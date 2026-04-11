"""
decky.pyi — Type hints for the DeckyLoader Python plugin API.
Place this file alongside main.py in the plugin root for intellisense.

Based on the official DeckyLoader plugin template:
https://github.com/SteamDeckHomebrew/decky-plugin-template
"""

import os
from typing import Any

# ---------------------------------------------------------------------------
# Decky-provided directory constants
# ---------------------------------------------------------------------------

# Home directory of the user running DeckyLoader (typically /home/deck)
DECKY_USER_HOME: str

# Root of the currently loaded plugin  (<plugins>/<plugin_name>)
DECKY_PLUGIN_DIR: str

# Per-plugin settings directory (persisted across updates)
DECKY_PLUGIN_SETTINGS_DIR: str

# Per-plugin log directory
DECKY_PLUGIN_LOG_DIR: str

# DeckyLoader runtime directory
DECKY_PLUGIN_RUNTIME_DIR: str

# DeckyLoader version string
DECKY_VERSION: str


# ---------------------------------------------------------------------------
# Logger — mirrors Python's standard logging interface
# ---------------------------------------------------------------------------

class _DeckyLogger:
    def info(self, msg: str, *args: Any) -> None: ...
    def warn(self, msg: str, *args: Any) -> None: ...
    def error(self, msg: str, *args: Any) -> None: ...
    def debug(self, msg: str, *args: Any) -> None: ...

logger: _DeckyLogger
