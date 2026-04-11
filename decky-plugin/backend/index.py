"""
Tadpole BG3 Companion — DeckyLoader Python Backend

Runs on the Steam Deck, manages the bridge server process,
reads game state, and exposes API methods to the TSX frontend.
"""

import subprocess
import os
import json
import signal
import socket
import time
import urllib.request
import urllib.error
import http.client

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BRIDGE_SCRIPT = None  # Set dynamically via start_bridge()
SETTINGS_FILE = os.path.join(os.path.dirname(__file__), "tadpole_settings.json")
STATE_FILE = os.path.join(os.environ.get("TMPDIR", "/tmp"), "tadpole_state.json")

# Bridge process handle
_bridge_process = None
_bridge_port = 3456

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_ip():
    """Get the Steam Deck's LAN IP address."""
    try:
        # Create a socket to determine the outbound IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("1.1.1.1", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        try:
            # Fallback: parse hostname -I
            result = subprocess.run(
                ["hostname", "-I"], capture_output=True, text=True, timeout=5
            )
            return result.stdout.strip().split()[0] if result.stdout.strip() else "localhost"
        except Exception:
            return "localhost"


def _is_bg3_running():
    """Check if Baldur's Gate 3 is currently running."""
    try:
        result = subprocess.run(
            ["pgrep", "-f", "bg3"], capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0:
            return True
        # Also check for the Steam AppID
        result2 = subprocess.run(
            ["pgrep", "-f", "1086940"], capture_output=True, text=True, timeout=5
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
        # Use http.client to avoid DNS resolution delays with localhost
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


# ---------------------------------------------------------------------------
# Plugin API methods — called from the TSX frontend via serverAPI.callPluginMethod
# ---------------------------------------------------------------------------

class Plugin:
    """DeckyLoader Python plugin backend."""

    async def get_status(self) -> dict:
        """Return the current bridge + game status."""
        global _bridge_port

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

    async def start_bridge(self, port: int = 3456, bridge_dir: str = "") -> dict:
        """Start the bridge server as a background process."""
        global _bridge_process, _bridge_port, BRIDGE_SCRIPT

        if _is_bridge_running():
            return {"success": True, "message": "Bridge already running"}

        if not _is_node_installed():
            return {
                "success": False,
                "message": "Node.js is not installed. Install it with: sudo pacman -S nodejs npm",
            }

        _bridge_port = port or 3456

        # Resolve bridge directory
        if bridge_dir:
            BRIDGE_SCRIPT = os.path.join(bridge_dir, "server.js")
        else:
            # Default: look relative to this plugin
            plugin_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            candidates = [
                os.path.join(plugin_dir, "bridge", "server.js"),
                os.path.join(plugin_dir, "tadpole", "bridge", "server.js"),
                "/home/deck/tadpole/bridge/server.js",
            ]
            for candidate in candidates:
                if os.path.exists(candidate):
                    BRIDGE_SCRIPT = candidate
                    break

        if not BRIDGE_SCRIPT or not os.path.exists(BRIDGE_SCRIPT):
            return {
                "success": False,
                "message": f"Bridge server not found. Searched: {BRIDGE_SCRIPT}",
            }

        # Check node_modules
        bridge_dir = os.path.dirname(BRIDGE_SCRIPT)
        if not os.path.exists(os.path.join(bridge_dir, "node_modules")):
            # Install dependencies
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

        try:
            _bridge_process = subprocess.Popen(
                ["node", BRIDGE_SCRIPT],
                cwd=bridge_dir,
                env=env,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                # Start in a new process group so we can kill the tree
                preexec_fn=os.setsid,
            )
            return {
                "success": True,
                "message": f"Bridge started on port {_bridge_port}",
                "pid": _bridge_process.pid,
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to start bridge: {str(e)}",
            }

    async def stop_bridge(self) -> dict:
        """Stop the bridge server process."""
        global _bridge_process

        if not _is_bridge_running():
            _bridge_process = None
            return {"success": True, "message": "Bridge was not running"}

        try:
            # Kill the entire process group
            pgid = os.getpgid(_bridge_process.pid)
            os.killpg(pgid, signal.SIGTERM)

            # Wait briefly for clean exit
            try:
                _bridge_process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                os.killpg(pgid, signal.SIGKILL)
                _bridge_process.wait(timeout=2)

            _bridge_process = None
            return {"success": True, "message": "Bridge stopped"}
        except Exception as e:
            # Force cleanup
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
        return {"ip": _get_ip()}

    async def get_settings(self) -> dict:
        """Load saved settings from disk."""
        try:
            if os.path.exists(SETTINGS_FILE):
                with open(SETTINGS_FILE, "r") as f:
                    return json.loads(f.read())
        except Exception:
            pass
        return {}

    async def save_settings(self, settings: dict) -> dict:
        """Persist settings to disk."""
        global _bridge_port
        try:
            with open(SETTINGS_FILE, "w") as f:
                f.write(json.dumps(settings, indent=2))
            if "port" in settings:
                _bridge_port = settings["port"]
            return {"success": True}
        except Exception as e:
            return {"success": False, "message": str(e)}


# ---------------------------------------------------------------------------
# Plugin lifecycle
# ---------------------------------------------------------------------------

# DeckyLoader looks for these module-level hooks

_plugin_instance = Plugin()


def main():
    """Entry point — DeckyLoader calls this to get the plugin instance."""
    return _plugin_instance


# Cleanup on module unload
def _cleanup():
    """Stop the bridge server when the plugin is unloaded."""
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


import atexit
atexit.register(_cleanup)
