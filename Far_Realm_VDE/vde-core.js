/**
 * vde-core.js
 * Target Domain: 01_Narrative_Orchestration & 99_System_Governance
 * Structural Role: Core Orchestration and Layout Management
 * Patterns: Observer, Singleton, GridBucket Container, BaseGridPanel UI Wrapper, Builder, Factory
 */

class WorkspaceSubject {
    constructor() {
        this.observers = [];
    }

    addObserver(observer) {
        if (!this.observers.includes(observer)) {
            this.observers.push(observer);
        }
    }

    removeObserver(observer) {
        this.observers = this.observers.filter(obs => obs !== observer);
    }

    notify(event, payload) {
        this.observers.forEach(observer => {
            if (typeof observer.updateLayout === 'function') {
                observer.updateLayout(event, payload);
            }
        });
    }
}

class BaseGridPanel {
    constructor(id, x, y, w, h, title, contentInstance) {
        this.id = id;
        this.x = x || 0;
        this.y = y || 0;
        this.w = w || 4;
        this.h = h || 6;
        this.title = title || `Panel ${id}`;
        this.content = contentInstance;
        this.bucketId = null;
        if (this.content) {
            this.content.panel = this;
        }
        this.el = null;
    }

    render() {
        const el = document.createElement("div");
        el.className = "grid-stack-item";
        el.setAttribute("gs-id", this.id);

        const inner = document.createElement("div");
        inner.className = "grid-stack-item-content card border-secondary text-white";
        inner.style.backgroundColor = "#1a1a1a";
        inner.style.border = "1px solid #333";
        inner.style.display = "flex";
        inner.style.flexDirection = "column";
        inner.style.boxSizing = "border-box";
        inner.style.height = "100%";

        const header = document.createElement("div");
        header.className = "vde-panel-header p-2 bg-dark text-warning d-flex justify-content-between align-items-center";
        header.style.cursor = "move";
        header.style.borderBottom = "1px solid #2a2a2a";
        header.style.fontSize = "11px";
        header.style.fontWeight = "600";
        header.style.userSelect = "none";

        const titleSpan = document.createElement("span");
        titleSpan.textContent = this.title;
        header.appendChild(titleSpan);

        const actionsSpan = document.createElement("div");
        actionsSpan.className = "d-flex align-items-center";

        const cloneBtn = document.createElement("span");
        cloneBtn.className = "panel-clone-btn text-info me-2";
        cloneBtn.style.cursor = "pointer";
        cloneBtn.style.fontSize = "12px";
        cloneBtn.textContent = "📋";
        cloneBtn.title = "Clone Workspace Panel";
        cloneBtn.onclick = (e) => {
            e.stopPropagation();
            if (window.IntegratedGridManager) {
                window.IntegratedGridManager.clonePanel(this.id);
            }
        };
        actionsSpan.appendChild(cloneBtn);

        const closeBtn = document.createElement("span");
        closeBtn.className = "panel-close-btn text-danger fw-bold";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.fontSize = "13px";
        closeBtn.textContent = "✕";
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            this.destroy();
        };
        actionsSpan.appendChild(closeBtn);

        header.appendChild(actionsSpan);
        inner.appendChild(header);

        const body = document.createElement("div");
        body.className = "vde-panel-body flex-grow-1 overflow-hidden position-relative";
        body.style.height = "calc(100% - 28px)";
        inner.appendChild(body);

        el.appendChild(inner);
        this.el = el;

        if (this.content) {
            this.content.render(body);
        }
        return el;
    }

    destroy() {
        if (this.el) {
            const gridStackEl = this.el.closest(".grid-stack");
            if (gridStackEl && gridStackEl.gridstack) {
                gridStackEl.gridstack.removeWidget(this.el);
            } else {
                this.el.remove();
            }
        }
        if (window.IntegratedGridManager) {
            window.IntegratedGridManager.removePanel(this.id);
        }
    }

    clone() {
        const clonedContent = this.content ? this.content.clone() : null;
        return new BaseGridPanel(
            null,
            this.x,
            this.y,
            this.w,
            this.h,
            `${this.title} (Clone)`,
            clonedContent
        );
    }
}

class GridBucket {
    constructor(id, name, options = {}) {
        this.id = id;
        this.name = name;
        this.options = Object.assign({
            column: 12,
            cellHeight: 25,
            margin: 5,
            acceptWidgets: true,
            enableMove: true,
            enableResize: true
        }, options);
        this.grid = null;
        this.el = null;
        this.render();
    }

    render() {
        const workspace = document.querySelector(window.IntegratedGridManager.containerSelector);
        if (!workspace) return;

        const bucketCard = document.createElement("div");
        bucketCard.className = "vde-bucket-card mb-4";
        bucketCard.id = `vde-bucket-${this.id}`;
        bucketCard.style.border = "1px solid #333";
        bucketCard.style.backgroundColor = "#151515";
        bucketCard.style.borderRadius = "6px";
        bucketCard.style.overflow = "hidden";

        const header = document.createElement("div");
        header.className = "vde-bucket-header d-flex justify-content-between align-items-center p-3";
        header.style.backgroundColor = "#0d0d0d";
        header.style.borderBottom = "1px solid #2a2a2a";

        const titleDiv = document.createElement("div");
        titleDiv.className = "d-flex align-items-center gap-2";
        titleDiv.innerHTML = `
            <i class="bi bi-folder2-open text-warning"></i>
            <span class="vde-bucket-title fw-bold" style="font-size: 13px;">${this.name}</span>
        `;
        header.appendChild(titleDiv);
        bucketCard.appendChild(header);

        const gridContainer = document.createElement("div");
        gridContainer.className = "vde-bucket-grid-container p-2";

        const gridElement = document.createElement("div");
        gridElement.className = "grid-stack";
        gridElement.id = `grid-stack-${this.id}`;
        gridContainer.appendChild(gridElement);
        bucketCard.appendChild(gridContainer);
        workspace.appendChild(bucketCard);

        this.el = bucketCard;

        const gridOptions = {
            column: this.options.column,
            cellHeight: this.options.cellHeight,
            margin: this.options.margin,
            acceptWidgets: ".grid-stack-item",
            draggable: { handle: ".vde-panel-header" },
            resizable: { handles: "se" }
        };

        this.grid = GridStack.init(gridOptions, gridElement);

        this.grid.on('resizestop', (event, el) => {
            if (!el) return;
            const panelId = parseInt(el.getAttribute("gs-id"), 10);
            const panel = window.IntegratedGridManager.panels.get(panelId);
            if (panel && panel.content && typeof panel.content.resize === 'function') {
                const bodyEl = el.querySelector('.vde-panel-body');
                if (bodyEl) {
                    panel.content.resize(bodyEl.clientWidth, bodyEl.clientHeight);
                }
            }
            window.IntegratedGridManager.triggerStateChange();
        });
    }

    addWidget(panel) {
        const panelEl = panel.render();
        this.grid.addWidget(panelEl, {
            x: panel.x,
            y: panel.y,
            w: panel.w,
            h: panel.h,
            id: panel.id
        });
    }

    destroy() {
        if (this.grid) {
            this.grid.destroy(false);
        }
        if (this.el) {
            this.el.remove();
        }
    }
}

class PanelBuilder {
    constructor() { this.reset(); }
    reset() {
        this.config = { id: null, x: 0, y: 0, w: 4, h: 6, title: "Panel", content: null };
        return this;
    }
    setId(id) { this.config.id = id; return this; }
    setCoordinates(x, y) { this.config.x = x; this.config.y = y; return this; }
    setDimensions(w, h) { this.config.w = w; this.config.h = h; return this; }
    setTitle(title) { this.config.title = title; return this; }
    setContent(contentInstance) { this.config.content = contentInstance; return this; }
    build() {
        const panel = new BaseGridPanel(this.config.id, this.config.x, this.config.y, this.config.w, this.config.h, this.config.title, this.config.content);
        this.reset();
        return panel;
    }
}

class PanelFactory {
    static createMarkdownPanel(initialText = "") {
        const text = initialText || `### Codex Unit\nDouble-click to write markdown.`;
        const content = typeof RichTextContent !== 'undefined' ? new RichTextContent({ contentType: "markdown", sourceText: text }) : null;
        return new PanelBuilder().setTitle("Codex Panel").setDimensions(4, 8).setContent(content).build();
    }
    static createCodePanel(initialText = "") {
        const text = initialText || `// Code Sanctuary\nfunction executeRitual() {\n    return 100;\n}`;
        const content = typeof CodeSnippetContent !== 'undefined' ? new CodeSnippetContent({ contentType: "code-snippet", sourceText: text }) : null;
        return new PanelBuilder().setTitle("Code Snippet Panel").setDimensions(4, 8).setContent(content).build();
    }
    static createChartPanel(chartType = "Bar Chart") {
        const content = typeof D3ChartContent !== 'undefined' ? new D3ChartContent({
            chartType: chartType,
            chartConfig: {},
            data: {
                data: [{ label: "Q1", value: 30 }, { label: "Q2", value: 55 }, { label: "Q3", value: 70 }, { label: "Q4", value: 95 }]
            }
        }) : null;
        return new PanelBuilder().setTitle(`${chartType} Panel`).setDimensions(5, 10).setContent(content).build();
    }
    static createDashboardPanel() {
        const content = typeof DataVizDashboardContent !== 'undefined' ? new DataVizDashboardContent() : null;
        return new PanelBuilder().setTitle("Dynamic Analysis Sanctuary").setDimensions(12, 14).setContent(content).build();
    }
    static createOllamaPanel() {
        const content = typeof OllamaInterfaceContent !== 'undefined' ? new OllamaInterfaceContent() : null;
        return new PanelBuilder().setTitle("Ollama AI Interface").setDimensions(6, 12).setContent(content).build();
    }
    static createObsidianCLIPanel() {
        const content = typeof ObsidianCLIContent !== 'undefined' ? new ObsidianCLIContent() : null;
        return new PanelBuilder().setTitle("Obsidian CLI Controller").setDimensions(6, 12).setContent(content).build();
    }
}

class IntegratedGridManagerClass extends WorkspaceSubject {
    constructor() {
        super();
        this.containerSelector = null;
        this.buckets = new Map();
        this.panels = new Map();
        this.nextBucketId = 1;
        this.nextPanelId = 1;
        this.stateChangeListener = null;
    }

    setContainer(selector) { this.containerSelector = selector; }

    createBucket(name, options = {}) {
        if (!this.containerSelector) return null;
        const id = this.nextBucketId++;
        const bucket = new GridBucket(id, name, options);
        this.buckets.set(id, bucket);
        this.triggerStateChange();
        return bucket;
    }

    removeBucket(id) {
        const bucket = this.buckets.get(id);
        if (bucket) {
            bucket.destroy();
            this.buckets.delete(id);
            this.triggerStateChange();
        }
    }

    registerAndPlacePanel(panel, bucketId) {
        let targetBucket = bucketId ? this.buckets.get(bucketId) : (this.buckets.size > 0 ? this.buckets.values().next().value : null);
        if (!targetBucket) return null;

        panel.id = panel.id || this.nextPanelId++;
        if (panel.id >= this.nextPanelId) this.nextPanelId = panel.id + 1;

        panel.bucketId = targetBucket.id;
        this.panels.set(panel.id, panel);
        targetBucket.addWidget(panel);
        this.triggerStateChange();
        return panel;
    }

    addMarkdownWidget(initialText = "", bucketId = null) {
        return this.registerAndPlacePanel(PanelFactory.createMarkdownPanel(initialText), bucketId);
    }
    addDashboardWidget(bucketId = null) {
        return this.registerAndPlacePanel(PanelFactory.createDashboardPanel(), bucketId);
    }
    addCodeWidget(initialText = "", bucketId = null) {
        return this.registerAndPlacePanel(PanelFactory.createCodePanel(initialText), bucketId);
    }
    addOllamaWidget(bucketId = null) {
        return this.registerAndPlacePanel(PanelFactory.createOllamaPanel(), bucketId);
    }
    addObsidianCLIWidget(bucketId = null) {
        return this.registerAndPlacePanel(PanelFactory.createObsidianCLIPanel(), bucketId);
    }

    clonePanel(panelId) {
        const original = this.panels.get(panelId);
        if (!original) return null;
        const cloned = original.clone();
        cloned.x = original.x + 1;
        cloned.y = original.y + 1;
        return this.registerAndPlacePanel(cloned, original.bucketId);
    }

    removePanel(id) {
        this.panels.delete(id);
        this.triggerStateChange();
    }

    clearAll() {
        this.buckets.forEach(bucket => bucket.destroy());
        this.buckets.clear();
        this.panels.clear();
        this.nextBucketId = 1;
        this.nextPanelId = 1;
        this.triggerStateChange();
    }

    exportVDE() {
        const payload = { vde_version: "4.1-OOP-Integrated", timestamp: new Date().toISOString(), buckets: [] };
        return JSON.stringify(payload, null, 2);
    }

    importVDE(jsonString) {
        return true;
    }

    triggerStateChange() {
        const state = this.exportVDE();
        this.notify('stateChange', { state });
        if (typeof this.stateChangeListener === 'function') {
            this.stateChangeListener(state);
        }
    }
}

const IntegratedGridManager = new IntegratedGridManagerClass();
window.IntegratedGridManager = IntegratedGridManager;