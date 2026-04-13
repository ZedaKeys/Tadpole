# Tadpole Native Mode - Linux BG3 Support

This enables Tadpole to work with the native Linux build of Baldur's Gate 3 (no Proton required).

## Quick Start

### On Steam Deck:

```bash
# 1. SSH into your Deck
ssh -i ~/.ssh/deck_key deck@192.168.1.136

# 2. Navigate to Tadpole
cd ~/tadpole

# 3. Build the native daemon
cd native-daemon
make install-deps  # Installs nlohmann/json
make
cd ..

# 4. Start everything (bridge + native daemon)
cd bridge
./start-native.sh
```

### On PC:

```bash
# 1. Install dependencies (if not already installed)
sudo apt install g++ make libpthread-dev

# 2. Build native daemon
cd tadpole/native-daemon
make install-deps
make
cd ../..

# 3. Start both services
cd bridge
./start-native.sh
```

## How It Works

The bridge now supports **dual mode**:

1. **Lua Mod Mode (Preferred)**
   - Uses BG3 Script Extender (BG3SE)
   - Full feature set (events, commands, all game state)
   - Requires Proton (Windows BG3)

2. **Native Daemon Mode (Fallback)**
   - Reads BG3 memory directly
   - No Proton or BG3SE needed
   - Limited features (basic state, no events, limited commands)

The bridge **automatically falls back** to native mode if:
- `/tmp/tadpole_state.json` doesn't exist (Lua mod not running)
- The file is stale or corrupted

## Building the Native Daemon

```bash
cd native-daemon

# Install JSON library (one-time setup)
make install-deps

# Compile
make

# Install system-wide (optional)
sudo make install
```

## Running

### Automatic (Recommended)

Use the startup script:
```bash
cd bridge
./start-native.sh
```

This starts:
1. Native daemon (if built)
2. Bridge server
3. Detects BG3 process automatically

### Manual

```bash
# Terminal 1: Native daemon
cd native-daemon
./tadpole-native

# Terminal 2: Bridge server
cd bridge
node server.js
```

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌────────────┐
│  Phone App  │ <-----> │  Bridge Server   │ <-----> │  BG3 (Native)│
│  (Next.js)  │  HTTP/  │  (Dual Mode)     │  Socket │   (ELF)     │
└─────────────┘  WS     │  - Lua Mod       │         └────────────┘
                         │  - Native Daemon │
                         └──────────────────┘
```

## Limitations (Native Mode)

The native daemon has these limitations compared to the Lua mod:

### Missing Features:
- ❌ Event notifications (combat started/ended, dialog, etc.)
- ❌ Approval ratings
- ❌ Death save tracking
- ❌ Class/level breakdown
- ❌ Camp supplies
- ❌ Most commands (only basic heal/rest work)

### Partial Support:
- ⚠️ Gold, HP, position: Requires reverse-engineering BG3 memory
- ⚠️ Command injection: Experimental, may not work reliably

### Working Features:
- ✅ Basic party member detection
- ✅ Area detection (if we can find memory offset)
- ✅ Timestamp
- ✅ Socket API for bridge communication

## Memory Reverse-Engineering

To make the native daemon fully functional, you'll need to find BG3's memory offsets:

### Tools:
- **Cheat Engine** (through Proton) - scan for values, find pointers
- **Ghidra** - reverse-engineer BG3 binary
- **radare2** - alternative disassembler
- **frida-trace** - dynamic analysis

### What to Find:
1. **Player struct address** - Usually at a fixed offset from module base
2. **HP offset** - `Player + 0x??` = current HP
3. **Gold offset** - `Player + 0x??` = gold amount
4. **Party array** - Pointer to array of party members
5. **Area name string** - Current location

### Example Pattern Matching:

```cpp
// Find gold value by scanning for known values
vector<uintptr_t> goldAddresses = scan_memory(pid, { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 }); // 64-bit zero

// After picking up 10g, scan again
// Intersection = gold address
```

## Troubleshooting

### "BG3 process not found"

Make sure BG3 is running:
```bash
ps aux | grep bg3
```

If not running, start BG3 first, then the daemon.

### "Failed to connect to native daemon"

Check if the socket file exists:
```bash
ls -la /tmp/tadpole_native.sock
```

If missing, the daemon isn't running. Check logs:
```bash
# If running via script
journalctl -u tadpole -f  # or check terminal output
```

### Bridge shows "Waiting for game data"

Check which mode the bridge is using:
```bash
curl http://localhost:3456/status | jq '.mode, .nativeConnected, .stateFileExists'
```

- If `mode: "none"` - Neither Lua mod nor native daemon working
- If `mode: "luamod"` - Lua mod is active (best)
- If `mode: "native"` - Native daemon is active (limited features)

### Commands not working

Native mode has limited command support. Check the bridge logs:
```bash
# Check if command reached native daemon
curl http://localhost:3456/status | jq '.currentState'
```

If commands fail, try forcing Proton mode for full Lua mod support.

## Switching Between Modes

The bridge **auto-detects** the best mode:

1. If `/tmp/tadpole_state.json` exists and is recent → Lua Mod mode
2. If `/tmp/tadpole_native.sock` exists → Native daemon mode
3. Otherwise → "Waiting for game data"

To force a specific mode:

### Force Lua Mod (Proton)
```bash
# Disable native daemon
pkill -f tadpole-native

# Set up BG3SE (see main README)
# Ensure DWrite.dll is in place
# Start BG3 via Proton
```

### Force Native Mode
```bash
# Remove state file to disable Lua mod mode
rm /tmp/tadpole_state.json

# Start native daemon
cd native-daemon
./tadpole-native
```

## Contributing

Want to improve the native daemon?

1. **Find memory offsets** - Use Cheat Engine or Ghidra to locate game state
2. **Add command injection** - Research how to inject actions into BG3
3. **Add event detection** - Hook into BG3's event system
4. **Submit PR** - Share your findings!

## Resources

- [BG3 Modding Discord](https://discord.gg/bg3modding)
- [Norbyte's Script Extender](https://github.com/Norbyte/bg3se) - For reference
- [Cheat Engine Tutorials](https://wiki.cheatengine.org/index.php?title=Tutorials)
- [Linux ptrace(2) man page](https://man7.org/linux/man-pages/man2/ptrace.2.html)

## License

Same as Tadpole - MIT
