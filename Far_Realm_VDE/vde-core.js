/**
 * vde-core.js
 * 
 * Target Domain: 01_Narrative_Orchestration & 99_System_Governance
 * Structural Role: Core Orchestration and Layout Management
 * 
 * Contains state and layout structures: WorkspaceSubject (Observer Pattern),
 * IntegratedGridManagerClass (Singleton), GridBucket (GridStack container),
 * BaseGridPanel (UI Wrapper), PanelBuilder, and PanelFactory (Creational Patterns).
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

        // Prototype Pattern: Visual Clone Trigger
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

        // Splitting logic: Digester triggers
        const splitBtn = document.createElement("span");
        splitBtn.className = "panel-split-btn text-success me-2";
        splitBtn.style.cursor = "pointer";
        splitBtn.style.fontSize = "12px";
        splitBtn.textContent = "✂️";
        splitBtn.title = "Digest & Split Content";
        splitBtn.onclick = (e) => {
            e.stopPropagation();
            if (window.IntegratedGridManager) {
                window.IntegratedGridManager.digestAndSplitPanel(this.id);
            }
        };
        actionsSpan.appendChild(splitBtn);

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
        bucketCard.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";

        const header = document.createElement("div");
        header.className = "vde-bucket-header d-flex justify-content-between align-items-center p-3";
        header.style.backgroundColor = "#0d0d0d";
        header.style.borderBottom = "1px solid #2a2a2a";
        header.style.borderLeft = "4px solid #ff7b00";

        const titleDiv = document.createElement("div");
        titleDiv.className = "d-flex align-items-center gap-2";
        titleDiv.innerHTML = `
            <i class="bi bi-folder2-open text-warning"></i>
            <span class="vde-bucket-title fw-bold" style="color: #ff7b00; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${this.name}</span>
            <span class="badge bg-dark border border-secondary text-muted" style="font-size: 9px; padding: 3px 6px;">Cols: ${this.options.column}</span>
        `;
        header.appendChild(titleDiv);

        const controlsDiv = document.createElement("div");
        controlsDiv.className = "d-flex align-items-center gap-2";

        const setupBtn = document.createElement("button");
        setupBtn.className = "btn btn-sm btn-outline-secondary edit-bucket-btn";
        setupBtn.style.fontSize = "11px";
        setupBtn.style.padding = "2px 8px";
        setupBtn.innerHTML = '<i class="bi bi-gear-fill"></i> Setup';
        controlsDiv.appendChild(setupBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-sm btn-outline-danger delete-bucket-btn";
        deleteBtn.style.fontSize = "11px";
        deleteBtn.style.padding = "2px 8px";
        deleteBtn.style.borderColor = "rgba(220,53,69,0.3)";
        deleteBtn.style.color = "rgba(220,53,69,0.8)";
        deleteBtn.innerHTML = '<i class="bi bi-trash3"></i> Delete';
        controlsDiv.appendChild(deleteBtn);

        header.appendChild(controlsDiv);
        bucketCard.appendChild(header);

        const settingsPane = document.createElement("div");
        settingsPane.className = "vde-bucket-settings-pane d-none p-3 border-bottom border-secondary";
        settingsPane.style.backgroundColor = "#1e1e1e";
        settingsPane.style.fontSize = "11px";
        settingsPane.innerHTML = `
            <div class="row g-2 align-items-center text-white">
                <div class="col-md-3">
                    <label class="text-muted font-monospace small mb-1">Bucket Name</label>
                    <input type="text" class="form-control form-control-sm bucket-name-input bg-dark text-white border-secondary font-monospace" value="${this.name}">
                </div>
                <div class="col-md-2">
                    <label class="text-muted font-monospace small mb-1">Columns</label>
                    <input type="number" class="form-control form-control-sm bucket-cols-input bg-dark text-white border-secondary font-monospace" value="${this.options.column}" min="1" max="12">
                </div>
                <div class="col-md-2">
                    <label class="text-muted font-monospace small mb-1">Cell Height (px)</label>
                    <input type="number" class="form-control form-control-sm bucket-height-input bg-dark text-white border-secondary font-monospace" value="${this.options.cellHeight}">
                </div>
                <div class="col-md-1">
                    <label class="text-muted font-monospace small mb-1">Margin (px)</label>
                    <input type="number" class="form-control form-control-sm bucket-margin-input bg-dark text-white border-secondary font-monospace" value="${this.options.margin}">
                </div>
                <div class="col-md-2 ps-3">
                    <div class="form-check" style="margin-top: 4px;">
                        <input class="form-check-input bucket-move-checkbox" type="checkbox" id="bucket-move-${this.id}" ${this.options.enableMove ? "checked" : ""}>
                        <label class="form-check-label text-muted small" for="bucket-move-${this.id}">Enable Move</label>
                    </div>
                    <div class="form-check">
                        <input class="form-check-input bucket-resize-checkbox" type="checkbox" id="bucket-resize-${this.id}" ${this.options.enableResize ? "checked" : ""}>
                        <label class="form-check-label text-muted small" for="bucket-resize-${this.id}">Enable Resize</label>
                    </div>
                </div>
                <div class="col-md-2 text-end pt-3">
                    <button class="btn btn-sm btn-warning apply-bucket-settings-btn font-monospace fw-bold" style="font-size:11px;">Apply Settings</button>
                </div>
            </div>
        `;
        bucketCard.appendChild(settingsPane);

        const gridContainer = document.createElement("div");
        gridContainer.className = "vde-bucket-grid-container p-2";
        
        const gridElement = document.createElement("div");
        gridElement.className = "grid-stack";
        gridElement.id = `grid-stack-${this.id}`;
        gridContainer.appendChild(gridElement);
        bucketCard.appendChild(gridContainer);

        workspace.appendChild(bucketCard);
        this.el = bucketCard;

        setupBtn.onclick = () => {
            settingsPane.classList.toggle("d-none");
        };

        deleteBtn.onclick = () => {
            if (confirm(`Are you sure you want to remove the bucket "${this.name}"? This will also destroy all widgets inside it.`)) {
                window.IntegratedGridManager.removeBucket(this.id);
            }
        };

        const applyBtn = settingsPane.querySelector(".apply-bucket-settings-btn");
        applyBtn.onclick = () => {
            const nameInput = settingsPane.querySelector(".bucket-name-input").value;
            const colsInput = parseInt(settingsPane.querySelector(".bucket-cols-input").value) || 12;
            const heightInput = parseInt(settingsPane.querySelector(".bucket-height-input").value) || 25;
            const marginInput = parseInt(settingsPane.querySelector(".bucket-margin-input").value) || 5;
            const moveInput = settingsPane.querySelector(".bucket-move-checkbox").checked;
            const resizeInput = settingsPane.querySelector(".bucket-resize-checkbox").checked;

            this.name = nameInput;
            titleDiv.querySelector(".vde-bucket-title").textContent = this.name;
            titleDiv.querySelector(".badge").textContent = `Cols: ${colsInput}`;

            this.options.column = colsInput;
            this.options.cellHeight = heightInput;
            this.options.margin = marginInput;
            this.options.enableMove = moveInput;
            this.options.enableResize = resizeInput;

            if (this.grid) {
                this.grid.column(colsInput);
                this.grid.cellHeight(heightInput);
                this.grid.margin(marginInput);
                
                // Dynamic toggles on the underlying GridStack layout context
                this.grid.enableMove(moveInput);
                this.grid.enableResize(resizeInput);
            }

            settingsPane.classList.add("d-none");
            window.IntegratedGridManager.triggerStateChange();
        };

        const gridOptions = {
            column: this.options.column,
            cellHeight: this.options.cellHeight,
            margin: this.options.margin,
            acceptWidgets: ".grid-stack-item",
            draggable: { handle: ".vde-panel-header" },
            resizable: { handles: "se" },
            disableDrag: !this.options.enableMove,
            disableResize: !this.options.enableResize
        };

        this.grid = GridStack.init(gridOptions, gridElement);

        this.grid.on('change', (event, items) => {
            if (items) {
                items.forEach(item => {
                    const panelId = parseInt(item.id || item.el.getAttribute("gs-id"));
                    const panel = window.IntegratedGridManager.panels.get(panelId);
                    if (panel) {
                        panel.x = item.x;
                        panel.y = item.y;
                        panel.w = item.w;
                        panel.h = item.h;
                    }
                });
                window.IntegratedGridManager.triggerStateChange();
            }
        });

        this.grid.on('added', (event, items) => {
            if (items) {
                items.forEach(item => {
                    const panelId = parseInt(item.id || item.el.getAttribute("gs-id"));
                    const panel = window.IntegratedGridManager.panels.get(panelId);
                    if (panel) {
                        panel.bucketId = this.id;
                        panel.x = item.x;
                        panel.y = item.y;
                        panel.w = item.w;
                        panel.h = item.h;

                        if (panel.content && typeof panel.content.resize === 'function') {
                            const bodyEl = item.el.querySelector('.vde-panel-body');
                            if (bodyEl) {
                                panel.content.resize(bodyEl.clientWidth, bodyEl.clientHeight);
                            }
                        }
                    }
                });
                window.IntegratedGridManager.triggerStateChange();
            }
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
            const widgets = this.grid.getGridItems();
            widgets.forEach(w => {
                const panelId = parseInt(w.getAttribute("gs-id"));
                window.IntegratedGridManager.removePanel(panelId);
            });
            this.grid.destroy(false);
        }
        if (this.el) {
            this.el.remove();
        }
    }
}

class PanelBuilder {
    constructor() {
        this.reset();
    }

    reset() {
        this.config = {
            id: null,
            x: 0,
            y: 0,
            w: 4,
            h: 6,
            title: "Panel",
            content: null
        };
        return this;
    }

    setId(id) {
        this.config.id = id;
        return this;
    }

    setCoordinates(x, y) {
        this.config.x = x;
        this.config.y = y;
        return this;
    }

    setDimensions(w, h) {
        this.config.w = w;
        this.config.h = h;
        return this;
    }

    setTitle(title) {
        this.config.title = title;
        return this;
    }

    setContent(contentInstance) {
        this.config.content = contentInstance;
        return this;
    }

    build() {
        const panel = new BaseGridPanel(
            this.config.id,
            this.config.x,
            this.config.y,
            this.config.w,
            this.config.h,
            this.config.title,
            this.config.content
        );
        this.reset();
        return panel;
    }
}

class PanelFactory {
    static createMarkdownPanel(initialText = "") {
        const text = initialText || `### Codex Unit\nDouble-click to write markdown.`;
        if (typeof RichTextContent === 'undefined') {
            console.warn("RichTextContent class not loaded yet. Delaying factory execution.");
        }
        const content = typeof RichTextContent !== 'undefined' 
            ? new RichTextContent({ contentType: "markdown", sourceText: text })
            : null;

        return new PanelBuilder()
            .setTitle("Codex Panel")
            .setDimensions(4, 8)
            .setContent(content)
            .build();
    }

    static createChartPanel(chartType = "Bar Chart") {
        if (typeof D3ChartContent === 'undefined') {
            console.warn("D3ChartContent class not loaded yet. Delaying factory execution.");
        }
        const content = typeof D3ChartContent !== 'undefined'
            ? new D3ChartContent({
                chartType: chartType,
                chartConfig: { color: "#ff7b00" },
                data: {
                    data: [
                        { label: "Q1", value: 30 },
                        { label: "Q2", value: 55 },
                        { label: "Q3", value: 70 },
                        { label: "Q4", value: 95 }
                    ]
                }
              })
            : null;

        return new PanelBuilder()
            .setTitle(`${chartType} Panel`)
            .setDimensions(5, 10)
            .setContent(content)
            .build();
    }

    static createDashboardPanel() {
        if (typeof DataVizDashboardContent === 'undefined') {
            console.warn("DataVizDashboardContent class not loaded yet. Delaying factory execution.");
        }
        const content = typeof DataVizDashboardContent !== 'undefined'
            ? new DataVizDashboardContent()
            : null;

        return new PanelBuilder()
            .setTitle("Dynamic Analysis Sanctuary")
            .setDimensions(12, 14)
            .setContent(content)
            .build();
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

    setContainer(selector) {
        this.containerSelector = selector;
    }

    createBucket(name, options = {}) {
        if (!this.containerSelector) {
            console.error("Workspace container not set. Use setContainer() first.");
            return null;
        }
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

    createPanel(config, bucketId = null) {
        if (!this.containerSelector) {
            console.error("Workspace container not set. Use setContainer() first.");
            return null;
        }

        let targetBucket = null;
        if (bucketId) {
            targetBucket = this.buckets.get(bucketId);
        } else if (this.buckets.size > 0) {
            targetBucket = this.buckets.values().next().value;
        }

        if (!targetBucket) {
            console.error("No active containment vessel (bucket) found. Summon a bucket first.");
            return null;
        }

        const id = config.id || this.nextPanelId++;
        if (config.id && config.id >= this.nextPanelId) {
            this.nextPanelId = config.id + 1;
        }

        const panel = new BaseGridPanel(
            id,
            config.x || 0,
            config.y || 0,
            config.w || 4,
            config.h || 6,
            config.title,
            config.content
        );
        panel.bucketId = targetBucket.id;

        this.panels.set(id, panel);
        targetBucket.addWidget(panel);

        this.triggerStateChange();
        return panel;
    }

    addMarkdownWidget(initialText = "", bucketId = null) {
        const panel = PanelFactory.createMarkdownPanel(initialText);
        return this.registerAndPlacePanel(panel, bucketId);
    }

    addChartWidget(chartType = "Bar Chart", bucketId = null) {
        const panel = PanelFactory.createChartPanel(chartType);
        return this.registerAndPlacePanel(panel, bucketId);
    }

    addDashboardWidget(bucketId = null) {
        const panel = PanelFactory.createDashboardPanel();
        return this.registerAndPlacePanel(panel, bucketId);
    }

    addCodeWidget(initialText = "", bucketId = null) {
        const text = initialText || `// Code Sanctuary\nfunction executeRitual() {\n    const progress = 100;\n    return progress;\n}`;
        if (typeof CodeSnippetContent === 'undefined') {
            console.error("CodeSnippetContent not loaded yet.");
            return null;
        }
        const content = new CodeSnippetContent({
            sourceText: text
        });

        return this.createPanel({
            title: "Code Snippet Panel",
            content: content,
            w: 4,
            h: 8
        }, bucketId);
    }

    registerAndPlacePanel(panel, bucketId) {
        let targetBucket = null;
        if (bucketId) {
            targetBucket = this.buckets.get(bucketId);
        } else if (this.buckets.size > 0) {
            targetBucket = this.buckets.values().next().value;
        }

        if (!targetBucket) {
            console.error("No active containment vessel (bucket) found. Summon a bucket first.");
            return null;
        }

        panel.id = panel.id || this.nextPanelId++;
        if (panel.id >= this.nextPanelId) {
            this.nextPanelId = panel.id + 1;
        }
        panel.bucketId = targetBucket.id;

        this.panels.set(panel.id, panel);
        targetBucket.addWidget(panel);

        this.triggerStateChange();
        return panel;
    }

    clonePanel(panelId) {
        const original = this.panels.get(panelId);
        if (!original) return null;

        const cloned = original.clone();
        cloned.x = original.x + 1;
        cloned.y = original.y + 1;

        return this.registerAndPlacePanel(cloned, original.bucketId);
    }

    digestAndSplitPanel(panelId) {
        const panel = this.panels.get(panelId);
        if (!panel) return;
        
        // Use duck typing checks to prevent "instanceof" dynamic load crashes
        const isRichText = panel.content && (panel.content.constructor.name === "RichTextContent");
        if (!isRichText) {
            alert("Slicing can only be enacted upon Codex (RichText) panels.");
            return;
        }

        const rawText = panel.content.config.sourceText;
        const formatType = panel.content.config.contentType;
        
        const digester = window.ContentDigester || window.Digester;
        if (!digester) {
            alert("Slicing failed: Content digestion engine is not loaded.");
            return;
        }

        const shards = digester.digest(rawText, formatType);
        if (shards.length <= 1) {
            alert("This codex is already undivided. No further boundaries were found.");
            return;
        }

        const parentBucket = this.buckets.get(panel.bucketId);
        if (!parentBucket) return;

        panel.destroy();

        shards.forEach((shardText, idx) => {
            const shardPanel = PanelFactory.createMarkdownPanel(shardText);
            shardPanel.title = `${panel.title} (Shard ${idx + 1})`;
            shardPanel.w = panel.w;
            shardPanel.h = Math.max(3, Math.round(panel.h / shards.length));
            this.registerAndPlacePanel(shardPanel, parentBucket.id);
        });
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
        const payload = {
            vde_version: "4.1-OOP-Integrated",
            timestamp: new Date().toISOString(),
            buckets: []
        };

        this.buckets.forEach(bucket => {
            const bucketConfig = {
                id: bucket.id,
                name: bucket.name,
                options: bucket.options,
                widgets: []
            };

            this.panels.forEach(panel => {
                if (panel.bucketId === bucket.id) {
                    const cName = panel.content ? panel.content.constructor.name : "";
                    const panelConfig = {
                        id: panel.id,
                        x: panel.x,
                        y: panel.y,
                        w: panel.w,
                        h: panel.h,
                        title: panel.title,
                        contentType: cName === "RichTextContent" ? "rich-text" : 
                                     cName === "DataVizDashboardContent" ? "data-viz-dashboard" : "d3-chart"
                    };

                    if (cName === "RichTextContent") {
                        panelConfig.contentConfig = {
                            contentType: panel.content.config.contentType,
                            sourceText: panel.content.config.sourceText
                        };
                    } else if (cName === "DataVizDashboardContent") {
                        panelConfig.contentConfig = {
                            state: {
                                xAxis: panel.content.state.xAxis,
                                yAxis: panel.content.state.yAxis,
                                transform: panel.content.state.transform,
                                chartType: panel.content.state.chartType,
                                filters: panel.content.state.filters,
                                columns: panel.content.state.columns,
                                data: panel.content.state.data
                            }
                        };
                    } else if (cName === "D3ChartContent") {
                        panelConfig.contentConfig = {
                            chartType: panel.content.config.chartType,
                            chartConfig: panel.content.config.chartConfig,
                            data: panel.content.config.data
                        };
                    }

                    bucketConfig.widgets.push(panelConfig);
                }
            });

            payload.buckets.push(bucketConfig);
        });

        return JSON.stringify(payload, null, 2);
    }

    importVDE(jsonString) {
        try {
            const payload = JSON.parse(jsonString);
            if (!payload) return false;

            this.clearAll();

            if (!payload.buckets && Array.isArray(payload.panels)) {
                const legacyBucket = this.createBucket("Legacy Sanctuary", {
                    column: 12,
                    cellHeight: 25,
                    margin: 5
                });

                payload.panels.forEach(p => {
                    let contentInstance = null;
                    if (p.contentType === "rich-text" && typeof RichTextContent !== 'undefined') {
                        contentInstance = new RichTextContent(p.contentConfig);
                    } else if (p.contentType === "d3-chart" && typeof D3ChartContent !== 'undefined') {
                        contentInstance = new D3ChartContent(p.contentConfig);
                    } else if (p.contentType === "data-viz-dashboard" && typeof DataVizDashboardContent !== 'undefined') {
                        contentInstance = new DataVizDashboardContent(p.contentConfig);
                    }

                    if (contentInstance) {
                        const w = Math.max(2, Math.round((p.width || 350) / 80));
                        const h = Math.max(4, Math.round((p.height || 250) / 20));
                        const x = Math.round((p.x || 50) / 80);
                        const y = Math.round((p.y || 50) / 20);

                        this.createPanel({
                            id: p.id,
                            x: x,
                            y: y,
                            w: w,
                            h: h,
                            title: p.title,
                            content: contentInstance
                        }, legacyBucket.id);
                    }
                });

                return true;
            }

            if (Array.isArray(payload.buckets)) {
                payload.buckets.forEach(b => {
                    const bucket = this.createBucket(b.name, b.options);
                    if (bucket && Array.isArray(b.widgets)) {
                        b.widgets.forEach(w => {
                            let contentInstance = null;
                            if (w.contentType === "rich-text" && typeof RichTextContent !== 'undefined') {
                                contentInstance = new RichTextContent(w.contentConfig);
                            } else if (w.contentType === "d3-chart" && typeof D3ChartContent !== 'undefined') {
                                contentInstance = new D3ChartContent(w.contentConfig);
                            } else if (w.contentType === "data-viz-dashboard" && typeof DataVizDashboardContent !== 'undefined') {
                                contentInstance = new DataVizDashboardContent(w.contentConfig);
                            }

                            if (contentInstance) {
                                this.createPanel({
                                    id: w.id,
                                    x: w.x,
                                    y: w.y,
                                    w: w.w,
                                    h: w.h,
                                    title: w.title,
                                    content: contentInstance
                                }, b.id);
                            }
                        });
                    }
                });

                return true;
            }

            return false;
        } catch (e) {
            console.error("VDE hydration failure:", e);
            return false;
        }
    }

    triggerStateChange() {
        const state = this.exportVDE();
        this.notify('stateChange', { state });
        if (typeof this.stateChangeListener === 'function') {
            this.stateChangeListener(state);
        }
    }
}

// Instantiate Global Orchestration Singleton
const IntegratedGridManager = new IntegratedGridManagerClass();
window.IntegratedGridManager = IntegratedGridManager;

console.log("[Narayah VDE] vde-core.js successfully loaded. Core singleton established.");
