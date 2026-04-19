#!/bin/bash
# patch-modsettings.sh
# Adds TadpoleCompanion to BG3's modsettings.lsx
# This is the game's active mod list - BG3SE only loads Lua for mods listed here

set -e
DECK="deck@192.168.1.119"
SSH_OPTS="-o StrictHostKeyChecking=no -o ConnectTimeout=5"
REMOTE_SSH="ssh $SSH_OPTS $DECK"

PLAYER_PROFILES="/home/deck/.local/share/Steam/steamapps/compatdata/1086940/pfx/drive_c/users/steamuser/AppData/Local/Larian Studios/Baldur's Gate 3/PlayerProfiles/Public"
MODSETTINGS="$PLAYER_PROFILES/modsettings.lsx"

echo "=== Checking modsettings.lsx ==="
$REMOTE_SSH "cat '$MODSETTINGS'" || { echo "modsettings.lsx not found"; exit 1; }

echo ""
echo "=== Backing up modsettings.lsx ==="
$REMOTE_SSH "cp '$MODSETTINGS' '${MODSETTINGS}.backup'"

echo "=== Checking if TadpoleCompanion already exists ==="
if $REMOTE_SSH "grep -q 'TadpoleCompanion' '$MODSETTINGS'"; then
    echo "TadpoleCompanion already in modsettings.lsx, skipping"
else
    echo "=== Adding TadpoleCompanion to modsettings.lsx ==="
    # We need to add TadpoleCompanion as a ModuleShortDesc inside the Mods node
    # The pattern: find the closing </children> of the Mods node and add before it
    
    $REMOTE_SSH "python3 -c \"
import re

with open('$MODSETTINGS', 'r') as f:
    content = f.read()

# Find the last ModuleShortDesc closing tag inside Mods section
# Add TadpoleCompanion entry after it
tadpole_entry = '''                    </children>
                    <children>
                        <node id=\\\"ModuleShortDesc\\\">
                            <attribute id=\\\"Folder\\\" type=\\\"LSString\\\" value=\\\"TadpoleCompanion\\\"/>
                            <attribute id=\\\"MD5\\\" type=\\\"LSString\\\" value=\\\"\\\"/>
                            <attribute id=\\\"Name\\\" type=\\\"LSString\\\" value=\\\"TadpoleCompanion\\\"/>
                            <attribute id=\\\"UUID\\\" type=\\\"FixedString\\\" value=\\\"d1c8e9a5-7b4f-4a2e-8c1d-3f9a5b6c7d8e\\\"/>
                            <attribute id=\\\"Version64\\\" type=\\\"int64\\\" value=\\\"36028797018963968\\\"/>
                        </node>'''

# Find the Mods node and its children, add our mod
# Look for the last </children> before </node> that closes the Mods section
# Strategy: find '</node>' that comes after the last ModuleShortDesc block
# and insert before the closing </children> of Mods

# Simpler: just append a new children block before the closing </node> of Mods
# Find the closing pattern of the Mods node
mods_close = '</node>\\n            </children>'
idx = content.find(mods_close, content.find('id=\\\"Mods\\\"'))
if idx == -1:
    # Try alternate pattern
    # The Mods section ends with </node> under <children>
    print('Could not find insertion point, manual edit needed')
    exit(1)

# Insert TadpoleCompanion entry
content = content[:idx] + tadpole_entry + '\\n' + content[idx:]

with open('$MODSETTINGS', 'w') as f:
    f.write(content)

print('TadpoleCompanion added to modsettings.lsx')
\""
fi

echo ""
echo "=== Verifying ==="
$REMOTE_SSH "grep -A6 'TadpoleCompanion' '$MODSETTINGS'"
echo ""
echo "Done! Now restart BG3 and load a save."
echo "BG3SE should detect TadpoleCompanion and load its Lua script."
echo "Check /tmp/tadpole_state.json after loading."
