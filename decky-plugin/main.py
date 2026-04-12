"""
Tadpole BG3 Companion - DeckyLoader Python Backend

Runs on the Steam Deck, manages the bridge server process,
reads game state, and exposes API methods to the TSX frontend
via the official decky module.
"""

import subprocess
import os
import json
import signal
import socket
import http.client
import traceback
import datetime
import urllib.request
import urllib.error

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

# Error reporting
PB_ERROR_ENDPOINT = "https://pb.gohanlab.uk/api/collections/tadpole_errors/records"
PLUGIN_VERSION = "0.2.0"
_error_report_timestamps = []
ERROR_RATE_LIMIT_PER_MINUTE = 10


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
        # Rate limit
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
            urllib.request.urlopen(req, timeout=3)
        except Exception:
            pass  # Silently fail if PocketBase is unreachable
    except Exception:
        pass  # Never let error reporting crash the plugin


def _safe_call(func):
    """Decorator that wraps an async method with error reporting."""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            tb = traceback.format_exc()
            decky.logger.error(f"{func.__name__} failed: {e}")
            _report_plugin_error(
                f"{func.__name__}: {e}",
                stack=tb,
                extra={"args": str(args)[:200]},
            )
            raise  # Re-raise so the frontend still sees the error
    wrapper.__name__ = func.__name__
    return wrapper


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_ip():
    """Get the Steam Deck's LAN IP address."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("1.1.1.1", 80))
        ip = s.getsockname()[0]
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
        # Fallback: check for Steam AppID in process args
        result2 = subprocess.run(
            ["pgrep", "-f", "1086940"],
            capture_output=True, text=True, timeout=5
        )
        return result2.returncode == 0
    except Exception:
        return False


def _is_bridge_running():
    """Check if the bridge server process is alive."""
    global _bridge_process
    if _bridge_process is None:
        return False
    return _bridge_process.poll() is None


def _is_node_installed():
    """Check if Node.js is available."""
    try:
        result = subprocess.run(
            ["node", "--version"], capture_output=True, text=True, timeout=5
        )
        return result.returncode == 0
    except Exception:
        return False


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
        decky.logger.info("Tadpole BG3 Companion plugin loaded")
        decky.logger.info(f"Plugin version: {PLUGIN_VERSION}")

        # Load saved port setting
        try:
            sp = _settings_path()
            if os.path.exists(sp):
                with open(sp, "r") as f:
                    saved = json.loads(f.read())
                    if "port" in saved:
                        _bridge_port = saved["port"]
        except Exception as e:
            decky.logger.warn(f"Could not load settings: {e}")
            _report_plugin_error(f"load settings: {e}", stack=traceback.format_exc())

    async def _unload(self):
        """Lifecycle: called when the plugin is unloaded."""
        decky.logger.info("Tadpole BG3 Companion plugin unloading")
        global _bridge_process
        if _bridge_process and _is_bridge_running():
            try:
                pgid = os.getpgid(_bridge_process.pid)
                os.killpg(pgid, signal.SIGTERM)
            except Exception:
                try:
                    _bridge_process.kill()
                except Exception:
                    pass
        _bridge_process = None

    async def _uninstall(self):
        """Lifecycle: called when the plugin is uninstalled."""
        await self._unload()

    # -------------------------------------------------------------------
    # API methods — called from the TSX frontend via callable()
    # -------------------------------------------------------------------

    async def get_status(self) -> dict:
        """Return the current bridge + game status."""
        try:
            global _bridge_port, _bridge_process

            # Bug #10: Handle sleep/wake — if bridge was running but process died
            # (e.g. after Steam Deck sleep), clean up the stale process handle
            if _bridge_process is not None and _bridge_process.poll() is not None:
                decky.logger.warn("Bridge process died (possibly from sleep/wake), cleaning up handle")
                _bridge_process = None

            bridge_running = _is_bridge_running()
            bg3_running = _is_bg3_running()
            ip = _get_ip()
            node_installed = _is_node_installed()

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

    async def start_bridge(self, port: int = 3456, bridge_dir: str = "") -> dict:
        """Start the bridge server as a background process."""
        try:
            global _bridge_process, _bridge_port

            decky.logger.info(f"start_bridge called: port={port}, bridge_dir={bridge_dir}")

            if _is_bridge_running():
                return {"success": True, "message": "Bridge already running"}

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

            # Check node_modules, run npm install if needed
            bridge_dir = os.path.dirname(bridge_script)
            if not os.path.exists(os.path.join(bridge_dir, "node_modules")):
                decky.logger.info("node_modules not found, running npm install...")
                try:
                    subprocess.run(
                        ["npm", "install", "--production"],
                        cwd=bridge_dir,
                        capture_output=True,
                        text=True,
                        timeout=120,
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
            log_dir = getattr(decky, 'DECKY_PLUGIN_LOG_DIR', '/tmp')
            os.makedirs(log_dir, exist_ok=True)
            stdout_log = open(os.path.join(log_dir, "tadpole-bridge-stdout.log"), "a")
            stderr_log = open(os.path.join(log_dir, "tadpole-bridge-stderr.log"), "a")

            _bridge_process = subprocess.Popen(
                ["node", bridge_script],
                cwd=bridge_dir,
                env=env,
                stdout=stdout_log,
                stderr=stderr_log,
                # Start in a new process group so we can kill the tree
                preexec_fn=os.setsid,
            )
            decky.logger.info(f"Bridge started on port {_bridge_port}, PID={_bridge_process.pid}")
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
                return {"success": True, "message": "Bridge was not running"}

            pgid = os.getpgid(_bridge_process.pid)
            os.killpg(pgid, signal.SIGTERM)

            try:
                _bridge_process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                os.killpg(pgid, signal.SIGKILL)
                _bridge_process.wait(timeout=2)

            _bridge_process = None
            decky.logger.info("Bridge stopped")
            return {"success": True, "message": "Bridge stopped"}
        except Exception as e:
            tb = traceback.format_exc()
            decky.logger.error(f"stop_bridge error: {e}")
            _report_plugin_error(f"stop_bridge: {e}", stack=tb)
            try:
                _bridge_process.kill()
            except Exception:
                pass
            _bridge_process = None
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
        """Persist settings to Decky's settings directory."""
        global _bridge_port
        try:
            sp = _settings_path()
            os.makedirs(os.path.dirname(sp), exist_ok=True)
            with open(sp, "w") as f:
                f.write(json.dumps(settings, indent=2))
            if "port" in settings:
                _bridge_port = settings["port"]
            decky.logger.info(f"Settings saved to {sp}")
            return {"success": True}
        except Exception as e:
            tb = traceback.format_exc()
            decky.logger.error(f"Could not save settings: {e}")
            _report_plugin_error(f"save_settings: {e}", stack=tb)
            return {"success": False, "message": str(e)}
