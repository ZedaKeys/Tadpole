# Tadpole BG3SE Mod

## What This Does

A BG3 ScriptExtender Lua mod that captures your game state (HP, position, combat status, area, gold, party info) every 2 seconds and writes it to a temp file. The Tadpole bridge server reads this file and streams it to your phone via WebSocket.

## Prerequisites

- Baldur's Gate 3 (Steam or GOG)
- [BG3 ScriptExtender](https://github.com/Norbyte/bg3se) installed

## Installation

1. Copy `TadpoleCompanion.lua` to:
   ```
   %LOCALAPPDATA%\Larian Studios\Baldur's Gate 3\ScriptExtender\LuaScripts\
   ```
   That's it. BG3SE auto-loads all .lua files in that folder.

2. Start BG3. The mod loads automatically when you load a save.

3. Run the bridge server (see ../bridge/README.md)

4. Open the Tadpole app on your phone and connect to your PC's IP address.

## Files

- `tadpole_state.json` — Written by this mod to `%TEMP%`, read by bridge server
- `tadpole_commands.json` — Written by bridge server, read by this mod (commands from phone)

## What Gets Captured

- Host character: name, HP, max HP, level, position
- All party members: same stats
- Current area/level name
- Gold amount
- Combat status (in/out)
- Events: combat start/end, dialog start/end, area change, long rest

## Commands (Phone → Game)

- `trigger_rest` — Trigger a long rest
- `add_gold` — Add gold to player
- `give_item` — Spawn an item near the player

## Troubleshooting

- Mod not loading? Check BG3SE is installed and `ScriptExtenderSettings.json` has `EnableConsole: true`
- No state file? Make sure you've loaded a save (mod only runs in-game, not main menu)
- Check the BG3SE console for "Tadpole Companion mod loaded!" message
