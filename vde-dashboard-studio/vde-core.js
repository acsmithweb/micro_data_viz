/**
 * vde-core.js
 * Core Layout Orchestration & Workspace Governance using GridStack.
 * Pure browser-native implementation with zero Node.js or build step required.
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
    constructor(id, x, y, w, h, title, contentInstance, options = {}) {
        this.id = id;
        this.x = x || 0;
        this.y = y || 0;
        this.w = w || 4;
        this.h = h || 8;
        this.title = title || ("Panel " + id);
        this.content = contentInstance;
        this.bucketId = null;
        this.visualState = null;
        this.backgroundColor = (options && typeof options.backgroundColor === 'string' && options.backgroundColor.trim())
            ? options.backgroundColor.trim()
            : null;
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
        inner.className = "grid-stack-item-content card text-white";
        inner.style.backgroundColor = "var(--global-panel, #1c1e24)";
        inner.style.border = "1px solid var(--global-border, #2a2d35)";
        inner.style.display = "flex";
        inner.style.flexDirection = "column";
        inner.style.height = "100%";

        const header = document.createElement("div");
        header.className = "vde-panel-header px-3 py-2 d-flex justify-content-between align-items-center";
        header.style.backgroundColor = "var(--global-bg, #121316)";
        header.style.borderBottom = "1px solid var(--global-border, #2a2d35)";
        header.style.cursor = "move";
        header.style.fontSize = "12px";
        header.style.fontWeight = "600";
        header.style.userSelect = "none";
        header.style.color = "var(--global-accent, #ff7b00)";

        const titleSpan = document.createElement("span");
        titleSpan.className = "text-truncate pe-2";
        titleSpan.textContent = this.title;
        header.appendChild(titleSpan);

        const actionsSpan = document.createElement("div");
        actionsSpan.className = "d-flex align-items-center gap-2 shrink-0";

        const bgBtn = document.createElement("button");
        bgBtn.type = "button";
        bgBtn.className = "btn btn-link p-0 text-warning border-0 vde-panel-bg-btn";
        bgBtn.style.fontSize = "12px";
        bgBtn.innerHTML = '<i class="bi bi-palette"></i>';
        bgBtn.title = "Panel Background";
        bgBtn.onclick = (e) => {
            e.stopPropagation();
            if (window.IntegratedGridManager) {
                window.IntegratedGridManager.openPanelBackgroundPicker(this.id, bgBtn);
            }
        };
        actionsSpan.appendChild(bgBtn);

        const cloneBtn = document.createElement("button");
        cloneBtn.type = "button";
        cloneBtn.className = "btn btn-link p-0 text-info border-0";
        cloneBtn.style.fontSize = "12px";
        cloneBtn.innerHTML = '<i class="bi bi-copy"></i>';
        cloneBtn.title = "Clone Panel";
        cloneBtn.onclick = (e) => {
            e.stopPropagation();
            if (window.IntegratedGridManager) {
                window.IntegratedGridManager.clonePanel(this.id);
            }
        };
        actionsSpan.appendChild(cloneBtn);

        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "btn btn-link p-0 text-danger border-0";
        closeBtn.style.fontSize = "13px";
        closeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
        closeBtn.title = "Remove Panel";
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            this.destroy();
        };
        actionsSpan.appendChild(closeBtn);

        header.appendChild(actionsSpan);
        inner.appendChild(header);

        const body = document.createElement("div");
        body.className = "vde-panel-body flex-grow-1 overflow-hidden position-relative";
        body.style.minHeight = "0";
        inner.appendChild(body);

        el.appendChild(inner);
        this.el = el;

        this.applyBackgroundStyle();

        if (this.content) {
            this.content.render(body);
        }

        return el;
    }

    applyBackgroundStyle() {
        if (!this.el) return;
        const inner = this.el.querySelector(".grid-stack-item-content");
        const header = this.el.querySelector(".vde-panel-header");
        const bgBtn = this.el.querySelector(".vde-panel-bg-btn");
        if (!inner) return;

        if (this.backgroundColor) {
            inner.dataset.customBg = this.backgroundColor;
            inner.style.setProperty("--panel-bg", this.backgroundColor);
            inner.style.setProperty("--panel-surface-bg", this.backgroundColor);
            inner.style.backgroundColor = this.backgroundColor;
            if (header) {
                const darkened = window.VisualStyleMemento
                    ? window.VisualStyleMemento.prototype.adjustColor(this.backgroundColor, -5)
                    : this.backgroundColor;
                header.style.backgroundColor = darkened;
            }
            if (bgBtn) {
                bgBtn.innerHTML = `<i class="bi bi-palette-fill"></i>`;
            }
        } else {
            delete inner.dataset.customBg;
            const globalPanelBg = getComputedStyle(document.documentElement).getPropertyValue("--global-panel").trim() || "#1c1e24";
            inner.style.setProperty("--panel-bg", globalPanelBg);
            inner.style.removeProperty("--panel-surface-bg");
            inner.style.backgroundColor = "var(--global-panel, #1c1e24)";
            if (header) {
                header.style.backgroundColor = "var(--global-bg, #121316)";
            }
            if (bgBtn) {
                bgBtn.innerHTML = `<i class="bi bi-palette"></i>`;
            }
        }
    }

    setBackgroundColor(color, persist = true) {
        this.backgroundColor = (color && typeof color === 'string' && color.trim()) ? color.trim() : null;
        this.applyBackgroundStyle();
        if (this.content && (this.content instanceof DataVizDashboardContent || this.content instanceof D3ChartContent)) {
            if (this.content instanceof DataVizDashboardContent) {
                this.content.renderChart();
            } else {
                this.content.mountChart();
            }
        }
        if (persist && window.IntegratedGridManager) {
            window.IntegratedGridManager.triggerStateChange();
        }
    }

    destroy() {
        if (this.content && typeof this.content.destroy === 'function') {
            this.content.destroy();
        }
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
            this.title + " (Copy)",
            clonedContent,
            { backgroundColor: this.backgroundColor }
        );
    }
}

class GridBucket {
    constructor(id, name, options = {}) {
        this.id = id;
        this.name = name;
        this.options = Object.assign({
            column: 12,
            cellHeight: 30,
            margin: 6,
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
        bucketCard.className = "vde-bucket-card";
        bucketCard.id = "vde-bucket-" + this.id;

        const header = document.createElement("div");
        header.className = "vde-bucket-header d-flex justify-content-between align-items-center";

        const titleDiv = document.createElement("div");
        titleDiv.className = "d-flex align-items-center gap-2";

        const icon = document.createElement("i");
        icon.className = "bi bi-folder2-open";
        icon.style.color = "var(--global-accent, #ff7b00)";

        const nameSpan = document.createElement("span");
        nameSpan.className = "vde-bucket-title fw-semibold";
        nameSpan.style.fontSize = "13px";
        nameSpan.textContent = this.name;

        const metaSpan = document.createElement("span");
        metaSpan.className = "vde-bucket-meta font-mono text-secondary ms-2";
        metaSpan.style.fontSize = "11px";
        metaSpan.textContent = `${this.options.column} cols · ${this.options.cellHeight}px row`;

        titleDiv.appendChild(icon);
        titleDiv.appendChild(nameSpan);
        titleDiv.appendChild(metaSpan);
        header.appendChild(titleDiv);

        const actionsDiv = document.createElement("div");
        actionsDiv.className = "d-flex align-items-center gap-2";

        const configBtn = document.createElement("button");
        configBtn.type = "button";
        configBtn.className = "btn btn-sm btn-outline-secondary";
        configBtn.style.fontSize = "11px";
        configBtn.style.padding = "3px 10px";
        configBtn.innerHTML = '<i class="bi bi-sliders me-1"></i>Layout Settings';
        configBtn.onclick = () => {
            if (window.IntegratedGridManager) {
                window.IntegratedGridManager.openBucketConfigModal(this.id);
            }
        };
        actionsDiv.appendChild(configBtn);

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "btn btn-sm btn-outline-danger";
        removeBtn.style.fontSize = "11px";
        removeBtn.style.padding = "3px 8px";
        removeBtn.innerHTML = '<i class="bi bi-trash3"></i>';
        removeBtn.title = "Remove Bucket";
        removeBtn.onclick = () => {
            if (window.IntegratedGridManager) {
                window.IntegratedGridManager.removeBucket(this.id);
            }
        };
        actionsDiv.appendChild(removeBtn);

        header.appendChild(actionsDiv);
        bucketCard.appendChild(header);

        const gridContainer = document.createElement("div");
        gridContainer.className = "p-2";

        const gridElement = document.createElement("div");
        gridElement.className = "grid-stack";
        gridElement.id = "grid-stack-" + this.id;
        gridContainer.appendChild(gridElement);
        bucketCard.appendChild(gridContainer);

        workspace.appendChild(bucketCard);
        this.el = bucketCard;

        const gridOptions = {
            column: parseInt(this.options.column, 10) || 12,
            cellHeight: parseInt(this.options.cellHeight, 10) || 30,
            margin: parseInt(this.options.margin, 10) ?? 6,
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
        if (newOptions.name) this.name = newOptions.name;

        if (this.el) {
            const titleEl = this.el.querySelector(".vde-bucket-title");
            if (titleEl) titleEl.textContent = this.name;
            const metaEl = this.el.querySelector(".vde-bucket-meta");
            if (metaEl) metaEl.textContent = `${this.options.column} cols · ${this.options.cellHeight}px row`;
        }

        if (this.grid) {
            if (newOptions.column !== undefined) this.grid.column(parseInt(newOptions.column, 10) || 12);
            if (newOptions.cellHeight !== undefined) this.grid.cellHeight(parseInt(newOptions.cellHeight, 10) || 30);
            if (newOptions.margin !== undefined) this.grid.margin(parseInt(newOptions.margin, 10) ?? 6);
            if (newOptions.float !== undefined) this.grid.float(!!newOptions.float);
            if (newOptions.staticGrid !== undefined) this.grid.setStatic(!!newOptions.staticGrid);
            if (newOptions.disableDrag !== undefined) this.grid.enableMove(!newOptions.disableDrag);
            if (newOptions.disableResize !== undefined) this.grid.enableResize(!newOptions.disableResize);
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
        }, 80);
    }

    destroy() {
        if (this.grid) this.grid.destroy(false);
        if (this.el) this.el.remove();
    }
}

class PanelBuilder {
    constructor() { this.reset(); }
    reset() {
        this.config = { id: null, x: 0, y: 0, w: 4, h: 8, title: "Panel", content: null, backgroundColor: null };
        return this;
    }
    setId(id) { this.config.id = id; return this; }
    setCoordinates(x, y) { this.config.x = x; this.config.y = y; return this; }
    setDimensions(w, h) { this.config.w = w; this.config.h = h; return this; }
    setTitle(title) { this.config.title = title; return this; }
    setContent(contentInstance) { this.config.content = contentInstance; return this; }
    setBackgroundColor(color) { this.config.backgroundColor = color; return this; }
    build() {
        const panel = new BaseGridPanel(
            this.config.id,
            this.config.x,
            this.config.y,
            this.config.w,
            this.config.h,
            this.config.title,
            this.config.content,
            { backgroundColor: this.config.backgroundColor }
        );
        this.reset();
        return panel;
    }
}

class PanelFactory {
    static createMarkdownPanel(initialText = "") {
        const text = initialText || "### Workspace Notes\nDouble-click to edit Markdown, or use **Split Sections** to divide headings into separate panels.";
        const content = typeof RichTextContent !== 'undefined' ? new RichTextContent({ contentType: "markdown", sourceText: text }) : null;
        return new PanelBuilder().setTitle("Markdown Notes").setDimensions(4, 9).setContent(content).build();
    }

    static createCodePanel(initialText = "") {
        const text = initialText || "function summarizeMetrics(rows) {\n  return rows.reduce((sum, r) => sum + r.value, 0);\n}\n\nclass ChartPipeline {\n  render(data) {\n    return data.length;\n  }\n}";
        const content = typeof CodeSnippetContent !== 'undefined' ? new CodeSnippetContent({ contentType: "code-snippet", sourceText: text }) : null;
        return new PanelBuilder().setTitle("Code Snippet").setDimensions(4, 9).setContent(content).build();
    }

    static createHTMLPanel(initialHtml = "") {
        const html = initialHtml || [
            '<style>',
            '  .card { background: #1c1e24; border: 1px solid #2e3340; border-radius: 10px; padding: 16px; }',
            '  .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; background: rgba(255,123,0,0.16); color: #ff9c40; font-size: 11px; font-weight: 600; }',
            '  h3 { margin: 10px 0 6px; color: #f3f4f6; }',
            '  p { margin: 0; color: #9ca3af; }',
            '</style>',
            '<div class="card">',
            '  <span class="badge">LIVE HTML PREVIEW</span>',
            '  <h3>Custom HTML Panel</h3>',
            '  <p>Paste any HTML, CSS, SVG, or full document into the editor to render it here.</p>',
            '</div>'
        ].join("\n");
        const content = typeof HTMLPreviewContent !== 'undefined'
            ? new HTMLPreviewContent({ contentType: "html-preview", sourceText: html, viewMode: "split", autoRender: true })
            : null;
        return new PanelBuilder().setTitle("HTML Renderer").setDimensions(6, 11).setContent(content).build();
    }

    static createChartPanel(chartType = "Bar Chart", datasetId = null) {
        const samples = window.VDE_SAMPLE_DATASETS || [];
        const funnelCharts = new Set(['Funnel Chart', 'Pie Chart', 'Donut Chart', 'Treemap', 'Bubble Chart', 'Radial Bar Chart', 'Word Cloud Chart']);
        const distCharts = new Set(['Box Plot', 'Histogram', 'Scatter Plot']);
        const ds = (datasetId ? samples.find(d => d.id === datasetId) : null)
            || (funnelCharts.has(chartType) ? (samples.find(d => d.id === 'conversion-funnel') || samples[1])
                : distCharts.has(chartType) ? (samples.find(d => d.id === 'service-latency') || samples[2])
                : chartType === 'Radar Chart' ? (samples.find(d => d.id === 'capability-radar') || samples[3])
                : (samples.find(d => d.id === 'regional-revenue') || samples[0]));

        const content = typeof D3ChartContent !== 'undefined' ? new D3ChartContent({
            chartType: chartType,
            datasetId: ds ? ds.id : '',
            data: ds ? { data: ds.data, xAxis: ds.defaultX, yAxis: ds.defaultY, groupKey: ds.defaultGroup } : { data: [] }
        }) : null;
        return new PanelBuilder().setTitle(chartType).setDimensions(6, 10).setContent(content).build();
    }

    static createDashboardPanel() {
        const content = typeof DataVizDashboardContent !== 'undefined' ? new DataVizDashboardContent() : null;
        return new PanelBuilder().setTitle("Interactive Data Explorer").setDimensions(12, 13).setContent(content).build();
    }

    static createOllamaPanel() {
        const content = typeof OllamaInterfaceContent !== 'undefined' ? new OllamaInterfaceContent() : null;
        return new PanelBuilder().setTitle("Ollama AI Console").setDimensions(6, 12).setContent(content).build();
    }

    static createObsidianCLIPanel() {
        const content = typeof ObsidianCLIContent !== 'undefined' ? new ObsidianCLIContent() : null;
        return new PanelBuilder().setTitle("Obsidian CLI").setDimensions(6, 13).setContent(content).build();
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
        this.currentTheme = window.DEFAULT_THEME_STATE ? Object.assign({}, window.DEFAULT_THEME_STATE) : null;
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
            Array.from(this.panels.values())
                .filter(p => p.bucketId === id)
                .forEach(p => {
                    if (p.content && typeof p.content.destroy === 'function') p.content.destroy();
                    this.panels.delete(p.id);
                });
            bucket.destroy();
            this.buckets.delete(id);
            this.triggerStateChange();
        }
    }

    registerAndPlacePanel(panel, bucketId) {
        let targetBucket = bucketId ? this.buckets.get(bucketId) : (this.buckets.size > 0 ? this.buckets.values().next().value : null);
        if (!targetBucket) targetBucket = this.createBucket("Primary Workspace");
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

    addChartWidget(chartType = "Bar Chart", bucketId = null, datasetId = null) {
        return this.registerAndPlacePanel(PanelFactory.createChartPanel(chartType, datasetId), bucketId);
    }

    addCodeWidget(initialText = "", bucketId = null) {
        return this.registerAndPlacePanel(PanelFactory.createCodePanel(initialText), bucketId);
    }

    addHTMLWidget(initialHtml = "", bucketId = null) {
        return this.registerAndPlacePanel(PanelFactory.createHTMLPanel(initialHtml), bucketId);
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
        cloned.x = (original.x + 1) % 12;
        cloned.y = original.y + 1;
        return this.registerAndPlacePanel(cloned, original.bucketId);
    }

    removePanel(id) {
        this.panels.delete(id);
        this.triggerStateChange();
    }

    clearAll() {
        this.panels.forEach(p => {
            if (p.content && typeof p.content.destroy === 'function') p.content.destroy();
        });
        this.buckets.forEach(bucket => bucket.destroy());
        this.buckets.clear();
        this.panels.clear();
        this.nextBucketId = 1;
        this.nextPanelId = 1;
        this.triggerStateChange();
    }

    refreshAllCharts() {
        this.panels.forEach(panel => {
            if (panel.content instanceof DataVizDashboardContent) {
                panel.content.renderChart();
            } else if (panel.content instanceof D3ChartContent) {
                const bodyEl = panel.el?.querySelector('.vde-panel-body');
                if (bodyEl) panel.content.render(bodyEl);
            }
        });
    }

    openBucketConfigModal(targetBucketId = null) {
        if (!this.configModalEl) this.buildConfigModalDOM();

        const bucketSelect = document.getElementById("vde-config-bucket-select");
        if (!bucketSelect || this.buckets.size === 0) return;

        bucketSelect.innerHTML = "";
        this.buckets.forEach((bucket, id) => {
            const opt = document.createElement("option");
            opt.value = id;
            opt.textContent = `${bucket.name} (#${id})`;
            bucketSelect.appendChild(opt);
        });

        const activeId = targetBucketId && this.buckets.has(targetBucketId) ? targetBucketId : this.buckets.keys().next().value;
        bucketSelect.value = activeId;
        this.loadBucketFormValues(activeId);

        bucketSelect.onchange = (e) => {
            this.loadBucketFormValues(parseInt(e.target.value, 10));
        };

        bootstrap.Modal.getOrCreateInstance(this.configModalEl).show();
    }

    loadBucketFormValues(bucketId) {
        const bucket = this.buckets.get(bucketId);
        if (!bucket) return;
        const opts = bucket.options;
        document.getElementById("vde-config-name").value = bucket.name || "";
        document.getElementById("vde-config-column").value = opts.column || 12;
        document.getElementById("vde-config-cellheight").value = opts.cellHeight || 30;
        document.getElementById("vde-config-margin").value = opts.margin !== undefined ? opts.margin : 6;
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

        modalDiv.innerHTML = `
<div class="modal-dialog modal-dialog-centered">
  <div class="modal-content bg-dark text-white border-secondary shadow-lg">
    <div class="modal-header border-secondary">
      <h5 class="modal-title font-mono text-warning fs-6"><i class="bi bi-sliders me-2"></i>Bucket Layout Settings</h5>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body font-mono" style="font-size: 12px;">
      <div class="mb-3">
        <label class="form-label text-secondary small mb-1">Target Bucket</label>
        <select id="vde-config-bucket-select" class="form-select form-select-sm bg-black text-warning border-secondary fw-bold"></select>
      </div>
      <div class="row g-2">
        <div class="col-12">
          <label class="form-label text-secondary small mb-1">Bucket Name</label>
          <input type="text" id="vde-config-name" class="form-control form-control-sm bg-dark text-white border-secondary">
        </div>
        <div class="col-4">
          <label class="form-label text-secondary small mb-1">Columns</label>
          <select id="vde-config-column" class="form-select form-select-sm bg-dark text-white border-secondary">
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="6">6</option>
            <option value="8">8</option>
            <option value="12">12</option>
          </select>
        </div>
        <div class="col-4">
          <label class="form-label text-secondary small mb-1">Row Height (px)</label>
          <input type="number" id="vde-config-cellheight" class="form-control form-control-sm bg-dark text-white border-secondary" min="15" max="150" step="5">
        </div>
        <div class="col-4">
          <label class="form-label text-secondary small mb-1">Gap (px)</label>
          <input type="number" id="vde-config-margin" class="form-control form-control-sm bg-dark text-white border-secondary" min="0" max="30">
        </div>
      </div>
      <hr class="border-secondary my-3">
      <div class="row g-2">
        <div class="col-6"><div class="form-check"><input class="form-check-input" type="checkbox" id="vde-config-float"><label class="form-check-label" for="vde-config-float">Float Mode</label></div></div>
        <div class="col-6"><div class="form-check"><input class="form-check-input" type="checkbox" id="vde-config-static"><label class="form-check-label" for="vde-config-static">Lock Grid</label></div></div>
        <div class="col-6"><div class="form-check"><input class="form-check-input" type="checkbox" id="vde-config-disable-drag"><label class="form-check-label" for="vde-config-disable-drag">Disable Drag</label></div></div>
        <div class="col-6"><div class="form-check"><input class="form-check-input" type="checkbox" id="vde-config-disable-resize"><label class="form-check-label" for="vde-config-disable-resize">Disable Resize</label></div></div>
        <div class="col-6"><div class="form-check"><input class="form-check-input" type="checkbox" id="vde-config-animate"><label class="form-check-label" for="vde-config-animate">Animate Changes</label></div></div>
      </div>
    </div>
    <div class="modal-footer border-secondary">
      <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
      <button type="button" class="btn btn-sm btn-warning" id="vde-config-apply-btn">Apply</button>
    </div>
  </div>
</div>`;

        document.body.appendChild(modalDiv);
        this.configModalEl = modalDiv;

        document.getElementById("vde-config-apply-btn").onclick = () => {
            const bucketId = parseInt(document.getElementById("vde-config-bucket-select").value, 10);
            const bucket = this.buckets.get(bucketId);
            if (bucket) {
                bucket.updateOptions({
                    name: document.getElementById("vde-config-name").value.trim(),
                    column: parseInt(document.getElementById("vde-config-column").value, 10),
                    cellHeight: parseInt(document.getElementById("vde-config-cellheight").value, 10),
                    margin: parseInt(document.getElementById("vde-config-margin").value, 10),
                    float: document.getElementById("vde-config-float").checked,
                    staticGrid: document.getElementById("vde-config-static").checked,
                    disableDrag: document.getElementById("vde-config-disable-drag").checked,
                    disableResize: document.getElementById("vde-config-disable-resize").checked,
                    animate: document.getElementById("vde-config-animate").checked
                });
                bootstrap.Modal.getInstance(modalDiv)?.hide();
            }
        };
    }

    openPanelBackgroundPicker(panelId, anchorEl) {
        const panel = this.panels.get(panelId);
        if (!panel) return;

        if (this._bgPopoverEl) {
            this._bgPopoverEl.remove();
            this._bgPopoverEl = null;
        }

        const currentBg = panel.backgroundColor
            || (getComputedStyle(document.documentElement).getPropertyValue('--global-panel').trim() || '#1c1e24');

        const popover = document.createElement('div');
        popover.className = 'card bg-dark text-white border-secondary shadow-lg p-2 font-mono';
        popover.style.position = 'fixed';
        popover.style.zIndex = '2050';
        popover.style.width = '226px';
        popover.style.fontSize = '11px';
        popover.style.borderRadius = '8px';

        const presets = ['#1c1e24', '#121316', '#152238', '#11241f', '#23192d', '#2a1b18', '#1f2419'];
        const swatchesHtml = presets.map(hex =>
            `<button type="button" class="btn p-0 border border-secondary vde-bg-swatch" data-hex="${hex}" title="${hex}" style="width:20px;height:20px;border-radius:4px;background:${hex};"></button>`
        ).join('');

        popover.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom border-secondary">
                <span class="text-warning fw-semibold" style="font-size:11px;">Panel Background</span>
                <button type="button" class="btn-close btn-close-white vde-bg-close" style="font-size:9px;" aria-label="Close"></button>
            </div>
            <div class="d-flex align-items-center gap-2 mb-2">
                <input type="color" class="form-control form-control-color vde-bg-color-input" value="${currentBg.startsWith('#') && currentBg.length === 7 ? currentBg : '#1c1e24'}" style="width:42px;height:30px;padding:2px;">
                <input type="text" class="form-control form-control-sm bg-black text-white border-secondary vde-bg-hex-input" value="${panel.backgroundColor || ''}" placeholder="Theme Default" style="font-size:11px;">
            </div>
            <div class="d-flex align-items-center justify-content-between gap-1 mb-2">${swatchesHtml}</div>
            <div class="d-flex gap-2">
                <button type="button" class="btn btn-sm btn-outline-secondary flex-fill vde-bg-reset" style="font-size:10.5px;">Reset Theme</button>
                <button type="button" class="btn btn-sm btn-warning flex-fill fw-semibold vde-bg-done" style="font-size:10.5px;">Done</button>
            </div>
        `;

        document.body.appendChild(popover);
        this._bgPopoverEl = popover;

        if (anchorEl && typeof anchorEl.getBoundingClientRect === 'function') {
            const rect = anchorEl.getBoundingClientRect();
            const top = Math.min(window.innerHeight - 175, rect.bottom + 6);
            const left = Math.max(8, Math.min(window.innerWidth - 234, rect.right - 226));
            popover.style.top = `${Math.max(8, top)}px`;
            popover.style.left = `${left}px`;
        } else {
            popover.style.top = '72px';
            popover.style.right = '24px';
        }

        const colorInput = popover.querySelector('.vde-bg-color-input');
        const hexInput = popover.querySelector('.vde-bg-hex-input');

        const closePopover = () => {
            if (this._bgPopoverEl) {
                this._bgPopoverEl.remove();
                this._bgPopoverEl = null;
            }
            document.removeEventListener('mousedown', onDocDown);
            document.removeEventListener('keydown', onKeyDown);
        };

        const onDocDown = (ev) => {
            if (!popover.contains(ev.target) && ev.target !== anchorEl && !anchorEl?.contains(ev.target)) {
                closePopover();
            }
        };
        const onKeyDown = (ev) => {
            if (ev.key === 'Escape') closePopover();
        };

        popover.addEventListener('mousedown', (ev) => ev.stopPropagation());
        setTimeout(() => {
            document.addEventListener('mousedown', onDocDown);
            document.addEventListener('keydown', onKeyDown);
        }, 0);

        colorInput?.addEventListener('input', () => {
            if (hexInput) hexInput.value = colorInput.value;
            panel.setBackgroundColor(colorInput.value, false);
        });
        colorInput?.addEventListener('change', () => {
            if (hexInput) hexInput.value = colorInput.value;
            panel.setBackgroundColor(colorInput.value, true);
        });

        hexInput?.addEventListener('change', () => {
            const val = hexInput.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(val) && colorInput) {
                colorInput.value = val;
            }
            panel.setBackgroundColor(val || null, true);
        });

        popover.querySelectorAll('.vde-bg-swatch').forEach(btn => {
            btn.addEventListener('click', () => {
                const hex = btn.getAttribute('data-hex');
                if (colorInput && hex) colorInput.value = hex;
                if (hexInput && hex) hexInput.value = hex;
                panel.setBackgroundColor(hex, true);
            });
        });

        popover.querySelector('.vde-bg-reset')?.addEventListener('click', () => {
            if (hexInput) hexInput.value = '';
            const globalBg = getComputedStyle(document.documentElement).getPropertyValue('--global-panel').trim() || '#1c1e24';
            if (colorInput && /^#[0-9a-fA-F]{6}$/.test(globalBg)) colorInput.value = globalBg;
            panel.setBackgroundColor(null, true);
        });

        popover.querySelector('.vde-bg-close')?.addEventListener('click', closePopover);
        popover.querySelector('.vde-bg-done')?.addEventListener('click', closePopover);
    }

    exportVDEState() {
        return {
            vde_version: "0.2.0-Standalone",
            timestamp: new Date().toISOString(),
            theme: this.currentTheme,
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
                        backgroundColor: p.backgroundColor || null,
                        contentType: p.content ? p.content.constructor.name : null,
                        config: p.content ? p.content.serializeState() : {}
                    }))
            }))
        };
    }

    exportVDE() {
        return JSON.stringify(this.exportVDEState(), null, 2);
    }

    importVDE(jsonPayload) {
        try {
            const payload = (typeof jsonPayload === 'string') ? JSON.parse(jsonPayload) : jsonPayload;
            if (!payload || !Array.isArray(payload.buckets)) return false;

            this.clearAll();

            if (payload.theme && window.VisualStyleMemento) {
                this.currentTheme = payload.theme;
                new window.VisualStyleMemento(payload.theme).applyToGlobalUI(document);
            }

            let maxBucketId = 0;
            let maxPanelId = 0;

            payload.buckets.forEach(bData => {
                const bucket = this.createBucket(bData.name, bData.options);
                if (bData.id > maxBucketId) maxBucketId = bData.id;

                if (bucket && Array.isArray(bData.panels)) {
                    bData.panels.forEach(pData => {
                        if (pData.id > maxPanelId) maxPanelId = pData.id;
                        const cConfig = pData.config || {};
                        let contentInst = null;

                        if (pData.contentType === "RichTextContent") contentInst = new RichTextContent(cConfig);
                        else if (pData.contentType === "CodeSnippetContent") contentInst = new CodeSnippetContent(cConfig);
                        else if (pData.contentType === "HTMLPreviewContent") contentInst = new HTMLPreviewContent(cConfig);
                        else if (pData.contentType === "D3ChartContent") contentInst = new D3ChartContent(cConfig);
                        else if (pData.contentType === "DataVizDashboardContent") contentInst = new DataVizDashboardContent({ state: cConfig.state || cConfig });
                        else if (pData.contentType === "OllamaInterfaceContent") contentInst = new OllamaInterfaceContent({ state: cConfig.state || cConfig });
                        else if (pData.contentType === "ObsidianCLIContent") contentInst = new ObsidianCLIContent({ state: cConfig.state || cConfig });

                        const panel = new BaseGridPanel(
                            pData.id,
                            pData.x,
                            pData.y,
                            pData.w,
                            pData.h,
                            pData.title,
                            contentInst,
                            { backgroundColor: pData.backgroundColor || null }
                        );
                        this.registerAndPlacePanel(panel, bucket.id);
                    });
                }
            });

            if (maxBucketId >= this.nextBucketId) this.nextBucketId = maxBucketId + 1;
            if (maxPanelId >= this.nextPanelId) this.nextPanelId = maxPanelId + 1;

            this.triggerStateChange();
            return true;
        } catch (err) {
            console.error("[VDE Import Exception]", err);
            return false;
        }
    }

    exportStaticDashboardHTML(jsonState = null) {
        let payload;
        try {
            payload = jsonState ? (typeof jsonState === 'string' ? JSON.parse(jsonState) : jsonState) : this.exportVDEState();
        } catch (e) {
            payload = this.exportVDEState();
        }
        if (!payload || !Array.isArray(payload.buckets)) return;
        const jsonPayloadStr = JSON.stringify(payload, null, 2);
        const htmlContent = [
            '<!DOCTYPE html>',
            '<html lang="en" data-bs-theme="dark">',
            '<head>',
            '  <meta charset="UTF-8">',
            '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
            '  <title>VDE Static Dashboard Export</title>',
            '  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">',
            '  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">',
            '  <style>',
            '    body { margin: 0; background: #121316; color: #e2e4e9; font-family: system-ui, -apple-system, sans-serif; }',
            '    .vde-static-container { padding: 24px; max-width: 1600px; margin: 0 auto; }',
            '    .vde-bucket-card { border: 1px solid #2a2d35; background: #16181d; border-radius: 8px; overflow: hidden; margin-bottom: 24px; }',
            '    .vde-bucket-header { background: #121316; border-bottom: 1px solid #2a2d35; padding: 10px 16px; color: #ff7b00; font-weight: 600; }',
            '    .static-grid-container { display: grid; grid-template-columns: repeat(12, 1fr); gap: 14px; padding: 14px; }',
            '    .static-panel-card { background: #1c1e24; border: 1px solid #2a2d35; border-radius: 6px; display: flex; flex-direction: column; overflow: hidden; min-height: 240px; }',
            '    .static-panel-header { background: #121316; border-bottom: 1px solid #2a2d35; padding: 6px 12px; font-size: 12px; font-weight: 600; color: #ff7b00; }',
            '    .static-panel-body { flex: 1 1 auto; padding: 8px; position: relative; overflow: auto; }',
            '    @media (max-width: 768px) { .static-panel-card { grid-column: span 12 !important; } }',
            '    @media print { .no-print { display: none !important; } }',
            '  </style>',
            '</head>',
            '<body>',
            '  <div class="no-print p-3 bg-dark border-bottom border-secondary d-flex justify-content-between align-items-center">',
            '    <span class="text-warning fw-semibold">VDE Static Dashboard Export</span>',
            '    <button class="btn btn-sm btn-outline-warning" onclick="window.print()">Print / Save PDF</button>',
            '  </div>',
            '  <div class="vde-static-container" id="static-dashboard-root"></div>',
            '  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"><\/script>',
            '  <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"><\/script>',
            '  <script src="https://cdn.jsdelivr.net/npm/d3-cloud@1.2.7/build/d3.layout.cloud.min.js"><\/script>',
            '  <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js"><\/script>',
            '  <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.9/purify.min.js"><\/script>',
            '  <script src="./vde-adapters.js"><\/script>',
            '  <script src="./vde-ollama-adapter.js"><\/script>',
            '  <script src="./vde-obsidian-adapter.js"><\/script>',
            '  <script src="./vde-digester.js"><\/script>',
            '  <script src="./vde-sample-datasets.js"><\/script>',
            '  <script src="./vde-charts.js"><\/script>',
            '  <script src="./vde-style-memento.js"><\/script>',
            '  <script src="./vde-content.js"><\/script>',
            '  <script src="./vde-core.js"><\/script>',
            '  <script>',
            '    const VDE_STATE = ' + jsonPayloadStr + ';',
            '    document.addEventListener("DOMContentLoaded", () => {',
            '      const root = document.getElementById("static-dashboard-root");',
            '      if (!root || !VDE_STATE || !Array.isArray(VDE_STATE.buckets)) return;',
            '      if (VDE_STATE.theme && window.VisualStyleMemento) new window.VisualStyleMemento(VDE_STATE.theme).applyToGlobalUI(document);',
            '      VDE_STATE.buckets.forEach(bData => {',
            '        const card = document.createElement("div"); card.className = "vde-bucket-card";',
            '        const hdr = document.createElement("div"); hdr.className = "vde-bucket-header"; hdr.textContent = bData.name || "Bucket";',
            '        const grid = document.createElement("div"); grid.className = "static-grid-container";',
            '        (bData.panels || []).forEach(pData => {',
            '          const pCard = document.createElement("div"); pCard.className = "static-panel-card";',
            '          if (pData.backgroundColor) pCard.style.backgroundColor = pData.backgroundColor;',
            '          pCard.style.gridColumn = "span " + Math.min(12, Math.max(1, pData.w || 4));',
            '          if (pData.h) pCard.style.minHeight = Math.max(200, pData.h * 30) + "px";',
            '          const pHdr = document.createElement("div"); pHdr.className = "static-panel-header"; pHdr.textContent = pData.title || ("Panel " + pData.id);',
            '          const pBody = document.createElement("div"); pBody.className = "static-panel-body";',
            '          pCard.appendChild(pHdr); pCard.appendChild(pBody);',
            '          const cfg = pData.config || {}; let inst = null;',
            '          if (pData.contentType === "RichTextContent" && window.RichTextContent) inst = new window.RichTextContent(cfg);',
            '          else if (pData.contentType === "CodeSnippetContent" && window.CodeSnippetContent) inst = new window.CodeSnippetContent(cfg);',
            '          else if (pData.contentType === "HTMLPreviewContent" && window.HTMLPreviewContent) inst = new window.HTMLPreviewContent(cfg);',
            '          else if (pData.contentType === "D3ChartContent" && window.D3ChartContent) inst = new window.D3ChartContent(cfg);',
            '          else if (pData.contentType === "DataVizDashboardContent" && window.DataVizDashboardContent) inst = new window.DataVizDashboardContent({ state: cfg.state || cfg });',
            '          else if (pData.contentType === "OllamaInterfaceContent" && window.OllamaInterfaceContent) inst = new window.OllamaInterfaceContent({ state: cfg.state || cfg });',
            '          else if (pData.contentType === "ObsidianCLIContent" && window.ObsidianCLIContent) inst = new window.ObsidianCLIContent({ state: cfg.state || cfg });',
            '          if (inst) inst.render(pBody);',
            '          grid.appendChild(pCard);',
            '        });',
            '        card.appendChild(hdr); card.appendChild(grid); root.appendChild(card);',
            '      });',
            '    });',
            '  <\/script>',
            '</body>',
            '</html>'
        ].join("\n");
        const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "vde-static-dashboard.html";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
window.WorkspaceSubject = WorkspaceSubject;
window.BaseGridPanel = BaseGridPanel;
window.GridBucket = GridBucket;
window.PanelBuilder = PanelBuilder;
window.PanelFactory = PanelFactory;
window.IntegratedGridManagerClass = IntegratedGridManagerClass;
window.IntegratedGridManager = IntegratedGridManager;
