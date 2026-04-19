#!/bin/bash
# Deploy to ALL BG3 directories on Deck
SRC="/tmp/BootstrapServer.lua"

# Directory without apostrophe (the one BG3SE actually uses!)
DST1="/home/deck/.local/share/Steam/steamapps/common/Baldurs Gate 3/Data/Mods/GustavX/ScriptExtender/Lua/"
mkdir -p "$DST1"
cp "$SRC" "$DST1/BootstrapServer.lua"
echo "Deployed to: $DST1"

# Directory with apostrophe (backup)
DST2="/home/deck/.local/share/Steam/steamapps/common/Baldur's Gate 3/Data/Mods/GustavX/ScriptExtender/Lua/"
mkdir -p "$DST2"
cp "$SRC" "$DST2/BootstrapServer.lua"
echo "Deployed to: $DST2"

# AppData
DST3="/home/deck/.local/share/Steam/steamapps/compatdata/1086940/pfx/drive_c/users/steamuser/AppData/Local/Larian Studios/Baldur's Gate 3/Mods/GustavX/ScriptExtender/Lua/"
mkdir -p "$DST3"
cp "$SRC" "$DST3/BootstrapServer.lua"
echo "Deployed to: $DST3"

# Verify all three
echo "=== Version check ==="
grep "0.13.0\|0.12.0" "$DST1/BootstrapServer.lua" | head -1
grep "0.13.0\|0.12.0" "$DST2/BootstrapServer.lua" | head -1
grep "0.13.0\|0.12.0" "$DST3/BootstrapServer.lua" | head -1
echo "Done!"
