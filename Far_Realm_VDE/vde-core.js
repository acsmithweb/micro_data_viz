/**
 * vde-core.js (v6 - Clean Engine)
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
        this.title = title || ("Panel " + id);
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
            this.title + " (Clone)",
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
            float: false,
            staticGrid: false,
            disableDrag: false,
            disableResize: false,
            animate: true,
            acceptWidgets: true
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
        bucketCard.id = "vde-bucket-" + this.id;
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
        titleDiv.innerHTML = '<i class="bi bi-folder2-open text-warning"></i>' +
            '<span class="vde-bucket-title fw-bold" style="font-size: 13px;">' + this.escapeHtml(this.name) + '</span>' +
            '<span class="badge bg-dark border border-secondary text-muted font-monospace ms-2" style="font-size: 10px;">Cols: ' + this.options.column + ' | Cell: ' + this.options.cellHeight + 'px</span>';
        header.appendChild(titleDiv);

        const actionsDiv = document.createElement("div");
        actionsDiv.className = "d-flex align-items-center gap-2";

        const exportBtn = document.createElement("button");
        exportBtn.className = "btn btn-sm btn-outline-info";
        exportBtn.style.fontSize = "11px";
        exportBtn.style.padding = "2px 8px";
        exportBtn.innerHTML = '<i class="bi bi-file-earmark-code me-1"></i> Export HTML';
        exportBtn.title = "Export this Bucket as a Standalone HTML Document";
        exportBtn.onclick = () => {
            this.exportBucketHTML();
        };
        actionsDiv.appendChild(exportBtn);

        const configBtn = document.createElement("button");
        configBtn.className = "btn btn-sm btn-outline-warning";
        configBtn.style.fontSize = "11px";
        configBtn.style.padding = "2px 8px";
        configBtn.innerHTML = '<i class="bi bi-gear-fill me-1"></i> GridStack Settings';
        configBtn.title = "Configure GridStack Settings for this Bucket";
        configBtn.onclick = () => {
            if (window.IntegratedGridManager) {
                window.IntegratedGridManager.openBucketConfigModal(this.id);
            }
        };
        actionsDiv.appendChild(configBtn);

        const removeBtn = document.createElement("button");
        removeBtn.className = "btn btn-sm btn-outline-danger";
        removeBtn.style.fontSize = "11px";
        removeBtn.style.padding = "2px 6px";
        removeBtn.innerHTML = '<i class="bi bi-trash"></i>';
        removeBtn.title = "Remove Bucket";
        removeBtn.onclick = () => {
            if (confirm("Remove bucket '" + this.name + "' and its contents?")) {
                if (window.IntegratedGridManager) {
                    window.IntegratedGridManager.removeBucket(this.id);
                }
            }
        };
        actionsDiv.appendChild(removeBtn);

        header.appendChild(actionsDiv);
        bucketCard.appendChild(header);

        const gridContainer = document.createElement("div");
        gridContainer.className = "vde-bucket-grid-container p-2";

        const gridElement = document.createElement("div");
        gridElement.className = "grid-stack";
        gridElement.id = "grid-stack-" + this.id;
        gridContainer.appendChild(gridElement);
        bucketCard.appendChild(gridContainer);
        workspace.appendChild(bucketCard);

        this.el = bucketCard;

        const gridOptions = {
            column: parseInt(this.options.column, 10) || 12,
            cellHeight: isNaN(this.options.cellHeight) ? this.options.cellHeight : parseInt(this.options.cellHeight, 10) || 25,
            margin: parseInt(this.options.margin, 10) || 5,
            float: !!this.options.float,
            staticGrid: !!this.options.staticGrid,
            animate: this.options.animate !== false,
            acceptWidgets: ".grid-stack-item",
            draggable: { handle: ".vde-panel-header" },
            resizable: { handles: "se" }
        };

        this.grid = GridStack.init(gridOptions, gridElement);

        if (this.options.disableDrag) this.grid.enableMove(false);
        if (this.options.disableResize) this.grid.enableResize(false);

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

        this.grid.on('change', (event, items) => {
            if (items) {
                items.forEach(item => {
                    const itemEl = item.el;
                    if (!itemEl) return;
                    const panelId = parseInt(itemEl.getAttribute("gs-id"), 10);
                    const panel = window.IntegratedGridManager.panels.get(panelId);
                    if (panel) {
                        panel.x = item.x;
                        panel.y = item.y;
                        panel.w = item.w;
                        panel.h = item.h;
                        if (panel.content && typeof panel.content.resize === 'function') {
                            const bodyEl = itemEl.querySelector('.vde-panel-body');
                            if (bodyEl && bodyEl.clientWidth > 0 && bodyEl.clientHeight > 0) {
                                panel.content.resize(bodyEl.clientWidth, bodyEl.clientHeight);
                            }
                        }
                    }
                });
            }
            window.IntegratedGridManager.triggerStateChange();
        });
    }

    notifyAllPanelsResize() {
        if (!this.el) return;
        requestAnimationFrame(() => {
            setTimeout(() => {
                const itemEls = this.el.querySelectorAll('.grid-stack-item');
                itemEls.forEach(itemEl => {
                    const panelId = parseInt(itemEl.getAttribute("gs-id"), 10);
                    const panel = window.IntegratedGridManager.panels.get(panelId);
                    if (panel) {
                        const node = itemEl.gridstackNode;
                        if (node) {
                            panel.x = node.x;
                            panel.y = node.y;
                            panel.w = node.w;
                            panel.h = node.h;
                        }
                        if (panel.content && typeof panel.content.resize === 'function') {
                            const bodyEl = itemEl.querySelector('.vde-panel-body');
                            if (bodyEl && bodyEl.clientWidth > 0 && bodyEl.clientHeight > 0) {
                                panel.content.resize(bodyEl.clientWidth, bodyEl.clientHeight);
                            }
                        }
                    }
                });
            }, 60);
        });
    }

    updateOptions(newOptions = {}) {
        this.options = Object.assign({}, this.options, newOptions);

        if (newOptions.name) {
            this.name = newOptions.name;
        }

        if (this.el) {
            const titleEl = this.el.querySelector(".vde-bucket-title");
            if (titleEl) titleEl.textContent = this.name;

            const badgeEl = this.el.querySelector(".badge");
            if (badgeEl) {
                badgeEl.textContent = "Cols: " + this.options.column + " | Cell: " + this.options.cellHeight + "px";
            }
        }

        if (this.grid) {
            if (newOptions.column !== undefined) {
                this.grid.column(parseInt(newOptions.column, 10) || 12);
            }
            if (newOptions.cellHeight !== undefined) {
                const ch = isNaN(newOptions.cellHeight) ? newOptions.cellHeight : parseInt(newOptions.cellHeight, 10);
                this.grid.cellHeight(ch);
            }
            if (newOptions.margin !== undefined) {
                this.grid.margin(parseInt(newOptions.margin, 10) || 0);
            }
            if (newOptions.float !== undefined) {
                this.grid.float(!!newOptions.float);
            }
            if (newOptions.staticGrid !== undefined) {
                this.grid.setStatic(!!newOptions.staticGrid);
            }
            if (newOptions.disableDrag !== undefined) {
                this.grid.enableMove(!newOptions.disableDrag);
            }
            if (newOptions.disableResize !== undefined) {
                this.grid.enableResize(!newOptions.disableResize);
            }
        }

        this.notifyAllPanelsResize();

        if (window.IntegratedGridManager) {
            window.IntegratedGridManager.triggerStateChange();
        }
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
        setTimeout(() => {
            const bodyEl = panelEl.querySelector('.vde-panel-body');
            if (bodyEl && panel.content && typeof panel.content.resize === 'function') {
                panel.content.resize(bodyEl.clientWidth, bodyEl.clientHeight);
            }
        }, 60);
    }

    destroy() {
        if (this.grid) {
            this.grid.destroy(false);
        }
        if (this.el) {
            this.el.remove();
        }
    }

    exportBucketHTML() {
        const manager = window.IntegratedGridManager;
        if (!manager) return;

        // Filter panels belonging ONLY to this bucket
        const bucketPanels = Array.from(manager.panels.values()).filter(p => p.bucketId === this.id);

        const serializedPanels = bucketPanels.map(p => {
            let contentConfig = {};
            let contentType = null;
            if (p.content) {
                contentType = p.content.constructor.name;
                if (contentType === "RichTextContent" || contentType === "CodeSnippetContent") {
                    contentConfig = {
                        contentType: p.content.config ? p.content.config.contentType : "markdown",
                        sourceText: p.content.config ? p.content.config.sourceText : ""
                    };
                } else if (contentType === "D3ChartContent") {
                    contentConfig = {
                        chartType: p.content.config ? p.content.config.chartType : "Bar Chart",
                        chartConfig: p.content.config ? p.content.config.chartConfig : {},
                        data: p.content.config ? p.content.config.data : null
                    };
                } else if (contentType === "DataVizDashboardContent") {
                    contentConfig = {
                        state: JSON.parse(JSON.stringify(p.content.state || {}))
                    };
                } else if (contentType === "OllamaInterfaceContent" || contentType === "ObsidianCLIContent") {
                    contentConfig = {
                        state: JSON.parse(JSON.stringify(p.content.state || {}))
                    };
                }
            }
            return {
                id: p.id,
                x: p.x,
                y: p.y,
                w: p.w,
                h: p.h,
                title: p.title,
                contentType: contentType,
                config: contentConfig
            };
        });

        const bucketData = {
            id: this.id,
            name: this.name,
            options: this.options,
            panels: serializedPanels
        };

        const jsonBucketData = JSON.stringify(bucketData, null, 2);

        const htmlLines = [
            '<!DOCTYPE html>',
            '<html lang="en">',
            '<head>',
            '    <meta charset="UTF-8">',
            '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
            '    <title>VDE Bucket Export - ' + this.escapeHtml(this.name) + '</title>',
            '    <!-- External CSS Dependencies -->',
            '    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">',
            '    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">',
            '    <link href="https://cdn.jsdelivr.net/npm/gridstack@10.0.1/dist/gridstack.min.css" rel="stylesheet" />',
            '    <style>',
            '        body { margin: 0; padding: 0; background-color: #121212; color: #e0e0e0; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; display: flex; height: 100vh; overflow: hidden; }',
            '        #vde-workspace-canvas { flex-grow: 1; position: relative; background-color: #101010; padding: 25px; overflow-y: auto; height: 100%; }',
            '        .grid-stack { background: rgba(0, 0, 0, 0.2); border-radius: 4px; min-height: 120px; border: 1px dashed #222; }',
            '        .vde-bucket-card { border: 1px solid #333; background-color: #151515; border-radius: 6px; overflow: hidden; margin-bottom: 1.5rem; }',
            '        .vde-bucket-header { background-color: #0d0d0d; border-bottom: 1px solid #2a2a2a; padding: 0.75rem 1rem; }',
            '    </style>',
            '</head>',
            '<body>',
            '    <div id="vde-workspace-canvas"></div>',
            '',
            '    <!-- External Laying & Rendering Engines -->',
            '    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>',
            '    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>',
            '    <script src="https://cdn.jsdelivr.net/npm/d3-cloud@1.2.5/build/d3.layout.cloud.min.js"></script>',
            '    <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.2/marked.min.js"></script>',
            '    <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"></script>',
            '    <script src="https://cdnjs.cloudflare.com/ajax/libs/gridstack/10.0.1/gridstack-all.js"></script>',
            '',
            '    <!-- VDE Module Scripts -->',
            '    <script src="vde-charts.js"></script>',
            '    <script src="vde-content.js"></script>',
            '    <script src="vde-core.js"></script>',
            '',
            '    <script>',
            '        const BUCKET_DATA = ' + jsonBucketData + ';',
            '',
            '        document.addEventListener("DOMContentLoaded", () => {',
            '            const manager = window.IntegratedGridManager;',
            '            if (!manager) return;',
            '            manager.setContainer("#vde-workspace-canvas");',
            '',
            '            if (BUCKET_DATA) {',
            '                const bucket = manager.createBucket(BUCKET_DATA.name, BUCKET_DATA.options);',
            '                if (BUCKET_DATA.panels && BUCKET_DATA.panels.length > 0) {',
            '                    BUCKET_DATA.panels.forEach(pData => {',
            '                        let contentInst = null;',
            '                        if (pData.contentType === "RichTextContent") {',
            '                            contentInst = new RichTextContent(pData.config);',
            '                        } else if (pData.contentType === "CodeSnippetContent") {',
            '                            contentInst = new CodeSnippetContent(pData.config);',
            '                        } else if (pData.contentType === "D3ChartContent") {',
            '                            contentInst = new D3ChartContent(pData.config);',
            '                        } else if (pData.contentType === "DataVizDashboardContent") {',
            '                            contentInst = new DataVizDashboardContent(pData.config);',
            '                        } else if (pData.contentType === "OllamaInterfaceContent") {',
            '                            contentInst = new OllamaInterfaceContent(pData.config);',
            '                        } else if (pData.contentType === "ObsidianCLIContent") {',
            '                            contentInst = new ObsidianCLIContent(pData.config);',
            '                        }',
            '                        const panel = new BaseGridPanel(pData.id, pData.x, pData.y, pData.w, pData.h, pData.title, contentInst);',
            '                        manager.registerAndPlacePanel(panel, bucket.id);',
            '                    });',
            '                }',
            '            }',
            '        });',
            '    </script>',
            '</body>',
            '</html>'
        ];

        const htmlContent = htmlLines.join("\n");
        const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const cleanName = (this.name || "bucket").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        a.download = "vde-bucket-" + this.id + "-" + cleanName + ".html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    escapeHtml(unsafe) {
        if (!unsafe) return "";
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
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
        const text = initialText || "### Codex Unit\\nDouble-click to write markdown.";
        const content = typeof RichTextContent !== 'undefined' ? new RichTextContent({ contentType: "markdown", sourceText: text }) : null;
        return new PanelBuilder().setTitle("Codex Panel").setDimensions(4, 8).setContent(content).build();
    }
    static createCodePanel(initialText = "") {
        const text = initialText || "// Code Sanctuary\\nfunction executeRitual() {\\n    return 100;\\n}";
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
        return new PanelBuilder().setTitle(chartType + " Panel").setDimensions(5, 10).setContent(content).build();
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
        this.configModalEl = null;
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

    openBucketConfigModal(targetBucketId = null) {
        if (!this.configModalEl) {
            this.buildConfigModalDOM();
        }

        const bucketSelect = document.getElementById("vde-config-bucket-select");
        bucketSelect.innerHTML = "";

        if (this.buckets.size === 0) {
            alert("No active buckets available to configure.");
            return;
        }

        this.buckets.forEach((bucket, id) => {
            const opt = document.createElement("option");
            opt.value = id;
            opt.textContent = bucket.name + " (Bucket #" + id + ")";
            bucketSelect.appendChild(opt);
        });

        const activeId = targetBucketId && this.buckets.has(targetBucketId) ? targetBucketId : this.buckets.keys().next().value;
        bucketSelect.value = activeId;

        this.loadBucketFormValues(activeId);

        bucketSelect.onchange = (e) => {
            const selectedId = parseInt(e.target.value, 10);
            this.loadBucketFormValues(selectedId);
        };

        const modalInstance = new bootstrap.Modal(this.configModalEl);
        modalInstance.show();
    }

    loadBucketFormValues(bucketId) {
        const bucket = this.buckets.get(bucketId);
        if (!bucket) return;

        const opts = bucket.options;
        document.getElementById("vde-config-name").value = bucket.name || "";
        document.getElementById("vde-config-column").value = opts.column || 12;
        document.getElementById("vde-config-cellheight").value = opts.cellHeight || 25;
        document.getElementById("vde-config-margin").value = opts.margin !== undefined ? opts.margin : 5;
        document.getElementById("vde-config-float").checked = !!opts.float;
        document.getElementById("vde-config-static").checked = !!opts.staticGrid;
        document.getElementById("vde-config-disable-drag").checked = !!opts.disableDrag;
        document.getElementById("vde-config-disable-resize").checked = !!opts.disableResize;
        document.getElementById("vde-config-animate").checked = opts.animate !== false;
    }

    buildConfigModalDOM() {
        const modalDiv = document.createElement("div");
        modalDiv.className = "modal fade";
        modalDiv.id = "vde-gridstack-config-modal";
        modalDiv.tabIndex = -1;
        modalDiv.setAttribute("aria-hidden", "true");

        const modalHTML = [
            '<div class="modal-dialog modal-dialog-centered">',
            '    <div class="modal-content bg-dark text-white border-secondary shadow-lg">',
            '        <div class="modal-header border-secondary bg-black bg-opacity-50">',
            '            <h5 class="modal-title font-monospace text-warning d-flex align-items-center gap-2" style="font-size: 14px;">',
            '                <i class="bi bi-sliders"></i> GridStack Bucket Configuration',
            '            </h5>',
            '            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>',
            '        </div>',
            '        <div class="modal-body font-monospace" style="font-size: 11px;">',
            '            <div class="mb-3">',
            '                <label class="form-label text-muted small mb-1">Target Bucket:</label>',
            '                <select id="vde-config-bucket-select" class="form-select form-select-sm bg-black text-warning border-secondary fw-bold"></select>',
            '            </div>',
            '            <hr class="border-secondary my-2">',
            '            <div class="row g-2">',
            '                <div class="col-12">',
            '                    <label class="form-label text-muted small mb-1">Bucket Title / Label:</label>',
            '                    <input type="text" id="vde-config-name" class="form-control form-control-sm bg-dark text-white border-secondary">',
            '                </div>',
            '                <div class="col-6">',
            '                    <label class="form-label text-muted small mb-1">Grid Columns (1-12):</label>',
            '                    <select id="vde-config-column" class="form-select form-select-sm bg-dark text-white border-secondary">',
            '                        <option value="1">1 Column</option>',
            '                        <option value="2">2 Columns</option>',
            '                        <option value="3">3 Columns</option>',
            '                        <option value="4">4 Columns</option>',
            '                        <option value="6">6 Columns</option>',
            '                        <option value="8">8 Columns</option>',
            '                        <option value="10">10 Columns</option>',
            '                        <option value="12">12 Columns (Default)</option>',
            '                    </select>',
            '                </div>',
            '                <div class="col-6">',
            '                    <label class="form-label text-muted small mb-1">Cell Height (px):</label>',
            '                    <input type="number" id="vde-config-cellheight" class="form-control form-control-sm bg-dark text-white border-secondary" min="10" max="200" step="5">',
            '                </div>',
            '                <div class="col-6">',
            '                    <label class="form-label text-muted small mb-1">Grid Margin (px):</label>',
            '                    <input type="number" id="vde-config-margin" class="form-control form-control-sm bg-dark text-white border-secondary" min="0" max="30">',
            '                </div>',
            '            </div>',
            '            <hr class="border-secondary my-3">',
            '            <div class="row g-2">',
            '                <div class="col-6">',
            '                    <div class="form-check">',
            '                        <input class="form-check-input" type="checkbox" id="vde-config-float">',
            '                        <label class="form-check-label text-white" for="vde-config-float">Float Mode (No auto-compact)</label>',
            '                    </div>',
            '                </div>',
            '                <div class="col-6">',
            '                    <div class="form-check">',
            '                        <input class="form-check-input" type="checkbox" id="vde-config-static">',
            '                        <label class="form-check-label text-white" for="vde-config-static">Static Grid (Lock layout)</label>',
            '                    </div>',
            '                </div>',
            '                <div class="col-6">',
            '                    <div class="form-check">',
            '                        <input class="form-check-input" type="checkbox" id="vde-config-disable-drag">',
            '                        <label class="form-check-label text-white" for="vde-config-disable-drag">Disable Panel Dragging</label>',
            '                    </div>',
            '                </div>',
            '                <div class="col-6">',
            '                    <div class="form-check">',
            '                        <input class="form-check-input" type="checkbox" id="vde-config-disable-resize">',
            '                        <label class="form-check-label text-white" for="vde-config-disable-resize">Disable Panel Resizing</label>',
            '                    </div>',
            '                </div>',
            '                <div class="col-6">',
            '                    <div class="form-check">',
            '                        <input class="form-check-input" type="checkbox" id="vde-config-animate">',
            '                        <label class="form-check-label text-white" for="vde-config-animate">Animate Layout Changes</label>',
            '                    </div>',
            '                </div>',
            '            </div>',
            '        </div>',
            '        <div class="modal-footer border-secondary bg-black bg-opacity-50">',
            '            <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>',
            '            <button type="button" class="btn btn-sm btn-warning font-monospace" id="vde-config-apply-btn">',
            '                <i class="bi bi-check2-circle me-1"></i> Apply GridStack Settings',
            '            </button>',
            '        </div>',
            '    </div>',
            '</div>'
        ].join('\n');

        modalDiv.innerHTML = modalHTML;
        document.body.appendChild(modalDiv);
        this.configModalEl = modalDiv;

        document.getElementById("vde-config-apply-btn").onclick = () => {
            const bucketSelect = document.getElementById("vde-config-bucket-select");
            const bucketId = parseInt(bucketSelect.value, 10);
            const bucket = this.buckets.get(bucketId);

            if (bucket) {
                const newOpts = {
                    name: document.getElementById("vde-config-name").value.trim(),
                    column: parseInt(document.getElementById("vde-config-column").value, 10),
                    cellHeight: parseInt(document.getElementById("vde-config-cellheight").value, 10),
                    margin: parseInt(document.getElementById("vde-config-margin").value, 10),
                    float: document.getElementById("vde-config-float").checked,
                    staticGrid: document.getElementById("vde-config-static").checked,
                    disableDrag: document.getElementById("vde-config-disable-drag").checked,
                    disableResize: document.getElementById("vde-config-disable-resize").checked,
                    animate: document.getElementById("vde-config-animate").checked
                };

                bucket.updateOptions(newOpts);

                const bsModal = bootstrap.Modal.getInstance(this.configModalEl);
                if (bsModal) bsModal.hide();
            }
        };
    }

    exportVDEState() {
        return {
            vde_version: "4.1-OOP-Integrated",
            timestamp: new Date().toISOString(),
            buckets: Array.from(this.buckets.values()).map(b => ({
                id: b.id,
                name: b.name,
                options: b.options,
                panels: Array.from(this.panels.values())
                    .filter(p => p.bucketId === b.id)
                    .map(p => ({
                        id: p.id,
                        x: p.x,
                        y: p.y,
                        w: p.w,
                        h: p.h,
                        title: p.title,
                        contentType: p.content ? p.content.constructor.name : null,
                        config: p.content ? (p.content.config || p.content.state || {}) : {}
                    }))
            }))
        };
    }

    exportVDE() {
        return JSON.stringify(this.exportVDEState(), null, 2);
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