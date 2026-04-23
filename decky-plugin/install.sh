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

# DeckyLoader plugin directory: modern versions use ~/homebrew/plugins/,
# older versions use ~/.config/decky/plugins/. Check both.
DECKY_PLUGIN_DIR=""
if [[ -d "${HOME}/homebrew/plugins" ]]; then
    DECKY_PLUGIN_DIR="${HOME}/homebrew/plugins/${PLUGIN_NAME}"
elif [[ -d "${HOME}/.config/decky/plugins" ]]; then
    DECKY_PLUGIN_DIR="${HOME}/.config/decky/plugins/${PLUGIN_NAME}"
else
    # Default to modern path (will be created)
    DECKY_PLUGIN_DIR="${HOME}/homebrew/plugins/${PLUGIN_NAME}"
fi

BRIDGE_DIR="$(cd "${SCRIPT_DIR}/../bridge" 2>/dev/null && pwd || echo "")"

# -- Banner --
echo ""
echo -e "  ${BOLD}🐸  Tadpole BG3 Companion — DeckyLoader Plugin Installer${RESET}"
echo "  ────────────────────────────────────────────────────────────"
echo ""

# ── Step 1: Check for DeckyLoader ─────────────────────────────────────────────
echo ""
log_info "Step 1: Checking DeckyLoader installation..."

DECKY_FOUND=false
if [[ -d "${HOME}/homebrew/plugins" ]]; then
    log_ok "DeckyLoader found at: ${HOME}/homebrew (modern path)"
    DECKY_FOUND=true
elif [[ -d "${HOME}/.config/decky" ]]; then
    log_ok "DeckyLoader found at: ${HOME}/.config/decky (legacy path)"
    DECKY_FOUND=true
fi

if [[ "${DECKY_FOUND}" == "false" ]]; then
    log_warn "DeckyLoader installation not found at expected paths."
    log_info "DeckyLoader may still be installed in a non-standard location."
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

# ── Step 4: Check for pnpm ───────────────────────────────────────────────────
echo ""
log_info "Step 4: Checking for pnpm..."

if command -v pnpm &>/dev/null; then
    PNPM_VER=$(pnpm --version 2>/dev/null || echo "unknown")
    log_ok "pnpm ${PNPM_VER} found"
else
    log_warn "pnpm not found. Installing..."
    npm install -g pnpm 2>/dev/null && log_ok "pnpm installed" || {
        log_warn "Could not install pnpm. Plugin build may fail."
    }
fi

# ── Step 5: Build the plugin ─────────────────────────────────────────────────
echo ""
log_info "Step 5: Building the DeckyLoader plugin..."

cd "${SCRIPT_DIR}"

if [[ -f "package.json" ]]; then
    if command -v pnpm &>/dev/null; then
        pnpm install 2>/dev/null && log_ok "Plugin dependencies installed" || log_warn "pnpm install had issues"
        pnpm build 2>/dev/null && log_ok "Plugin built successfully" || log_warn "Plugin build had issues (dist/index.js may not be up to date)"
    else
        npm install 2>/dev/null && log_ok "Plugin dependencies installed" || log_warn "npm install had issues"
        npm run build 2>/dev/null && log_ok "Plugin built successfully" || log_warn "Plugin build had issues"
    fi
else
    log_warn "No package.json found. Skipping build step."
fi

# ── Step 6: Install plugin files ─────────────────────────────────────────────
echo ""
log_info "Step 6: Installing plugin to DeckyLoader..."

mkdir -p "${DECKY_PLUGIN_DIR}"

# Copy all plugin files
cp "${SCRIPT_DIR}/plugin.json" "${DECKY_PLUGIN_DIR}/" 2>/dev/null || log_warn "Could not copy plugin.json"
cp "${SCRIPT_DIR}/main.py" "${DECKY_PLUGIN_DIR}/" 2>/dev/null || log_warn "Could not copy main.py"
cp "${SCRIPT_DIR}/package.json" "${DECKY_PLUGIN_DIR}/" 2>/dev/null || true

# Copy decky.pyi type stub if it exists (needed by DeckyLoader's Python backend)
if [[ -f "${SCRIPT_DIR}/decky.pyi" ]]; then
    cp "${SCRIPT_DIR}/decky.pyi" "${DECKY_PLUGIN_DIR}/" 2>/dev/null || true
fi

# Copy dist if it exists
if [[ -d "${SCRIPT_DIR}/dist" ]]; then
    mkdir -p "${DECKY_PLUGIN_DIR}/dist"
    cp -r "${SCRIPT_DIR}/dist/"* "${DECKY_PLUGIN_DIR}/dist/" 2>/dev/null || log_warn "Could not copy dist/"
fi

# Copy defaults if they exist
if [[ -d "${SCRIPT_DIR}/defaults" ]]; then
    cp -r "${SCRIPT_DIR}/defaults" "${DECKY_PLUGIN_DIR}/" 2>/dev/null || true
fi

# Copy assets if they exist
if [[ -d "${SCRIPT_DIR}/assets" ]]; then
    cp -r "${SCRIPT_DIR}/assets" "${DECKY_PLUGIN_DIR}/" 2>/dev/null || true
fi

# Copy mod directory if it exists
if [[ -d "${SCRIPT_DIR}/mod" ]]; then
    cp -r "${SCRIPT_DIR}/mod" "${DECKY_PLUGIN_DIR}/" 2>/dev/null || true
fi

log_ok "Plugin files installed to: ${DECKY_PLUGIN_DIR}"

# ── Step 6b: Copy bridge server files ────────────────────────────────────────
echo ""
log_info "Step 6b: Checking bridge server availability..."

BRIDGE_TARGET="${DECKY_PLUGIN_DIR}/bridge"
if [[ -n "${BRIDGE_DIR}" && -f "${BRIDGE_DIR}/server.js" ]]; then
    mkdir -p "${BRIDGE_TARGET}"
    cp "${BRIDGE_DIR}/server.js" "${BRIDGE_TARGET}/" 2>/dev/null || log_warn "Could not copy bridge server.js"
    cp "${BRIDGE_DIR}/package.json" "${BRIDGE_TARGET}/" 2>/dev/null || true
    # Copy node_modules if they exist, otherwise npm install will be needed
    if [[ -d "${BRIDGE_DIR}/node_modules" ]]; then
        cp -r "${BRIDGE_DIR}/node_modules" "${BRIDGE_TARGET}/" 2>/dev/null || log_warn "Could not copy node_modules (may need npm install later)"
    fi
    log_ok "Bridge server files copied to: ${BRIDGE_TARGET}"
else
    log_warn "Bridge directory not found at expected location."
    log_info "The plugin will search for the bridge at runtime in common locations:"
    log_info "  ~/tadpole/bridge/, ~/homebrew/plugins/TadpoleBG3/bridge/"
    log_info "You can also set the bridge directory in the plugin settings."
fi

# ── Step 7: Set permissions ──────────────────────────────────────────────────
echo ""
log_info "Step 7: Setting permissions..."

chmod 644 "${DECKY_PLUGIN_DIR}/plugin.json" 2>/dev/null || true
chmod 644 "${DECKY_PLUGIN_DIR}/main.py" 2>/dev/null || true

if [[ -f "${DECKY_PLUGIN_DIR}/dist/index.js" ]]; then
    chmod 644 "${DECKY_PLUGIN_DIR}/dist/index.js" 2>/dev/null || true
fi

log_ok "Permissions set"

# ── Step 8: Verify installation ───────────────────────────────────────────────
echo ""
log_info "Step 8: Verifying installation..."

PLUGINS_OK=true

[[ -f "${DECKY_PLUGIN_DIR}/plugin.json" ]] || { log_fail "plugin.json missing"; PLUGINS_OK=false; }
[[ -f "${DECKY_PLUGIN_DIR}/main.py" ]] || { log_fail "main.py missing"; PLUGINS_OK=false; }

if [[ "${PLUGINS_OK}" == "true" ]]; then
    log_ok "All plugin files verified"
else
    die "Some plugin files are missing."
fi

# ── Step 9: Attempt DeckyLoader reload ───────────────────────────────────────
echo ""
log_info "Step 9: Attempting to reload DeckyLoader..."

RELOADED=false

# Method A: systemctl (most common on Steam Deck)
if command -v systemctl &>/dev/null; then
    for svc in "decky_loader" "deckyloader" "plugin_loader" "PluginLoader"; do
        if systemctl --user status "${svc}" &>/dev/null 2>&1; then
            systemctl --user restart "${svc}" 2>/dev/null && {
                log_ok "DeckyLoader service (${svc}) restarted via systemctl"
                RELOADED=true
                break
            }
        fi
    done
fi

# Method B: systemd system service
if [[ "${RELOADED}" == "false" ]] && command -v systemctl &>/dev/null; then
    for svc in "decky_loader" "deckyloader" "plugin_loader" "PluginLoader"; do
        if systemctl status "${svc}" &>/dev/null 2>&1; then
            sudo systemctl restart "${svc}" 2>/dev/null && {
                log_ok "DeckyLoader service (${svc}) restarted via systemctl (system)"
                RELOADED=true
                break
            }
        fi
    done
fi

if [[ "${RELOADED}" == "false" ]]; then
    log_warn "Could not auto-restart DeckyLoader service."
fi

# ── Done! ─────────────────────────────────────────────────────────────────────
echo ""
echo "  ════════════════════════════════════════════════════════════════"
echo -e "  ${BOLD}  🎉  DeckyLoader Plugin Installed!${RESET}"
echo "  ════════════════════════════════════════════════════════════════"
echo ""
echo -e "  ${BOLD}Next steps:${RESET}"
echo ""
if [[ "${RELOADED}" == "true" ]]; then
    echo "  1. DeckyLoader has been restarted — the Tadpole panel should appear"
    echo "     in the quick access menu (... button) momentarily"
else
    echo "  1. Restart DeckyLoader (or reload plugins):"
    echo "     - Open the quick access menu (... button)"
    echo "     - Go to DeckyLoader settings"
    echo "     - Click 'Reload Plugins'"
    echo ""
    echo "  2. The Tadpole panel will appear in the quick access menu"
fi
echo ""
echo "  3. Start BG3 — the bridge will auto-start (if auto-start is on)"
echo ""
echo -e "  ${DIM}Plugin location: ${DECKY_PLUGIN_DIR}${RESET}"
echo -e "  ${DIM}To uninstall: rm -rf ${DECKY_PLUGIN_DIR}${RESET}"
echo ""
