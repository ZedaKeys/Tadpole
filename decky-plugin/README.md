# Tadpole BG3 Companion -- DeckyLoader Plugin

Live Baldur's Gate 3 companion for Steam Deck. Shows real-time HP bars, combat tracking, and party info on your phone while you play.

## Quick Install

1. Install [DeckyLoader](https://decky.xyz) on your Steam Deck
2. Download the latest `TadpoleBG3.zip` from [Releases](https://github.com/ZedaKeys/Tadpole/releases)
3. In Decky menu: gear icon > "Install Plugin From Zip" > select the zip
4. Open Tadpole in the Decky menu and tap "One-Click Setup"

## Prerequisites

- **DeckyLoader** -- [decky.xyz](https://decky.xyz)
- **BG3 ScriptExtender** (for live data) -- [Norbyte/lsxy](https://github.com/Norbyte/lsxy)

Node.js, the bridge server, and the Lua mod are all installed automatically.

## Features

- One-click auto-install of all dependencies
- Real-time HP bars for all party members
- Combat start/end notifications
- Level up alerts
- Connection status and phone count
- Diagnostics panel showing every path checked
- Copyable terminal commands for manual install
- In-app log viewer
- Auto-start bridge when BG3 launches
- Plugin update checker

## Manual Commands (Desktop Mode)

If auto-install fails, switch to Desktop Mode, open Konsole:

```bash
# Install Node.js (no sudo)
mkdir -p ~/tadpole/node && cd /tmp && curl -sL https://nodejs.org/dist/v18.20.4/node-v18.20.4-linux-x64.tar.xz -o node.tar.xz && tar xf node.tar.xz -C ~/tadpole/node --strip-components=1 && rm node.tar.xz && ~/tadpole/node/bin/node --version

# View plugin log
cat /tmp/tadpole-plugin.log

# Test bridge connection
curl -s http://127.0.0.1:3456/status
```

## Phone App

Open https://tadpole-omega.vercel.app on your phone and enter the IP shown in the plugin.

## Version

Current: **0.6.0**
