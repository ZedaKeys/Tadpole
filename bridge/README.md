# Tadpole Bridge Server

The bridge server runs on your PC alongside Baldur's Gate 3 and connects the BG3SE Lua mod to the Tadpole phone companion app via WebSocket.

## Prerequisites

- **Node.js 18+** — [Download here](https://nodejs.org/)
- **Baldur's Gate 3** with [ScriptExtender](https://github.com/Norbyte/Bg3SE) installed
- **Tadpole phone app** (open `index.html` on your phone's browser)

## Setup

### Step 1: Install the Lua mod

Copy `TadpoleCompanion.lua` into your BG3 ScriptExtender scripts directory:

```
<BG3 Install>/bin/bg3se/LuaScripts/TadpoleCompanion.lua
```

The Lua mod writes game state to a temp file (`tadpole_state.json`) and reads commands from `tadpole_commands.json`.

### Step 2: Start the bridge server

```bash
cd bridge/
npm install
npm start
```

The server starts on **port 3456** by default. You should see:

```
🐸 Tadpole Bridge running on http://192.168.x.x:3456
   Watching: /tmp/tadpole_state.json
   Waiting for phone apps to connect...
```

### Step 3: Connect your phone

1. Make sure your phone is on the same WiFi network as your PC
2. Open the Tadpole phone app
3. Enter your PC's IP address (shown in the bridge server output)
4. The app will connect via WebSocket and start receiving live game state

## Configuration

All paths and the port are configurable via environment variables:

| Variable       | Default                        | Description                          |
|----------------|--------------------------------|--------------------------------------|
| `PORT`         | `3456`                         | HTTP and WebSocket server port       |
| `STATE_FILE`   | `<os.tmpdir()>/tadpole_state.json` | Path to the Lua mod state file  |
| `COMMAND_FILE` | `<os.tmpdir()>/tadpole_commands.json` | Path to the commands file     |

Example with custom paths:

```bash
PORT=8080 STATE_FILE=/bg3data/state.json COMMAND_FILE=/bg3data/commands.json npm start
```

## How It Works

```
┌─────────┐    writes state    ┌──────────────┐   WebSocket   ┌────────────┐
│  BG3SE   │──────────────────>│  Bridge      │<─────────────>│  Phone App │
│ Lua Mod  │<── reads commands─│  Server      │               │            │
└─────────┘    └───────────────└──────────────┘               └────────────┘
```

1. The Lua mod runs inside BG3 and writes game state to `tadpole_state.json` every tick
2. The bridge server watches that file and broadcasts changes to all connected phones
3. The phone app sends commands (trigger rest, etc.) via WebSocket
4. The bridge server writes commands to `tadpole_commands.json` for the Lua mod to read

## Events

The bridge server detects game events by comparing state snapshots and pushes notifications to connected clients:

- Combat started / ended
- Area changed
- Dialog started / ended
- HP warnings (any party member below 25%)
- Level up
- Gold changes (large deltas)
- Approval changes

## Status Page

Open `http://<your-pc-ip>:3456/` in a browser to see the bridge status, connected clients, and current game state.
