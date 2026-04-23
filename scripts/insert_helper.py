#!/usr/bin/env python3
"""Insert the _kill_bridge_cascade helper function before the Plugin class."""

HELPER = '''
async def _kill_bridge_cascade():
    """Shared cascade to fully stop the bridge process.

    Tries in order:
    1. Tracked subprocess (plugin-managed)
    2. systemd user service
    3. PID file (orphan detection)
    4. fuser on bridge port
    5. pkill fallback
    Then cleans up PID file and resets global state.
    Returns True if something was killed.
    """
    global _bridge_process, _bridge_port

    killed = False

    # 1. Try the tracked plugin-managed process
    if _bridge_process is not None and _bridge_process.poll() is None:
        try:
            pgid = os.getpgid(_bridge_process.pid)
            os.killpg(pgid, signal.SIGTERM)
            try:
                _bridge_process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                os.killpg(pgid, signal.SIGKILL)
            killed = True
            decky.logger.info("Killed tracked bridge process")
        except Exception as e:
            decky.logger.warn(f"Failed to kill tracked bridge: {e}")
    _bridge_process = None

    # 2. Try systemd user service
    if not killed:
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

    # 3. Try PID file (orphan detection)
    if not killed and os.path.exists(_BRIDGE_PID_FILE):
        try:
            with open(_BRIDGE_PID_FILE, "r") as f:
                pid = int(f.read().strip())
            if os.path.exists(f"/proc/{pid}"):
                os.kill(pid, signal.SIGTERM)
                await asyncio.sleep(0.5)
                if os.path.exists(f"/proc/{pid}"):
                    os.kill(pid, signal.SIGKILL)
                killed = True
                decky.logger.info(f"Killed bridge PID {pid} from PID file")
        except Exception as e:
            decky.logger.warn(f"Failed to kill via PID file: {e}")

    # 4. Try fuser on bridge port
    if not killed:
        try:
            subprocess.run(
                ["fuser", "-k", "-TERM", f"{_bridge_port}/tcp"],
                capture_output=True, timeout=5,
            )
            await asyncio.sleep(0.5)
            subprocess.run(
                ["fuser", "-k", f"{_bridge_port}/tcp"],
                capture_output=True, timeout=5,
            )
            killed = True
            decky.logger.info(f"Killed process on port {_bridge_port} via fuser")
        except Exception:
            pass

    # 5. Last resort: pkill
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

    return killed

'''

import sys

filepath = sys.argv[1]
with open(filepath, 'r') as f:
    content = f.read()

marker = '# ---------------------------------------------------------------------------\n# Plugin class'
idx = content.find(marker)
if idx == -1:
    print("ERROR: Marker not found!")
    sys.exit(1)

content = content[:idx] + HELPER + '\n' + content[idx:]
with open(filepath, 'w') as f:
    f.write(content)

print(f"Inserted helper function at position {idx}")
