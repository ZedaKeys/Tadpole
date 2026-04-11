#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
#  🐸 Tadpole Bridge — Quick Start (Linux / macOS / Steam Deck)
#  Starts the bridge server and shows connection info.
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN='\033[92m'
CYAN='\033[96m'
RED='\033[91m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# ── Resolve bridge directory ────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BRIDGE_DIR="$(cd "${SCRIPT_DIR}/../bridge" && pwd)"

# ── Load nvm if available ────────────────────────────────────────────────────
if [[ -s "${HOME}/.nvm/nvm.sh" ]]; then
    source "${HOME}/.nvm/nvm.sh"
fi

# ── Check Node.js ────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    echo ""
    echo -e "  ${RED}[FAIL] Node.js is not installed or not in PATH.${RESET}"
    echo "         Please install Node.js, then run this script again."
    echo ""
    exit 1
fi

# ── Check bridge exists ──────────────────────────────────────────────────────
if [[ ! -f "${BRIDGE_DIR}/server.js" ]]; then
    echo ""
    echo -e "  ${RED}[FAIL] Bridge server not found at: ${BRIDGE_DIR}/server.js${RESET}"
    echo "         Please run install-linux.sh first."
    echo ""
    exit 1
fi

# ── Install deps if needed ──────────────────────────────────────────────────
if [[ ! -d "${BRIDGE_DIR}/node_modules" ]]; then
    echo "  Installing bridge dependencies..."
    cd "${BRIDGE_DIR}"
    npm install --production
fi

# ── Get IP ────────────────────────────────────────────────────────────────────
LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ipconfig getifaddr en0 2>/dev/null || echo "localhost")
if [[ "${LAN_IP}" == "localhost" || -z "${LAN_IP}" ]]; then
    LAN_IP=$(ip route get 1.1.1.1 2>/dev/null | grep -oP 'src \K\S+' || echo "localhost")
fi

# ── Show banner ───────────────────────────────────────────────────────────────
echo ""
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo -e "  ${BOLD}   🐸  Tadpole Bridge Server${RESET}"
echo "  ╠══════════════════════════════════════════════════════════════╣"
echo -e "  ${DIM}   Bridge:    ${RESET}${CYAN}http://${LAN_IP}:3456${RESET}"
echo -e "  ${DIM}   WebSocket: ${RESET}${CYAN}ws://${LAN_IP}:3456/ws${RESET}"
echo "  ╠══════════════════════════════════════════════════════════════╣"
echo -e "  ${BOLD}   Phone App: https://tadpole-omega.vercel.app${RESET}"
echo -e "  ${BOLD}   Enter IP:  ${LAN_IP}:3456${RESET}"
echo "  ╠══════════════════════════════════════════════════════════════╣"
echo ""
echo -e "  ${DIM} Open the URL above on your phone and enter the IP address.${RESET}"
echo -e "  ${DIM} Both devices must be on the same WiFi network.${RESET}"
echo -e "  ${DIM} Press Ctrl+C to stop the server.${RESET}"
echo ""
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo ""

# ── Start server ──────────────────────────────────────────────────────────────
cd "${BRIDGE_DIR}"
exec node server.js
