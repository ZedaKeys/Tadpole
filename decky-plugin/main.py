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
import shutil
import zipfile
import io
import re

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
PLUGIN_VERSION = "0.4.1"
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
    """Check if the TadpoleCompanion.lua BG3 ScriptExtender mod exists."""
    try:
        # BG3 ScriptExtender mods live in:
        # ~/.local/share/Steam/steamapps/common/Baldurs Gate 3/Data/Mods/ (for .pak)
        # or the SE LuaScripts folder
        home = os.path.expanduser("~")
        candidates = [
            # Steam Deck typical BG3 SE path
            os.path.join(home, ".steam", "steam", "steamapps", "common", "Baldurs Gate 3", "Data", "Mods"),
            os.path.join(home, ".local", "share", "Steam", "steamapps", "common", "Baldurs Gate 3", "Data", "Mods"),
            # ScriptExtender Lua scripts
            os.path.join(home, ".steam", "steam", "steamapps", "common", "Baldurs Gate 3", "Data", "LuaScripts"),
            os.path.join(home, ".local", "share", "Steam", "steamapps", "common", "Baldurs Gate 3", "Data", "LuaScripts"),
            # Alternative BG3 folder name
            os.path.join(home, ".steam", "steam", "steamapps", "common", "Baldur's Gate 3", "Data", "LuaScripts"),
        ]
        for candidate in candidates:
            tadpole_lua = os.path.join(candidate, "TadpoleCompanion.lua")
            if os.path.exists(tadpole_lua):
                return True
        # Also check if BG3 SE is even installed
        for candidate in candidates:
            if os.path.exists(candidate):
                # Folder exists but no TadpoleCompanion.lua
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
        os.path.join(getattr(decky, 'DECKY_USER_HOME', home), "homebrew", "plugins", "TadpoleBG3", "bridge", "server.js"),
        os.path.join(getattr(decky, 'DECKY_USER_HOME', home), ".config", "decky", "plugins", "TadpoleBG3", "bridge", "server.js"),
    ]
    for c in candidates:
        if c and os.path.exists(c):
            return os.path.realpath(c)
    return None


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

# The Lua mod file
LUA_MOD_FILE = "mod/TadpoleCompanion.lua"


def _get_bg3_mod_dir():
    """Find the BG3 ScriptExtender LuaScripts directory."""
    home = os.path.expanduser("~")
    candidates = [
        os.path.join(home, ".steam", "steam", "steamapps", "common", "Baldurs Gate 3", "Data", "LuaScripts"),
        os.path.join(home, ".local", "share", "Steam", "steamapps", "common", "Baldurs Gate 3", "Data", "LuaScripts"),
        os.path.join(home, ".steam", "steam", "steamapps", "common", "Baldur's Gate 3", "Data", "LuaScripts"),
        os.path.join(home, ".local", "share", "Steam", "steamapps", "common", "Baldur's Gate 3", "Data", "LuaScripts"),
    ]
    for c in candidates:
        if os.path.isdir(c):
            return c
    # Try to find via Steam library
    try:
        vdf_path = os.path.join(home, ".steam", "steam", "steamapps", "libraryfolders.vdf")
        if not os.path.exists(vdf_path):
            vdf_path = os.path.join(home, ".local", "share", "Steam", "steamapps", "libraryfolders.vdf")
        if os.path.exists(vdf_path):
            with open(vdf_path) as f:
                content = f.read()
            # Extract paths from VDF
            for match in re.finditer(r'"path"\s+"([^"]+)"', content):
                lib_path = match.group(1)
                bg3_lua = os.path.join(lib_path, "steamapps", "common", "Baldurs Gate 3", "Data", "LuaScripts")
                if os.path.isdir(bg3_lua):
                    return bg3_lua
                bg3_lua = os.path.join(lib_path, "steamapps", "common", "Baldur's Gate 3", "Data", "LuaScripts")
                if os.path.isdir(bg3_lua):
                    return bg3_lua
    except Exception:
        pass
    return None


def _download_file(url, dest_path):
    """Download a file from URL to a local path."""
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Tadpole-Decky/0.4.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
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
        req = urllib.request.Request(url, headers={"User-Agent": "Tadpole-Decky/0.4.0"})
        with urllib.request.urlopen(req, timeout=120) as resp:
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
    """Download bridge server files from GitHub."""
    try:
        bridge_dir = os.path.join(os.path.expanduser("~"), "tadpole", "bridge")
        os.makedirs(bridge_dir, exist_ok=True)

        downloaded = 0
        total = len(BRIDGE_FILES)

        for file_path in BRIDGE_FILES:
            url = f"{GITHUB_RAW}/{file_path}"
            dest = os.path.join(bridge_dir, os.path.basename(file_path))
            if not _download_file(url, dest):
                # File might not exist in repo, skip
                decky.logger.warn(f"Skipping {file_path} (not found in repo)")
            downloaded += 1
            if progress_cb:
                progress_cb(downloaded, total)

        # Run npm install using bundled or system npm
        if os.path.exists(os.path.join(bridge_dir, "package.json")):
            node_bin = _get_node_binary()
            npm_bin = os.path.join(os.path.dirname(node_bin), "npm") if os.path.dirname(node_bin) != "" else "npm"
            result = subprocess.run(
                [npm_bin, "install", "--production"],
                cwd=bridge_dir, capture_output=True, text=True, timeout=120,
            )
            if result.returncode != 0:
                return {"success": False, "message": f"npm install failed: {result.stderr[-200:]}"}

        return {
            "success": True,
            "message": f"Bridge installed to {bridge_dir}",
            "path": bridge_dir,
        }
    except Exception as e:
        return {"success": False, "message": str(e)}


def _install_lua_mod():
    """Download and install the BG3 ScriptExtender Lua mod."""
    try:
        mod_dir = _get_bg3_mod_dir()
        if not mod_dir:
            return {
                "success": False,
                "message": "BG3 ScriptExtender LuaScripts folder not found. Make sure BG3 is installed and ScriptExtender is set up.",
            }

        url = f"{GITHUB_RAW}/{LUA_MOD_FILE}"
        dest = os.path.join(mod_dir, "TadpoleCompanion.lua")

        if not _download_file(url, dest):
            return {"success": False, "message": f"Failed to download Lua mod from {url}"}

        return {"success": True, "message": f"Lua mod installed to {dest}"}
    except Exception as e:
        return {"success": False, "message": str(e)}


def _check_for_update():
    """Check GitHub releases for a newer plugin version."""
    try:
        url = f"{GITHUB_API}/releases/latest"
        req = urllib.request.Request(url, headers={"User-Agent": "Tadpole-Decky/0.4.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())

        tag = data.get("tag_name", "")
        # Extract version from tag like "decky-plugin-v0.4.0" or "v0.4.0"
        match = re.search(r"v?(\d+\.\d+\.\d+)", tag)
        if not match:
            return {"update_available": False, "error": "Could not parse version from tag"}

        latest = match.group(1)
        current = PLUGIN_VERSION

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
                    result["release_notes"] = data.get("body", "")
                    break

        return result
    except Exception as e:
        return {"update_available": False, "error": str(e)}


def _perform_update(download_url):
    """Download and install the latest plugin release."""
    try:
        plugin_dir = getattr(decky, 'DECKY_PLUGIN_DIR', '')
        if not plugin_dir:
            return {"success": False, "message": "Cannot determine plugin directory"}

        # Download the zip
        req = urllib.request.Request(download_url, headers={"User-Agent": "Tadpole-Decky/0.4.0"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            zip_bytes = resp.read()

        # Extract
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
            # The zip contains a TadpoleBG3/ folder
            for info in zf.infolist():
                # Skip directories
                if info.filename.endswith("/"):
                    continue
                # Remove the TadpoleBG3/ prefix
                rel_path = info.filename
                for prefix in ["TadpoleBG3/", "tadpole-decky/", ""]:
                    if rel_path.startswith(prefix) and prefix:
                        rel_path = rel_path[len(prefix):]
                        break
                if not rel_path:
                    continue

                dest = os.path.join(plugin_dir, rel_path)
                os.makedirs(os.path.dirname(dest), exist_ok=True)
                with zf.open(info) as src, open(dest, "wb") as dst:
                    dst.write(src.read())

        return {
            "success": True,
            "message": "Update installed. Please restart DeckyLoader to apply.",
        }
    except Exception as e:
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

    async def get_diagnostics(self) -> dict:
        """Run all diagnostic checks and return results."""
        try:
            node_installed = _is_node_installed()
            node_version = _get_node_version() if node_installed else None
            bridge_found = _find_bridge_server()
            lua_installed = _is_lua_mod_installed()
            bg3_running = _is_bg3_running()

            return {
                "node_installed": node_installed,
                "node_version": node_version,
                "bridge_found": bridge_found is not None,
                "bridge_path": bridge_found,
                "lua_installed": lua_installed,
                "bg3_running": bg3_running,
                "ip": _get_ip(),
                "ready": node_installed and bridge_found is not None,
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
        """Install Node.js via pacman."""
        return _install_node()

    async def install_bridge(self) -> dict:
        """Download and set up the bridge server from GitHub."""
        result = _install_bridge()
        # Update settings with the new bridge dir
        if result.get("success") and result.get("path"):
            sp = _settings_path()
            settings = {}
            if os.path.exists(sp):
                with open(sp) as f:
                    settings = json.loads(f.read())
            settings["bridgeDir"] = result["path"]
            with open(sp, "w") as f:
                f.write(json.dumps(settings, indent=2))
        return result

    async def install_lua_mod(self) -> dict:
        """Download and install the BG3 Lua mod."""
        return _install_lua_mod()

    async def install_everything(self) -> dict:
        """One-click: install Node.js, bridge server, and Lua mod."""
        results = {}
        # 1. Node.js
        if not _is_node_installed():
            results["node"] = _install_node()
            if not results["node"]["success"]:
                return {"success": False, "step": "node", "results": results}
        else:
            results["node"] = {"success": True, "message": "Already installed"}

        # 2. Bridge server
        if not _find_bridge_server():
            results["bridge"] = _install_bridge()
            if not results["bridge"]["success"]:
                return {"success": False, "step": "bridge", "results": results}
        else:
            results["bridge"] = {"success": True, "message": "Already installed"}

        # 3. Lua mod
        results["lua"] = _install_lua_mod()

        all_ok = all(r.get("success") for r in results.values())
        return {"success": all_ok, "results": results}

    async def check_update(self) -> dict:
        """Check GitHub for a newer plugin version."""
        return _check_for_update()

    async def perform_update(self, download_url: str) -> dict:
        """Download and install the latest plugin version."""
        return _perform_update(download_url)

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

            # Use bundled node if available
            node_bin = _get_node_binary()
            bridge_dir = os.path.dirname(bridge_script)

            # Check node_modules, run npm install if needed
            if not os.path.exists(os.path.join(bridge_dir, "node_modules")):
                decky.logger.info("node_modules not found, running npm install...")
                # Find npm binary (bundled or system)
                npm_bin = os.path.join(os.path.dirname(node_bin), "npm") if os.path.dirname(node_bin) != "" else "npm"
                try:
                    subprocess.run(
                        [npm_bin, "install", "--production"],
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
                [node_bin, bridge_script],
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
