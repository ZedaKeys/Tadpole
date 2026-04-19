"""
Tadpole BG3 Companion - DeckyLoader Python Backend

Runs on the Steam Deck, manages the bridge server process,
reads game state, and exposes API methods to the TSX frontend
via the official decky module.
"""

import subprocess
import os
import sys
import json
import signal
import socket
import http.client
import traceback
import datetime
import urllib.request
import urllib.error
import shutil
import zipfile
import io
import re
import ssl
import time
import asyncio
import struct
import hashlib
import base64
import threading

import decky


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
# State file path: The Lua mod writes to os.getenv("TEMP")/tadpole_state.json.
# On Linux/Steam Deck, Proton typically maps Windows TEMP to /tmp on the host,
# so /tmp/tadpole_state.json should match. The bridge server also uses os.tmpdir()
# which resolves to /tmp on Linux. If you encounter issues, verify that the
# Proton prefix maps TEMP correctly for your setup.
STATE_FILE = "/tmp/tadpole_state.json"

# Bridge process handle
_bridge_process = None
_bridge_port = 3456

# Bridge log file handles (must be closed in _unload to prevent file descriptor leaks)
_bridge_stdout_log = None
_bridge_stderr_log = None

# PID file for detecting orphaned bridge processes after plugin crashes
_BRIDGE_PID_FILE = "/tmp/tadpole-bridge.pid"

# Error reporting
PB_ERROR_ENDPOINT = "https://pb.gohanlab.uk/api/collections/tadpole_errors/records"
PLUGIN_VERSION = "0.15.0"
_error_report_timestamps = []
ERROR_RATE_LIMIT_PER_MINUTE = 10

# Local debug log -- always works, no network needed
PLUGIN_LOG = "/tmp/tadpole-plugin.log"
_DIAGNOSTIC_LOG = "/tmp/tadpole-diagnostic.json"

# TTL cache for get_status (avoids 4-6 subprocess calls every 2 seconds)
_status_cache = {
    "bg3_running": False, "bg3_ts": 0,
    "ip": "...", "ip_ts": 0,
    "node_installed": False, "node_ts": 0,
}

# Default command file path (used by Lua mod)
_DEFAULT_COMMAND_FILE = (
    "/home/deck/.local/share/Steam/steamapps/compatdata/1086940/pfx/drive_c/users/"
    "steamuser/AppData/Local/Larian Studios/Baldur's Gate 3/Script Extender/TadpoleCommands.json"
)
_BRIDGE_ENV_FILE = "/home/deck/.config/tadpole-bridge.env"


def _get_command_file() -> str:
    """Return the path to TadpoleCommands.json.

    Checks the bridge env file for COMMAND_FILE= first, then falls back to the
    default SE directory path.
    """
    try:
        if os.path.exists(_BRIDGE_ENV_FILE):
            with open(_BRIDGE_ENV_FILE, "r") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("COMMAND_FILE="):
                        path = line[len("COMMAND_FILE="):].strip().strip('"').strip("'")
                        if path:
                            return path
    except OSError:
        pass
    return _DEFAULT_COMMAND_FILE

# ---------------------------------------------------------------------------
# WebSocket listener thread — connects to bridge and pushes updates via decky.emit
# ---------------------------------------------------------------------------
_ws_listener_thread = None
_ws_listener_stop = threading.Event()
_ws_last_state = None  # Track last pushed state to deduplicate


def _ws_send_ping(sock):
    """Send a WebSocket ping frame (opcode 0x9)."""
    frame = struct.pack('!BB', 0x89, 0)
    sock.sendall(frame)


def _ws_pong(sock):
    """Send a WebSocket pong frame (opcode 0xA)."""
    frame = struct.pack('!BB', 0x8A, 0)
    sock.sendall(frame)


def _ws_send_close(sock):
    """Send a WebSocket close frame."""
    frame = struct.pack('!BB', 0x88, 0)
    try:
        sock.sendall(frame)
    except Exception:
        pass


def _ws_connect(host, port, path='/ws'):
    """Perform a raw WebSocket handshake over a TCP socket.
    
    Returns the connected socket on success, None on failure.
    Uses the standard RFC 6455 handshake with a Sec-WebSocket-Key.
    """
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        sock.connect((host, port))

        # Generate WebSocket key
        key = base64.b64encode(os.urandom(16)).decode('utf-8')

        handshake = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: {host}:{port}\r\n"
            f"Upgrade: websocket\r\n"
            f"Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            f"Sec-WebSocket-Version: 13\r\n"
            f"\r\n"
        )
        sock.sendall(handshake.encode('utf-8'))

        # Read response headers
        response = b""
        while b"\r\n\r\n" not in response:
            chunk = sock.recv(4096)
            if not chunk:
                sock.close()
                return None
            response += chunk

        # Verify upgrade
        if b"101" not in response.split(b"\r\n")[0]:
            sock.close()
            return None

        return sock
    except Exception as e:
        _log(f"WS connect failed: {e}", "DEBUG")
        try:
            sock.close()
        except Exception:
            pass
        return None


def _ws_recv_message(sock):
    """Read a single WebSocket text message from the socket.
    
    Returns the decoded text payload, or None on error/close.
    Handles fragmentation, ping frames, and close frames.
    """
    payload = b""
    opcode = None

    while True:
        # Read frame header (first 2 bytes)
        header = b""
        try:
            while len(header) < 2:
                chunk = sock.recv(2 - len(header))
                if not chunk:
                    return None
                header += chunk
        except socket.timeout:
            return None
        except Exception:
            return None

        byte1, byte2 = header[0], header[1]
        fin = bool(byte1 & 0x80)
        frame_opcode = byte1 & 0x0F
        masked = bool(byte2 & 0x80)
        payload_len = byte2 & 0x7F

        # Determine opcode for the message
        if opcode is None:
            opcode = frame_opcode

        # Connection close
        if frame_opcode == 0x8:
            return None

        # Ping — respond with pong
        if frame_opcode == 0x9:
            # Read ping payload if any
            ping_data = b""
            if payload_len > 0:
                ping_data = _recv_exact(sock, payload_len)
            # Read mask if present
            if masked:
                _recv_exact(sock, 4)
            try:
                # Send pong with same payload
                pong_header = struct.pack('!BB', 0x8A, len(ping_data))
                sock.sendall(pong_header + ping_data)
            except Exception:
                pass
            continue

        # Pong — just consume and continue
        if frame_opcode == 0xA:
            if masked and payload_len > 0:
                _recv_exact(sock, payload_len + 4)
            elif payload_len > 0:
                _recv_exact(sock, payload_len)
            continue

        # Extended payload length
        if payload_len == 126:
            ext = _recv_exact(sock, 2)
            if not ext:
                return None
            payload_len = struct.unpack('!H', ext)[0]
        elif payload_len == 127:
            ext = _recv_exact(sock, 8)
            if not ext:
                return None
            payload_len = struct.unpack('!Q', ext)[0]

        # Read mask key
        mask_key = None
        if masked:
            mask_key = _recv_exact(sock, 4)
            if not mask_key:
                return None

        # Read payload data
        data = b""
        if payload_len > 0:
            data = _recv_exact(sock, payload_len)
            if not data:
                return None

        # Unmask if needed
        if masked and mask_key:
            data = bytes(b ^ mask_key[i % 4] for i, b in enumerate(data))

        # Append continuation data
        if frame_opcode in (0x0, 0x1, 0x2):
            payload += data

        if fin:
            break

    if opcode == 0x1:  # Text frame
        return payload.decode('utf-8', errors='replace')
    elif opcode == 0x2:  # Binary frame
        return payload.decode('utf-8', errors='replace')
    return None


def _recv_exact(sock, nbytes):
    """Read exactly nbytes from socket, or return None on failure."""
    buf = b""
    while len(buf) < nbytes:
        try:
            chunk = sock.recv(nbytes - len(buf))
            if not chunk:
                return None
            buf += chunk
        except Exception:
            return None
    return buf


def _ws_listener_loop():
    """Background thread: connect to bridge WS and emit state updates to frontend."""
    global _ws_last_state

    _log("WS listener thread started")
    reconnect_delay = 1  # Start with 1s, increase on failure

    while not _ws_listener_stop.is_set():
        try:
            sock = _ws_connect('127.0.0.1', _bridge_port, '/ws')
            if not sock:
                # Bridge not available yet — wait and retry
                _ws_listener_stop.wait(reconnect_delay)
                reconnect_delay = min(reconnect_delay * 2, 30)
                continue

            # Connected — reset reconnect delay
            reconnect_delay = 1
            sock.settimeout(30)  # Read timeout for keepalive
            _log("WS listener connected to bridge")

            while not _ws_listener_stop.is_set():
                msg = _ws_recv_message(sock)
                if msg is None:
                    # Connection lost or close frame
                    _log("WS listener: connection lost", "DEBUG")
                    break

                try:
                    data = json.loads(msg)
                except Exception:
                    continue

                msg_type = data.get('type')

                if msg_type == 'state':
                    game_state = data.get('data')
                    events = data.get('events', [])

                    # Deduplicate: skip if same timestamp as last push
                    new_ts = game_state.get('timestamp') if game_state else None
                    if new_ts is not None and _ws_last_state == new_ts:
                        continue
                    _ws_last_state = new_ts

                    # Push to frontend via decky.emit
                    try:
                        decky.emit('game-state-update', {
                            'game_state': game_state,
                            'recent_events': events,
                        })
                    except Exception as e:
                        _log(f"decky.emit failed: {e}", "ERROR")

                elif msg_type == 'history':
                    # Initial history dump — extract latest state if we don't have one
                    history = data.get('data', [])
                    if history and _ws_last_state is None:
                        latest = history[-1]
                        game_state = latest if isinstance(latest, dict) else None
                        if game_state:
                            new_ts = game_state.get('timestamp')
                            _ws_last_state = new_ts
                            try:
                                decky.emit('game-state-update', {
                                    'game_state': game_state,
                                    'recent_events': [],
                                })
                            except Exception:
                                pass

        except Exception as e:
            _log(f"WS listener error: {e}", "ERROR")

        finally:
            try:
                sock.close()
            except Exception:
                pass

        # Wait before reconnecting (unless stop requested)
        if not _ws_listener_stop.is_set():
            _ws_listener_stop.wait(reconnect_delay)
            reconnect_delay = min(reconnect_delay * 2, 30)

    _log("WS listener thread stopped")


def _start_ws_listener():
    """Start the WebSocket listener thread."""
    global _ws_listener_thread, _ws_listener_stop
    _stop_ws_listener()
    _ws_listener_stop.clear()
    _ws_listener_thread = threading.Thread(
        target=_ws_listener_loop,
        name="tadpole-ws-listener",
        daemon=True,
    )
    _ws_listener_thread.start()


def _stop_ws_listener():
    """Stop the WebSocket listener thread."""
    global _ws_listener_thread
    if _ws_listener_thread and _ws_listener_thread.is_alive():
        _ws_listener_stop.set()
        _ws_listener_thread.join(timeout=5)
    _ws_listener_thread = None

def _log(msg, level="INFO"):
    """Write to local log file with level tracking."""
    try:
        ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        line = f"[{ts}] [{level}] {msg}\n"
        with open(PLUGIN_LOG, "a") as f:
            f.write(line)
        # Rotate if over 2MB
        try:
            if os.path.getsize(PLUGIN_LOG) > 2 * 1024 * 1024:
                with open(PLUGIN_LOG, "r") as f:
                    lines = f.readlines()
                with open(PLUGIN_LOG, "w") as f:
                    f.writelines(lines[-1000:])
        except Exception:
            pass
    except Exception:
        pass

def _capture_diagnostic(event: str, data: dict = None):
    """Capture a diagnostic snapshot for remote debugging.
    
    Writes to /tmp/tadpole-diagnostic.json with the current state of everything.
    This file can be fetched via the plugin's get_log API for remote debugging.
    """
    try:
        diag = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "event": event,
            "version": PLUGIN_VERSION,
            "bridge": {
                "process_running": _bridge_process is not None and _bridge_process.poll() is None if _bridge_process else False,
                "pid": _bridge_process.pid if _bridge_process and _bridge_process.poll() is None else None,
                "port": _bridge_port,
                "pid_file_exists": os.path.exists(_BRIDGE_PID_FILE),
                "pid_file_content": None,
            },
            "system": {
                "bg3_running": _is_bg3_running(),
                "ip": _try_get_ip(),
                "node_installed": _is_node_installed(),
                "node_version": _get_node_version() if _is_node_installed() else None,
                "bridge_found": bool(_find_bridge_server()),
                "lua_installed": _is_lua_mod_installed(),
                "bg3se_installed": _is_bg3se_installed(),
            },
            "state_file": {
                "exists": os.path.exists(STATE_FILE),
                "size": os.path.getsize(STATE_FILE) if os.path.exists(STATE_FILE) else 0,
                "modified": datetime.datetime.fromtimestamp(os.path.getmtime(STATE_FILE)).isoformat() if os.path.exists(STATE_FILE) else None,
                "parseable": False,
            },
            "data": data or {},
        }
        # Try to parse state file
        if os.path.exists(STATE_FILE):
            try:
                with open(STATE_FILE, "r") as f:
                    content = f.read().strip()
                if content:
                    json.loads(content)
                    diag["state_file"]["parseable"] = True
            except Exception as e:
                diag["state_file"]["parse_error"] = str(e)
        # Read PID file content
        if os.path.exists(_BRIDGE_PID_FILE):
            try:
                with open(_BRIDGE_PID_FILE, "r") as f:
                    diag["bridge"]["pid_file_content"] = f.read().strip()
            except Exception:
                pass
        with open(_DIAGNOSTIC_LOG, "w") as f:
            f.write(json.dumps(diag, indent=2))
    except Exception as e:
        _log(f"Diagnostic capture failed: {e}", "ERROR")

def _try_get_ip():
    """Get IP without raising."""
    try:
        return _get_ip()
    except Exception:
        return "unknown"


# SSL context cache — try verified first, fall back to unverified
_ssl_context = None
_ssl_verified_ok = None

def _get_ssl_context():
    """Return an SSL context that works on Steam Deck.

    Tries verified SSL first. Falls back to unverified if the CA bundle
    is incomplete (common on SteamOS). Caches the result.
    """
    global _ssl_context, _ssl_verified_ok
    if _ssl_context is not None:
        return _ssl_context

    # Try verified SSL first
    try:
        ctx = ssl.create_default_context()
        # Quick test: try connecting to GitHub
        conn = http.client.HTTPSConnection("github.com", timeout=5, context=ctx)
        conn.request("HEAD", "/")
        conn.close()
        _ssl_verified_ok = True
        _ssl_context = ctx
        return ctx
    except Exception:
        pass

    # Fall back to unverified (SteamOS has incomplete CA bundle)
    _ssl_verified_ok = False
    _ssl_context = ssl._create_unverified_context()
    return _ssl_context


def _error_log_path():
    """Return path for the error log file."""
    log_dir = getattr(decky, 'DECKY_PLUGIN_LOG_DIR', '/tmp')
    os.makedirs(log_dir, exist_ok=True)
    return os.path.join(log_dir, "tadpole-error.log")


def _report_plugin_error(message, stack=None, extra=None):
    """Report an error to PocketBase and local log file. Never raises."""
    global _error_report_timestamps
    try:
        now = datetime.datetime.now(datetime.timezone.utc).timestamp() * 1000
        # Rate limit and cleanup old timestamps
        _error_report_timestamps = [t for t in _error_report_timestamps if now - t < 60000]
        if len(_error_report_timestamps) >= ERROR_RATE_LIMIT_PER_MINUTE:
            return
        _error_report_timestamps.append(now)

        record = {
            "source": "decky-plugin",
            "message": str(message or "Unknown error"),
            "stack": str(stack) if stack else "",
            "url": f"decky-plugin://port:{_bridge_port}",
            "userAgent": f"TadpoleDeckyPlugin/{PLUGIN_VERSION}",
            "metadata": extra or {},
            "version": PLUGIN_VERSION,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }

        # Log locally
        log_line = f"[{record['timestamp']}] [ERROR] {record['message']}"
        if stack:
            log_line += f"\n  {stack[:500]}"
        log_line += "\n"
        try:
            with open(_error_log_path(), "a") as f:
                f.write(log_line)
            # Rotate if over 1MB
            try:
                if os.path.getsize(_error_log_path()) > 1024 * 1024:
                    with open(_error_log_path(), "r") as f:
                        lines = f.readlines()
                    with open(_error_log_path(), "w") as f:
                        f.writelines(lines[-500:])
            except Exception:
                pass
        except Exception:
            pass

        # Report to PocketBase (fire and forget, 3s timeout)
        try:
            data = json.dumps(record).encode("utf-8")
            req = urllib.request.Request(
                PB_ERROR_ENDPOINT,
                data=data,
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            ctx = _get_ssl_context()
            urllib.request.urlopen(req, timeout=3, context=ctx)
        except Exception:
            pass  # Silently fail if PocketBase is unreachable
    except Exception:
        pass  # Never let error reporting crash the plugin


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_ip():
    """Get the Steam Deck's LAN IP address."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            s.connect(("1.1.1.1", 80))
            ip = s.getsockname()[0]
        finally:
            s.close()
        return ip
    except Exception:
        try:
            result = subprocess.run(
                ["hostname", "-I"], capture_output=True, text=True, timeout=5
            )
            return result.stdout.strip().split()[0] if result.stdout.strip() else "localhost"
        except Exception:
            return "localhost"


def _is_bg3_running():
    """Check if Baldur's Gate 3 is currently running.

    Uses specific process name patterns to avoid false positives.
    The Steam AppID for BG3 is 1086940. On Linux/Proton, the process
    is typically visible as a wine/proton process with that AppID.
    """
    try:
        # Check for the actual BG3 executable path (most specific)
        result = subprocess.run(
            ["pgrep", "-f", "steamapps/common/Baldur"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            return True
        # Fallback: check for Steam AppID in process args (specific to steam_app_ prefix to avoid false positives)
        result2 = subprocess.run(
            ["pgrep", "-f", "steam_app_1086940"],
            capture_output=True, text=True, timeout=5
        )
        return result2.returncode == 0
    except Exception:
        return False


def _is_bridge_running():
    """Check if the bridge server process is alive OR already running on the port."""
    global _bridge_process
    # Check plugin-managed process
    if _bridge_process is not None and _bridge_process.poll() is None:
        return True
    # Also check if something is listening on the bridge port
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1)
        result = s.connect_ex(("127.0.0.1", _bridge_port))
        s.close()
        return result == 0
    except Exception:
        return False


def _is_systemd_bridge_running():
    """Check if the bridge is running via systemd user service."""
    try:
        result = subprocess.run(
            ["systemctl", "--user", "is-active", "tadpole-bridge"],
            capture_output=True, text=True, timeout=5,
        )
        return result.stdout.strip() == "active"
    except Exception:
        return False


def _is_node_installed():
    """Check if Node.js is available (bundled or system)."""
    tadpole_node = os.path.join(os.path.expanduser("~"), "tadpole", "node", "bin", "node")
    if os.path.exists(tadpole_node):
        return True
    try:
        result = subprocess.run(
            ["node", "--version"], capture_output=True, text=True, timeout=5
        )
        return result.returncode == 0
    except Exception:
        return False


def _get_node_version():
    """Get Node.js version string, or None if not installed."""
    node_bin = _get_node_binary()
    try:
        result = subprocess.run(
            [node_bin, "--version"], capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return None


def _is_lua_mod_installed():
    """Check if the TadpoleCompanion BG3 ScriptExtender mod exists (v30 format)."""
    try:
        # BG3SE v30+ mods live in BG3/Mods/TadpoleCompanion/ with Config.json
        home = os.path.expanduser("~")
        candidates = [
            # Proton prefix path (Steam Deck)
            os.path.join(home, ".steam", "steam", "steamapps", "compatdata", "1086940", "pfx", "drive_c", "users", "steamuser", "AppData", "Local", "Larian Studios", "Baldur's Gate 3", "Mods", "TadpoleCompanion"),
            os.path.join(home, ".local", "share", "Steam", "steamapps", "compatdata", "1086940", "pfx", "drive_c", "users", "steamuser", "AppData", "Local", "Larian Studios", "Baldur's Gate 3", "Mods", "TadpoleCompanion"),
            # Direct BG3 install
            os.path.join(home, ".steam", "steam", "steamapps", "common", "Baldurs Gate 3", "Mods", "TadpoleCompanion"),
            os.path.join(home, ".local", "share", "Steam", "steamapps", "common", "Baldurs Gate 3", "Mods", "TadpoleCompanion"),
            os.path.join(home, ".steam", "steam", "steamapps", "common", "Baldur's Gate 3", "Mods", "TadpoleCompanion"),
            os.path.join(home, ".local", "share", "Steam", "steamapps", "common", "Baldur's Gate 3", "Mods", "TadpoleCompanion"),
        ]
        for candidate in candidates:
            # Check for v30 mod structure
            config_json = os.path.join(candidate, "ScriptExtender", "Config.json")
            lua_file = os.path.join(candidate, "ScriptExtender", "Lua", "TadpoleCompanion.lua")
            if os.path.exists(config_json) and os.path.exists(lua_file):
                return True
        # Also check if BG3 SE is even installed (Mods directory exists)
        for candidate in candidates:
            mods_dir = os.path.dirname(candidate)
            if os.path.isdir(mods_dir):
                # Folder exists but no TadpoleCompanion mod
                return False
        return False  # Can't find BG3 install
    except Exception:
        return False


def _find_bridge_server():
    """Search common locations for the bridge server.js."""
    home = os.path.expanduser("~")
    candidates = [
        os.path.join(home, "tadpole", "bridge", "server.js"),
        os.path.join(getattr(decky, 'DECKY_PLUGIN_DIR', ''), "bridge", "server.js"),
        os.path.join(getattr(decky, 'DECKY_USER_HOME', home), "tadpole", "bridge", "server.js"),
        os.path.join(getattr(decky, 'DECKY_USER_HOME', home), "homebrew", "plugins", "TadpoleCompanion", "bridge", "server.js"),
        os.path.join(getattr(decky, 'DECKY_USER_HOME', home), "homebrew", "plugins", "TadpoleBG3", "bridge", "server.js"),
        os.path.join(getattr(decky, 'DECKY_USER_HOME', home), ".config", "decky", "plugins", "TadpoleBG3", "bridge", "server.js"),
    ]
    for c in candidates:
        if c and os.path.exists(c):
            return os.path.realpath(c)
    return None


def _find_bg3_install_dir():
    """Find the BG3 installation directory (where bin/ lives)."""
    home = os.path.expanduser("~")
    candidates = [
        os.path.join(home, ".steam", "steam", "steamapps", "common", "Baldurs Gate 3"),
        os.path.join(home, ".local", "share", "Steam", "steamapps", "common", "Baldurs Gate 3"),
        os.path.join(home, ".steam", "steam", "steamapps", "common", "Baldur's Gate 3"),
        os.path.join(home, ".local", "share", "Steam", "steamapps", "common", "Baldur's Gate 3"),
    ]
    for c in candidates:
        if os.path.isdir(c) and os.path.isdir(os.path.join(c, "bin")):
            return c
    # Try Steam libraryfolders.vdf
    try:
        for vdf_path in [
            os.path.join(home, ".steam", "steam", "steamapps", "libraryfolders.vdf"),
            os.path.join(home, ".local", "share", "Steam", "steamapps", "libraryfolders.vdf"),
        ]:
            if os.path.exists(vdf_path):
                with open(vdf_path) as f:
                    content = f.read()
                for match in re.finditer(r'"path"\s+"([^"]+)"', content):
                    lib_path = match.group(1)
                    for name in ["Baldurs Gate 3", "Baldur's Gate 3"]:
                        bg3_dir = os.path.join(lib_path, "steamapps", "common", name)
                        if os.path.isdir(bg3_dir) and os.path.isdir(os.path.join(bg3_dir, "bin")):
                            return bg3_dir
    except Exception:
        pass
    return None


def _is_bg3se_installed():
    """Check if BG3 Script Extender is installed (DWrite.dll in BG3 bin dir)."""
    bg3_dir = _find_bg3_install_dir()
    if not bg3_dir:
        return False
    dwrite = os.path.join(bg3_dir, "bin", "DWrite.dll")
    return os.path.exists(dwrite)


def _get_steam_launch_options(appid):
    """Read the current Steam launch options for a given appid.

    Returns the LaunchOptions string, or None if not set or unreadable.
    Uses brace counting to handle nested VDF structures correctly.
    """
    home = os.path.expanduser("~")
    userdata_dir = os.path.join(home, ".local", "share", "Steam", "userdata")
    if not os.path.isdir(userdata_dir):
        userdata_dir = os.path.join(home, ".steam", "steam", "userdata")
    if not os.path.isdir(userdata_dir):
        return None

    for user_dir in os.listdir(userdata_dir):
        config_path = os.path.join(userdata_dir, user_dir, "config", "localconfig.vdf")
        if not os.path.exists(config_path):
            continue
        try:
            with open(config_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()

            # Find the appid block inside a proper VDF section (skip metadata/hex occurrences)
            # The real app block has "1086940"\n\t...\t{ very close together
            app_search = f'"{appid}"'
            search_pos = 0
            app_start = -1
            brace_start = -1
            while True:
                app_start = content.find(app_search, search_pos)
                if app_start == -1:
                    break
                # Find the opening brace after appid
                brace_start = content.find("{", app_start)
                if brace_start == -1 or brace_start - app_start > 20:
                    search_pos = app_start + 1
                    continue
                # Verify this is a proper VDF block (whitespace-only between appid and brace)
                between = content[app_start + len(app_search):brace_start].strip()
                if between:
                    search_pos = app_start + 1
                    continue
                # Found a valid block
                break
            if app_start == -1 or brace_start == -1:
                continue

            # Count braces to find the matching closing brace (skip braces inside quoted strings)
            depth = 1
            i = brace_start + 1
            app_section_end = -1
            in_string = False
            while i < len(content) and depth > 0:
                ch = content[i]
                if ch == '"' and (i == 0 or content[i-1] != '\\'):
                    in_string = not in_string
                elif not in_string:
                    if ch == "{":
                        depth += 1
                    elif ch == "}":
                        depth -= 1
                        if depth == 0:
                            app_section_end = i
                            break
                i += 1

            if app_section_end == -1:
                continue

            # Extract the app section content
            app_section = content[brace_start:app_section_end]

            # Now search for LaunchOptions in this section
            # VDF values can contain escaped quotes (\\\") e.g. WINEDLLOVERRIDES=\"DWrite.dll=n,b\"
            # The regex must match the full value including escaped quotes, stopping only at
            # an unescaped closing quote.
            launch_pattern = re.compile(r'"LaunchOptions"\s+"((?:[^"\\]|\\.)*)"')
            if match:
                return match.group(1)
        except Exception:
            pass
    return None


def _set_steam_launch_options(appid, launch_options):
    """Set Steam launch options for a given appid.

    This modifies the localconfig.vdf file. Steam needs to be restarted
    (or at least the game) for changes to take effect.
    Returns True if successful.
    Uses brace counting to handle nested VDF structures correctly.
    """
    home = os.path.expanduser("~")
    userdata_dir = os.path.join(home, ".local", "share", "Steam", "userdata")
    if not os.path.isdir(userdata_dir):
        userdata_dir = os.path.join(home, ".steam", "steam", "userdata")
    if not os.path.isdir(userdata_dir):
        return False

    for user_dir in os.listdir(userdata_dir):
        config_path = os.path.join(userdata_dir, user_dir, "config", "localconfig.vdf")
        if not os.path.exists(config_path):
            continue
        try:
            with open(config_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()

            # Find the appid block inside a proper VDF section (skip metadata/hex occurrences)
            app_search = f'"{appid}"'
            search_pos = 0
            app_start = -1
            brace_start = -1
            while True:
                app_start = content.find(app_search, search_pos)
                if app_start == -1:
                    break
                brace_start = content.find("{", app_start)
                if brace_start == -1 or brace_start - app_start > 20:
                    search_pos = app_start + 1
                    continue
                between = content[app_start + len(app_search):brace_start].strip()
                if between:
                    search_pos = app_start + 1
                    continue
                break
            if app_start == -1 or brace_start == -1:
                continue

            # Count braces to find the matching closing brace (skip braces inside quoted strings)
            depth = 1
            i = brace_start + 1
            app_section_end = -1
            in_string = False
            while i < len(content) and depth > 0:
                ch = content[i]
                if ch == '"' and (i == 0 or content[i-1] != '\\'):
                    in_string = not in_string
                elif not in_string:
                    if ch == "{":
                        depth += 1
                    elif ch == "}":
                        depth -= 1
                        if depth == 0:
                            app_section_end = i
                            break
                i += 1

            if app_section_end == -1:
                continue

            # Extract the app section content (including braces)
            app_section = content[brace_start:app_section_end + 1]

            # Check if LaunchOptions already exists in this section
            launch_pattern = re.compile(r'("LaunchOptions"\s+"[^"]*")')
            match = launch_pattern.search(app_section)

            if match:
                # Replace existing LaunchOptions
                old_line = match.group(1)
                new_line = f'"LaunchOptions"\t\t"{launch_options}"'
                # Replace in the full content, using the absolute positions
                abs_start = brace_start + match.start(1)
                abs_end = brace_start + match.end(1)
                content = content[:abs_start] + new_line + content[abs_end:]
            else:
                # Add LaunchOptions at end of app section (before closing })
                # Insert before the final }
                insert_pos = brace_start + app_section_end
                content = content[:insert_pos] + f'\t\t\t\t\t"LaunchOptions"\t\t"{launch_options}"\n' + content[insert_pos:]

            with open(config_path, "w", encoding="utf-8") as f:
                f.write(content)
            return True
        except Exception as e:
            _log(f"Failed to set launch options: {e}")
            continue
    return False


def _install_bg3se():
    """Download and install BG3 Script Extender for Linux/Proton (Steam Deck).

    Steps:
    1. Download the BG3SE updater zip from GitHub
    2. Extract DWrite.dll to BG3's bin/ directory
    3. Set Steam launch option: WINEDLLOVERRIDES="DWrite.dll=n,b" %command%
    4. On first BG3 launch, SE auto-downloads the actual extender files
    """
    try:
        # Step 0: Find BG3 install
        bg3_dir = _find_bg3_install_dir()
        if not bg3_dir:
            return {
                "success": False,
                "message": "BG3 installation not found. Make sure Baldur's Gate 3 is installed.",
            }

        bg3_bin = os.path.join(bg3_dir, "bin")
        dwrite_path = os.path.join(bg3_bin, "DWrite.dll")

        # Already installed?
        if os.path.exists(dwrite_path):
            # Still check/set launch options
            current_opts = _get_steam_launch_options(BG3SE_STEAM_APPID)
            needed = 'WINEDLLOVERRIDES="DWrite.dll=n,b" %command%'
            if current_opts and "DWrite.dll" in current_opts:
                return {"success": True, "message": "BG3 Script Extender already installed and configured."}

            # Set launch options
            if _set_steam_launch_options(BG3SE_STEAM_APPID, needed):
                return {
                    "success": True,
                    "message": "DWrite.dll found. Set Steam launch option for Proton. Restart Steam/BG3 to apply.",
                }
            return {
                "success": True,
                "message": "DWrite.dll found. You need to set this Steam launch option manually:\nWINEDLLOVERRIDES=\"DWrite.dll=n,b\" %command%",
            }

        # Step 1: Download BG3SE updater zip
        _log(f"Downloading BG3 Script Extender from {BG3SE_DOWNLOAD_URL}")
        req = urllib.request.Request(BG3SE_DOWNLOAD_URL, headers={"User-Agent": "Tadpole-Decky/0.7.0"})
        ctx = _get_ssl_context()
        with urllib.request.urlopen(req, timeout=60, context=ctx) as resp:
            zip_bytes = resp.read()

        _log(f"Downloaded {len(zip_bytes)} bytes, extracting DWrite.dll...")

        # Step 2: Extract DWrite.dll from zip
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
            dwrite_found = False
            for info in zf.infolist():
                if os.path.basename(info.filename).lower() == "dwrite.dll" and not info.is_dir():
                    with zf.open(info) as src, open(dwrite_path, "wb") as dst:
                        dst.write(src.read())
                    dwrite_found = True
                    _log(f"Extracted {info.filename} -> {dwrite_path}")
                    break

            if not dwrite_found:
                return {
                    "success": False,
                    "message": "DWrite.dll not found in the downloaded zip. The BG3SE release format may have changed.",
                }

        # Step 3: Set Steam launch options for Proton
        needed = 'WINEDLLOVERRIDES="DWrite.dll=n,b" %command%'
        current_opts = _get_steam_launch_options(BG3SE_STEAM_APPID)

        if current_opts and "DWrite.dll" not in current_opts:
            # Append DWrite override to existing options (before %command%)
            new_opts = current_opts.replace('%command%', 'WINEDLLOVERRIDES=\"DWrite.dll=n,b\" %command%')
            if '%command%' not in current_opts:
                new_opts = f'WINEDLLOVERRIDES=\"DWrite.dll=n,b\" {current_opts}'
            launch_set = _set_steam_launch_options(BG3SE_STEAM_APPID, new_opts)
        elif not current_opts:
            launch_set = _set_steam_launch_options(BG3SE_STEAM_APPID, needed)
        else:
            launch_set = True  # Already has it

        if launch_set:
            return {
                "success": True,
                "message": "BG3 Script Extender installed! Steam launch option set. Restart BG3 to apply -- SE will auto-update on first launch.",
            }
        else:
            return {
                "success": True,
                "message": "BG3 Script Extender installed! Set this Steam launch option manually:\nWINEDLLOVERRIDES=\"DWrite.dll=n,b\" %command%\nThen restart BG3.",
                "manual_launch_option": needed,
            }

    except Exception as e:
        _log(f"BG3SE install failed: {e}")
        return {"success": False, "message": f"Install failed: {str(e)}"}


def _get_bridge_health(port):
    """Detailed health check of the bridge server."""
    try:
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
        conn.request("GET", "/health")
        resp = conn.getresponse()
        if resp.status == 200:
            data = json.loads(resp.read().decode())
            conn.close()
            return {"healthy": True, **data}
        conn.close()
    except Exception:
        pass
    # Fallback: try /status
    data = _fetch_bridge_status(port)
    if data:
        return {"healthy": True, "clients": data.get("connectedClients", 0)}
    return {"healthy": False}


# ---------------------------------------------------------------------------
# Auto-installer & auto-updater
# ---------------------------------------------------------------------------

GITHUB_REPO = "ZedaKeys/Tadpole"
GITHUB_API = f"https://api.github.com/repos/{GITHUB_REPO}"
GITHUB_RAW = f"https://raw.githubusercontent.com/{GITHUB_REPO}/main"

# Files from the repo that the bridge server needs
BRIDGE_FILES = [
    "bridge/package.json",
    "bridge/server.js",
    "bridge/ws-handler.js",
    "bridge/state-parser.js",
]

# The Lua mod files (v30 format)
LUA_MOD_FILES = [
    "mod/ScriptExtender/Config.json",
    "mod/ScriptExtender/Lua/TadpoleCompanion.lua",
    "mod/meta.lsx",
    "mod/modsettings.lsx",
]

# BG3 Script Extender (Norbyte's bg3se)
BG3SE_REPO = "Norbyte/bg3se"
BG3SE_API = f"https://api.github.com/repos/{BG3SE_REPO}"
BG3SE_DOWNLOAD_URL = "https://github.com/Norbyte/bg3se/releases/download/updater-20240430/BG3SE-Updater-20240430.zip"
BG3SE_STEAM_APPID = "1086940"


def _get_bg3_mod_dir():
    """Find or create the BG3 ScriptExtender LuaScripts directory.

    For BG3SE v30+, use the Mods/ directory structure.
    For older versions, use Data/LuaScripts/.
    """
    home = os.path.expanduser("~")

    # BG3SE v30+ uses Mods/ directory
    mod_candidates = [
        os.path.join(home, ".steam", "steam", "steamapps", "compatdata", "1086940", "pfx", "drive_c", "users", "steamuser", "AppData", "Local", "Larian Studios", "Baldur's Gate 3", "Mods"),
        os.path.join(home, ".local", "share", "Steam", "steamapps", "compatdata", "1086940", "pfx", "drive_c", "users", "steamuser", "AppData", "Local", "Larian Studios", "Baldur's Gate 3", "Mods"),
    ]

    # Check if v30 Mods directory exists
    for c in mod_candidates:
        if os.path.isdir(c):
            _log(f"Found BG3SE v30+ Mods directory: {c}")
            return c

    # Fall back to old LuaScripts directory for older BG3SE versions
    lua_candidates = [
        os.path.join(home, ".steam", "steam", "steamapps", "common", "Baldurs Gate 3", "Data", "LuaScripts"),
        os.path.join(home, ".local", "share", "Steam", "steamapps", "common", "Baldurs Gate 3", "Data", "LuaScripts"),
        os.path.join(home, ".steam", "steam", "steamapps", "common", "Baldur's Gate 3", "Data", "LuaScripts"),
        os.path.join(home, ".local", "share", "Steam", "steamapps", "common", "Baldur's Gate 3", "Data", "LuaScripts"),
    ]
    # Check if any already exist (old LuaScripts paths)
    for c in lua_candidates:
        if os.path.isdir(c):
            _log(f"Found old BG3SE LuaScripts directory: {c}")
            return c
    
    # Try to find via Steam library
    bg3_dir = _find_bg3_install_dir()
    if bg3_dir:
        # Check for v30 Mods first
        mods_dir = os.path.join(bg3_dir, "Mods")
        if os.path.isdir(mods_dir):
            _log(f"Found BG3 Mods directory: {mods_dir}")
            return mods_dir
        
        # Fall back to LuaScripts for older BG3SE
        lua_dir = os.path.join(bg3_dir, "Data", "LuaScripts")
        if os.path.isdir(lua_dir):
            _log(f"Found BG3 LuaScripts directory: {lua_dir}")
            return lua_dir
        # BG3SE is installed but directories don't exist yet -- create them
        if _is_bg3se_installed():
            try:
                # Prefer v30 Mods directory
                os.makedirs(mods_dir, exist_ok=True)
                _log(f"Created Mods directory: {mods_dir}")
                return mods_dir
            except Exception as e:
                _log(f"Failed to create Mods dir: {e}")
                # Fall back to creating LuaScripts
                try:
                    os.makedirs(lua_dir, exist_ok=True)
                    _log(f"Created LuaScripts directory: {lua_dir}")
                    return lua_dir
                except Exception as e2:
                    _log(f"Failed to create LuaScripts dir: {e2}")
    
    # Library folders fallback
    try:
        vdf_path = os.path.join(home, ".steam", "steam", "steamapps", "libraryfolders.vdf")
        if not os.path.exists(vdf_path):
            vdf_path = os.path.join(home, ".local", "share", "Steam", "steamapps", "libraryfolders.vdf")
        if os.path.exists(vdf_path):
            with open(vdf_path) as f:
                content = f.read()
            for match in re.finditer(r'"path"\s+"([^"]+)"', content):
                lib_path = match.group(1)
                for name in ["Baldurs Gate 3", "Baldur's Gate 3"]:
                    bg3_lua = os.path.join(lib_path, "steamapps", "common", name, "Data", "LuaScripts")
                    if os.path.isdir(bg3_lua):
                        return bg3_lua
    except Exception:
        pass
    return None


def _download_file(url, dest_path):
    """Download a file from URL to a local path."""
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": f"Tadpole-Decky/{PLUGIN_VERSION}"})
        ctx = _get_ssl_context()
        with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
            with open(dest_path, "wb") as f:
                f.write(resp.read())
        return True
    except Exception as e:
        decky.logger.error(f"Failed to download {url}: {e}")
        return False


def _install_node():
    """Install Node.js by downloading the prebuilt binary (no sudo needed)."""
    try:
        # Check if we already have our own node
        tadpole_node = os.path.join(os.path.expanduser("~"), "tadpole", "node", "bin", "node")
        if os.path.exists(tadpole_node):
            return {"success": True, "message": f"Node.js already installed at {tadpole_node}"}

        # Download prebuilt Node.js LTS for linux-x64 (Steam Deck is x86_64)
        # Use v18 LTS for broad compatibility
        node_version = "v18.20.4"
        tarball = f"node-{node_version}-linux-x64.tar.xz"
        url = f"https://nodejs.org/dist/{node_version}/{tarball}"

        install_dir = os.path.join(os.path.expanduser("~"), "tadpole", "node")
        tmp_tarball = os.path.join("/tmp", tarball)

        decky.logger.info(f"Downloading Node.js {node_version} from {url}")

        # Download
        req = urllib.request.Request(url, headers={"User-Agent": f"Tadpole-Decky/{PLUGIN_VERSION}"})
        ctx = _get_ssl_context()
        with urllib.request.urlopen(req, timeout=120, context=ctx) as resp:
            with open(tmp_tarball, "wb") as f:
                # Read in chunks for large file
                while True:
                    chunk = resp.read(65536)
                    if not chunk:
                        break
                    f.write(chunk)

        decky.logger.info(f"Downloaded {tarball}, extracting...")

        # Extract -- strip the top-level node-v18.x.x-linux-x64/ folder
        os.makedirs(install_dir, exist_ok=True)
        result = subprocess.run(
            ["tar", "xf", tmp_tarball, "-C", install_dir, "--strip-components=1"],
            capture_output=True, text=True, timeout=60,
        )

        # Clean up tarball
        try:
            os.remove(tmp_tarball)
        except Exception:
            pass

        if result.returncode != 0:
            return {"success": False, "message": f"Extract failed: {result.stderr[-200:]}"}

        # Verify
        if not os.path.exists(tadpole_node):
            return {"success": False, "message": "Node binary not found after extraction"}

        # Make executable
        subprocess.run(["chmod", "+x", tadpole_node], capture_output=True, timeout=5)

        version = _get_node_version()
        decky.logger.info(f"Node.js installed: {version}")
        return {"success": True, "message": f"Node.js {version} installed to {install_dir}"}

    except Exception as e:
        decky.logger.error(f"Node.js install failed: {e}")
        return {"success": False, "message": str(e)}


# Path to the bundled Node.js binary (if installed by us)
def _get_node_binary():
    """Return the path to the node binary, preferring our bundled version."""
    tadpole_node = os.path.join(os.path.expanduser("~"), "tadpole", "node", "bin", "node")
    if os.path.exists(tadpole_node):
        return tadpole_node
    # Fall back to system node
    return "node"


def _install_bridge(progress_cb=None):
    """Set up bridge server from bundled files or GitHub."""
    try:
        bridge_dir = os.path.join(os.path.expanduser("~"), "tadpole", "bridge")
        os.makedirs(bridge_dir, exist_ok=True)

        # First try: copy from plugin's bundled bridge/ directory
        plugin_dir = getattr(decky, 'DECKY_PLUGIN_DIR', '')
        bundled_bridge = os.path.join(plugin_dir, "bridge") if plugin_dir else ""
        used_bundled = False

        if bundled_bridge and os.path.exists(os.path.join(bundled_bridge, "server.js")):
            decky.logger.info(f"Found bundled bridge at {bundled_bridge}, copying...")
            _log(f"Installing bridge from bundled files at {bundled_bridge}")
            for fname in ["server.js", "package.json", "package-lock.json"]:
                src = os.path.join(bundled_bridge, fname)
                dst = os.path.join(bridge_dir, fname)
                if os.path.exists(src):
                    shutil.copy2(src, dst)
            used_bundled = True
        else:
            # Fallback: download from GitHub
            decky.logger.info("No bundled bridge, downloading from GitHub...")
            _log("Downloading bridge from GitHub...")
            downloaded = 0
            total = len(BRIDGE_FILES)
            for file_path in BRIDGE_FILES:
                url = f"{GITHUB_RAW}/{file_path}"
                dest = os.path.join(bridge_dir, os.path.basename(file_path))
                if not _download_file(url, dest):
                    decky.logger.warn(f"Skipping {file_path} (not found in repo)")
                downloaded += 1
                if progress_cb:
                    progress_cb(downloaded, total)

        # Run npm install
        if os.path.exists(os.path.join(bridge_dir, "package.json")):
            node_bin = _get_node_binary()
            node_dir = os.path.dirname(node_bin)  # e.g. ~/tadpole/node/bin
            npm_bin = os.path.join(node_dir, "npm") if node_dir != "." else "npm"
            # Ensure npm can find node by setting PATH
            install_env = os.environ.copy()
            if node_dir and os.path.isdir(node_dir):
                install_env["PATH"] = node_dir + ":" + install_env.get("PATH", "")
            result = subprocess.run(
                [npm_bin, "install", "--production"],
                cwd=bridge_dir, capture_output=True, text=True, timeout=120,
                env=install_env,
            )
            if result.returncode != 0:
                return {"success": False, "message": f"npm install failed: {result.stderr[-200:]}"}

        source = "bundled" if used_bundled else "downloaded"
        return {
            "success": True,
            "message": f"Bridge ({source}) installed to {bridge_dir}",
            "path": bridge_dir,
        }
    except Exception as e:
        return {"success": False, "message": str(e)}


def _install_lua_mod():
    """Install the BG3 ScriptExtender Lua mod (v30 format) from bundled files or GitHub."""
    try:
        mod_dir = _get_bg3_mod_dir()
        if not mod_dir:
            return {
                "success": False,
                "message": "BG3 Mods directory not found. Make sure BG3 is installed and ScriptExtender is set up.",
            }

        # Destination is the full TadpoleCompanion mod directory
        dest_dir = os.path.join(mod_dir, "TadpoleCompanion")

        # Remove old version if exists
        if os.path.exists(dest_dir):
            shutil.rmtree(dest_dir)
        os.makedirs(dest_dir, exist_ok=True)

        # Try to copy from bundled mod/ directory (v30 structure)
        plugin_dir = getattr(decky, 'DECKY_PLUGIN_DIR', '')
        if plugin_dir:
            bundled_mod = os.path.join(plugin_dir, "mod")
            if os.path.exists(bundled_mod):
                _log(f"Installing Lua mod from bundled directory: {bundled_mod}")
                shutil.copytree(bundled_mod, dest_dir, dirs_exist_ok=True)
                return {"success": True, "message": f"Lua mod installed to {dest_dir}"}

        # Fallback: download individual files from GitHub
        _log("No bundled Lua mod found, downloading from GitHub...")
        for file_path in LUA_MOD_FILES:
            url = f"{GITHUB_RAW}/{file_path}"
            dest_file = os.path.join(dest_dir, *file_path.split('/')[1:])
            os.makedirs(os.path.dirname(dest_file), exist_ok=True)
            if not _download_file(url, dest_file):
                return {"success": False, "message": f"Failed to download {file_path} from {url}"}

        return {"success": True, "message": f"Lua mod installed to {dest_dir}"}
    except Exception as e:
        return {"success": False, "message": str(e)}


def _check_for_update():
    """Check GitHub releases for a newer plugin version."""
    try:
        # Try GitHub API first
        url = f"{GITHUB_API}/releases/latest"
        _log(f"Checking for updates: {url}")
        req = urllib.request.Request(url, headers={"User-Agent": f"Tadpole-Decky/{PLUGIN_VERSION}"})
        ctx = _get_ssl_context()
        with urllib.request.urlopen(req, timeout=15, context=ctx) as resp:
            data = json.loads(resp.read().decode())

        tag = data.get("tag_name", "")
        _log(f"Latest release tag: {tag}")

        # Extract version from tag like "decky-plugin-v0.4.2" or "v0.4.2"
        match = re.search(r"(\d+\.\d+\.\d+)", tag)
        if not match:
            _log(f"Could not parse version from tag: {tag}")
            return {"update_available": False, "error": f"Could not parse version from tag: {tag}"}

        latest = match.group(1)
        current = PLUGIN_VERSION
        _log(f"Current: {current}, Latest: {latest}")

        # Simple semver comparison
        def parse_ver(v):
            return tuple(int(x) for x in v.split("."))
        
        update_available = parse_ver(latest) > parse_ver(current)

        result = {
            "update_available": update_available,
            "current_version": current,
            "latest_version": latest,
            "tag": tag,
        }

        if update_available:
            # Find the zip asset
            for asset in data.get("assets", []):
                if asset["name"].endswith(".zip"):
                    result["download_url"] = asset["browser_download_url"]
                    result["release_notes"] = data.get("body", "") or ""
                    break
            _log(f"Update available! {result.get('download_url', 'no zip found')}")
        else:
            _log("Already up to date")

        return result
    except urllib.error.URLError as e:
        _log(f"Update check failed (network): {e}")
        return {"update_available": False, "error": f"Network error: {e}"}
    except Exception as e:
        _log(f"Update check failed: {e}")
        return {"update_available": False, "error": str(e)}


def _perform_update(download_url):
    """Download the latest plugin release zip to the user's Downloads folder."""
    try:
        # Security: only allow downloads from our own GitHub repo
        if not download_url.startswith("https://github.com/ZedaKeys/Tadpole/"):
            return {"success": False, "message": "Invalid download URL — only official Tadpole releases allowed"}

        # Download the zip
        req = urllib.request.Request(download_url, headers={"User-Agent": f"Tadpole-Decky/{PLUGIN_VERSION}"})
        ctx = _get_ssl_context()
        with urllib.request.urlopen(req, timeout=60, context=ctx) as resp:
            zip_bytes = resp.read()

        # Save to Downloads folder
        downloads_dir = os.path.expanduser("~/Downloads")
        os.makedirs(downloads_dir, exist_ok=True)
        zip_name = f"tadpole-decky-v{download_url.split('/')[-1]}.zip"
        zip_path = os.path.join(downloads_dir, zip_name)

        with open(zip_path, "wb") as f:
            f.write(zip_bytes)

        _log(f"Update downloaded to: {zip_path}")

        return {
            "success": True,
            "message": f"Downloaded to: {zip_path}\n\nInstall it via DeckyLoader: Plugins → Install Plugin → From File",
            "download_path": zip_path,
        }
    except Exception as e:
        _log(f"Download failed: {e}")
        return {"success": False, "message": str(e)}


def _read_state_file():
    """Read the game state file written by the Lua mod."""
    try:
        if not os.path.exists(STATE_FILE):
            return None
        with open(STATE_FILE, "r") as f:
            content = f.read().strip()
            if not content:
                return None
            return json.loads(content)
    except Exception:
        return None


def _fetch_bridge_status(port):
    """Fetch live status from the bridge server's HTTP endpoint."""
    try:
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
        conn.request("GET", "/status")
        resp = conn.getresponse()
        if resp.status == 200:
            data = json.loads(resp.read().decode())
            conn.close()
            return data
        conn.close()
    except Exception:
        pass
    return None


def _settings_path():
    """Return the path to the settings file in Decky's settings directory."""
    return os.path.join(decky.DECKY_PLUGIN_SETTINGS_DIR, "tadpole.json")


# ---------------------------------------------------------------------------
# Plugin class — DeckyLoader calls async methods on this instance
# ---------------------------------------------------------------------------

class Plugin:
    """DeckyLoader Python plugin backend."""

    async def _main(self):
        """Lifecycle: called when the plugin is loaded."""
        global _bridge_port
        _log("=== Tadpole plugin starting ===")
        _log(f"Version: {PLUGIN_VERSION}")
        _log(f"DECKY_PLUGIN_DIR: {getattr(decky, 'DECKY_PLUGIN_DIR', 'unknown')}")
        _log(f"DECKY_USER_HOME: {getattr(decky, 'DECKY_USER_HOME', 'unknown')}")
        _log(f"Python: {os.path.dirname(sys.executable)}")
        _log(f"Node installed: {_is_node_installed()}")
        _log(f"Node binary: {_get_node_binary()}")
        _log(f"Bridge found: {_find_bridge_server()}")
        _log(f"BG3 mod dir: {_get_bg3_mod_dir()}")
        _capture_diagnostic("plugin_start")

        decky.logger.info("Tadpole BG3 Companion plugin loaded")
        decky.logger.info(f"Plugin version: {PLUGIN_VERSION}")

        # Start WebSocket listener for reactive state updates
        _start_ws_listener()

        # Check for orphaned bridge process from previous crash
        if os.path.exists(_BRIDGE_PID_FILE):
            try:
                with open(_BRIDGE_PID_FILE, "r") as f:
                    orphan_pid = int(f.read().strip())
                try:
                    os.kill(orphan_pid, 0)  # Check if process exists
                    _log(f"Found orphan bridge process (PID {orphan_pid}), terminating...")
                    os.killpg(os.getpgid(orphan_pid), signal.SIGTERM)
                    await asyncio.sleep(1)
                    try:
                        os.killpg(os.getpgid(orphan_pid), signal.SIGKILL)
                    except (OSError, ProcessLookupError):
                        pass
                    _log("Orphan bridge terminated")
                except ProcessLookupError:
                    _log("Orphan PID file exists but process already dead, cleaning up")
                os.remove(_BRIDGE_PID_FILE)
            except Exception as e:
                _log(f"Failed to clean orphan: {e}")

        # Load saved port setting
        try:
            sp = _settings_path()
            _log(f"Settings path: {sp}")
            if os.path.exists(sp):
                with open(sp, "r") as f:
                    saved = json.loads(f.read())
                    if "port" in saved:
                        _bridge_port = saved["port"]
                _log(f"Loaded port: {_bridge_port}")
        except Exception as e:
            _log(f"ERROR loading settings: {e}")
            decky.logger.warn(f"Could not load settings: {e}")

    async def _unload(self):
        """Lifecycle: called when the plugin is unloaded."""
        decky.logger.info("Tadpole BG3 Companion plugin unloading")
        global _bridge_process, _bridge_stdout_log, _bridge_stderr_log

        # Stop the WebSocket listener thread
        _stop_ws_listener()

        # 1. Stop the tracked process first
        if _bridge_process and _is_bridge_running():
            try:
                pgid = os.getpgid(_bridge_process.pid)
                os.killpg(pgid, signal.SIGTERM)
                try:
                    _bridge_process.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    os.killpg(pgid, signal.SIGKILL)
            except Exception as e:
                decky.logger.warn(f"Failed to kill tracked bridge: {e}")
        _bridge_process = None

        # 2. Check and kill any process from PID file (orphan detection)
        if os.path.exists(_BRIDGE_PID_FILE):
            try:
                with open(_BRIDGE_PID_FILE, "r") as f:
                    pid = int(f.read().strip())
                # Check if process is still running
                if os.path.exists(f"/proc/{pid}"):
                    try:
                        os.kill(pid, signal.SIGTERM)
                        await asyncio.sleep(0.5)
                        # If still alive, force kill
                        if os.path.exists(f"/proc/{pid}"):
                            os.kill(pid, signal.SIGKILL)
                        decky.logger.info(f"Killed orphaned bridge PID {pid}")
                    except Exception as e:
                        decky.logger.warn(f"Failed to kill PID {pid}: {e}")
            except Exception as e:
                decky.logger.warn(f"Failed to read PID file: {e}")
            finally:
                try:
                    os.remove(_BRIDGE_PID_FILE)
                except OSError:
                    pass

        # 3. Kill any node process running the bridge server (by port)
        try:
            import psutil
            port = _bridge_port
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    if proc.info['name'] == 'node':
                        # Check if this node process has our port open
                        for conn in proc.connections():
                            if conn.laddr.port == port:
                                decky.logger.info(f"Killing bridge process {proc.pid} on port {port}")
                                proc.kill()
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    continue
        except ImportError:
            # psutil not available, try a simpler approach
            try:
                # Use fuser to find process on our port, send SIGTERM first then SIGKILL
                port = _bridge_port
                # Try graceful SIGTERM first
                subprocess.run(
                    ["fuser", "-k", "-TERM", f"{port}/tcp"],
                    capture_output=True,
                    timeout=5
                )
                await asyncio.sleep(0.5)
                # If still alive, force kill
                result = subprocess.run(
                    ["fuser", "-k", f"{port}/tcp"],
                    capture_output=True,
                    timeout=5
                )
                if result.returncode == 0:
                    decky.logger.info(f"Killed process on port {port} using fuser")
            except Exception as e:
                decky.logger.debug(f"Could not use fuser to kill port {port}: {e}")

        # Close log file handles to prevent file descriptor leaks
        if _bridge_stdout_log:
            try:
                _bridge_stdout_log.close()
            except Exception:
                pass
            _bridge_stdout_log = None
        if _bridge_stderr_log:
            try:
                _bridge_stderr_log.close()
            except Exception:
                pass
            _bridge_stderr_log = None

    async def _uninstall(self):
        """Lifecycle: called when the plugin is uninstalled."""
        await self._unload()

    # -------------------------------------------------------------------
    # API methods — called from the TSX frontend via callable()
    # -------------------------------------------------------------------

    async def get_diagnostics(self) -> dict:
        """Run all diagnostic checks and return results with detailed paths."""
        try:
            node_installed = _is_node_installed()
            node_version = _get_node_version() if node_installed else None
            bridge_found = _find_bridge_server()
            lua_installed = _is_lua_mod_installed()
            bg3_running = _is_bg3_running()
            bg3_mod_dir = _get_bg3_mod_dir()
            bg3se_installed = _is_bg3se_installed()
            bg3_install_dir = _find_bg3_install_dir()
            node_bin = _get_node_binary()
            home = os.path.expanduser("~")

            # Detailed path info for debugging
            tadpole_node_path = os.path.join(home, "tadpole", "node", "bin", "node")
            bridge_dir = os.path.join(home, "tadpole", "bridge")

            # Check what actually exists on disk
            paths_checked = {
                "tadpole_node_bin": {"path": tadpole_node_path, "exists": os.path.exists(tadpole_node_path)},
                "bridge_server_js": {"path": os.path.join(bridge_dir, "server.js"), "exists": os.path.exists(os.path.join(bridge_dir, "server.js"))},
                "bridge_node_modules": {"path": os.path.join(bridge_dir, "node_modules"), "exists": os.path.isdir(os.path.join(bridge_dir, "node_modules"))},
                "bg3_lua_scripts_dir": {"path": bg3_mod_dir or "NOT FOUND", "exists": bg3_mod_dir is not None},
                "bg3_install_dir": {"path": bg3_install_dir or "NOT FOUND", "exists": bg3_install_dir is not None},
                "bg3se_dwrite": {"path": os.path.join(bg3_install_dir, "bin", "DWrite.dll") if bg3_install_dir else "N/A", "exists": bg3se_installed},
                "plugin_dir": {"path": getattr(decky, 'DECKY_PLUGIN_DIR', 'unknown'), "exists": os.path.isdir(getattr(decky, 'DECKY_PLUGIN_DIR', ''))},
                "state_file": {"path": STATE_FILE, "exists": os.path.exists(STATE_FILE)},
            }

            # If bg3_mod_dir exists, check for v30 mod structure
            if bg3_mod_dir:
                config_path = os.path.join(bg3_mod_dir, "TadpoleCompanion", "ScriptExtender", "Config.json")
                lua_path = os.path.join(bg3_mod_dir, "TadpoleCompanion", "ScriptExtender", "Lua", "TadpoleCompanion.lua")
                paths_checked["tadpole_mod_config"] = {"path": config_path, "exists": os.path.exists(config_path)}
                paths_checked["tadpole_mod_lua"] = {"path": lua_path, "exists": os.path.exists(lua_path)}

            return {
                "node_installed": node_installed,
                "node_version": node_version,
                "node_binary": node_bin,
                "bridge_found": bridge_found is not None,
                "bridge_path": bridge_found,
                "lua_installed": lua_installed,
                "bg3se_installed": bg3se_installed,
                "bg3_install_dir": bg3_install_dir,
                "bg3_running": bg3_running,
                "bg3_mod_dir": bg3_mod_dir,
                "ip": _get_ip(),
                "ready": node_installed and bridge_found is not None and bg3se_installed and lua_installed,
                "paths_checked": paths_checked,
                "plugin_version": PLUGIN_VERSION,
                "home": home,
                "decky_user_home": getattr(decky, 'DECKY_USER_HOME', 'unknown'),
            }
        except Exception as e:
            _report_plugin_error(f"get_diagnostics: {e}", stack=traceback.format_exc())
            return {"error": str(e), "ready": False}

    async def check_health(self) -> dict:
        """Quick health check of the bridge server."""
        try:
            return _get_bridge_health(_bridge_port)
        except Exception as e:
            return {"healthy": False, "error": str(e)}

    async def install_node(self) -> dict:
        """Install Node.js by downloading prebuilt binary."""
        _log("install_node called")
        result = _install_node()
        _log(f"install_node result: {result}")
        return result

    async def install_bridge(self) -> dict:
        """Download and set up the bridge server from GitHub."""
        _log("install_bridge called")
        result = _install_bridge()
        _log(f"install_bridge result: {result}")
        # Update settings with the new bridge dir
        if result.get("success") and result.get("path"):
            try:
                sp = _settings_path()
                settings = {}
                if os.path.exists(sp):
                    with open(sp) as f:
                        settings = json.loads(f.read())
                settings["bridgeDir"] = result["path"]
                with open(sp, "w") as f:
                    f.write(json.dumps(settings, indent=2))
            except Exception as e:
                _log(f"Failed to update settings after bridge install: {e}", "ERROR")
        return result

    async def install_lua_mod(self) -> dict:
        """Download and install the BG3 Lua mod."""
        _log("install_lua_mod called")
        result = _install_lua_mod()
        _log(f"install_lua_mod result: {result}")
        return result

    async def install_bg3se(self) -> dict:
        """Download and install BG3 Script Extender (DWrite.dll + Steam launch options)."""
        _log("install_bg3se called")
        result = _install_bg3se()
        _log(f"install_bg3se result: {result}")
        return result

    async def install_everything(self) -> dict:
        """One-click: install BG3SE, Node.js, bridge server, and Lua mod."""
        _log("=== install_everything called ===")
        results = {}

        # 0. BG3 Script Extender (required for Lua mod to work)
        if not _is_bg3se_installed():
            _log("Step 0: Installing BG3 Script Extender...")
            results["bg3se"] = _install_bg3se()
            _log(f"BG3SE result: {results['bg3se']}")
            if not results["bg3se"]["success"]:
                _log(f"FAILED at bg3se: {results['bg3se']['message']}")
                return {"success": False, "step": "bg3se", "results": results}
        else:
            results["bg3se"] = {"success": True, "message": "Already installed"}
            _log("BG3 Script Extender already installed")

        # 1. Node.js
        if not _is_node_installed():
            _log("Step 1: Installing Node.js...")
            results["node"] = _install_node()
            _log(f"Node.js result: {results['node']}")
            if not results["node"]["success"]:
                _log(f"FAILED at node: {results['node']['message']}")
                return {"success": False, "step": "node", "results": results}
        else:
            results["node"] = {"success": True, "message": "Already installed"}
            _log("Node.js already installed")

        # 2. Bridge server
        if not _find_bridge_server():
            _log("Step 2: Installing bridge server...")
            results["bridge"] = _install_bridge()
            _log(f"Bridge result: {results['bridge']}")
            if not results["bridge"]["success"]:
                _log(f"FAILED at bridge: {results['bridge']['message']}")
                return {"success": False, "step": "bridge", "results": results}
        else:
            results["bridge"] = {"success": True, "message": "Already installed"}
            _log("Bridge already installed")

        # 3. Lua mod
        _log("Step 3: Installing Lua mod...")
        results["lua"] = _install_lua_mod()
        _log(f"Lua mod result: {results['lua']}")

        all_ok = all(r.get("success") for r in results.values())
        _log(f"=== install_everything done: {'SUCCESS' if all_ok else 'PARTIAL'} ===")
        return {"success": all_ok, "results": results}

    async def check_update(self) -> dict:
        """Check GitHub for a newer plugin version."""
        return _check_for_update()

    async def perform_update(self, download_url: str) -> dict:
        """Download and install the latest plugin version."""
        return _perform_update(download_url)

    async def get_log(self) -> dict:
        """Return the plugin log and diagnostic snapshot for remote debugging."""
        try:
            log_content = ""
            if os.path.exists(PLUGIN_LOG):
                with open(PLUGIN_LOG, "r") as f:
                    lines = f.readlines()
                log_content = "".join(lines[-200:])
            
            # Capture fresh diagnostic snapshot
            _capture_diagnostic("get_log")
            
            diag_content = ""
            if os.path.exists(_DIAGNOSTIC_LOG):
                with open(_DIAGNOSTIC_LOG, "r") as f:
                    diag_content = f.read()
            
            return {
                "log": log_content,
                "diagnostic": diag_content,
                "version": PLUGIN_VERSION,
            }
        except Exception as e:
            return {"log": f"Error reading log: {e}", "diagnostic": "", "version": PLUGIN_VERSION}

    async def get_launch_options(self) -> dict:
        """Get current BG3 Steam launch options."""
        try:
            current = _get_steam_launch_options("1086940")
            return {
                "success": True,
                "current": current or "",
                "recommended": 'WINEDLLOVERRIDES="DWrite.dll=n,b" %command%',
                "has_dwrite": bool(current and "DWrite.dll" in current),
            }
        except Exception as e:
            return {"success": False, "current": "", "recommended": "", "has_dwrite": False, "error": str(e)}

    async def set_launch_options(self, launch_options: str) -> dict:
        """Set BG3 Steam launch options. Returns the final value set."""
        try:
            _set_steam_launch_options("1086940", launch_options)
            _log(f"Launch options set: {launch_options}")
            return {"success": True, "message": f"Set: {launch_options}", "value": launch_options}
        except Exception as e:
            _log(f"Failed to set launch options: {e}")
            return {"success": False, "message": str(e)}

    async def copy_to_clipboard(self, text: str) -> dict:
        """Copy text to the system clipboard using xclip (XWayland on Steam Deck).

        Decky's CEF webview blocks navigator.clipboard, so we use the Python
        backend to call xclip against the XWayland display.
        """
        try:
            result = subprocess.run(
                ["xclip", "-selection", "clipboard"],
                input=text,
                capture_output=True,
                text=True,
                timeout=5,
                env={**os.environ, "DISPLAY": ":0"},
            )
            if result.returncode == 0:
                _log(f"Copied to clipboard: {text[:60]}")
                return {"success": True}
            else:
                _log(f"xclip failed: {result.stderr}", "ERROR")
                return {"success": False, "error": result.stderr.strip()}
        except FileNotFoundError:
            _log("xclip not installed", "ERROR")
            return {"success": False, "error": "xclip not installed"}
        except Exception as e:
            _log(f"copy_to_clipboard failed: {e}", "ERROR")
            return {"success": False, "error": str(e)}

    async def get_manual_commands(self) -> dict:
        """Return terminal commands the user can run manually to install deps."""
        home = os.path.expanduser("~")
        tadpole_dir = os.path.join(home, "tadpole")
        node_dir = os.path.join(tadpole_dir, "node")
        bridge_dir = os.path.join(tadpole_dir, "bridge")
        bg3_mod_dir = _get_bg3_mod_dir()

        commands = []

        # 0. BG3 Script Extender
        if not _is_bg3se_installed():
            bg3_dir = _find_bg3_install_dir()
            if bg3_dir:
                commands.append({
                    "label": "Install BG3 Script Extender",
                    "command": f"cd /tmp && curl -sL {BG3SE_DOWNLOAD_URL} -o bg3se.zip && python3 -c \"import zipfile; z=zipfile.ZipFile('bg3se.zip'); [z.extract(m, '{bg3_dir}/bin/') for m in z.namelist() if 'DWrite.dll' in m]\" && rm bg3se.zip && echo 'Done! Now set this Steam launch option for BG3: WINEDLLOVERRIDES=\\\"DWrite.dll=n,b\\\" %command%'",
                    "category": "install",
                })
            else:
                commands.append({
                    "label": "BG3 installation not found",
                    "command": "echo 'Could not find BG3 install directory. Make sure BG3 is installed via Steam.'",
                    "category": "info",
                })

        # 1. Node.js install command
        if not _is_node_installed():
            commands.append({
                "label": "Install Node.js (no sudo needed)",
                "command": f"mkdir -p {node_dir} && cd /tmp && curl -sL https://nodejs.org/dist/v18.20.4/node-v18.20.4-linux-x64.tar.xz -o node.tar.xz && tar xf node.tar.xz -C {node_dir} --strip-components=1 && rm node.tar.xz && {node_dir}/bin/node --version",
                "category": "install",
            })

        # 2. Bridge server install
        if not _find_bridge_server():
            bridge_files_cmd = f"mkdir -p {bridge_dir}"
            for f in BRIDGE_FILES:
                basename = os.path.basename(f)
                bridge_files_cmd += f" && curl -sL {GITHUB_RAW}/{f} -o {bridge_dir}/{basename}"
            npm_bin = os.path.join(node_dir, "bin", "npm") if os.path.exists(os.path.join(node_dir, "bin", "node")) else "npm"
            bridge_files_cmd += f" && cd {bridge_dir} && {npm_bin} install --production"
            commands.append({
                "label": "Install Bridge Server",
                "command": bridge_files_cmd,
                "category": "install",
            })

        # 3. Lua mod install
        if not _is_lua_mod_installed():
            if bg3_mod_dir:
                commands.append({
                    "label": "Install BG3 Lua Mod",
                    "command": f"curl -sL {GITHUB_RAW}/{LUA_MOD_FILES[1]} -o {bg3_mod_dir}/TadpoleCompanion.lua",
                    "category": "install",
                })
            else:
                commands.append({
                    "label": "BG3 ScriptExtender not found. Install BG3 ScriptExtender first, then retry.",
                    "command": "echo 'Install BG3 ScriptExtender from: https://github.com/Norbyte/lsxy'",
                    "category": "info",
                })

        # 4. View log command
        commands.append({
            "label": "View plugin log",
            "command": f"cat {PLUGIN_LOG}",
            "category": "debug",
        })

        # 5. Check bridge status
        commands.append({
            "label": "Test bridge connection",
            "command": f"curl -s http://127.0.0.1:{_bridge_port}/health || echo 'Bridge not responding'",
            "category": "debug",
        })

        return {"commands": commands}

    async def get_status(self) -> dict:
        """Return the current bridge + game status. Uses short TTL caches for expensive calls."""
        try:
            global _bridge_port, _bridge_process

            # Bug #10: Handle sleep/wake — if bridge was running but process died
            # (e.g. after Steam Deck sleep), clean up the stale process handle
            if _bridge_process is not None and _bridge_process.poll() is not None:
                decky.logger.warn("Bridge process died (possibly from sleep/wake), cleaning up handle")
                _bridge_process = None

            now = time.monotonic()
            # Check both plugin-managed and systemd-managed bridge
            bridge_running = _is_bridge_running() or _is_systemd_bridge_running()

            # Cache bg3_running for 5 seconds (pgrep is expensive)
            if now - _status_cache["bg3_ts"] > 5:
                _status_cache["bg3_running"] = _is_bg3_running()
                _status_cache["bg3_ts"] = now
            bg3_running = _status_cache["bg3_running"]

            # Cache IP for 30 seconds (socket connect is expensive)
            if now - _status_cache["ip_ts"] > 30:
                _status_cache["ip"] = _get_ip()
                _status_cache["ip_ts"] = now
            ip = _status_cache["ip"]

            # Cache node_installed for 30 seconds
            if now - _status_cache["node_ts"] > 30:
                _status_cache["node_installed"] = _is_node_installed()
                _status_cache["node_ts"] = now
            node_installed = _status_cache["node_installed"]

            connected_clients = 0
            game_state = None
            recent_events = []

            # Try to get live data from the bridge server HTTP endpoint
            bridge_data = _fetch_bridge_status(_bridge_port)
            if bridge_data:
                connected_clients = bridge_data.get("connectedClients", 0)
                game_state = bridge_data.get("currentState")
                recent_events = bridge_data.get("recentEvents", [])
            elif not bridge_running:
                # Fallback: read state file directly (bridge not running)
                game_state = _read_state_file()

            return {
                "bridge_running": bridge_running,
                "bg3_running": bg3_running,
                "ip": ip,
                "connected_clients": connected_clients,
                "game_state": game_state,
                "recent_events": recent_events,
                "node_installed": node_installed,
            }
        except Exception as e:
            tb = traceback.format_exc()
            decky.logger.error(f"get_status failed: {e}")
            _report_plugin_error(f"get_status: {e}", stack=tb)
            return {"error": str(e)}

    def _is_port_in_use(self, port: int) -> bool:
        """Check if a port is already in use by another process."""
        try:
            import socket
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                result = s.connect_ex(("127.0.0.1", port))
                return result == 0
        except Exception:
            return False

    async def start_bridge(self, port: int = 3456, bridge_dir: str = "") -> dict:
        """Start the bridge server as a background process."""
        try:
            global _bridge_process, _bridge_port

            decky.logger.info(f"start_bridge called: port={port}, bridge_dir={bridge_dir}")

            if _is_bridge_running() or self._is_port_in_use(port or 3456):
                return {"success": True, "message": "Bridge already running"}

            # Check port conflict before starting
            if self._is_port_in_use(port or 3456):
                return {
                    "success": False,
                    "message": f"Bridge is already running on port {port or 3456}. Everything is working!",
                }

            if not _is_node_installed():
                return {
                    "success": False,
                    "message": "Node.js is not installed. Install it with: sudo pacman -S nodejs npm",
                }

            _bridge_port = port or 3456

            # Resolve bridge script path
            bridge_script = None
            if bridge_dir:
                bridge_script = os.path.join(bridge_dir, "server.js")
            else:
                # Search common locations
                candidates = [
                    os.path.join(decky.DECKY_USER_HOME, "tadpole", "bridge", "server.js"),
                    os.path.join(decky.DECKY_PLUGIN_DIR, "bridge", "server.js"),
                    os.path.join(os.path.dirname(decky.DECKY_PLUGIN_DIR), "tadpole", "bridge", "server.js"),
                    os.path.join(decky.DECKY_USER_HOME, "homebrew", "plugins", "TadpoleCompanion", "bridge", "server.js"),
                    os.path.join(decky.DECKY_USER_HOME, "homebrew", "plugins", "TadpoleBG3", "bridge", "server.js"),
                    os.path.join(decky.DECKY_USER_HOME, ".config", "decky", "plugins", "TadpoleBG3", "bridge", "server.js"),
                    "/home/deck/tadpole/bridge/server.js",
                ]
                for candidate in candidates:
                    if os.path.exists(candidate):
                        bridge_script = os.path.realpath(candidate)
                        break

            if not bridge_script or not os.path.exists(bridge_script):
                return {
                    "success": False,
                    "message": f"Bridge server not found. Searched: {bridge_script}",
                }

            # Use bundled node if available
            node_bin = _get_node_binary()
            bridge_dir = os.path.dirname(bridge_script)

            # Check node_modules, run npm install if needed
            if not os.path.exists(os.path.join(bridge_dir, "node_modules")):
                decky.logger.info("node_modules not found, running npm install...")
                # Find npm binary (bundled or system)
                node_dir = os.path.dirname(node_bin)
                npm_bin = os.path.join(node_dir, "npm") if node_dir != "." else "npm"
                npm_env = os.environ.copy()
                if node_dir and os.path.isdir(node_dir):
                    npm_env["PATH"] = node_dir + ":" + npm_env.get("PATH", "")
                try:
                    subprocess.run(
                        [npm_bin, "install", "--production"],
                        cwd=bridge_dir,
                        capture_output=True,
                        text=True,
                        timeout=120,
                        env=npm_env,
                    )
                except Exception as e:
                    return {
                        "success": False,
                        "message": f"npm install failed: {str(e)}",
                    }

            # Start the bridge
            env = os.environ.copy()
            env["PORT"] = str(_bridge_port)

            # Open log files for bridge server output
            global _bridge_stdout_log, _bridge_stderr_log
            log_dir = getattr(decky, 'DECKY_PLUGIN_LOG_DIR', '/tmp')
            os.makedirs(log_dir, exist_ok=True)

            # Close old log handles to prevent FD leaks
            if _bridge_stdout_log:
                try:
                    _bridge_stdout_log.close()
                except Exception:
                    pass
            if _bridge_stderr_log:
                try:
                    _bridge_stderr_log.close()
                except Exception:
                    pass

            _bridge_stdout_log = open(os.path.join(log_dir, "tadpole-bridge-stdout.log"), "a")
            _bridge_stderr_log = open(os.path.join(log_dir, "tadpole-bridge-stderr.log"), "a")

            _bridge_process = subprocess.Popen(
                [node_bin, bridge_script],
                cwd=bridge_dir,
                env=env,
                stdout=_bridge_stdout_log,
                stderr=_bridge_stderr_log,
                # Start in a new process group so we can kill the tree
                preexec_fn=os.setsid,
            )
            decky.logger.info(f"Bridge started on port {_bridge_port}, PID={_bridge_process.pid}")
            _capture_diagnostic("bridge_started", {"pid": _bridge_process.pid, "port": _bridge_port})

            # Write PID file for orphan detection
            try:
                with open(_BRIDGE_PID_FILE, "w") as f:
                    f.write(str(_bridge_process.pid))
            except Exception as e:
                _log(f"Failed to write PID file: {e}")

            # Brief pause then verify process didn't crash immediately
            await asyncio.sleep(0.5)
            if _bridge_process.poll() is not None:
                exit_code = _bridge_process.returncode
                _bridge_process = None
                return {
                    "success": False,
                    "message": f"Bridge exited immediately (code {exit_code}). Check logs in {log_dir}",
                }

            return {
                "success": True,
                "message": f"Bridge started on port {_bridge_port}",
                "pid": _bridge_process.pid,
            }
        except Exception as e:
            tb = traceback.format_exc()
            decky.logger.error(f"start_bridge failed: {e}")
            _report_plugin_error(f"start_bridge: {e}", stack=tb, extra={"port": port, "bridge_dir": bridge_dir})
            return {
                "success": False,
                "message": f"Failed to start bridge: {str(e)}",
            }

    async def stop_bridge(self) -> dict:
        """Stop the bridge server process."""
        global _bridge_process

        decky.logger.info("stop_bridge called")

        try:
            if not _is_bridge_running():
                _bridge_process = None
                try:
                    if os.path.exists(_BRIDGE_PID_FILE):
                        os.remove(_BRIDGE_PID_FILE)
                except OSError:
                    pass
                return {"success": True, "message": "Bridge was not running"}

            if _bridge_process is None:
                # Something is listening on the port but we don't track the process.
                # This happens when the bridge was started by systemd or another instance.
                killed = False

                # 1. Try stopping systemd service first
                try:
                    result = subprocess.run(
                        ["systemctl", "--user", "stop", "tadpole-bridge"],
                        capture_output=True, text=True, timeout=5,
                    )
                    if result.returncode == 0:
                        killed = True
                        decky.logger.info("Stopped bridge via systemd")
                except Exception:
                    pass

                # 2. Try PID file
                if not killed:
                    try:
                        if os.path.exists(_BRIDGE_PID_FILE):
                            with open(_BRIDGE_PID_FILE, "r") as f:
                                pid = int(f.read().strip())
                            if os.path.exists(f"/proc/{pid}"):
                                os.kill(pid, signal.SIGTERM)
                                await asyncio.sleep(0.5)
                                if os.path.exists(f"/proc/{pid}"):
                                    os.kill(pid, signal.SIGKILL)
                                killed = True
                                decky.logger.info(f"Killed bridge PID {pid} from PID file")
                    except Exception:
                        pass

                # 3. Try fuser to kill whatever is on the port
                if not killed:
                    try:
                        subprocess.run(
                            ["fuser", "-k", "-TERM", f"{_bridge_port}/tcp"],
                            capture_output=True, timeout=5,
                        )
                        await asyncio.sleep(0.5)
                        killed = True
                        decky.logger.info(f"Killed process on port {_bridge_port} via fuser")
                    except Exception:
                        pass

                # 4. Last resort: pkill node server.js
                if not killed:
                    try:
                        subprocess.run(
                            ["pkill", "-f", "node.*server.js"],
                            capture_output=True, timeout=5,
                        )
                        killed = True
                        decky.logger.info("Killed bridge via pkill")
                    except Exception:
                        pass

                # Clean up PID file
                try:
                    if os.path.exists(_BRIDGE_PID_FILE):
                        os.remove(_BRIDGE_PID_FILE)
                except OSError:
                    pass

                return {"success": True, "message": "Bridge stopped" if killed else "Bridge was not tracked (cleaned up)"}

            pgid = os.getpgid(_bridge_process.pid)
            os.killpg(pgid, signal.SIGTERM)

            try:
                _bridge_process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                os.killpg(pgid, signal.SIGKILL)
                _bridge_process.wait(timeout=2)

            _bridge_process = None

            # Clean up PID file
            try:
                if os.path.exists(_BRIDGE_PID_FILE):
                    os.remove(_BRIDGE_PID_FILE)
            except OSError:
                pass

            decky.logger.info("Bridge stopped")
            return {"success": True, "message": "Bridge stopped"}
        except Exception as e:
            tb = traceback.format_exc()
            decky.logger.error(f"stop_bridge error: {e}")
            _report_plugin_error(f"stop_bridge: {e}", stack=tb)
            if _bridge_process is not None:
                try:
                    _bridge_process.kill()
                except Exception:
                    pass
            _bridge_process = None
            # Clean up PID file even on error
            try:
                if os.path.exists(_BRIDGE_PID_FILE):
                    os.remove(_BRIDGE_PID_FILE)
            except OSError:
                pass
            return {
                "success": False,
                "message": f"Error stopping bridge: {str(e)}",
            }

    async def get_ip(self) -> dict:
        """Return the Steam Deck's LAN IP address."""
        try:
            return {"ip": _get_ip()}
        except Exception as e:
            _report_plugin_error(f"get_ip: {e}", stack=traceback.format_exc())
            return {"ip": "localhost", "error": str(e)}

    async def get_settings(self) -> dict:
        """Load saved settings from Decky's settings directory."""
        try:
            sp = _settings_path()
            if os.path.exists(sp):
                with open(sp, "r") as f:
                    return json.loads(f.read())
        except Exception as e:
            decky.logger.warn(f"Could not read settings: {e}")
            _report_plugin_error(f"get_settings: {e}", stack=traceback.format_exc())
        return {}

    async def save_settings(self, settings: dict) -> dict:
        """Persist settings to Decky's settings directory (atomic write)."""
        global _bridge_port
        try:
            sp = _settings_path()
            os.makedirs(os.path.dirname(sp), exist_ok=True)

            # Atomic write: write to temp file, then rename
            temp_path = sp + ".tmp"
            with open(temp_path, "w") as f:
                f.write(json.dumps(settings, indent=2))
            os.rename(temp_path, sp)

            if "port" in settings:
                _bridge_port = settings["port"]
            decky.logger.info(f"Settings saved to {sp}")
            return {"success": True}
        except Exception as e:
            tb = traceback.format_exc()
            decky.logger.error(f"Could not save settings: {e}")
            _report_plugin_error(f"save_settings: {e}", stack=tb)
            return {"success": False, "message": str(e)}

    # -------------------------------------------------------------------
    # Cheats — write commands to the Lua mod's command file
    # -------------------------------------------------------------------

    async def send_command(self, action: str, value: str = "") -> dict:
        """Append a cheat command to the TadpoleCommands.json file for the Lua mod to consume.

        Allowed actions: heal_party, revive, full_restore, add_gold,
        trigger_rest, short_rest, long_rest, god_mode, reset_cooldowns, toggle_combat.
        """
        ALLOWED = {
            "heal_party", "revive", "full_restore", "add_gold",
            "trigger_rest", "short_rest", "long_rest", "god_mode",
            "reset_cooldowns", "toggle_combat",
        }

        if action not in ALLOWED:
            return {"success": False, "message": f"Unknown action: {action}"}

        # Validate value for specific actions
        if action == "add_gold" and (not value or not value.isdigit()):
            return {"success": False, "message": "add_gold requires a numeric value"}
        if action == "god_mode" and value not in ("0", "1"):
            return {"success": False, "message": "god_mode value must be '0' or '1'"}

        try:
            cmd_file = _get_command_file()
            _log(f"send_command: action={action}, value={value}, file={cmd_file}")

            # Read existing commands (or start fresh)
            commands = []
            if os.path.exists(cmd_file):
                try:
                    with open(cmd_file, "r") as f:
                        data = f.read().strip()
                    if data:
                        commands = json.loads(data)
                        if not isinstance(commands, list):
                            commands = []
                except (json.JSONDecodeError, OSError):
                    commands = []

            # Append new command
            commands.append({"type": action, "value": str(value)})

            # Atomic write: temp file + rename
            cmd_dir = os.path.dirname(cmd_file)
            os.makedirs(cmd_dir, exist_ok=True)
            temp_path = cmd_file + ".tmp"
            with open(temp_path, "w") as f:
                f.write(json.dumps(commands))
            os.rename(temp_path, cmd_file)

            _log(f"send_command: wrote command {action} to {cmd_file}")
            return {"success": True, "message": f"Sent: {action}" + (f" ({value})" if value else "")}

        except Exception as e:
            _log(f"send_command failed: {e}", "ERROR")
            return {"success": False, "message": f"Failed: {str(e)}"}
