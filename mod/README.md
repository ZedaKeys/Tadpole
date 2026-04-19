# Tadpole BG3SE Mod (v30 Format)

## What This Does

A BG3 ScriptExtender Lua mod that captures your game state (HP, position, combat status, area, gold, party info) every 2 seconds and writes it to a temp file. The Tadpole bridge server reads this file and streams it to your phone via WebSocket.

## Prerequisites

- Baldur's Gate 3 (Steam or GOG)
- [BG3 ScriptExtender v30+](https://github.com/Norbyte/bg3se) installed

## Installation

### Option 1: Steam Deck / Linux (Proton)

1. Copy the entire `TadpoleCompanion/` folder to:
   ```
   ~/.steam/steam/steamapps/compatdata/1086940/pfx/drive_c/users/steamuser/AppData/Local/Larian Studios/Baldur's Gate 3/Mods/
   ```

2. Launch BG3 (make sure it's running through Proton, not native)

3. Go to Mods menu, enable "TadpoleCompanion"

4. Load a save

### Option 2: Windows

1. Copy the entire `TadpoleCompanion/` folder to:
   ```
   %LOCALAPPDATA%\Larian Studios\Baldur's Gate 3\Mods\
   ```

2. Launch BG3

3. Go to Mods menu, enable "TadpoleCompanion"

4. Load a save

## Directory Structure

```
TadpoleCompanion/
├── ScriptExtender/
│   ├── Config.json          ← Required: Enables Lua
│   └── Lua/
│       └── TadpoleCompanion.lua  ← The mod script
├── meta.lsx                ← Mod metadata
└── modsettings.lsx         ← Mod settings (enabled by default)
```

## Running the Bridge Server

Run the bridge server (see ../bridge/README.md) to stream data to your phone app.

## Files

- `tadpole_state.json` — Written by this mod to `/tmp/` (Linux) or `%TEMP%` (Windows), read by bridge server
- `tadpole_commands.json` — Written by bridge server, read by this mod (commands from phone)

## What Gets Captured

- Host character: name, HP, max HP, level, position, temp HP, initiative, spell slots, conditions, concentration, death saves, classes, camp supplies
- All party members: same stats
- Current area/level name
- Gold amount
- Combat status (in/out)
- Dialog status (in/out)
- Events: combat start/end, dialog start/end, area change, long rest

## Commands (Phone → Game)

- `trigger_rest` — Trigger a long rest
- `add_gold` — Add gold to player
- `give_item` — Spawn an item near the player
- `god_mode` — Toggle god mode
- `heal` — Heal all party members
- `full_restore` — Full restore party
- `short_rest` — Trigger a short rest
- `reset_cooldowns` — Reset all spell/ability cooldowns
- `resurrect` — Resurrect all dead party members
- `teleport_to` — Teleport party to coordinates

## Troubleshooting

- **Mod not loading?** Check that BG3SE v30+ is installed and the mod is enabled in the Mods menu
- **No state file?** Make sure you've loaded a save (mod only runs in-game, not main menu)
- **Lua errors?** Open the BG3SE console (tilde ~) and check for error messages
- **Check logs:** `%LOCALAPPDATA%\Larian Studios\BG3\ScriptExtenderLogs\` (Windows) or Proton equivalent

## BG3SE v30 Notes

This mod uses the v30 mod format with `Config.json` and proper module structure. The old v29 method of dropping .lua files in `LuaScripts/` no longer works in v30+.

**Critical:** The `Config.json` file must have `"FeatureFlags": ["Lua"]` for Lua scripts to load.
