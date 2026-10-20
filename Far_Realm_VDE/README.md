# Far Realm VDE - Extended with Ollama & Obsidian CLI

## 🎯 Overview

The Far Realm VDE (Virtue Development Environment) is now enhanced with two powerful integrations:

1. **Ollama AI Interface** - Local LLM interaction directly in your workspace
2. **Obsidian CLI Controller** - Vault management and automation panel

Both integrations are **fully modular**, follow **OOP design patterns**, and maintain **style consistency** with the existing VDE architecture.

---

## ✨ Key Features

### Ollama AI Interface
- 🤖 **Local LLM Support** - Connect to any Ollama model on your machine
- 💬 **Conversation Context** - Full history maintained across sessions
- ⚙️ **Fine-Grained Control** - Temperature, Top-P, Context Window, Repeat Penalty
- 📝 **System Prompts** - Customize AI persona and behavior
- 🔄 **JSON Mode** - Enforce structured outputs
- 💾 **Persistent State** - Conversations saved in VDE export/import

### Obsidian CLI Controller
- 📂 **Vault Operations** - File, folder, search, tags, tasks management
- 🛠️ **Dynamic Forms** - Command-specific parameter inputs
- 🔗 **URI Support** - Direct Obsidian protocol links for open/create/search
- 📋 **Command Builder** - Live preview of generated commands
- 🖥️ **Execution Console** - Color-coded output display
- 📜 **Command History** - Track all executed operations

---

## 🚀 Quick Start

### Prerequisites
```bash
# 1. Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama2

# 2. Install Obsidian CLI
npm install -g @polyipseity/obsidian-cli

# 3. Verify Node.js
node --version  # Should be v14+
```

### Run the Application
```bash
# Terminal 1: Start server
cd /home/acsmithweb/Documents/dev_env
node server.js

# Terminal 2: Open VDE
cd Far_Realm_VDE
python3 -m http.server 8080
# Then open http://localhost:8080 in browser
```

### Add Your First Panel
1. Click **"Summon New Bucket"** to create a workspace
2. Click **"+ Add Ollama AI Interface"** or **"+ Add Obsidian CLI"**
3. Configure and start using!

**📘 See [QUICKSTART.md](QUICKSTART.md) for detailed instructions**

---

## 📁 Project Structure

```
Far_Realm_VDE/
├── index.html                     # Main application entry
├── vde-adapters.js                # Sanitization adapters
├── vde-ollama-adapter.js         # 🆕 Ollama API adapter
├── vde-obsidian-adapter.js       # 🆕 Obsidian CLI adapter
├── vde-charts.js                  # D3 visualizations
├── vde-content.js                 # ✏️ Content implementations (extended)
├── vde-core.js                    # ✏️ Core orchestration (extended)
├── vde-digester.js                # Content splitting strategies
├── vde-style-memento.js           # Theme management
├── README.md                      # This file
├── QUICKSTART.md                  # Getting started guide
├── INTEGRATION_NOTES.md           # Detailed documentation
└── CHANGES_SUMMARY.md             # Complete change log
```

🆕 = New file | ✏️ = Modified file

---

## 🏗️ Architecture

### Design Patterns
- **Adapter Pattern** - Isolate external API dependencies (Ollama, Obsidian)
- **Bridge Pattern** - Separate panel abstraction from implementation
- **Factory Pattern** - Unified panel creation interface
- **Observer Pattern** - State change notifications
- **Memento Pattern** - State serialization/restoration

### Module Hierarchy
```
index.html
  ↓ loads
┌─────────────────────────────────────┐
│ Adapters Layer                      │
│ - vde-adapters.js                   │
│ - vde-ollama-adapter.js    🆕       │
│ - vde-obsidian-adapter.js  🆕       │
└─────────────────────────────────────┘
  ↓ uses
┌─────────────────────────────────────┐
│ Content Layer                       │
│ - vde-content.js (extended)   ✏️    │
│   - RichTextContent                 │
│   - CodeSnippetContent              │
│   - D3ChartContent                  │
│   - DataVizDashboardContent         │
│   - OllamaInterfaceContent   🆕     │
│   - ObsidianCLIContent       🆕     │
└─────────────────────────────────────┘
  ↓ managed by
┌─────────────────────────────────────┐
│ Core Layer                          │
│ - vde-core.js (extended)      ✏️    │
│   - PanelFactory                    │
│   - IntegratedGridManager           │
│   - GridBucket                      │
└─────────────────────────────────────┘
```

---

## 🎨 Styling

All components follow the Far Realm VDE dark theme:

| Element | Color |
|---------|-------|
| Background | `#1a1a1a`, `#0d0d0d` |
| Text | `#ffffff`, `#e0e0e0` |
| Borders | `#2a2a2a`, `#333` |
| Accent | `#ff7b00` (orange) |
| Success | `#00ff66` (green) |
| Warning | `#ffaa44` (amber) |
| Error | `#ff4444` (red) |

Font: `Segoe UI`, 11px base, `Consolas` for code

---

## 🔌 API Endpoints

### Ollama (Local)
```
http://localhost:11434/api/tags        # GET - List models
http://localhost:11434/api/chat        # POST - Send message
```

### Server (Custom)
```
http://localhost:5000/api/execute      # POST - Execute CLI command
```

**📘 See [INTEGRATION_NOTES.md](INTEGRATION_NOTES.md) for API details**

---

## 🐛 Known Issues

### High Priority
1. **CORS Restrictions** - Use `http://` not `file://` protocol
2. **Server Dependency** - Obsidian CLI requires running server
3. **Ollama Connection** - Silent failure if service not running

### Medium Priority
4. Long-running commands may timeout
5. Large outputs cause UI lag
6. No token counting for context limits
7. No streaming response support

**📘 See [INTEGRATION_NOTES.md](INTEGRATION_NOTES.md) for full bug list (22 issues documented)**

---

## 🧪 Testing

Manual testing checklist available in [INTEGRATION_NOTES.md](INTEGRATION_NOTES.md)

### Quick Validation
```bash
# Test Ollama
curl http://localhost:11434/api/tags

# Test Server
curl http://localhost:5000/api/execute \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"command":"echo test"}'

# Test Obsidian CLI
obsidian --version
```

---

## 🔒 Security

⚠️ **NOT production-ready!**

Current security concerns:
- No authentication on `/api/execute`
- Command injection vulnerabilities
- No rate limiting
- Hardcoded localhost URLs

**Do NOT expose server to untrusted networks.**

### Recommendations
1. Run server only on localhost
2. Add authentication middleware
3. Whitelist allowed commands
4. Sanitize all user inputs
5. Use HTTPS in production

**📘 See [INTEGRATION_NOTES.md](INTEGRATION_NOTES.md) for security details**

---

## 📊 Statistics

| Metric | Value |
|--------|-------|
| New Files | 5 |
| Modified Files | 4 |
| Total JS Lines | 3,702 |
| New Classes | 4 |
| New Methods | 26 |
| Design Patterns | 5 |
| Documentation Pages | 4 |

---

## 🛠️ Development

### Adding New Panel Types

Follow this pattern:

1. **Create Adapter** (`vde-*-adapter.js`)
```javascript
class MyAdapter {
    async doSomething(params) { /* ... */ }
}
window.MyAdapter = MyAdapter;
```

2. **Create Content Class** (in `vde-content.js`)
```javascript
class MyContent extends IPanelContent {
    constructor(config) { super(config); }
    render(container) { /* ... */ }
    clone() { return new MyContent({...}); }
}
window.MyContent = MyContent;
```

3. **Add Factory Method** (in `vde-core.js`)
```javascript
static createMyPanel() {
    const content = new MyContent();
    return new PanelBuilder()
        .setTitle("My Panel")
        .setContent(content)
        .build();
}
```

4. **Add Manager Method** (in `vde-core.js`)
```javascript
addMyWidget(bucketId) {
    const panel = PanelFactory.createMyPanel();
    return this.registerAndPlacePanel(panel, bucketId);
}
```

5. **Update Import/Export** (in `vde-core.js`)
```javascript
// In exportVDE()
if (cName === "MyContent") {
    typeTag = "my-content";
}

// In importVDE()
else if (w.contentType === "my-content") {
    contentInstance = new MyContent(w.contentConfig);
}
```

6. **Add UI Button** (in `index.html`)
```html
<button id="add-my-btn">+ Add My Panel</button>
```

7. **Add Event Handler** (in `index.html` script)
```javascript
document.getElementById("add-my-btn").addEventListener("click", () => {
    manager.addMyWidget(getSelectedBucketId());
});
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | This overview |
| [QUICKSTART.md](QUICKSTART.md) | Getting started guide |
| [INTEGRATION_NOTES.md](INTEGRATION_NOTES.md) | Detailed documentation |
| [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md) | Complete change log |

---

## 🤝 Contributing

This integration maintains the existing VDE architecture. When contributing:

1. ✅ Follow OOP principles
2. ✅ Use design patterns (Adapter, Bridge, Factory, etc.)
3. ✅ Match existing styling (`#ff7b00`, `#1a1a1a`, etc.)
4. ✅ Maintain modularity (self-contained modules)
5. ✅ Document potential bugs
6. ✅ Add to export/import logic
7. ✅ Test with existing panels

---

## 🔄 Version History

### v1.0.0 (2026-10-05)
- ✨ Added Ollama AI Interface panel
- ✨ Added Obsidian CLI Controller panel
- 🏗️ Created adapter modules (Ollama, Obsidian)
- 📝 Extended content implementations
- 🔧 Enhanced core factory and import/export
- 📚 Comprehensive documentation (4 documents)
- 🐛 Documented 22 known issues

### v0.1.0 (Original)
- Base Far Realm VDE implementation
- GridStack layout system
- Markdown, Code, Chart, Dashboard panels
- Theme customization
- Export/Import functionality

---

## 📝 License

Integration follows the Far Realm VDE project license.

---

## 🙏 Credits

- **Far Realm VDE** - Original architecture and design patterns
- **Ollama** - Local LLM runtime (https://ollama.ai)
- **Obsidian CLI** - Vault automation (https://github.com/polyipseity/obsidian-cli)
- **GridStack** - Layout engine (https://gridstackjs.com)
- **D3.js** - Visualizations (https://d3js.org)

---

## 📞 Support

For issues or questions:

1. Check [QUICKSTART.md](QUICKSTART.md) for common setup problems
2. Review [INTEGRATION_NOTES.md](INTEGRATION_NOTES.md) troubleshooting section
3. Verify prerequisites are installed (Ollama, Obsidian CLI, Node.js)
4. Check browser console (F12) for JavaScript errors
5. Ensure server.js is running on port 5000
6. Confirm Ollama is accessible on port 11434

---

**Built with 🧠 intelligence and 📝 precision**

*Integrating local AI and knowledge management into your workspace.*
