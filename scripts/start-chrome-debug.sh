#!/bin/bash
# Start Chrome with remote debugging for MCP

CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DEBUG_PORT=9222
USER_DATA_DIR="/tmp/chrome-dev"
URL="${1:-http://localhost:3001}"

# Kill existing debug instances
pkill -f "remote-debugging-port=$DEBUG_PORT" 2>/dev/null
sleep 1

# Start Chrome with debugging
"$CHROME_PATH" \
  --remote-debugging-port=$DEBUG_PORT \
  --user-data-dir="$USER_DATA_DIR" \
  "$URL" > /dev/null 2>&1 &

echo "✅ Chrome started with remote debugging on port $DEBUG_PORT"
echo "🌐 Opening: $URL"
echo ""
echo "🔍 Verify connection:"
echo "  curl http://127.0.0.1:$DEBUG_PORT/json/version"
echo ""
echo "🔄 Next steps:"
echo "  1. Wait 2-3 seconds for Chrome to start"
echo "  2. Run: ./scripts/verify-chrome-debug.sh"
echo "  3. Restart Claude Code to connect MCP server"
