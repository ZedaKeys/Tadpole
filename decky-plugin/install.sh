#!/usr/bin/env bash
# ==============================================================================
#  Tadpole BG3 Companion - DeckyLoader Plugin Installer for Steam Deck
#  Usage: chmod +x install.sh && ./install.sh
# ==============================================================================
set -euo pipefail

# -- Colours --
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

# -- Helpers --
log_ok()   { echo -e "  ${OK} $*"; }
log_fail() { echo -e "  ${FAIL} $*"; }
log_warn() { echo -e "  ${WARN} $*"; }
log_info() { echo -e "  ${INFO} $*"; }

die() {
    log_fail "$@"
    echo ""
    echo -e "  ${RED}Installation failed. See errors above.${RESET}"
    exit 1
}

# -- Resolve paths --
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_NAME="TadpoleBG3"
DECKY_PLUGIN_DIR="${HOME}/.config/decky/plugins/${PLUGIN_NAME}"
BRIDGE_DIR="$(cd "${SCRIPT_DIR}/../bridge" 2>/dev/null && pwd || echo "")"

# -- Banner --
echo ""
echo -e "  ${BOLD}🐸  Tadpole BG3 Companion — DeckyLoader Plugin Installer${RESET}"
echo "  ────────────────────────────────────────────────────────────"
echo ""

# ── Step 1: Check for DeckyLoader ─────────────────────────────────────────────
echo ""
log_info "Step 1: Checking DeckyLoader installation..."

DECKY_DIR="${HOME}/.config/decky"
if [[ -d "${DECKY_DIR}" ]]; then
    log_ok "DeckyLoader config directory found at: ${DECKY_DIR}"
else
    log_warn "DeckyLoader config directory not found at: ${DECKY_DIR}"
    log_info "DeckyLoader may still be installed in a different location."
    echo ""
    echo "  If DeckyLoader is not installed:"
    echo "  1. Switch to Desktop Mode"
    echo "  2. Visit https://decky.xyz for installation instructions"
    echo "  3. Run this installer again after installing DeckyLoader"
    echo ""
    read -rp "  Continue anyway? [y/N]: " cont
    [[ "${cont,,}" == "y" ]] || die "Aborted. Install DeckyLoader first."
fi

# ── Step 2: Check for Node.js ────────────────────────────────────────────────
echo ""
log_info "Step 2: Checking Node.js..."

# Load nvm if available
if [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
    source "${HOME}/.nvm/nvm.sh"
fi

if command -v node &>/dev/null; then
    NODE_VER=$(node -v 2>/dev/null || echo "unknown")
    log_ok "Node.js ${NODE_VER} found"
else
    log_warn "Node.js not found."
    echo ""
    echo "  On Steam Deck, install Node.js in Desktop Mode:"
    echo "    sudo pacman -S nodejs npm"
    echo ""
    read -rp "  Continue anyway? (bridge won't work without Node.js) [y/N]: " cont
    [[ "${cont,,}" == "y" ]] || die "Aborted. Install Node.js first."
fi

# ── Step 3: Install bridge server dependencies ───────────────────────────────
echo ""
log_info "Step 3: Installing bridge server dependencies..."

if [[ -n "${BRIDGE_DIR}" && -f "${BRIDGE_DIR}/server.js" ]]; then
    cd "${BRIDGE_DIR}"
    if npm install --production 2>/dev/null; then
        log_ok "Bridge dependencies installed"
    else
        log_warn "npm install failed. Bridge may not start."
    fi
else
    log_warn "Bridge directory not found at expected location."
    log_info "You can set the bridge directory later in the plugin settings."
fi

# ── Step 4: Install plugin files ─────────────────────────────────────────────
echo ""
log_info "Step 4: Installing plugin to DeckyLoader..."

mkdir -p "${DECKY_PLUGIN_DIR}"

# Copy plugin files
cp "${SCRIPT_DIR}/plugin.json" "${DECKY_PLUGIN_DIR}/" 2>/dev/null || log_warn "Could not copy plugin.json"
cp "${SCRIPT_DIR}/index.tsx" "${DECKY_PLUGIN_DIR}/" 2>/dev/null || log_warn "Could not copy index.tsx"

# Copy backend
mkdir -p "${DECKY_PLUGIN_DIR}/backend"
cp "${SCRIPT_DIR}/backend/index.py" "${DECKY_PLUGIN_DIR}/backend/" 2>/dev/null || log_warn "Could not copy backend/index.py"

# Copy package.json if present
cp "${SCRIPT_DIR}/package.json" "${DECKY_PLUGIN_DIR}/" 2>/dev/null || true

log_ok "Plugin files installed to: ${DECKY_PLUGIN_DIR}"

# ── Step 5: Set permissions ──────────────────────────────────────────────────
echo ""
log_info "Step 5: Setting permissions..."

chmod 644 "${DECKY_PLUGIN_DIR}/plugin.json" 2>/dev/null || true
chmod 644 "${DECKY_PLUGIN_DIR}/index.tsx" 2>/dev/null || true
chmod 755 "${DECKY_PLUGIN_DIR}/backend" 2>/dev/null || true
chmod 644 "${DECKY_PLUGIN_DIR}/backend/index.py" 2>/dev/null || true

log_ok "Permissions set"

# ── Step 6: Verify installation ───────────────────────────────────────────────
echo ""
log_info "Step 6: Verifying installation..."

PLUGINS_OK=true

[[ -f "${DECKY_PLUGIN_DIR}/plugin.json" ]] || { log_fail "plugin.json missing"; PLUGINS_OK=false; }
[[ -f "${DECKY_PLUGIN_DIR}/index.tsx" ]] || { log_fail "index.tsx missing"; PLUGINS_OK=false; }
[[ -f "${DECKY_PLUGIN_DIR}/backend/index.py" ]] || { log_fail "backend/index.py missing"; PLUGINS_OK=false; }

if [[ "${PLUGINS_OK}" == "true" ]]; then
    log_ok "All plugin files verified"
else
    die "Some plugin files are missing."
fi

# ── Done! ─────────────────────────────────────────────────────────────────────
echo ""
echo "  ════════════════════════════════════════════════════════════════"
echo -e "  ${BOLD}  🎉  DeckyLoader Plugin Installed!${RESET}"
echo "  ════════════════════════════════════════════════════════════════"
echo ""
echo -e "  ${BOLD}Next steps:${RESET}"
echo ""
echo "  1. Restart DeckyLoader (or reload plugins):"
echo "     - Open the quick access menu (... button)"
echo "     - Go to DeckyLoader settings"
echo "     - Click 'Reload Plugins'"
echo ""
echo "  2. The Tadpole panel will appear in the quick access menu"
echo ""
echo "  3. Start BG3 — the bridge will auto-start (if auto-start is on)"
echo ""
echo -e "  ${DIM}Plugin location: ${DECKY_PLUGIN_DIR}${RESET}"
echo -e "  ${DIM}To uninstall: rm -rf ${DECKY_PLUGIN_DIR}${RESET}"
echo ""
