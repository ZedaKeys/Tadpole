#!/bin/bash
# deploy-tadpole-mod.sh
# Deploys TadpoleCompanion BG3SE Lua mod to Steam Deck
# Run from gohan: bash ~/tadpole/deploy-tadpole-mod.sh

set -e
DECK="deck@192.168.1.119"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=5"
REMOTE_SSH="ssh $SSH_OPTS $DECK"

echo "=== Testing SSH connection ==="
$REMOTE_SSH "echo OK" || { echo "Deck not reachable"; exit 1; }

BG3_BASE="/home/deck/.local/share/Steam/steamapps/common/Baldurs Gate 3"
MOD_DIR="$BG3_BASE/Data/Mods/TadpoleCompanion"
PLAYER_PROFILES="/home/deck/.local/share/Steam/steamapps/compatdata/1086940/pfx/drive_c/users/steamuser/AppData/Local/Larian Studios/Baldur's Gate 3/PlayerProfiles/Public"

echo "=== Step 1: Clean up old attempts ==="
# Remove any old GustavX injection
$REMOTE_SSH "echo killua | sudo -S rm -rf '$BG3_BASE/Data/Mods/GustavX/ScriptExtender' 2>/dev/null" || true

echo "=== Step 2: Create TadpoleCompanion mod folder ==="
$REMOTE_SSH "mkdir -p '$MOD_DIR/ScriptExtender/Lua'"

echo "=== Step 3: Deploy Config.json ==="
cat /home/gohan/tadpole/mod/ScriptExtender/Config.json | $REMOTE_SSH "cat > '$MOD_DIR/ScriptExtender/Config.json'"

echo "=== Step 4: Deploy Lua script ==="
cat /home/gohan/tadpole/mod/ScriptExtender/Lua/TadpoleCompanion.lua | $REMOTE_SSH "cat > '$MOD_DIR/ScriptExtender/Lua/TadpoleCompanion.lua'"

echo "=== Step 5: Deploy meta.lsx ==="
cat /home/gohan/tadpole/mod/meta.lsx | $REMOTE_SSH "cat > '$MOD_DIR/meta.lsx'"

echo "=== Step 6: Verify files ==="
$REMOTE_SSH "echo '--- Config.json ---' && cat '$MOD_DIR/ScriptExtender/Config.json'"
$REMOTE_SSH "echo '--- meta.lsx (first 5 lines) ---' && head -5 '$MOD_DIR/meta.lsx'"
$REMOTE_SSH "echo '--- Lua files ---' && ls -la '$MOD_DIR/ScriptExtender/Lua/'"

echo "=== Step 7: Check modsettings.lsx ==="
$REMOTE_SSH "cat '$PLAYER_PROFILES/modsettings.lsx'" 2>/dev/null || echo "modsettings.lsx not found at PlayerProfiles"

echo ""
echo "=== IMPORTANT: modsettings.lsx ==="
echo "BG3SE only loads Lua scripts for mods in LoadOrderedModules."
echo "TadpoleCompanion must appear in the game's modsettings.lsx."
echo ""
echo "Option A: Edit modsettings.lsx to add TadpoleCompanion (manual, may get overwritten)"
echo "Option B: Use BG3's in-game Mod Manager to enable the mod (safest)"
echo "Option C: Use LSLib to create a proper .pak and install via mod manager"
echo ""
echo "Files deployed. Now you need to either:"
echo "  1. Install BG3 Mod Manager (or use in-game mods menu)"
echo "  2. Or manually edit modsettings.lsx to add TadpoleCompanion entry"
