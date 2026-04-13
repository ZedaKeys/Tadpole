#!/bin/bash
# Start Tadpole Bridge with Native Daemon for Linux BG3

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐸 Tadpole Bridge + Native Daemon${NC}"
echo "======================================"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Kill existing processes
echo -e "${YELLOW}Stopping existing processes...${NC}"
pkill -f "tadpole-native" 2>/dev/null
pkill -f "node.*server.js" 2>/dev/null
sleep 1

# Check if BG3 is running
if ! pgrep -x "bg3" > /dev/null; then
    echo -e "${YELLOW}⚠️  Warning: BG3 process not found${NC}"
    echo "   Make sure Baldur's Gate 3 is running before starting the daemon."
    echo ""
fi

# Build native daemon if needed
if [ ! -f "$SCRIPT_DIR/../native-daemon/tadpole-native" ]; then
    echo -e "${YELLOW}Building native daemon...${NC}"
    cd "$SCRIPT_DIR/../native-daemon"
    make install-deps
    make
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Failed to build native daemon, continuing without it${NC}"
        echo ""
    else
        echo -e "${GREEN}✓ Native daemon built successfully${NC}"
        echo ""
    fi
fi

# Start native daemon
if [ -f "$SCRIPT_DIR/../native-daemon/tadpole-native" ]; then
    echo -e "${BLUE}Starting native daemon...${NC}"
    "$SCRIPT_DIR/../native-daemon/tadpole-native" &
    NATIVE_PID=$!
    echo -e "${GREEN}✓ Native daemon started (PID: $NATIVE_PID)${NC}"
    sleep 1
else
    echo -e "${YELLOW}⚠️  Native daemon not available, running bridge only${NC}"
    echo ""
fi

# Start bridge server
echo -e "${BLUE}Starting bridge server...${NC}"
cd "$SCRIPT_DIR"
if [ -f "$SCRIPT_DIR/node_modules/.bin/node" ]; then
    NODE="$SCRIPT_DIR/node_modules/.bin/node"
else
    NODE="node"
fi

$NODE server.js &
BRIDGE_PID=$!

echo -e "${GREEN}✓ Bridge server started (PID: $BRIDGE_PID)${NC}"
echo ""
echo "======================================"
echo -e "${GREEN}Both services are running!${NC}"
echo ""
echo "Native Daemon: $([ -n "$NATIVE_PID" ] && echo "Active (PID: $NATIVE_PID)" || echo "Not available")"
echo "Bridge Server: Active (PID: $BRIDGE_PID)"
echo ""
echo "Check status: curl http://localhost:3456/status"
echo "Stop: kill $BRIDGE_PID $NATIVE_PID"
echo ""
