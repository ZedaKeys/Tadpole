# Tadpole BG3SE Lua Mod - Deployment Plan

## Problem
BG3SE v30 only loads Lua scripts for mods in `modManager->LoadOrderedModules`.
BG3 only loads modules that are registered in the game's modsettings.lsx.

## What We Were Missing
1. **meta.lsx format was wrong** - used non-standard format instead of official BG3 ModuleInfo format
2. **modsettings.lsx not applied** - TadpoleCompanion was never added to the game's active mod list
3. **Mod files location** - need to be in BOTH places:
   - Game install: `BG3/Data/Mods/TadpoleCompanion/` (for BG3SE to find ScriptExtender/Config.json)
   - Player data: `modsettings.lsx` must list TadpoleCompanion (for BG3 to "load" the module)

## Official SampleMod Structure (from Norbyte/bg3se)
```
Mods/TadpoleCompanion/
  ├── ScriptExtender/
  │   ├── Config.json
  │   └── Lua/
  │       └── TadpoleCompanion.lua
  ├── meta.lsx
  └── modsettings.lsx (reference only - actual one is in PlayerProfiles)
```

## Deployment Steps (when Deck is online)

### Step 1: Deploy mod files to game install directory
```
BG3_BASE = "/home/deck/.local/share/Steam/steamapps/common/Baldurs Gate 3"
MOD_DIR = "$BG3_BASE/Data/Mods/TadpoleCompanion"

# Create structure
mkdir -p "$MOD_DIR/ScriptExtender/Lua"

# Copy files
# - meta.lsx (fixed format matching official sample)
# - ScriptExtender/Config.json
# - ScriptExtender/Lua/TadpoleCompanion.lua
```

### Step 2: Patch game's modsettings.lsx
```
PLAYER_PROFILES = "/home/deck/.local/share/Steam/steamapps/compatdata/1086940/pfx/drive_c/users/steamuser/AppData/Local/Larian Studios/Baldur's Gate 3/PlayerProfiles/Public"
MODSETTINGS = "$PLAYER_PROFILES/modsettings.lsx"

# Backup first!
# Add TadpoleCompanion ModuleShortDesc alongside GustavDev
```

The modsettings.lsx needs a new `<children>` block under the Mods node:
```xml
<node id="ModuleShortDesc">
    <attribute id="Folder" type="LSString" value="TadpoleCompanion"/>
    <attribute id="MD5" type="LSString" value=""/>
    <attribute id="Name" type="LSString" value="TadpoleCompanion"/>
    <attribute id="UUID" type="FixedString" value="d1c8e9a5-7b4f-4a2e-8c1d-3f9a5b6c7d8e"/>
    <attribute id="Version64" type="int64" value="36028797018963968"/>
</node>
```

### Step 3: Restart BG3
- BG3SE will scan LoadOrderedModules
- Find TadpoleCompanion
- Look for `Mods/TadpoleCompanion/ScriptExtender/Config.json`
- Load `Mods/TadpoleCompanion/ScriptExtender/Lua/TadpoleCompanion.lua`
- Script writes to `/tmp/tadpole_state.json` via Z:\tmp mapping

### Verification
- Check BG3SE logs in `.../bin/ScriptExtenderLogs/` for "Tadpole" mentions
- Check `/tmp/tadpole_state.json` exists after loading a save
- Bridge on port 3456 should start receiving state updates

## Risk
- BG3 may overwrite modsettings.lsx when saving/loading
- If so, we need to use a proper .pak file (created via LSLib or BG3 Multitool)
- Alternative: use mod.io API to publish, then subscribe in-game

## UUID
TadpoleCompanion UUID: d1c8e9a5-7b4f-4a2e-8c1d-3f9a5b6c7d8e
