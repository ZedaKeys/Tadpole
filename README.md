<p align="center">
  <img src="banner.png" alt="Tadpole - Your BG3 Companion" width="800">
</p>

<p align="center">
  <strong>Live Baldur's Gate 3 companion for Steam Deck + Phone</strong><br>
  Real-time HP bars, combat tracking, action resources, cheats, and more.
</p>

<p align="center">
  <a href="https://github.com/ZedaKeys/Tadpole/releases"><strong>Download Plugin</strong></a>
  &nbsp;&bull;&nbsp;
  <a href="#install"><strong>Install Guide</strong></a>
  &nbsp;&bull;&nbsp;
  <a href="#how-it-works"><strong>How It Works</strong></a>
</p>

---

## What is Tadpole?

Tadpole is a companion app for Baldur's Gate 3 that shows live game data on your phone while you play on Steam Deck. It reads your game state in real-time and displays HP bars, combat status, party info, gold, and more.

### Features

**Live Game Data**
- HP Bars with temp HP for every party member
- Spell slots and action resources (Bardic Inspiration, Sorcery Points, Ki, Rages, etc.)
- Ability scores with modifiers (STR/DEX/CON/INT/WIS/CHA)
- AC, initiative, proficiency bonus, level
- Gold counter and experience tracking
- Encumbrance state and vision mode
- Active conditions and concentration with spell names
- Equipment across 13 slots with item names
- Full spellbook (known/prepared spells)
- Character flags (dead, in combat, sneaking, invulnerable, etc.)
- Tadpole infection state

**Combat & Events**
- Real-time combat tracking with turn indicators
- Live event feed: damage, healing, status effects, spell casts, kills, saving throws, level ups, and more
- Session stats: damage dealt/taken, healing done, spells cast, kills, critical hits, turns taken

**Game Commands (23 cheats)**
- Character: Heal, Full Restore, Set HP, Set Level, Add XP, God Mode, Reset Cooldowns
- Party: Heal Party, Revive All
- Items & Gold: Add Gold, Spawn Items (potions, scrolls, custom)
- Status: Apply/Remove Status, Resurrect
- Combat: Toggle Combat, Kill Target, Deal Damage
- Movement: Teleport to Waypoint
- Rest: Long Rest, Short Rest

**Integration**
- Zero-config connection -- auto-connects when you open the bridge URL
- WebSocket bridge with sub-2s state updates
- DeckyLoader plugin with native Steam Deck UI
- Lossless Scaling (LSFG) launch option support
- Auto-installs BG3 Script Extender and Node.js
- Works offline -- no internet needed on the Deck

---

## How It Works

```
[BG3 Game] --(Lua Mod)--> [State File] --(Bridge Server)--> [Phone Browser]
                                |
                          [Steam Deck]
                          [Decky Plugin]
```

1. A **BG3 ScriptExtender Lua mod** writes your game state to a file
2. A **Node.js bridge server** on the Steam Deck reads that file and serves it via WebSocket
3. The **DeckyLoader plugin** manages the bridge server and shows status in the Steam Deck UI
4. Your **phone browser** connects to the bridge server and displays live data

---

## Install

### Prerequisites

Before installing the plugin, you need one thing:

- **DeckyLoader** -- The Steam Deck plugin loader. Install it from [decky.xyz](https://decky.xyz)

### Step 1: Install Plugin

1. Open DeckyLoader settings (the plug icon in the quick access menu)
2. Search for **Tadpole BG3 Companion** in the store, or install manually from [GitHub Releases](https://github.com/ZedaKeys/Tadpole/releases)

### Step 2: One-Click Setup

Open the Tadpole plugin from the quick access menu and hit **Install Everything**. This handles:

- **BG3 Script Extender** -- Downloads DWrite.dll and configures Steam launch options
- **Node.js** -- Downloads and installs locally (no sudo needed)
- **Bridge Server** -- Copied from bundled files (works offline)
- **BG3 Lua Mod** -- Copied from bundled files (needs BG3 launched once after Script Extender)
4. If the Lua mod couldn't install, the plugin will show instructions:
   - Close BG3 completely
   - Launch BG3 again -- Script Extender will create its folders on first run
   - Come back to Tadpole and hit Install Everything again
5. Done! The bridge starts automatically when BG3 launches

### Launch Options

The plugin can automatically set your Steam launch options. Choose the right one:

**Standard (BG3SE only):**
```
WINEDLLOVERRIDES="DWrite.dll=n,b" %command%
```

**With Lossless Scaling (LSFG):**
```
WINEDLLOVERRIDES="DWrite.dll=n,b" ~/lsfg %command%
```

### Step 3: Connect Your Phone

1. Find your Steam Deck's IP in the Tadpole plugin settings
2. Open **http://[DECK-IP]:3456/phone** on your phone
3. The app auto-connects -- no manual IP entry needed!

---

## Manual Install (Troubleshooting)

If the one-click setup fails, switch to Desktop Mode, open Konsole, and run:

### Install Node.js (no sudo)
```bash
mkdir -p ~/tadpole/node && cd /tmp && curl -sL https://nodejs.org/dist/v18.20.4/node-v18.20.4-linux-x64.tar.xz -o node.tar.xz && tar xf node.tar.xz -C ~/tadpole/node --strip-components=1 && rm node.tar.xz && ~/tadpole/node/bin/node --version
```

### Verify Bridge Server
```bash
ls ~/tadpole/bridge/server.js && echo "OK" || echo "Missing"
```

### View Plugin Log
```bash
cat /tmp/tadpole-plugin.log
```

### Test Bridge Connection
```bash
curl -s http://127.0.0.1:3456/status
```

---

## Plugin Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Auto-start with BG3 | On | Starts the bridge server when BG3 launches |
| Bridge Port | 3456 | Port for the WebSocket bridge server |
| Bridge Directory | ~/tadpole/bridge | Where the bridge server files live |

---

## Architecture

```
tadpole/
├── src/                    # Next.js web app (phone companion)
│   ├── app/page.tsx        # Home page with connection panel
│   ├── app/cheats/         # Game commands (23 cheats)
│   ├── app/feed/           # Live event feed
│   ├── app/live/combat/    # Combat tracker
│   └── components/         # Reusable widgets
├── bridge/                 # Node.js WebSocket bridge server
│   ├── server.js           # Express + WebSocket server
│   └── package.json
├── mod/                    # BG3 ScriptExtender Lua mod (v31 format)
│   ├── Config.json
│   └── Lua/BootstrapServer.lua
├── decky-plugin/           # DeckyLoader plugin (Steam Deck)
│   ├── main.py             # Python backend
│   ├── src/index.tsx       # React frontend
│   ├── bridge/             # Bundled bridge files
│   ├── mod/                # Bundled Lua mod
│   ├── plugin.json         # Plugin manifest
│   └── dist/               # Built frontend bundle
└── screenshots/            # App screenshots for README
```

---

## Tech Stack

| Component | Stack |
|-----------|-------|
| Web App | Next.js 16, React 19, TypeScript, Tailwind v4 |
| Bridge Server | Node.js, Express, WebSocket (ws) |
| Decky Plugin | Python 3 (backend), React/TypeScript (frontend) |
| BG3 Mod | Lua (ScriptExtender v31) |
| Deployment | GitHub Releases (plugin), Static export (phone app) |

---

## Credits

- [DeckyLoader](https://github.com/SteamDeckHomebrew/decky-loader) -- Steam Deck plugin framework
- [BG3 ScriptExtender](https://github.com/Norbyte/bg3se) -- BG3 modding framework
- Built with love for the BG3 community

## License

MIT
