# Far Realm VDE - Quick Start Guide

## Prerequisites Setup (One-Time)

### 1. Install Ollama
```bash
# Visit https://ollama.ai and follow installation instructions for Linux
# Or use curl:
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model (example: llama2)
ollama pull llama2

# Verify Ollama is running
curl http://localhost:11434/api/tags
```

### 2. Install Obsidian CLI
```bash
# Install globally via npm
npm install -g @polyipseity/obsidian-cli

# Verify installation
obsidian --version
```

### 3. Install Node.js (if not already installed)
```bash
# Check if Node.js is installed
node --version

# If not installed, use your package manager:
# Ubuntu/Debian:
sudo apt install nodejs npm

# Or download from https://nodejs.org
```

## Running the Application

### Step 1: Start the Server
```bash
cd /home/acsmithweb/Documents/dev_env
node server.js
```

You should see:
```
🚀 Unified Interface & Execution Server running at http://localhost:5000
```

**Keep this terminal open!**

### Step 2: Open the VDE Interface

Open a new terminal:

```bash
cd /home/acsmithweb/Documents/dev_env/Far_Realm_VDE
python3 -m http.server 8080
```

Or just open `index.html` directly in your browser.

### Step 3: Navigate to the Application

Open your browser and go to:
```
http://localhost:8080
```

Or via the server:
```
http://localhost:5000/Far_Realm_VDE/index.html
```

## Using the New Features

### Adding an Ollama AI Panel

1. **Click** "Summon New Bucket" (creates a workspace container)
2. **Click** "+ Add Ollama AI Interface" in the left sidebar
3. **Click** "Refresh" button next to model dropdown
4. **Select** a model from the dropdown
5. **Type** a message in the text area
6. **Click** "Send Request"
7. Watch the conversation build!

**Tips:**
- Adjust temperature for creativity (higher = more creative)
- Enable JSON format for structured responses
- Use "Clear" to start fresh conversations

### Adding an Obsidian CLI Panel

1. **Click** "+ Add Obsidian CLI" in the left sidebar
2. **Select** a command (try "files" to list vault files)
3. **Fill in** the vault name (optional, e.g., "MyVault")
4. **Click** "Execute Command"
5. See results in the output console

**Common Commands:**
- `files` - List all files in vault
- `search` - Search for text in vault
- `tags` - List all tags
- `open` - Open a specific file
- `create` - Create a new note

## Workspace Management

### Save Your Workspace
1. Scroll down in the left sidebar
2. **Click** "Export" button
3. JSON appears in the text area
4. Copy and save to a file

### Load a Workspace
1. Paste JSON into the text area
2. **Click** "Import" button
3. Your panels and content are restored!

## Keyboard Shortcuts & Tips

- **Double-click** markdown panels to edit
- **Drag** panel headers to move panels
- **Resize** from bottom-right corner
- **Clone** panels with 📋 button
- **Split** content with ✂️ button

## Troubleshooting

### "Loading models..." never changes
**Problem:** Ollama is not running or not accessible

**Solution:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If it fails, start Ollama
ollama serve
```

### "Execution Error: fetch failed"
**Problem:** Server is not running

**Solution:**
```bash
# Make sure server.js is running
cd /home/acsmithweb/Documents/dev_env
node server.js
```

### "Failed to connect to Ollama"
**Problem:** CORS or network issue

**Solution:**
- Use `http://localhost:8080` (not `file://`)
- Verify Ollama is on port 11434
- Check browser console for errors

### Obsidian commands fail
**Problem:** Vault name wrong or Obsidian CLI not installed

**Solution:**
```bash
# Verify CLI is installed
obsidian --version

# Check vault names
obsidian vaults

# Try without vault name first
```

## Next Steps

1. **Explore Panels** - Try creating multiple Ollama panels with different models
2. **Mix and Match** - Combine AI insights with Obsidian notes
3. **Save Workflows** - Export workspaces for different tasks
4. **Customize Theme** - Click "Customize Theme" button to change colors
5. **Add Data Viz** - Use "+ Add Data Viz Dashboard" for CSV analysis

## One-Command Start (Advanced)

Create a startup script:

```bash
#!/bin/bash
# save as: ~/start-vde.sh

# Start server in background
cd /home/acsmithweb/Documents/dev_env
node server.js &
SERVER_PID=$!

# Start HTTP server for VDE
cd Far_Realm_VDE
python3 -m http.server 8080 &
HTTP_PID=$!

# Open browser
xdg-open http://localhost:8080 2>/dev/null || open http://localhost:8080 2>/dev/null

echo "VDE Running!"
echo "Server PID: $SERVER_PID"
echo "HTTP PID: $HTTP_PID"
echo ""
echo "Press CTRL+C to stop..."

# Wait for interrupt
trap "kill $SERVER_PID $HTTP_PID; exit" INT
wait
```

Make it executable and run:
```bash
chmod +x ~/start-vde.sh
~/start-vde.sh
```

## Support

See `INTEGRATION_NOTES.md` for detailed documentation, known bugs, and troubleshooting.

Happy VDE exploration! 🚀
