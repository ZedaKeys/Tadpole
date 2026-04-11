# Tadpole BG3 Companion - DeckyLoader Plugin

A DeckyLoader plugin for Steam Deck that runs the Tadpole bridge server and shows live BG3 game status in the Steam Deck quick access menu.

## Features

- Start/stop the bridge server directly from the Steam Deck quick access menu
- Live connection status (IP, connected phone apps)
- Real-time game state preview:
  - Current area name
  - Combat and dialog status indicators
  - Party HP bars (color-coded)
  - Gold amount
  - Recent game events
- Auto-start bridge when BG3 launches
- Configurable port and bridge directory
- Warning when Node.js is not installed

## Prerequisites

1. **DeckyLoader** - Install from [decky.xyz](https://decky.xyz)
   - On Steam Deck: switch to Desktop Mode
   - Open a terminal and run the DeckyLoader installer
   - Reboot back to Gaming Mode

2. **Node.js** - Required to run the bridge server
   ```bash
   # On Steam Deck (Desktop Mode):
   sudo pacman -S nodejs npm
   ```

3. **Tadpole BG3 mod** - The Lua mod must be installed for BG3
   - Run the main Tadpole installer: `./install/install-linux.sh`

## Installation

### Option 1: Using the installer script (recommended)

```bash
cd ~/tadpole/decky-plugin
chmod +x install.sh
./install.sh
```

### Option 2: Manual installation

```bash
# Copy the plugin to DeckyLoader's plugin directory
mkdir -p ~/.config/decky/plugins/TadpoleBG3
cp -r ~/tadpole/decky-plugin/* ~/.config/decky/plugins/TadpoleBG3/

# Install bridge server dependencies (if not already done)
cd ~/tadpole/bridge
npm install --production
```

### Option 3: Symlink for development

```bash
ln -s ~/tadpole/decky-plugin ~/.config/decky/plugins/TadpoleBG3
```

## Usage

1. **Install the BG3 mod** by running `./install/install-linux.sh` from the main Tadpole directory
2. **Launch Baldur's Gate 3** on your Steam Deck
3. Open the **quick access menu** (the `...` button)
4. Scroll to the **Tadpole BG3 Companion** panel
5. The bridge will auto-start when BG3 is detected (or click "Start Bridge")
6. On your phone, open **https://tadpole-omega.vercel.app**
7. Enter your Steam Deck's IP address (shown in the plugin panel) and port (default: 3456)

## Plugin Panel

The plugin shows:

- **Connection Status** - Green/red dot + bridge running state, IP address, connected phone count
- **Game Status** - Whether BG3 is running
- **Live Game** (when game state is available):
  - Current area name
  - Combat/Dialog/Exploring indicator
  - Gold amount
  - Host character HP bar
  - Party member HP bars
  - Recent events (combat started, area changed, etc.)
- **Phone App** - URL and IP to enter on your phone
- **Settings** - Auto-start toggle, port number, bridge directory

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Port | 3456 | Bridge server port |
| Auto-start | On | Automatically start bridge when BG3 launches |
| Bridge Directory | /home/deck/tadpole/bridge | Path to the bridge server |

## Architecture

```
BG3 (Lua Mod)  -->  State File  -->  Bridge Server  -->  Phone App (WebSocket)
                                       ^
                                       |
                            DeckyLoader Plugin
                            (manages bridge process,
                             shows live status)
```

- The **Lua mod** writes game state to `/tmp/tadpole_state.json`
- The **bridge server** watches that file and broadcasts via WebSocket
- The **DeckyLoader plugin** manages the bridge process and polls its `/status` endpoint
- The **phone app** connects to the bridge via WebSocket

## Troubleshooting

### "Node.js is not installed"
Switch to Desktop Mode and install Node.js:
```bash
sudo pacman -S nodejs npm
```

### "Bridge Stopped" and won't start
- Check that the bridge directory exists and contains `server.js`
- Check that Node.js is installed: `node --version`
- Try running the bridge manually in Desktop Mode:
  ```bash
  cd ~/tadpole/bridge && node server.js
  ```

### "Launch BG3 to begin"
BG3 is not detected as running. Make sure:
- BG3 is actually running (not just the launcher)
- The BG3 ScriptExtender mod is installed
- The TadpoleCompanion.lua is in the correct LuaScripts directory

### Phone can't connect
- Make sure both devices are on the same WiFi network
- Check the IP shown in the plugin panel matches your Deck's IP
- Try disabling and re-enabling the bridge
- In Desktop Mode, check the firewall: `sudo ufw allow 3456/tcp`

## Files

```
decky-plugin/
  plugin.json          -- Plugin metadata for DeckyLoader
  package.json         -- Node dependencies (decky-frontend-lib)
  index.tsx            -- React frontend (panel shown in quick access menu)
  backend/
    index.py           -- Python backend (manages bridge, reads state)
  install.sh           -- Installer script for Steam Deck
  README.md            -- This file
```

## Development

The plugin is built using:
- **decky-frontend-lib** - DeckyLoader's React component library
- **React/TSX** - Frontend panel UI
- **Python** - Backend process management

To modify the plugin:
1. Edit `index.tsx` for UI changes
2. Edit `backend/index.py` for backend logic
3. Restart DeckyLoader or re-load the plugin

## License

Part of the Tadpole BG3 Companion project by ZedaKeys.
