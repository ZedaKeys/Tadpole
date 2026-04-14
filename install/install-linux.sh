#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
#  🐸 Tadpole BG3 Companion — Linux / macOS / Steam Deck Installer
#  Idempotent: safe to run multiple times.
#  Usage: chmod +x install-linux.sh && ./install-linux.sh
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[91m'
GREEN='\033[92m'
YELLOW='\033[93m'
CYAN='\033[96m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'
OK="${GREEN}[OK]${RESET}"
FAIL="${RED}[FAIL]${RESET}"
WARN="${YELLOW}[WARN]${RESET}"
INFO="${CYAN}[INFO]${RESET}"

# ── Helpers ───────────────────────────────────────────────────────────────────
log_ok()   { echo -e "  ${OK} $*"; }
log_fail() { echo -e "  ${FAIL} $*"; }
log_warn() { echo -e "  ${WARN} $*"; }
log_info() { echo -e "  ${INFO} $*"; }

die() {
    log_fail "$@"
    echo ""
    echo -e "  ${RED}Installation failed. See errors above.${RESET}"
    echo -e "  ${DIM}You can re-run this installer at any time — it's safe to retry.${RESET}"
    exit 1
}

# ── Resolve paths ────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MOD_DIR="${PROJECT_ROOT}/mod"
BRIDGE_DIR="${PROJECT_ROOT}/bridge"

# ── Banner ───────────────────────────────────────────────────────────────────
echo ""
echo -e "  ${BOLD}🐸  Tadpole BG3 Companion — Linux Installer${RESET}"
echo "  ────────────────────────────────────────────────"
echo ""

# ── Step 0: Validate source files ────────────────────────────────────────────
log_info "Checking installer source files..."

[[ -d "${MOD_DIR}" ]] || die "Mod directory not found at: ${MOD_DIR}"
[[ -f "${MOD_DIR}/meta.lsx" ]] || die "meta.lsx not found in mod directory"
[[ -f "${MOD_DIR}/ScriptExtender/Config.json" ]] || die "Config.json not found in mod directory"
[[ -f "${MOD_DIR}/ScriptExtender/Lua/TadpoleCompanion.lua" ]] || die "TadpoleCompanion.lua not found in mod directory"
log_ok "Mod directory validated (BG3SE v30 format)"

[[ -f "${BRIDGE_DIR}/server.js" ]] || die "Bridge server not found at: ${BRIDGE_DIR}/server.js"
log_ok "Bridge server found"

# ── Step 1: Detect BG3 install path ──────────────────────────────────────────
echo ""
log_info "Step 1: Detecting Baldur's Gate 3 installation..."

BG3_PATH=""
STEAM_HOME="${HOME}/.steam/steam"
FLATPAK_STEAM="${HOME}/.var/app/com.valvesoftware.Steam/.steam/steam"

# Helper: try a path
try_path() {
    if [[ -d "$1" ]]; then
        BG3_PATH="$1"
        return 0
    fi
    return 1
}

# Method A: Native Linux Steam
try_path "${STEAM_HOME}/steamapps/common/Baldurs Gate 3"              && true
# Method B: Flatpak Steam
[[ -n "${BG3_PATH}" ]] || try_path "${FLATPAK_STEAM}/steamapps/common/Baldurs Gate 3" && true
# Method C: Scan libraryfolders.vdf for extra library paths
if [[ -z "${BG3_PATH}" && -f "${STEAM_HOME}/steamapps/libraryfolders.vdf" ]]; then
    while IFS= read -r line; do
        lib=$(echo "$line" | grep -oP '"path"\s+"(.+?)"' | grep -oP '(?<=")[^"]*(?=")' | tail -1 || true)
        if [[ -n "${lib}" ]]; then
            try_path "${lib}/steamapps/common/Baldurs Gate 3" && break
        fi
    done < "${STEAM_HOME}/steamapps/libraryfolders.vdf"
fi
# Method C2: Scan Flatpak Steam libraryfolders.vdf
if [[ -z "${BG3_PATH}" && -f "${FLATPAK_STEAM}/steamapps/libraryfolders.vdf" ]]; then
    while IFS= read -r line; do
        lib=$(echo "$line" | grep -oP '"path"\s+"(.+?)"' | grep -oP '(?<=")[^"]*(?=")' | tail -1 || true)
        if [[ -n "${lib}" ]]; then
            try_path "${lib}/steamapps/common/Baldurs Gate 3" && break
        fi
    done < "${FLATPAK_STEAM}/steamapps/libraryfolders.vdf"
fi
# Method D: GOG / Heroic paths
[[ -n "${BG3_PATH}" ]] || try_path "${HOME}/Games/Heroic/Baldurs Gate 3" && true
# Method E: Heroic default GOG path
[[ -n "${BG3_PATH}" ]] || {
    heroic_path=$(find "${HOME}/Games/Heroic" -maxdepth 2 -name "Baldurs Gate 3" -type d 2>/dev/null | head -1 || true)
    if [[ -n "${heroic_path}" ]]; then
        try_path "${heroic_path}"
    fi
}

# Method F: Ask user
if [[ -z "${BG3_PATH}" ]]; then
    echo -e "  ${WARN} Could not auto-detect BG3 install path."
    echo ""
    read -rp "  Please enter your BG3 install folder path: " BG3_PATH
    if [[ ! -d "${BG3_PATH}" ]]; then
        die "Path does not exist: ${BG3_PATH}"
    fi
fi

log_ok "BG3 found at: ${BG3_PATH}"

# ── Step 2: Check BG3 ScriptExtender ─────────────────────────────────────────
echo ""
log_info "Step 2: Checking BG3 ScriptExtender..."

SE_DLL="${BG3_PATH}/DWrite.dll"
SE_DLL_ALT="${BG3_PATH}/bin/DWrite.dll"

if [[ -f "${SE_DLL}" ]] || [[ -f "${SE_DLL_ALT}" ]]; then
    log_ok "BG3 ScriptExtender is installed (DWrite.dll found)"
else
    log_warn "BG3 ScriptExtender not found."
    log_info "Attempting to download from GitHub..."

    SE_ZIP="/tmp/bg3se.zip"
    if command -v curl &>/dev/null; then
        # Get latest release URL
        DOWNLOAD_URL=$(curl -sL "https://api.github.com/repos/Norbyte/bg3se/releases/latest" \
            | grep -oP '"browser_download_url":\s*"\K[^"]*\.zip' | head -1 || true)

        if [[ -n "${DOWNLOAD_URL}" ]]; then
            log_info "Downloading: ${DOWNLOAD_URL}"
            if curl -sL -o "${SE_ZIP}" "${DOWNLOAD_URL}"; then
                # Install unzip if needed
                if ! command -v unzip &>/dev/null; then
                    log_info "Installing unzip..."
                    sudo apt-get install -y unzip 2>/dev/null || sudo pacman -S --noconfirm unzip 2>/dev/null || true
                fi
                if command -v unzip &>/dev/null; then
                    unzip -o -q "${SE_ZIP}" -d "${BG3_PATH}/"
                    rm -f "${SE_ZIP}"
                    log_ok "BG3 ScriptExtender downloaded and installed"
                else
                    log_warn "Could not extract (unzip not available)."
                    rm -f "${SE_ZIP}"
                fi
            else
                log_warn "Download failed."
            fi
        else
            log_warn "Could not determine download URL from GitHub API."
        fi
    else
        log_warn "curl not found. Cannot download automatically."
    fi

    # Verify after attempt
    if [[ ! -f "${SE_DLL}" ]] && [[ ! -f "${SE_DLL_ALT}" ]]; then
        log_warn "ScriptExtender could not be auto-installed."
        echo ""
        echo "  Please install BG3 ScriptExtender manually:"
        echo "  1. Go to https://github.com/Norbyte/bg3se/releases/latest"
        echo "  2. Download the latest release zip"
        echo "  3. Extract DWrite.dll into your BG3 folder:"
        echo "     ${BG3_PATH}"
        echo "  4. Run this installer again."
        echo ""
        read -rp "  Continue anyway? (bridge server can still be installed) [y/N]: " cont
        [[ "${cont,,}" == "y" ]] || die "Aborted."
    fi
fi

# ── Step 3: Install TadpoleCompanion mod (BG3SE v30 format) ──────────────
echo ""
log_info "Step 3: Installing Tadpole Lua mod (BG3SE v30 format)..."

# Determine Mods directory — BG3SE v30 loads mods from BG3/Mods/ instead of LuaScripts/
MODS_DIRS=(
    "${BG3_PATH}/Data/mods"
    "${BG3_PATH}/Mods"
)

# Also check Proton/compatdata path (Steam Deck + Proton)
STEAM_COMPAT="${STEAM_HOME}/steamapps/compatdata/1086940"
if [[ -d "${STEAM_COMPAT}" ]]; then
    PROTON_PFX="${STEAM_COMPAT}/pfx"
    if [[ -d "${PROTON_PFX}" ]]; then
        MODS_DIRS+=(
            "${PROTON_PFX}/drive_c/users/steamuser/AppData/Local/Larian Studios/Baldur's Gate 3/Mods"
        )
    fi
fi

# Flatpak compat
FLATPAK_COMPAT="${HOME}/.var/app/com.valvesoftware.Steam/.steam/steam/steamapps/compatdata/1086940"
if [[ -d "${FLATPAK_COMPAT}" ]]; then
    FLATPAK_PFX="${FLATPAK_COMPAT}/pfx"
    if [[ -d "${FLATPAK_PFX}" ]]; then
        MODS_DIRS+=(
            "${FLATPAK_PFX}/drive_c/users/steamuser/AppData/Local/Larian Studios/Baldur's Gate 3/Mods"
        )
    fi
fi

INSTALLED_MOD=0
for MODS_DIR in "${MODS_DIRS[@]}"; do
    # Create Mods directory if needed
    mkdir -p "${MODS_DIR}" 2>/dev/null || true

    if [[ -d "${MODS_DIR}" ]]; then
        # Copy the entire mod directory (v30 format)
        cp -r "${MOD_DIR}" "${MODS_DIR}/TadpoleCompanion" 2>/dev/null && {
            log_ok "TadpoleCompanion mod installed to: ${MODS_DIR}"
            INSTALLED_MOD=1
        } || {
            # May need elevated permissions for Proton prefix
            log_warn "Could not write to: ${MODS_DIR} (may need sudo)"
        }
    fi
done

# Fallback: try with sudo for Proton paths
if [[ "${INSTALLED_MOD}" -eq 0 ]]; then
    for MODS_DIR in "${MODS_DIRS[@]}"; do
        sudo mkdir -p "${MODS_DIR}" 2>/dev/null && \
        sudo cp -r "${MOD_DIR}" "${MODS_DIR}/TadpoleCompanion" 2>/dev/null && {
            log_ok "TadpoleCompanion mod installed (with sudo) to: ${MODS_DIR}"
            INSTALLED_MOD=1
            break
        } || true
    done
fi

if [[ "${INSTALLED_MOD}" -eq 0 ]]; then
    die "Could not install Lua mod to any detected BG3 Mods directory."
fi

log_info "Note: Launch BG3 and enable 'TadpoleCompanion' in the Mods menu."

# ── Step 4: Check / Install Node.js ──────────────────────────────────────────
echo ""
log_info "Step 4: Checking Node.js..."

NODE_OK=0
if command -v node &>/dev/null; then
    NODE_VER=$(node -v 2>/dev/null || echo "unknown")
    # Validate minimum version (v18+)
    NODE_MAJOR=$(echo "${NODE_VER}" | sed 's/^v//' | cut -d. -f1)
    if [[ "${NODE_MAJOR}" -ge 18 ]] 2>/dev/null; then
        log_ok "Node.js ${NODE_VER} found"
        NODE_OK=1
    else
        log_warn "Node.js ${NODE_VER} found but v18+ is required. Will attempt upgrade."
    fi
else
    log_warn "Node.js not found."

    # Try nvm
    if [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
        log_info "Loading nvm..."
        source "${HOME}/.nvm/nvm.sh"
        if command -v node &>/dev/null; then
            NODE_VER=$(node -v)
            log_ok "Node.js ${NODE_VER} found via nvm"
            NODE_OK=1
        fi
    fi

    # Install via nvm if still missing
    if [[ "${NODE_OK}" -eq 0 ]]; then
        log_info "Installing nvm + Node.js LTS..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash 2>/dev/null || true
        export NVM_DIR="${HOME}/.nvm"
        [[ -s "${NVM_DIR}/nvm.sh" ]] && source "${NVM_DIR}/nvm.sh"
        nvm install --lts 2>/dev/null && {
            NODE_VER=$(node -v)
            log_ok "Node.js ${NODE_VER} installed via nvm"
            NODE_OK=1
        } || {
            log_warn "nvm install failed."
        }
    fi

    # Try package manager fallback
    if [[ "${NODE_OK}" -eq 0 ]]; then
        log_info "Trying system package manager..."
        if command -v apt-get &>/dev/null; then
            sudo apt-get update -qq && sudo apt-get install -y nodejs npm 2>/dev/null && NODE_OK=1
        elif command -v pacman &>/dev/null; then
            sudo pacman -S --noconfirm nodejs npm 2>/dev/null && NODE_OK=1
        elif command -v dnf &>/dev/null; then
            sudo dnf install -y nodejs npm 2>/dev/null && NODE_OK=1
        elif command -v brew &>/dev/null; then
            brew install node 2>/dev/null && NODE_OK=1
        fi
    fi

    if [[ "${NODE_OK}" -eq 0 ]]; then
        log_warn "Could not install Node.js automatically."
        echo ""
        echo "  Please install Node.js manually:"
        echo "  - Ubuntu/Debian: sudo apt install nodejs npm"
        echo "  - Arch/SteamOS: sudo pacman -S nodejs npm"
        echo "  - macOS: brew install node"
        echo "  - Or visit: https://nodejs.org/"
        echo ""
        read -rp "  Continue anyway? (bridge won't work without Node.js) [y/N]: " cont
        [[ "${cont,,}" == "y" ]] || die "Aborted."
    fi
fi

# ── Step 5: Install bridge server dependencies ───────────────────────────────
echo ""
log_info "Step 5: Installing bridge server dependencies..."

cd "${BRIDGE_DIR}"
if npm install --production 2>/dev/null; then
    log_ok "Bridge dependencies installed"
else
    die "npm install failed. Check your Node.js installation."
fi

# ── Step 6: Create .desktop file ─────────────────────────────────────────────
echo ""
log_info "Step 6: Creating application launcher..."

DESKTOP_FILE="${HOME}/.local/share/applications/tadpole-bridge.desktop"
mkdir -p "${HOME}/.local/share/applications" 2>/dev/null

# Determine the node path
NODE_PATH=$(command -v node 2>/dev/null || echo "/usr/bin/node")

cat > "${DESKTOP_FILE}" << DESKTOP_EOF
[Desktop Entry]
Type=Application
Version=1.0
Name=Tadpole Bridge
Comment=Tadpole BG3 Companion Bridge Server
Exec=bash -c 'cd "${BRIDGE_DIR}" && "${NODE_PATH}" server.js; read -p "Press Enter to close..."'
Icon=utilities-terminal
Terminal=true
Categories=Game;Network;
StartupNotify=false
DESKTOP_EOF

chmod +x "${DESKTOP_FILE}" 2>/dev/null
log_ok ".desktop file created at: ${DESKTOP_FILE}"

# Also create a convenient start script in the project directory
START_SCRIPT="${PROJECT_ROOT}/start-bridge-quick.sh"
cat > "${START_SCRIPT}" << 'QUICKSTART_EOF'
#!/usr/bin/env bash
cd "$(dirname "$0")/bridge"
exec node server.js
QUICKSTART_EOF
chmod +x "${START_SCRIPT}"
log_ok "Quick-start script created at: ${START_SCRIPT}"

# ── Step 7: Configure firewall (if applicable) ──────────────────────────────
echo ""
log_info "Step 7: Configuring firewall for port 3456..."

if command -v ufw &>/dev/null; then
    sudo ufw status &>/dev/null && {
        sudo ufw allow 3456/tcp comment "Tadpole Bridge" 2>/dev/null && \
        log_ok "UFW rule added for port 3456/tcp" || \
        log_warn "Could not add UFW rule (may need sudo)"
    } || log_warn "UFW not active, skipping firewall config"
elif command -v firewall-cmd &>/dev/null; then
    sudo firewall-cmd --add-port=3456/tcp --permanent 2>/dev/null && \
    sudo firewall-cmd --reload 2>/dev/null && \
    log_ok "firewalld rule added for port 3456/tcp" || \
    log_warn "Could not add firewalld rule (may need sudo)"
else
    log_warn "No supported firewall detected. If you have a firewall, allow port 3456/tcp manually."
fi

# ── Step 8: Get IP address ───────────────────────────────────────────────────
echo ""
log_info "Step 8: Detecting your local IP address..."

LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ipconfig getifaddr en0 2>/dev/null || echo "localhost")
if [[ "${LAN_IP}" == "localhost" || -z "${LAN_IP}" ]]; then
    LAN_IP=$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+' || echo "localhost")
fi
log_ok "Your IP: ${LAN_IP}"

# ── Done! ────────────────────────────────────────────────────────────────────
echo ""
echo "  ════════════════════════════════════════════════════════════════"
echo -e "  ${BOLD}  🎉  Installation Complete!${RESET}"
echo "  ════════════════════════════════════════════════════════════════"
echo ""
echo -e "  ${BOLD}Next steps:${RESET}"
echo ""
echo "  1. Launch BG3 and go to the Mods menu"
echo "  2. Enable 'TadpoleCompanion' in the mods list"
echo "  3. Load a save — the mod will start capturing game state"
echo ""
echo "  4. Start the bridge server:"
echo "     cd ${BRIDGE_DIR} && node server.js"
echo ""
echo "     Or launch 'Tadpole Bridge' from your application menu."
echo ""
echo -e "  5. On your phone, open: ${CYAN}https://tadpole-omega.vercel.app${RESET}"
echo ""
echo -e "  6. Enter this IP address in the app: ${BOLD}${LAN_IP}:3456${RESET}"
echo ""
echo -e "  ${DIM}Tip: Make sure your phone and PC are on the same WiFi network.${RESET}"
echo -e "  ${DIM}Tip: Steam Deck users — use Desktop Mode to run the bridge server.${RESET}"
echo ""
