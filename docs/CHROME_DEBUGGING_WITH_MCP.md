# Chrome Debugging with MCP (Model Context Protocol)

**Last Updated:** 2025-10-21
**Status:** Production Ready

## What is MCP?

MCP (Model Context Protocol) allows Claude Code to connect to external tools and services. The `chrome-devtools-mcp` package enables Claude Code to inspect browser console logs, network requests, screenshots, and more - making it easy to debug web applications.

## Benefits

- **View browser console errors** directly in Claude Code
- **Inspect network requests** and API calls
- **Capture screenshots** of your application
- **Debug JavaScript errors** without manually checking DevTools
- **Automate browser inspection** during development

---

## Setup Instructions

### 1. Configure MCP Server

Create or update `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--browserUrl",
        "http://127.0.0.1:9222"
      ]
    }
  }
}
```

**Key Parameters:**
- `command: "npx"` - Uses npx to run the MCP package
- `chrome-devtools-mcp@latest` - Always uses the latest version
- `--browserUrl` - Connects to Chrome's remote debugging port (9222)

### 2. Start Chrome with Remote Debugging

**Quick Command:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="/tmp/chrome-dev" \
  http://localhost:3001
```

**Parameters Explained:**
- `--remote-debugging-port=9222` - Opens debugging interface on port 9222
- `--user-data-dir="/tmp/chrome-dev"` - Uses temporary profile (won't affect your regular Chrome)
- `http://localhost:3001` - Opens your development server automatically

**For Windows:**
```powershell
"C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --remote-debugging-port=9222 `
  --user-data-dir="C:\Temp\chrome-dev" `
  http://localhost:3001
```

**For Linux:**
```bash
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="/tmp/chrome-dev" \
  http://localhost:3001
```

### 3. Verify Chrome Debugging Port

Check if Chrome's debugging interface is accessible:

```bash
curl http://127.0.0.1:9222/json/version
```

**Expected Output:**
```json
{
  "Browser": "Chrome/141.0.7390.108",
  "Protocol-Version": "1.3",
  "User-Agent": "Mozilla/5.0 ...",
  "webSocketDebuggerUrl": "ws://127.0.0.1:9222/devtools/browser/..."
}
```

### 4. Restart Claude Code

**Important:** MCP servers are loaded when Claude Code starts, so you must restart:

```bash
# Exit current Claude Code session
exit

# Start new session in your project directory
cd /Users/ryad/marketdz
claude-code
```

### 5. Verify MCP Tools are Available

After restart, check if Chrome DevTools MCP is connected by listing available tools:

```bash
# In Claude Code, ask:
"What MCP tools are available?"
```

You should see tools starting with `mcp__chrome__*`

---

## Available MCP Tools

Once connected, you'll have access to these browser inspection tools:

### Console & Logging
- `mcp__chrome__get_console_logs` - Fetch browser console messages (errors, warnings, logs)
- `mcp__chrome__evaluate_js` - Execute JavaScript in the browser context

### Network Inspection
- `mcp__chrome__get_network_logs` - View all network requests and responses
- `mcp__chrome__get_failed_requests` - List only failed HTTP requests

### Visual Debugging
- `mcp__chrome__screenshot` - Capture screenshot of current page
- `mcp__chrome__screenshot_element` - Screenshot specific DOM element

### Navigation & DOM
- `mcp__chrome__navigate` - Navigate to a different URL
- `mcp__chrome__get_dom` - Get current page DOM structure
- `mcp__chrome__click_element` - Programmatically click elements

---

## Common Use Cases

### 1. Check for Console Errors

**Request:**
```
"Are there any console errors on localhost:3001?"
```

Claude Code will use `mcp__chrome__get_console_logs` to fetch and analyze errors.

### 2. Inspect Failed API Calls

**Request:**
```
"Show me all failed network requests"
```

Claude Code will use `mcp__chrome__get_failed_requests` to list 404s, 500s, etc.

### 3. Debug JavaScript Errors

**Request:**
```
"Execute console.log(window.location.href) in the browser"
```

Claude Code will use `mcp__chrome__evaluate_js` to run the command.

### 4. Visual Inspection

**Request:**
```
"Take a screenshot of the current page"
```

Claude Code will use `mcp__chrome__screenshot` and display the image.

---

## Troubleshooting

### Issue: "MCP tools not available after restart"

**Solution:**
1. Verify `.mcp.json` is in the project root (not a subdirectory)
2. Check Chrome is still running with debugging port:
   ```bash
   curl http://127.0.0.1:9222/json/version
   ```
3. Ensure you fully exited and restarted Claude Code (not just started a new task)

### Issue: "Chrome debugging port not accessible"

**Solution:**
1. Check if port 9222 is already in use:
   ```bash
   lsof -i :9222
   ```
2. Kill existing Chrome debug instances:
   ```bash
   pkill -f "remote-debugging-port=9222"
   ```
3. Restart Chrome with debugging enabled

### Issue: "Connection refused to localhost:3001"

**Solution:**
1. Ensure your development server is running:
   ```bash
   npm run dev
   ```
2. Verify the server is on port 3001:
   ```bash
   curl http://localhost:3001/api/health
   ```
3. Update Chrome to navigate to the correct port

### Issue: "Chrome opens but MCP can't connect"

**Solution:**
- Ensure you're using the correct Chrome executable path
- On macOS, verify:
  ```bash
  ls /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome
  ```
- Try using a different channel:
  ```bash
  npx chrome-devtools-mcp@latest --channel canary
  ```

---

## Advanced Configuration

### Using Headless Chrome

For automated testing without UI:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--headless"
      ]
    }
  }
}
```

### Connecting to Remote Chrome

If Chrome is running on a different machine:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--browserUrl",
        "http://192.168.1.100:9222"
      ]
    }
  }
}
```

### Custom Viewport Size

For testing responsive designs:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--viewport",
        "375x667"
      ]
    }
  }
}
```

### Using Chrome Canary/Beta/Dev

For testing with different Chrome versions:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--channel",
        "canary"
      ]
    }
  }
}
```

---

## Helper Scripts

### Create Startup Script (macOS/Linux)

```bash
cat > scripts/start-chrome-debug.sh << 'EOF'
#!/bin/bash
# Start Chrome with remote debugging for MCP

CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DEBUG_PORT=9222
USER_DATA_DIR="/tmp/chrome-dev"
URL="${1:-http://localhost:3001}"

# Kill existing debug instances
pkill -f "remote-debugging-port=$DEBUG_PORT" 2>/dev/null

# Start Chrome with debugging
"$CHROME_PATH" \
  --remote-debugging-port=$DEBUG_PORT \
  --user-data-dir="$USER_DATA_DIR" \
  "$URL" > /dev/null 2>&1 &

echo "Chrome started with remote debugging on port $DEBUG_PORT"
echo "Opening: $URL"
echo ""
echo "Verify connection:"
echo "  curl http://127.0.0.1:$DEBUG_PORT/json/version"
echo ""
echo "Restart Claude Code to connect MCP server"
EOF

chmod +x scripts/start-chrome-debug.sh
```

**Usage:**
```bash
# Start with default URL (localhost:3001)
./scripts/start-chrome-debug.sh

# Start with custom URL
./scripts/start-chrome-debug.sh http://localhost:3000
```

### Create Verification Script

```bash
cat > scripts/verify-chrome-debug.sh << 'EOF'
#!/bin/bash
# Verify Chrome debugging setup

echo "🔍 Checking Chrome debugging port..."

if curl -s http://127.0.0.1:9222/json/version > /dev/null; then
  echo "✅ Chrome debugging port is active"
  curl -s http://127.0.0.1:9222/json/version | jq .
else
  echo "❌ Chrome debugging port is not accessible"
  echo "   Start Chrome with: ./scripts/start-chrome-debug.sh"
  exit 1
fi

echo ""
echo "📋 Open tabs:"
curl -s http://127.0.0.1:9222/json | jq -r '.[] | select(.type=="page") | "- \(.title)\n  \(.url)"'

echo ""
echo "✅ Ready for MCP connection"
echo "   Restart Claude Code to activate MCP server"
EOF

chmod +x scripts/verify-chrome-debug.sh
```

**Usage:**
```bash
./scripts/verify-chrome-debug.sh
```

---

## Best Practices

### 1. Always Use Temporary Profile

Using `--user-data-dir="/tmp/chrome-dev"` ensures:
- No interference with your regular Chrome browsing
- Clean state for each debugging session
- No saved cookies/cache affecting tests

### 2. Restart Claude Code After Config Changes

MCP servers are loaded at startup, so:
- Any changes to `.mcp.json` require a restart
- Chrome must be running BEFORE restarting Claude Code
- Verify Chrome debugging port is active first

### 3. Keep Chrome Window Open

- Don't close the Chrome window while using MCP
- If Chrome crashes, restart it and restart Claude Code
- Use the verification script to check status

### 4. Use npm Scripts for Convenience

Add to `package.json`:
```json
{
  "scripts": {
    "chrome:debug": "./scripts/start-chrome-debug.sh",
    "chrome:verify": "./scripts/verify-chrome-debug.sh"
  }
}
```

Then use:
```bash
npm run chrome:debug
npm run chrome:verify
```

---

## Security Considerations

### Remote Debugging Port (9222)

**Warning:** Port 9222 provides full access to the browser, including:
- Executing arbitrary JavaScript
- Reading cookies and localStorage
- Intercepting network requests

**Recommendations:**
1. **Only use on localhost** - Never expose port 9222 to the network
2. **Firewall rules** - Block external access to port 9222:
   ```bash
   # macOS
   sudo pfctl -e
   sudo pfctl -f /etc/pf.conf
   ```
3. **Temporary profile only** - Always use `--user-data-dir` with a temporary directory
4. **Kill when done** - Stop debugging when finished:
   ```bash
   pkill -f "remote-debugging-port=9222"
   ```

---

## Quick Reference

### Start Chrome Debugging (macOS)
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="/tmp/chrome-dev" \
  http://localhost:3001 &
```

### Verify Connection
```bash
curl http://127.0.0.1:9222/json/version
```

### Restart Claude Code
```bash
exit
claude-code
```

### Stop Chrome Debugging
```bash
pkill -f "remote-debugging-port=9222"
```

---

## Additional Resources

- **Chrome DevTools Protocol:** https://chromedevtools.github.io/devtools-protocol/
- **MCP Documentation:** https://modelcontextprotocol.io/
- **chrome-devtools-mcp Package:** https://www.npmjs.com/package/chrome-devtools-mcp
- **Remote Debugging Guide:** https://developer.chrome.com/docs/devtools/remote-debugging/

---

## Related Files

- `.mcp.json` - MCP server configuration
- `scripts/start-chrome-debug.sh` - Chrome startup script
- `scripts/verify-chrome-debug.sh` - Connection verification script

---

**Created:** 2025-10-21
**Project:** MarketDZ
**Purpose:** Enable browser debugging via Claude Code MCP integration
