#!/bin/bash
# Verify Chrome debugging setup

echo "🔍 Checking Chrome debugging port..."
echo ""

if curl -s http://127.0.0.1:9222/json/version > /dev/null 2>&1; then
  echo "✅ Chrome debugging port is active"
  echo ""
  echo "📊 Browser Info:"
  curl -s http://127.0.0.1:9222/json/version | grep -o '"Browser":"[^"]*"' | cut -d'"' -f4
  echo ""
else
  echo "❌ Chrome debugging port is not accessible"
  echo ""
  echo "💡 Solution:"
  echo "   Start Chrome with: ./scripts/start-chrome-debug.sh"
  exit 1
fi

echo "📋 Open tabs:"
TABS=$(curl -s http://127.0.0.1:9222/json 2>/dev/null)
echo "$TABS" | grep -o '"title":"[^"]*","url":"[^"]*"' | while read -r line; do
  TITLE=$(echo "$line" | grep -o '"title":"[^"]*"' | cut -d'"' -f4)
  URL=$(echo "$line" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
  if [[ "$URL" == http* ]]; then
    echo "  • $TITLE"
    echo "    $URL"
  fi
done

echo ""
echo "✅ Ready for MCP connection"
echo ""
echo "🔄 Next step:"
echo "   Restart Claude Code to activate MCP server"
echo "   (Exit current session and run 'claude-code' again)"
