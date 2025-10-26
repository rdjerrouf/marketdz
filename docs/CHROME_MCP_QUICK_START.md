# Chrome MCP Quick Start Guide

**TL;DR:** Enable browser debugging in Claude Code

---

## 🚀 Quick Setup (3 Steps)

### 1️⃣ Start Chrome with Debugging
```bash
npm run chrome:debug
```

**Or manually:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="/tmp/chrome-dev" \
  http://localhost:3001
```

### 2️⃣ Verify Connection
```bash
npm run chrome:verify
```

**Expected output:**
```
✅ Chrome debugging port is active
📊 Browser Info: Chrome/141.0.7390.108
📋 Open tabs:
  • MarketDZ - Marketplace Algeria
    http://localhost:3001/
✅ Ready for MCP connection
```

### 3️⃣ Restart Claude Code
```bash
exit
claude-code
```

**That's it!** You can now ask Claude Code to inspect browser errors, network requests, etc.

---

## 📦 What's Already Configured

✅ `.mcp.json` - MCP server config (project root)
✅ `chrome-devtools-mcp` - Already in package.json dependencies
✅ Helper scripts - `scripts/start-chrome-debug.sh` and `verify-chrome-debug.sh`
✅ npm shortcuts - `npm run chrome:debug` and `npm run chrome:verify`

---

## 💡 Example Usage

After setup, ask Claude Code:

**Check for errors:**
```
"Are there any console errors on localhost:3001?"
```

**Inspect failed requests:**
```
"Show me all failed network requests"
```

**Take screenshot:**
```
"Take a screenshot of the current page"
```

**Execute JavaScript:**
```
"Run console.log(document.title) in the browser"
```

---

## 🛑 Troubleshooting

**MCP tools not available?**
- ✅ Verify Chrome is running: `npm run chrome:verify`
- ✅ Check `.mcp.json` exists in project root
- ✅ Fully exit and restart Claude Code (not just new task)

**Port 9222 already in use?**
```bash
pkill -f "remote-debugging-port=9222"
npm run chrome:debug
```

**Chrome won't start?**
- Check Chrome path: `ls /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome`
- Try running script directly: `./scripts/start-chrome-debug.sh`

---

## 📚 Full Documentation

See [CHROME_DEBUGGING_WITH_MCP.md](./CHROME_DEBUGGING_WITH_MCP.md) for:
- Detailed setup instructions
- All available MCP tools
- Advanced configuration options
- Security considerations
- Platform-specific guides (Windows/Linux)

---

**Created:** 2025-10-21
**Project:** MarketDZ
**Status:** Ready to use
