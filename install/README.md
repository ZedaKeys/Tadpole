# 🐸 Tadpole BG3 Companion — Installation Guide

Tadpole is a companion app for Baldur's Gate 3 that shows real-time game state on your phone, including party HP, combat status, gold, location, and more.

## Architecture

```
┌──────────────┐     WebSocket      ┌───────────────┐     File I/O     ┌──────────────┐
│  Phone App   │ ◄───────────────► │ Bridge Server │ ◄──────────────► │  BG3 Mod     │
│  (web/phone) │    port 3456      │   (Node.js)   │   temp files     │  (Lua/SE)    │
└──────────────┘                    └───────────────┘                  └──────────────┘
   tadpole-omega                      Your PC                          BG3 game dir
   .vercel.app
```

- **BG3 Lua Mod** — runs inside BG3 via ScriptExtender, writes game state to a temp file every 2 seconds
- **Bridge Server** — Node.js WebSocket/HTTP server that reads the state file and broadcasts to connected phones
- **Phone App** — web app at [tadpole-omega.vercel.app](https://tadpole-omega.vercel.app) that connects to the bridge

---

## Prerequisites

| Requirement | Why | Install |
|---|---|---|
| **Baldur's Gate 3** | The game itself | Steam / GOG / Xbox Game Pass |
| **BG3 ScriptExtender** | Loads the Lua mod | [GitHub Releases](https://github.com/Norbyte/bg3se/releases/latest) |
| **Node.js** (v18+) | Runs the bridge server | [nodejs.org](https://nodejs.org/) |
| **Same WiFi** | Phone must reach your PC | — |

---

## Windows Installation

### Automated (Recommended)

1. Download or clone the Tadpole repository
2. Open a terminal (Command Prompt or PowerShell) as Administrator
3. Navigate to the `install` folder and run:
   ```
   install-windows.bat
   ```
4. Follow the on-screen instructions

The installer will:
-Auto-detect your BG3 installation (Steam / GOG / Xbox Game Pass)
- Install BG3 ScriptExtender if missing
- Copy the Tadpole Lua mod
- Install Node.js (via winget) if missing
- Install bridge server dependencies
- Create a "Tadpole Bridge" desktop shortcut
- Add a Windows Firewall rule for port 3456
- Show your IP address for phone connection

### Starting the Bridge

Double-click **"Tadpole Bridge"** on your Desktop, or run:
```
install\start-bridge.bat
```

---

## Linux / Steam Deck Installation

### Automated (Recommended)

1. Download or clone the Tadpole repository
2. Open a terminal (Konsole, etc.)
3. Navigate to the `install` folder and run:
   ```bash
   chmod +x install-linux.sh
   ./install-linux.sh
   ```
4. Follow the on-screen instructions

The installer will:
- Auto-detect BG3 via Steam (including Proton prefixes on Steam Deck)
- Install BG3 ScriptExtender if missing
- Copy the Tadpole mod to BG3/Mods/ (v30 format)
- Install Node.js (via nvm or system package manager) if missing
- Install bridge server dependencies
- Create a `.desktop` file (launchable from app menu)
- Configure firewall (ufw / firewalld) if applicable
- Show your IP address for phone connection

### Starting the Bridge

```bash
./install/start-bridge.sh
```

Or launch **"Tadpole Bridge"** from your application menu.

---

## Steam Deck Specifics

### Desktop Mode

1. Switch to **Desktop Mode** (hold power button → Switch to Desktop)
2. Open **Konsole** (the terminal app)
3. Follow the Linux installation steps above
4. Start the bridge server
5. Open `https://tadpole-omega.vercel.app` on your phone
6. Enter the Steam Deck's IP address

### Gaming Mode

The bridge server needs to run in Desktop Mode. You can:
- Switch to Desktop Mode, start the bridge, then switch back to Gaming Mode (the server keeps running)
- Or add a non-Steam shortcut for the start-bridge.sh script

### Steam Deck IP Address

In Desktop Mode, open Konsole and run:
```bash
hostname -I
```
Or check Settings → Network → your active connection.

---

## ROG Ally / ROG Ally X

### Windows Mode (default)

The ROG Ally runs Windows, so follow the **Windows Installation** steps above.

1. Download the repository
2. Run `install-windows.bat` as Administrator
3. Use `start-bridge.bat` to start the bridge
4. Open the phone app on your phone and enter the ROG Ally's IP

### Finding Your IP on ROG Ally

- Open Command Prompt and run: `ipconfig`
- Look for the "IPv4 Address" under your WiFi adapter
- Or the installer/start script will show it automatically

---

## How to Find Your IP Address

### Windows
```
ipconfig | findstr IPv4
```

### Linux / Steam Deck
```bash
hostname -I
# or
ip addr show | grep "inet " | grep -v 127.0.0.1
```

### macOS
```bash
ipconfig getifaddr en0
```

The IP will look something like `192.168.1.100` or `10.0.0.50`.

---

## Connecting Your Phone

1. Make sure your **phone and PC are on the same WiFi network**
2. Start the bridge server on your PC
3. Open **https://tadpole-omega.vercel.app** on your phone
4. Enter your PC's IP address (shown by the bridge server) and port `3456`
5. The full address will be something like: `192.168.1.100:3456`

---

## Troubleshooting

### "Could not detect BG3 installation"
- Make sure BG3 is installed (not just in your library)
- Default Steam path: `C:\Program Files (x86)\Steam\steamapps\common\Baldurs Gate 3`
- Default Steam Deck/Linux path: `~/.steam/steam/steamapps/common/Baldurs Gate 3`
- You can enter the path manually when prompted

### "ScriptExtender not found"
- Download from: https://github.com/Norbyte/bg3se/releases/latest
- Extract `DWrite.dll` into your BG3 game folder (next to `bg3.exe`)
- The installer will attempt to download it automatically

### "Node.js not found"
- Download from: https://nodejs.org/ (choose LTS)
- Windows: the installer tries `winget install OpenJS.NodeJS.LTS`
- Linux: the installer tries `nvm`, `apt`, `pacman`, `dnf`, or `brew`

### Phone can't connect to bridge
1. **Same network?** — Both devices must be on the same WiFi
2. **Firewall?** — Windows: allow port 3456. Linux: `sudo ufw allow 3456/tcp`
3. **Correct IP?** — Make sure you're using the LAN IP (192.168.x.x), not localhost
4. **Bridge running?** — The bridge server must be running before the phone connects
5. **Try the HTTP endpoint** — Open `http://YOUR_IP:3456` in a browser on your phone

### Bridge server says "not yet written by Lua mod"
This is normal if BG3 isn't running. The Lua mod writes to the state file only while the game is active and a save is loaded.

### Lua mod not loading in BG3
- Verify `DWrite.dll` is in the BG3 game folder
- Verify BG3SE v30+ is installed (v30 changed the mod format)
- Make sure the entire `TadpoleCompanion/` folder is in `BG3/Mods/`
- **Important:** Launch BG3, go to Mods menu, and enable "TadpoleCompanion"
- Load a save (mods only run when a game is loaded, not at main menu)
- Check the BG3 ScriptExtender log file for errors
- On Steam Deck/Proton: make sure the mod is in the correct Proton prefix path

### Port 3456 already in use
Something else is using port 3456. You can change the port:
```
set PORT=8080
node server.js
```
Or on Linux: `PORT=8080 node server.js`

---

## Uninstalling

### Windows
1. Delete the `TadpoleCompanion/` folder from `BG3/Mods/` (or `%LOCALAPPDATA%\Larian Studios\Baldur's Gate 3\Mods\`)
2. Remove the "Tadpole Bridge" desktop shortcut
3. Remove firewall rule: `netsh advfirewall firewall delete rule name="Tadpole Bridge (TCP 3456)"`
4. Delete the Tadpole repository folder

### Linux
1. Delete the `TadpoleCompanion/` folder from `BG3/Mods/` (or `~/.steam/steam/steamapps/compatdata/1086940/pfx/drive_c/users/steamuser/AppData/Local/Larian Studios/Baldur's Gate 3/Mods/`)
2. Delete `~/.local/share/applications/tadpole-bridge.desktop`
3. Remove firewall rule: `sudo ufw delete allow 3456/tcp`
4. Delete the Tadpole repository folder

---

## DeckyLoader Plugin (Steam Deck)

A native DeckyLoader plugin is available for Steam Deck that:
- Runs the bridge server directly in Gaming Mode
- Shows connection status and live game state as a panel overlay
- Eliminates the need for Desktop Mode for basic operation

### Installation

```bash
# First, run the main Linux installer to install the BG3 mod
cd ~/tadpole/install
chmod +x install-linux.sh
./install-linux.sh

# Then install the DeckyLoader plugin
cd ~/tadpole/decky-plugin
chmod +x install.sh
./install.sh
```

See [decky-plugin/README.md](../decky-plugin/README.md) for full details.

---

## Support

- **Issues**: Open an issue on the Tadpole GitHub repository
- **BG3SE**: https://github.com/Norbyte/bg3se
