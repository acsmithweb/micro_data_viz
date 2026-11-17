/**
 * vde-content.js
 * Content Bridge Layer separating GridStack panel representation from content implementations.
 * Pure browser-native implementation with zero build step required.
 */

// =========================================================
// 1. ABSTRACT BASE: THE BRIDGE IMPLEMENTATION INTERFACE
// =========================================================
class IPanelContent {
    constructor(config = {}) {
        this.config = config;
        this.panel = null;
    }

    render(containerElement) {
        throw new Error("Render protocol must be implemented by subclasses.");
    }

    update(data) { }

    resize(width, height) { }

    destroy() { }

    clone() {
        throw new Error("Clone ritual must be implemented by content implementations.");
    }

    serializeState() {
        return JSON.parse(JSON.stringify(this.config || {}));
    }

    getThemeColors() {
        const panelBg = this.panel && this.panel.backgroundColor ? this.panel.backgroundColor : null;
        if (window.IntegratedGridManager && window.IntegratedGridManager.currentTheme) {
            const t = window.IntegratedGridManager.currentTheme;
            return {
                color: t.accentColor,
                chartPalette: t.chartPalette,
                textColor: t.textColor,
                backgroundColor: panelBg || t.background,
                borderColor: t.borderColor
            };
        }
        return panelBg ? { backgroundColor: panelBg } : {};
    }
}

// =========================================================
// 2. CONCRETE IMPLEMENTATION: RICH TEXT CONTENT (MD/HTML)
// =========================================================
class RichTextContent extends IPanelContent {
    constructor(config = {}) {
        super(config);
        this.isEditing = false;
        this.containerElement = null;
    }

    render(containerElement) {
        this.containerElement = containerElement;
        containerElement.innerHTML = "";

        const wrapper = document.createElement("div");
        wrapper.className = "rich-text-wrapper w-100 h-100 d-flex flex-column position-relative";

        const menu = document.createElement("div");
        menu.className = "position-absolute d-flex gap-1";
        menu.style.top = "8px";
        menu.style.right = "10px";
        menu.style.zIndex = "5";

        const raw = this.config.sourceText || "";

        if (!this.isEditing && raw.trim().length > 0) {
            const digestBtn = document.createElement("button");
            digestBtn.type = "button";
            digestBtn.className = "btn btn-sm btn-outline-info";
            digestBtn.style.fontSize = "10px";
            digestBtn.style.padding = "2px 8px";
            digestBtn.textContent = "Split Sections";
            digestBtn.title = "Digest Markdown headings into separate panels";
            digestBtn.onclick = () => this.triggerDigestion();
            menu.appendChild(digestBtn);
        }

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "btn btn-sm btn-outline-warning";
        editBtn.style.fontSize = "10px";
        editBtn.style.padding = "2px 8px";
        editBtn.textContent = this.isEditing ? "Save" : "Edit";
        menu.appendChild(editBtn);

        const bodyArea = document.createElement("div");
        bodyArea.className = "flex-grow-1 overflow-y-auto p-3 h-100";

        if (this.isEditing) {
            const textarea = document.createElement("textarea");
            textarea.className = "form-control font-mono h-100";
            textarea.style.backgroundColor = "#0e1014";
            textarea.style.color = "#a6e3a1";
            textarea.style.fontSize = "12px";
            textarea.style.border = "1px solid var(--global-border, #2a2d35)";
            textarea.style.resize = "none";
            textarea.value = raw;
            bodyArea.appendChild(textarea);

            editBtn.onclick = () => {
                this.config.sourceText = textarea.value;
                this.isEditing = false;
                this.render(containerElement);
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            };
        } else {
            const preview = document.createElement("div");
            preview.className = "vde-markdown-preview";
            preview.style.fontSize = "13px";
            preview.style.lineHeight = "1.6";
            const type = this.config.contentType || "markdown";
            preview.innerHTML = window.Formatter ? window.Formatter.render(raw, type) : raw;
            preview.ondblclick = () => {
                this.isEditing = true;
                this.render(containerElement);
            };
            bodyArea.appendChild(preview);

            editBtn.onclick = () => {
                this.isEditing = true;
                this.render(containerElement);
            };
        }

        wrapper.appendChild(menu);
        wrapper.appendChild(bodyArea);
        containerElement.appendChild(wrapper);
    }

    triggerDigestion() {
        const rawText = this.config.sourceText || "";
        const digester = window.ContentDigester || window.Digester;
        if (!digester) return;

        const fragments = digester.digest(rawText, this.config.contentType || "markdown");
        if (fragments.length <= 1) return;

        const manager = window.IntegratedGridManager;
        if (manager && this.panel) {
            const bucketId = this.panel.bucketId;
            this.panel.destroy();
            fragments.forEach(frag => manager.addMarkdownWidget(frag, bucketId));
        }
    }

    update(data) {
        if (data && data.sourceText !== undefined) {
            this.config.sourceText = data.sourceText;
            if (this.containerElement) this.render(this.containerElement);
            if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
        }
    }

    clone() {
        return new RichTextContent({
            contentType: this.config.contentType,
            sourceText: this.config.sourceText
        });
    }
}

// =========================================================
// 3. CONCRETE IMPLEMENTATION: RAW CODE SNIPPET
// =========================================================
class CodeSnippetContent extends IPanelContent {
    constructor(config = {}) {
        super(config);
        this.isEditing = false;
        this.containerElement = null;
    }

    render(containerElement) {
        this.containerElement = containerElement;
        containerElement.innerHTML = "";

        const wrapper = document.createElement("div");
        wrapper.className = "code-snippet-wrapper h-100 d-flex flex-column position-relative";

        const menu = document.createElement("div");
        menu.className = "position-absolute d-flex gap-1";
        menu.style.top = "8px";
        menu.style.right = "10px";
        menu.style.zIndex = "5";

        const raw = this.config.sourceText || "";

        if (!this.isEditing && raw) {
            const digestBtn = document.createElement("button");
            digestBtn.type = "button";
            digestBtn.className = "btn btn-sm btn-outline-info";
            digestBtn.style.fontSize = "10px";
            digestBtn.style.padding = "2px 8px";
            digestBtn.textContent = "Split Functions";
            digestBtn.title = "Digest code into individual function/class panels";
            digestBtn.onclick = () => this.triggerDigestion();
            menu.appendChild(digestBtn);
        }

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "btn btn-sm btn-outline-warning";
        editBtn.style.fontSize = "10px";
        editBtn.style.padding = "2px 8px";
        editBtn.textContent = this.isEditing ? "Save Code" : "Edit Code";
        menu.appendChild(editBtn);

        const bodyArea = document.createElement("div");
        bodyArea.className = "flex-grow-1 overflow-y-auto p-2 h-100";

        if (this.isEditing) {
            const textarea = document.createElement("textarea");
            textarea.className = "form-control font-mono h-100";
            textarea.style.backgroundColor = "#0e1014";
            textarea.style.color = "#a6e3a1";
            textarea.style.fontSize = "12px";
            textarea.style.border = "1px solid var(--global-border, #2a2d35)";
            textarea.style.resize = "none";
            textarea.value = raw;
            bodyArea.appendChild(textarea);

            editBtn.onclick = () => {
                this.config.sourceText = textarea.value;
                this.isEditing = false;
                this.render(containerElement);
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            };
        } else {
            const pre = document.createElement("pre");
            pre.className = "h-100 m-0 p-3";
            pre.style.backgroundColor = "#0e1014";
            pre.style.border = "1px solid var(--global-border, #2a2d35)";
            pre.style.borderRadius = "6px";
            pre.style.overflow = "auto";

            const code = document.createElement("code");
            code.className = "font-mono";
            code.style.color = "#94e2d5";
            code.style.fontSize = "11.5px";
            code.innerHTML = window.HTMLRendererAdapter ? window.HTMLRendererAdapter.escapeHtml(raw) : raw;

            pre.appendChild(code);
            pre.ondblclick = () => {
                this.isEditing = true;
                this.render(containerElement);
            };
            bodyArea.appendChild(pre);

            editBtn.onclick = () => {
                this.isEditing = true;
                this.render(containerElement);
            };
        }

        wrapper.appendChild(menu);
        wrapper.appendChild(bodyArea);
        containerElement.appendChild(wrapper);
    }

    triggerDigestion() {
        const rawText = this.config.sourceText || "";
        const digester = window.ContentDigester || window.Digester;
        if (!digester) return;

        const fragments = digester.digest(rawText, "code");
        if (fragments.length <= 1) return;

        const manager = window.IntegratedGridManager;
        if (manager && this.panel) {
            const bucketId = this.panel.bucketId;
            this.panel.destroy();
            fragments.forEach(frag => manager.addCodeWidget(frag, bucketId));
        }
    }

    update(data) {
        if (data && data.sourceText !== undefined) {
            this.config.sourceText = data.sourceText;
            if (this.containerElement) this.render(this.containerElement);
            if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
        }
    }

    clone() {
        return new CodeSnippetContent({
            sourceText: this.config.sourceText
        });
    }
}

// =========================================================
// 3B. CONCRETE IMPLEMENTATION: HTML RENDERER / PREVIEW CONTENT
// =========================================================
class HTMLPreviewContent extends IPanelContent {
    constructor(config = {}) {
        super(config);
        this.containerElement = null;
        this.textareaEl = null;
        this.iframeEl = null;
        this.renderTimer = null;
        this.stateTimer = null;

        this.config = Object.assign({
            contentType: "html-preview",
            sourceText: "",
            viewMode: "split",
            autoRender: true
        }, this.config);
    }

    buildDocument(rawHtml) {
        const raw = typeof rawHtml === "string" ? rawHtml : "";
        const trimmed = raw.trim();
        if (!trimmed) {
            return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>html,body{margin:0;height:100%;display:flex;align-items:center;justify-content:center;background:#121316;color:#7c8291;font-family:system-ui,sans-serif;font-size:12px;text-align:center;padding:16px;}</style></head><body>Paste HTML in the editor to render output here.</body></html>';
        }
        if (/^\s*(?:<!doctype|<html\b)/i.test(trimmed)) {
            return raw;
        }
        return [
            '<!DOCTYPE html>',
            '<html lang="en">',
            '<head>',
            '<meta charset="UTF-8">',
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
            '<style>',
            '  *, *::before, *::after { box-sizing: border-box; }',
            '  html, body { margin: 0; padding: 12px; background: #121316; color: #e2e4e9; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; line-height: 1.5; }',
            '  a { color: #ff9c40; }',
            '</style>',
            '</head>',
            '<body>',
            raw,
            '</body>',
            '</html>'
        ].join('\n');
    }

    applyPreview() {
        if (!this.iframeEl) return;
        this.iframeEl.srcdoc = this.buildDocument(this.config.sourceText);
    }

    scheduleStateSync() {
        clearTimeout(this.stateTimer);
        this.stateTimer = setTimeout(() => {
            if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
        }, 300);
    }

    render(containerElement) {
        this.containerElement = containerElement;
        containerElement.innerHTML = "";
        this.textareaEl = null;
        this.iframeEl = null;

        const viewMode = ["split", "code", "render"].includes(this.config.viewMode) ? this.config.viewMode : "split";
        const autoRender = this.config.autoRender !== false;

        const wrapper = document.createElement("div");
        wrapper.className = "d-flex flex-column h-100";
        wrapper.style.minHeight = "0";

        const toolbar = document.createElement("div");
        toolbar.className = "d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2 pb-1 border-bottom border-secondary";

        const modeGroup = document.createElement("div");
        modeGroup.className = "btn-group btn-group-sm";
        modeGroup.setAttribute("role", "group");

        [
            { id: "split", label: "Split" },
            { id: "code", label: "HTML" },
            { id: "render", label: "Render" }
        ].forEach(mode => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `btn py-0 px-2 ${viewMode === mode.id ? "btn-warning text-dark fw-semibold" : "btn-outline-secondary"}`;
            btn.style.fontSize = "11px";
            btn.textContent = mode.label;
            btn.onclick = () => {
                if (this.textareaEl) this.config.sourceText = this.textareaEl.value;
                this.config.viewMode = mode.id;
                this.render(containerElement);
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            };
            modeGroup.appendChild(btn);
        });

        const rightControls = document.createElement("div");
        rightControls.className = "d-flex align-items-center gap-1";

        const autoBtn = document.createElement("button");
        autoBtn.type = "button";
        autoBtn.className = `btn btn-sm py-0 px-2 ${autoRender ? "btn-outline-info" : "btn-outline-secondary"}`;
        autoBtn.style.fontSize = "11px";
        autoBtn.title = "Toggle live preview while typing or pasting";
        autoBtn.textContent = autoRender ? "Live: On" : "Live: Off";
        autoBtn.onclick = () => {
            this.config.autoRender = !autoRender;
            if (this.textareaEl) this.config.sourceText = this.textareaEl.value;
            this.render(containerElement);
            if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
        };

        const renderBtn = document.createElement("button");
        renderBtn.type = "button";
        renderBtn.className = "btn btn-sm btn-outline-warning py-0 px-2";
        renderBtn.style.fontSize = "11px";
        renderBtn.innerHTML = '<i class="bi bi-play-fill me-1"></i>Render';
        renderBtn.onclick = () => {
            if (this.textareaEl) this.config.sourceText = this.textareaEl.value;
            if (viewMode === "code") {
                this.config.viewMode = "split";
                this.render(containerElement);
            } else {
                this.applyPreview();
            }
            if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
        };

        const clearBtn = document.createElement("button");
        clearBtn.type = "button";
        clearBtn.className = "btn btn-sm btn-outline-secondary py-0 px-2";
        clearBtn.style.fontSize = "11px";
        clearBtn.textContent = "Clear";
        clearBtn.onclick = () => {
            this.config.sourceText = "";
            if (this.textareaEl) this.textareaEl.value = "";
            this.applyPreview();
            if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
        };

        rightControls.appendChild(autoBtn);
        rightControls.appendChild(renderBtn);
        rightControls.appendChild(clearBtn);

        toolbar.appendChild(modeGroup);
        toolbar.appendChild(rightControls);

        const bodyArea = document.createElement("div");
        bodyArea.className = "d-flex flex-grow-1 gap-2 overflow-hidden";
        bodyArea.style.minHeight = "0";

        if (viewMode === "split" || viewMode === "code") {
            const editorPane = document.createElement("div");
            editorPane.style.cssText = `flex: ${viewMode === "split" ? "1 1 50%" : "1 1 100%"}; min-width: 0; min-height: 0; display: flex; flex-direction: column;`;

            const textarea = document.createElement("textarea");
            textarea.className = "form-control font-mono h-100";
            textarea.style.backgroundColor = "#0e1014";
            textarea.style.color = "#f9e2af";
            textarea.style.fontSize = "12px";
            textarea.style.border = "1px solid var(--global-border, #2a2d35)";
            textarea.style.resize = "none";
            textarea.spellcheck = false;
            textarea.placeholder = "Paste HTML, <style> rules, SVG, or a full HTML document here...";
            textarea.value = this.config.sourceText || "";

            textarea.addEventListener("input", () => {
                this.config.sourceText = textarea.value;
                if (this.config.autoRender !== false && this.iframeEl) {
                    clearTimeout(this.renderTimer);
                    this.renderTimer = setTimeout(() => this.applyPreview(), 180);
                }
                this.scheduleStateSync();
            });

            textarea.addEventListener("keydown", (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    this.config.sourceText = textarea.value;
                    this.applyPreview();
                    if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
                }
            });

            this.textareaEl = textarea;
            editorPane.appendChild(textarea);
            bodyArea.appendChild(editorPane);
        }

        if (viewMode === "split" || viewMode === "render") {
            const previewPane = document.createElement("div");
            previewPane.style.cssText = `flex: ${viewMode === "split" ? "1 1 50%" : "1 1 100%"}; min-width: 0; min-height: 0; border: 1px solid var(--global-border, #2a2d35); border-radius: 6px; overflow: hidden; background: #121316;`;

            const iframe = document.createElement("iframe");
            iframe.className = "w-100 h-100 border-0";
            iframe.setAttribute("sandbox", "allow-scripts allow-forms");
            iframe.setAttribute("referrerpolicy", "no-referrer");
            iframe.title = "Pasted HTML Rendered Output";
            this.iframeEl = iframe;
            this.applyPreview();

            previewPane.appendChild(iframe);
            bodyArea.appendChild(previewPane);
        }

        wrapper.appendChild(toolbar);
        wrapper.appendChild(bodyArea);
        containerElement.appendChild(wrapper);
    }

    serializeState() {
        return {
            contentType: "html-preview",
            sourceText: this.config.sourceText || "",
            viewMode: this.config.viewMode || "split",
            autoRender: this.config.autoRender !== false
        };
    }

    update(data) {
        if (!data) return;
        if (data.sourceText !== undefined) this.config.sourceText = data.sourceText;
        if (data.viewMode !== undefined) this.config.viewMode = data.viewMode;
        if (data.autoRender !== undefined) this.config.autoRender = data.autoRender;
        if (this.containerElement) this.render(this.containerElement);
        if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
    }

    destroy() {
        clearTimeout(this.renderTimer);
        clearTimeout(this.stateTimer);
    }

    clone() {
        return new HTMLPreviewContent({
            contentType: "html-preview",
            sourceText: this.config.sourceText,
            viewMode: this.config.viewMode,
            autoRender: this.config.autoRender
        });
    }
}

// =========================================================
// 4. CONCRETE IMPLEMENTATION: D3 CHART CONTENT
// =========================================================
class D3ChartContent extends IPanelContent {
    constructor(config = {}) {
        super(config);
        this.chart = null;
        this.containerElement = null;
        this.canvasEl = null;

        if (!this.config.chartType) {
            this.config.chartType = "Bar Chart";
        }
        if (!this.config.data && window.VDE_SAMPLE_DATASETS && window.VDE_SAMPLE_DATASETS.length > 0) {
            const sample = window.VDE_SAMPLE_DATASETS[0];
            this.config.datasetId = sample.id;
            this.config.data = {
                data: sample.data,
                xAxis: sample.defaultX,
                yAxis: sample.defaultY,
                groupKey: sample.defaultGroup
            };
        }
    }

    render(containerElement) {
        this.containerElement = containerElement;
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        containerElement.innerHTML = "";

        const wrapper = document.createElement("div");
        wrapper.className = "d-flex flex-column h-100 w-100 p-2 gap-2";

        const toolbar = document.createElement("div");
        toolbar.className = "d-flex align-items-center justify-content-between gap-2 flex-wrap";

        const leftControls = document.createElement("div");
        leftControls.className = "d-flex align-items-center gap-2 flex-grow-1";

        const chartSelect = document.createElement("select");
        chartSelect.className = "form-select form-select-sm bg-dark text-white border-secondary font-mono";
        chartSelect.style.fontSize = "11px";
        chartSelect.style.maxWidth = "195px";

        const catalog = window.CHART_CATALOG || [];
        const categories = Array.from(new Set(catalog.map(c => c.category)));
        categories.forEach(cat => {
            const optGroup = document.createElement("optgroup");
            optGroup.label = cat;
            catalog.filter(c => c.category === cat).forEach(entry => {
                const opt = document.createElement("option");
                opt.value = entry.type;
                opt.textContent = entry.type;
                if (entry.type === this.config.chartType) opt.selected = true;
                optGroup.appendChild(opt);
            });
            chartSelect.appendChild(optGroup);
        });

        chartSelect.onchange = (e) => {
            this.config.chartType = e.target.value;
            this.mountChart();
            if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
        };

        const datasetSelect = document.createElement("select");
        datasetSelect.className = "form-select form-select-sm bg-dark text-white border-secondary font-mono";
        datasetSelect.style.fontSize = "11px";
        datasetSelect.style.maxWidth = "195px";

        (window.VDE_SAMPLE_DATASETS || []).forEach(ds => {
            const opt = document.createElement("option");
            opt.value = ds.id;
            opt.textContent = ds.name;
            if (ds.id === this.config.datasetId) opt.selected = true;
            datasetSelect.appendChild(opt);
        });

        datasetSelect.onchange = (e) => {
            const ds = (window.VDE_SAMPLE_DATASETS || []).find(d => d.id === e.target.value);
            if (ds) {
                this.config.datasetId = ds.id;
                this.config.data = {
                    data: ds.data,
                    xAxis: ds.defaultX,
                    yAxis: ds.defaultY,
                    groupKey: ds.defaultGroup
                };
                this.mountChart();
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            }
        };

        leftControls.appendChild(chartSelect);
        leftControls.appendChild(datasetSelect);

        const resetZoomBtn = document.createElement("button");
        resetZoomBtn.type = "button";
        resetZoomBtn.className = "btn btn-sm btn-outline-secondary font-mono";
        resetZoomBtn.style.fontSize = "10px";
        resetZoomBtn.style.padding = "2px 8px";
        resetZoomBtn.innerHTML = '<i class="bi bi-arrows-angle-contract me-1"></i>Reset Zoom';
        resetZoomBtn.onclick = () => { if (this.chart) this.chart.resetZoom(); };

        toolbar.appendChild(leftControls);
        toolbar.appendChild(resetZoomBtn);

        const canvasEl = document.createElement("div");
        canvasEl.className = "flex-grow-1 position-relative overflow-hidden rounded border border-secondary";
        canvasEl.style.backgroundColor = "var(--panel-surface-bg, var(--global-bg, #121316))";
        canvasEl.style.minHeight = "140px";
        this.canvasEl = canvasEl;

        wrapper.appendChild(toolbar);
        wrapper.appendChild(canvasEl);
        containerElement.appendChild(wrapper);

        requestAnimationFrame(() => this.mountChart());
    }

    prepareChartRows(rawRows, chartType, xAxis, yAxis) {
        const singleSeriesAggregateTypes = new Set([
            'Bar Chart', 'Horizontal Bar Chart', 'Line Chart', 'Area Chart',
            'Pie Chart', 'Donut Chart', 'Treemap', 'Funnel Chart',
            'Radial Bar Chart', 'Word Cloud Chart'
        ]);
        if (!Array.isArray(rawRows) || rawRows.length === 0) return [];
        if (singleSeriesAggregateTypes.has(chartType) && window.getAggregateFunction) {
            const uniqueX = new Set(rawRows.map(r => String(r[xAxis] ?? '')));
            if (uniqueX.size < rawRows.length) {
                return window.getAggregateFunction('Sum', rawRows, xAxis, yAxis, 'Raw');
            }
        }
        return rawRows;
    }

    mountChart() {
        if (!this.canvasEl) return;
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        const chartType = this.config.chartType || "Bar Chart";
        const ChartClass = (window.resolveChartClass && window.resolveChartClass(chartType))
            || (window.CHART_REGISTRY ? window.CHART_REGISTRY[chartType] : null);
        if (!ChartClass) {
            this.canvasEl.innerHTML = `<div class="text-danger p-3 small">Chart type "${chartType}" not registered.</div>`;
            return;
        }

        const width = this.canvasEl.clientWidth || 360;
        const height = this.canvasEl.clientHeight || 220;
        const themeColors = this.getThemeColors();
        const chartConfig = Object.assign({}, this.config.chartConfig || {}, { width, height }, themeColors);

        this.chart = new ChartClass(this.canvasEl, chartConfig);

        if (this.config.data) {
            const rawRows = this.config.data.data || this.config.data;
            const xAxis = this.config.data.xAxis || "label";
            const yAxis = this.config.data.yAxis || "value";
            const prepared = this.prepareChartRows(rawRows, chartType, xAxis, yAxis);
            this.chart.update({
                data: prepared,
                xAxis,
                yAxis,
                groupKey: this.config.data.groupKey,
                width,
                height
            });
        }
    }

    update(data) {
        if (data) this.config.data = data;
        if (this.chart && this.canvasEl && this.config.data) {
            const rawRows = this.config.data.data || this.config.data;
            const xAxis = this.config.data.xAxis || "label";
            const yAxis = this.config.data.yAxis || "value";
            const prepared = this.prepareChartRows(rawRows, this.config.chartType || "Bar Chart", xAxis, yAxis);
            this.chart.update({
                data: prepared,
                xAxis,
                yAxis,
                groupKey: this.config.data.groupKey,
                width: this.canvasEl.clientWidth || 360,
                height: this.canvasEl.clientHeight || 220
            });
        }
        if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
    }

    resize() {
        if (this.chart && this.canvasEl) {
            const w = this.canvasEl.clientWidth || 360;
            const h = this.canvasEl.clientHeight || 220;
            if (this.config.data) {
                const rawRows = this.config.data.data || this.config.data;
                const xAxis = this.config.data.xAxis || "label";
                const yAxis = this.config.data.yAxis || "value";
                const prepared = this.prepareChartRows(rawRows, this.config.chartType || "Bar Chart", xAxis, yAxis);
                this.chart.update({
                    data: prepared,
                    xAxis,
                    yAxis,
                    groupKey: this.config.data.groupKey,
                    width: w,
                    height: h
                });
            } else {
                this.chart.updateDimensions(w, h);
            }
        }
    }

    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    clone() {
        return new D3ChartContent({
            chartType: this.config.chartType,
            datasetId: this.config.datasetId,
            chartConfig: JSON.parse(JSON.stringify(this.config.chartConfig || {})),
            data: JSON.parse(JSON.stringify(this.config.data || {}))
        });
    }
}

// =========================================================
// 5. CONCRETE IMPLEMENTATION: DATA VIZ DASHBOARD CONTENT
// =========================================================
class DataVizDashboardContent extends IPanelContent {
    constructor(config = {}) {
        super(config);
        this.containerElement = null;
        this.chart = null;

        const defaultSample = (window.VDE_SAMPLE_DATASETS && window.VDE_SAMPLE_DATASETS[0]) || {
            id: '', data: [], columns: [], defaultX: '', defaultY: '', defaultGroup: '', defaultChart: 'Bar Chart'
        };
        const hasCustomData = config.state && Array.isArray(config.state.data) && config.state.data.length > 0;

        this.state = Object.assign({
            data: hasCustomData ? [] : [...defaultSample.data],
            columns: hasCustomData ? [] : [...defaultSample.columns],
            selectedColumns: hasCustomData ? [] : [...defaultSample.columns],
            xAxis: defaultSample.defaultX,
            yAxis: defaultSample.defaultY,
            groupKey: defaultSample.defaultGroup,
            transform: 'Sum',
            dateGranularity: 'Quarter',
            chartType: defaultSample.defaultChart,
            filters: [],
            sampleId: defaultSample.id
        }, config.state || {});
    }

    serializeState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    buildChartOptionsHTML() {
        const catalog = window.CHART_CATALOG || [];
        const categories = Array.from(new Set(catalog.map(c => c.category)));
        return categories.map(cat => {
            const opts = catalog.filter(c => c.category === cat)
                .map(entry => `<option value="${entry.type}">${entry.type}</option>`)
                .join('');
            return `<optgroup label="${cat}">${opts}</optgroup>`;
        }).join('');
    }

    buildSampleOptionsHTML() {
        const samples = window.VDE_SAMPLE_DATASETS || [];
        return `<option value="">-- Load Sample --</option>` + samples.map(ds =>
            `<option value="${ds.id}" ${ds.id === this.state.sampleId ? 'selected' : ''}>${ds.name}</option>`
        ).join('');
    }

    getHTMLTemplate() {
        return `
<div class="vde-viz-dashboard h-100 d-flex flex-column p-2 gap-2" style="background-color: var(--panel-bg, var(--global-panel, #1c1e24)); color: var(--global-text, #e2e4e9); font-size: 11px;">
  <div class="row g-2 align-items-end border-bottom border-secondary pb-2">
    <div class="col-6 col-md-2">
      <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Upload CSV</label>
      <input type="file" class="form-control form-control-sm file-input bg-dark border-secondary text-white" accept=".csv" style="font-size: 11px;" />
    </div>
    <div class="col-6 col-md-2">
      <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Sample Dataset</label>
      <select class="form-select form-select-sm sample-menu bg-dark text-white border-secondary" style="font-size: 11px;">
        ${this.buildSampleOptionsHTML()}
      </select>
    </div>
    <div class="col-12 col-md-8 d-none config-controls">
      <div class="row g-2">
        <div class="col-4 col-md-2">
          <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">X-Axis</label>
          <select class="form-select form-select-sm x-axis-menu bg-dark text-white border-secondary" style="font-size: 11px;"></select>
        </div>
        <div class="col-4 col-md-2">
          <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Y-Axis</label>
          <select class="form-select form-select-sm y-axis-menu bg-dark text-white border-secondary" style="font-size: 11px;"></select>
        </div>
        <div class="col-4 col-md-2">
          <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Series / Group</label>
          <select class="form-select form-select-sm group-axis-menu bg-dark text-white border-secondary" style="font-size: 11px;"></select>
        </div>
        <div class="col-4 col-md-2">
          <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Aggregate</label>
          <select class="form-select form-select-sm transform-menu bg-dark text-white border-secondary" style="font-size: 11px;">
            <option value="Raw">Raw Rows</option>
            <option value="Count">Count</option>
            <option value="Sum">Sum of Y</option>
            <option value="Avg">Avg of Y</option>
            <option value="Min">Min of Y</option>
            <option value="Max">Max of Y</option>
          </select>
        </div>
        <div class="col-4 col-md-2">
          <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Date Zoom</label>
          <select class="form-select form-select-sm date-granularity-menu bg-dark text-white border-secondary" style="font-size: 11px;">
            <option value="Raw">Raw</option>
            <option value="Year">Year</option>
            <option value="Quarter">Quarter</option>
            <option value="Month">Month</option>
            <option value="Day">Day</option>
            <option value="Hour">Hour</option>
          </select>
        </div>
        <div class="col-4 col-md-2">
          <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Chart Type</label>
          <select class="form-select form-select-sm chart-type-menu bg-dark text-white border-secondary" style="font-size: 11px;">
            ${this.buildChartOptionsHTML()}
          </select>
        </div>
      </div>
    </div>
  </div>

  <div class="d-none table-column-controls">
    <div class="d-flex align-items-center gap-2 bg-black bg-opacity-25 p-2 rounded border border-secondary flex-wrap">
      <span class="font-mono text-info" style="font-size: 10px;">Columns:</span>
      <div class="table-column-checkboxes d-flex gap-1 align-items-center flex-wrap"></div>
      <button type="button" class="btn btn-sm btn-outline-info select-all-cols-btn" style="padding: 1px 6px; font-size: 10px;">All</button>
      <button type="button" class="btn btn-sm btn-outline-secondary deselect-all-cols-btn" style="padding: 1px 6px; font-size: 10px;">None</button>
    </div>
  </div>

  <div class="d-none config-controls">
    <div class="d-flex align-items-center justify-content-between gap-2 bg-black bg-opacity-25 px-2 py-1 rounded border border-secondary flex-wrap">
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <span class="font-mono text-warning" style="font-size: 10px;"><i class="bi bi-funnel me-1"></i>Filter</span>
        <select class="form-select form-select-sm filter-column bg-dark text-white border-secondary" style="width: auto; font-size: 10px;"></select>
        <select class="form-select form-select-sm filter-operator bg-dark text-white border-secondary" style="width: auto; font-size: 10px;">
          <option value="eq">=</option>
          <option value="neq">≠</option>
          <option value="gt">&gt;</option>
          <option value="gte">&ge;</option>
          <option value="lt">&lt;</option>
          <option value="lte">&le;</option>
          <option value="contains">contains</option>
          <option value="starts">starts with</option>
          <option value="ends">ends with</option>
          <option value="null">is null</option>
          <option value="notnull">is not null</option>
        </select>
        <input type="text" class="form-control form-control-sm filter-value bg-dark text-white border-secondary" placeholder="Value..." style="width: 96px; font-size: 10px;" />
        <button type="button" class="btn btn-sm btn-outline-warning add-filter-btn" style="padding: 2px 8px; font-size: 10px;">Apply</button>
        <div class="active-filters-container d-flex gap-1 align-items-center flex-wrap"></div>
      </div>
      <button type="button" class="btn btn-sm btn-outline-secondary reset-zoom-btn font-mono" style="padding: 2px 8px; font-size: 10px;">
        <i class="bi bi-arrows-angle-contract me-1"></i>Reset Zoom
      </button>
    </div>
  </div>

  <div class="viz-container flex-grow-1 border border-secondary rounded p-2 overflow-hidden position-relative" style="min-height: 170px; background-color: var(--panel-surface-bg, var(--global-bg, #121316));">
    <div class="text-center text-secondary py-5 initial-message">
      <i class="bi bi-bar-chart-line fs-2 d-block text-warning mb-2"></i>
      Upload a CSV file or select a sample dataset to render D3.js charts.
    </div>
  </div>
</div>`;
    }

    render(containerElement) {
        this.containerElement = containerElement;
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        containerElement.innerHTML = this.getHTMLTemplate();
        this.attachEvents();
        if (this.state.data && this.state.data.length > 0) {
            this.restoreUIState();
            requestAnimationFrame(() => this.renderChart());
        }
    }

    attachEvents() {
        const el = this.containerElement;
        if (!el) return;

        el.querySelector(".file-input")?.addEventListener("change", (e) => this.loadCSV(e));

        el.querySelector(".sample-menu")?.addEventListener("change", (e) => {
            const ds = (window.VDE_SAMPLE_DATASETS || []).find(d => d.id === e.target.value);
            if (!ds) return;
            this.state.sampleId = ds.id;
            this.state.data = [...ds.data];
            this.state.columns = [...ds.columns];
            this.state.selectedColumns = [...ds.columns];
            this.state.xAxis = ds.defaultX;
            this.state.yAxis = ds.defaultY;
            this.state.groupKey = ds.defaultGroup;
            this.state.filters = [];
            this.state.transform = (ds.defaultChart === 'Box Plot' || ds.defaultChart === 'Radar Chart') ? 'Raw' : 'Sum';
            this.state.dateGranularity = ds.id === 'regional-revenue' ? 'Quarter' : 'Raw';
            this.state.chartType = ds.defaultChart;
            this.restoreUIState();
            this.renderChart();
            if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
        });

        const bindSelect = (selector, key, after) => {
            const select = el.querySelector(selector);
            if (!select) return;
            select.addEventListener("change", (e) => {
                this.state[key] = e.target.value;
                if (after) after();
                this.renderChart();
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            });
        };

        bindSelect(".x-axis-menu", "xAxis");
        bindSelect(".y-axis-menu", "yAxis");
        bindSelect(".group-axis-menu", "groupKey");
        bindSelect(".transform-menu", "transform");
        bindSelect(".date-granularity-menu", "dateGranularity");
        bindSelect(".chart-type-menu", "chartType", () => this.renderTableColumnControls());

        el.querySelector(".select-all-cols-btn")?.addEventListener("click", () => {
            this.state.selectedColumns = [...(this.state.columns || [])];
            this.renderTableColumnControls();
            this.renderChart();
            if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
        });

        el.querySelector(".deselect-all-cols-btn")?.addEventListener("click", () => {
            this.state.selectedColumns = [];
            this.renderTableColumnControls();
            this.renderChart();
            if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
        });

        el.querySelector(".add-filter-btn")?.addEventListener("click", () => {
            const col = el.querySelector(".filter-column")?.value;
            const op = el.querySelector(".filter-operator")?.value || 'eq';
            const valInput = el.querySelector(".filter-value");
            const val = valInput ? valInput.value : '';
            if (!col) return;
            if (!Array.isArray(this.state.filters)) this.state.filters = [];
            this.state.filters.push({ col, op, val });
            if (valInput) valInput.value = '';
            this.renderFilters();
            this.renderChart();
            if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
        });

        el.querySelector(".reset-zoom-btn")?.addEventListener("click", () => {
            if (this.chart) this.chart.resetZoom();
        });
    }

    loadCSV(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = String(e.target.result || "");
            const data = d3.csvParse(text);
            if (data && data.length > 0) {
                const cols = data.columns || Object.keys(data[0] || {});
                this.state.sampleId = '';
                this.state.data = data;
                this.state.columns = cols;
                this.state.selectedColumns = [...cols];
                this.state.xAxis = cols[0] || "";
                this.state.yAxis = cols[1] || cols[0] || "";
                this.state.groupKey = cols[2] || "";
                this.state.filters = [];
                this.state.transform = "Raw";
                this.state.dateGranularity = "Raw";
                this.restoreUIState();
                this.renderChart();
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            }
        };
        reader.readAsText(files[0]);
        event.target.value = "";
    }

    restoreUIState() {
        const el = this.containerElement;
        if (!el) return;
        el.querySelectorAll(".config-controls").forEach(c => c.classList.remove("d-none"));
        const initMsg = el.querySelector(".initial-message");
        if (initMsg) initMsg.classList.add("d-none");

        if (!Array.isArray(this.state.selectedColumns)) {
            this.state.selectedColumns = [...(this.state.columns || [])];
        }

        this.populateDropdowns();
        this.renderFilters();
        this.renderTableColumnControls();
    }

    renderTableColumnControls() {
        const el = this.containerElement;
        if (!el) return;
        const tableControls = el.querySelector(".table-column-controls");
        if (!tableControls) return;

        if (this.state.chartType === "Table Chart" && this.state.columns.length > 0) {
            tableControls.classList.remove("d-none");
            const container = el.querySelector(".table-column-checkboxes");
            if (!container) return;
            container.innerHTML = "";

            this.state.columns.forEach(col => {
                const isSelected = this.state.selectedColumns.includes(col);
                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = `btn btn-sm font-mono ${isSelected ? 'btn-info text-dark' : 'btn-outline-secondary'}`;
                btn.style.fontSize = "10px";
                btn.style.padding = "1px 7px";
                btn.textContent = col;
                btn.onclick = (e) => {
                    e.stopPropagation();
                    if (isSelected) {
                        this.state.selectedColumns = this.state.selectedColumns.filter(c => c !== col);
                    } else {
                        this.state.selectedColumns.push(col);
                    }
                    this.renderTableColumnControls();
                    this.renderChart();
                    if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
                };
                container.appendChild(btn);
            });
        } else {
            tableControls.classList.add("d-none");
        }
    }

    populateDropdowns() {
        const el = this.containerElement;
        const xMenu = el.querySelector(".x-axis-menu");
        const yMenu = el.querySelector(".y-axis-menu");
        const groupMenu = el.querySelector(".group-axis-menu");
        const filterCol = el.querySelector(".filter-column");
        if (!xMenu || !yMenu || !groupMenu || !filterCol) return;

        xMenu.innerHTML = "";
        yMenu.innerHTML = "";
        groupMenu.innerHTML = '<option value="">None</option>';
        filterCol.innerHTML = "";

        this.state.columns.forEach(col => {
            xMenu.insertAdjacentHTML("beforeend", `<option value="${col}" ${col === this.state.xAxis ? "selected" : ""}>${col}</option>`);
            yMenu.insertAdjacentHTML("beforeend", `<option value="${col}" ${col === this.state.yAxis ? "selected" : ""}>${col}</option>`);
            groupMenu.insertAdjacentHTML("beforeend", `<option value="${col}" ${col === this.state.groupKey ? "selected" : ""}>${col}</option>`);
            filterCol.insertAdjacentHTML("beforeend", `<option value="${col}">${col}</option>`);
        });

        const setVal = (sel, val) => { const n = el.querySelector(sel); if (n) n.value = val; };
        setVal(".transform-menu", this.state.transform || "Raw");
        setVal(".date-granularity-menu", this.state.dateGranularity || "Raw");
        setVal(".chart-type-menu", this.state.chartType || "Bar Chart");
        setVal(".sample-menu", this.state.sampleId || "");
    }

    renderFilters() {
        const el = this.containerElement;
        const container = el.querySelector(".active-filters-container");
        if (!container) return;
        container.innerHTML = "";

        if (!this.state.filters || this.state.filters.length === 0) {
            container.innerHTML = `<span class="text-secondary font-mono" style="font-size: 10px;">No active filters</span>`;
            return;
        }

        this.state.filters.forEach((f, idx) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "btn btn-sm btn-outline-warning font-mono d-inline-flex align-items-center gap-1";
            btn.style.fontSize = "10px";
            btn.style.padding = "1px 6px";
            btn.textContent = `${f.col} ${this.describeOperator(f.op)} ${f.val ? `"${f.val}"` : ''} ×`;
            btn.title = "Remove filter";
            btn.onclick = (e) => {
                e.stopPropagation();
                this.state.filters.splice(idx, 1);
                this.renderFilters();
                this.renderChart();
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            };
            container.appendChild(btn);
        });
    }

    describeOperator(op) {
        const map = {
            eq: "=", neq: "≠", gt: ">", gte: "≥", lt: "<", lte: "≤",
            contains: "contains", starts: "starts with", ends: "ends with",
            null: "is null", notnull: "is not null"
        };
        return map[op] || op;
    }

    applyFilters(data, filters) {
        if (!filters || filters.length === 0) return data;
        return data.filter(row => filters.every(f => {
            const val = row[f.col];
            const filterVal = f.val;
            if (f.op === 'null') return val === undefined || val === null || val === "";
            if (f.op === 'notnull') return val !== undefined && val !== null && val !== "";
            if (val === undefined || val === null) return false;

            const numVal = Number(val);
            const numFilter = Number(filterVal);
            const isNum = !isNaN(numVal) && !isNaN(numFilter) && val !== "" && filterVal !== "";

            switch (f.op) {
                case 'eq': return isNum ? numVal === numFilter : String(val).toLowerCase() === String(filterVal).toLowerCase();
                case 'neq': return isNum ? numVal !== numFilter : String(val).toLowerCase() !== String(filterVal).toLowerCase();
                case 'gt': return isNum ? numVal > numFilter : String(val).toLowerCase() > String(filterVal).toLowerCase();
                case 'gte': return isNum ? numVal >= numFilter : String(val).toLowerCase() >= String(filterVal).toLowerCase();
                case 'lt': return isNum ? numVal < numFilter : String(val).toLowerCase() < String(filterVal).toLowerCase();
                case 'lte': return isNum ? numVal <= numFilter : String(val).toLowerCase() <= String(filterVal).toLowerCase();
                case 'contains': return String(val).toLowerCase().includes(String(filterVal).toLowerCase());
                case 'starts': return String(val).toLowerCase().startsWith(String(filterVal).toLowerCase());
                case 'ends': return String(val).toLowerCase().endsWith(String(filterVal).toLowerCase());
                default: return true;
            }
        }));
    }

    renderChart() {
        const s = this.state;
        const canvas = this.containerElement ? this.containerElement.querySelector(".viz-container") : null;
        if (!canvas || !s.data || s.data.length === 0) return;

        const filteredData = this.applyFilters(s.data, s.filters);
        const seriesCharts = new Set([
            'Grouped Bar Chart', 'Stacked Bar Chart', 'Stacked Area Chart',
            'Scatter Plot', 'Heatmap', 'Radar Chart', 'Treemap', 'Bubble Chart'
        ]);

        let processedData = filteredData;

        if (
            seriesCharts.has(s.chartType) &&
            s.groupKey &&
            s.groupKey !== s.xAxis &&
            ((s.transform && s.transform !== 'Raw') || (s.dateGranularity && s.dateGranularity !== 'Raw'))
        ) {
            const dateProcessed = filteredData.map(r => Object.assign({}, r, {
                [s.xAxis]: (s.dateGranularity && s.dateGranularity !== 'Raw' && window.formatDateByGranularity)
                    ? window.formatDateByGranularity(r[s.xAxis], s.dateGranularity)
                    : r[s.xAxis]
            }));

            if (s.transform && s.transform !== 'Raw') {
                const compositeGroup = d3.group(dateProcessed, d => `${String(d[s.xAxis] ?? '')}|||${String(d[s.groupKey] ?? '')}`);
                processedData = Array.from(compositeGroup, ([compKey, rows]) => {
                    const [xv, gv] = compKey.split('|||');
                    const nums = rows.map(r => Number(r[s.yAxis]) || 0);
                    let val = 0;
                    if (s.transform === 'Count') val = rows.length;
                    else if (s.transform === 'Sum') val = d3.sum(nums);
                    else if (s.transform === 'Avg') val = d3.mean(nums) ?? 0;
                    else if (s.transform === 'Min') val = d3.min(nums) ?? 0;
                    else if (s.transform === 'Max') val = d3.max(nums) ?? 0;
                    return { [s.xAxis]: xv, [s.groupKey]: gv, [s.yAxis]: val };
                });
            } else {
                processedData = dateProcessed;
            }
        } else if ((s.transform && s.transform !== "Raw") || (s.dateGranularity && s.dateGranularity !== "Raw")) {
            processedData = window.getAggregateFunction
                ? window.getAggregateFunction(s.transform, filteredData, s.xAxis, s.yAxis, s.dateGranularity)
                : filteredData;
        }

        const ChartConstructor = (window.resolveChartClass && window.resolveChartClass(s.chartType))
            || (window.CHART_REGISTRY ? window.CHART_REGISTRY[s.chartType] : null);
        if (!ChartConstructor) return;

        const width = canvas.clientWidth || 420;
        const height = canvas.clientHeight || 220;
        const themeColors = this.getThemeColors();

        if (this.chart && !(this.chart instanceof ChartConstructor)) {
            this.chart.destroy();
            this.chart = null;
        }

        if (!this.chart) {
            this.chart = new ChartConstructor(canvas, Object.assign({ width, height }, themeColors));
        } else {
            Object.assign(this.chart.cfg, themeColors);
        }

        this.chart.update({
            data: processedData,
            xAxis: s.xAxis,
            yAxis: s.yAxis,
            groupKey: s.groupKey,
            selectedColumns: s.selectedColumns,
            width,
            height
        });
    }

    update(data) {
        if (data && data.data) {
            this.state.data = data.data;
            this.state.columns = data.columns || Object.keys(data.data[0] || {});
            this.restoreUIState();
            this.renderChart();
            if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
        }
    }

    resize() {
        if (this.containerElement && this.state.data && this.state.data.length > 0) {
            this.renderChart();
        }
    }

    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    clone() {
        return new DataVizDashboardContent({
            state: JSON.parse(JSON.stringify(this.state))
        });
    }
}

// =========================================================
// 6. CONCRETE IMPLEMENTATION: OLLAMA INTERFACE CONTENT
// =========================================================
class OllamaInterfaceContent extends IPanelContent {
    constructor(config = {}) {
        super(config);
        this.containerElement = null;
        this.state = Object.assign({
            baseUrl: 'http://localhost:11434',
            selectedModel: '',
            systemPrompt: 'You are a precise JSON-generating data assistant for local tool execution.',
            temperature: 0.2,
            topP: 0.9,
            numCtx: 4096,
            repeatPenalty: 1.1,
            responseFormat: 'text',
            conversationHistory: []
        }, config.state || {});

        this.adapter = window.OllamaAdapter ? new window.OllamaAdapter({ baseUrl: this.state.baseUrl }) : null;
        if (this.adapter && this.state.conversationHistory.length > 0) {
            this.adapter.setHistory(this.state.conversationHistory);
        }
    }

    serializeState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    render(containerElement) {
        this.containerElement = containerElement;
        containerElement.innerHTML = `
<div class="vde-ollama-interface h-100 d-flex flex-column p-2 gap-2 overflow-y-auto" style="color: var(--global-text); font-size: 11px;">
  <div class="row g-2 pb-2 border-bottom border-secondary">
    <div class="col-5">
      <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Ollama Endpoint</label>
      <input type="text" class="form-control form-control-sm baseurl-input bg-dark text-white border-secondary font-mono" style="font-size: 10.5px;" />
    </div>
    <div class="col-4">
      <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Model</label>
      <div class="d-flex gap-1">
        <select class="form-select form-select-sm model-select bg-dark text-white border-secondary" style="font-size: 10.5px;">
          <option value="">Loading...</option>
        </select>
        <button type="button" class="btn btn-sm btn-outline-secondary refresh-models-btn" style="font-size: 10.5px;"><i class="bi bi-arrow-clockwise"></i></button>
      </div>
    </div>
    <div class="col-3">
      <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Output</label>
      <select class="form-select form-select-sm response-format-select bg-dark text-white border-secondary" style="font-size: 10.5px;">
        <option value="text">Text</option>
        <option value="json">JSON</option>
      </select>
    </div>
  </div>

  <div>
    <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">System Prompt</label>
    <textarea class="form-control form-control-sm system-prompt-input bg-dark text-white border-secondary font-mono" rows="2" style="font-size: 10px;"></textarea>
  </div>

  <div class="row g-2 pb-2 border-bottom border-secondary">
    <div class="col-6">
      <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Temp: <span class="temp-value">${this.state.temperature}</span></label>
      <input type="range" class="form-range temperature-slider" min="0" max="1" step="0.1" value="${this.state.temperature}">
    </div>
    <div class="col-6">
      <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Top-P: <span class="topp-value">${this.state.topP}</span></label>
      <input type="range" class="form-range topp-slider" min="0" max="1" step="0.05" value="${this.state.topP}">
    </div>
    <div class="col-6">
      <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Context Window</label>
      <select class="form-select form-select-sm numctx-select bg-dark text-white border-secondary" style="font-size: 10px;">
        <option value="2048">2048 tokens</option>
        <option value="4096">4096 tokens</option>
        <option value="8192">8192 tokens</option>
        <option value="16384">16384 tokens</option>
        <option value="32768">32768 tokens</option>
      </select>
    </div>
    <div class="col-6">
      <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Repeat Penalty: <span class="repeat-value">${this.state.repeatPenalty}</span></label>
      <input type="range" class="form-range repeat-slider" min="1.0" max="2.0" step="0.05" value="${this.state.repeatPenalty}">
    </div>
  </div>

  <div class="flex-grow-1 d-flex flex-column" style="min-height: 0;">
    <div class="d-flex justify-content-between align-items-center mb-1">
      <span class="font-mono text-secondary" style="font-size: 10px;">Conversation</span>
      <button type="button" class="btn btn-sm btn-outline-danger clear-history-btn" style="font-size: 10px; padding: 1px 6px;">Clear</button>
    </div>
    <div class="chat-history flex-grow-1 border border-secondary rounded bg-dark p-2 overflow-y-auto" style="min-height: 90px;"></div>
    <div class="mt-2 d-flex gap-2">
      <textarea class="form-control form-control-sm user-input bg-dark text-white border-secondary font-mono" rows="2" placeholder="Enter prompt..." style="font-size: 11px;"></textarea>
      <button type="button" class="btn btn-sm btn-warning send-btn" style="font-size: 11px; white-space: nowrap;">Send</button>
    </div>
  </div>
</div>`;

        const baseUrlInput = containerElement.querySelector('.baseurl-input');
        if (baseUrlInput) {
            baseUrlInput.value = this.state.baseUrl;
            baseUrlInput.onchange = () => {
                this.state.baseUrl = baseUrlInput.value.trim() || 'http://localhost:11434';
                if (this.adapter) this.adapter.setBaseUrl(this.state.baseUrl);
                this.loadModels();
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            };
        }

        const sysInput = containerElement.querySelector('.system-prompt-input');
        if (sysInput) {
            sysInput.value = this.state.systemPrompt;
            sysInput.onchange = () => {
                this.state.systemPrompt = sysInput.value;
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            };
        }

        const fmtSelect = containerElement.querySelector('.response-format-select');
        if (fmtSelect) {
            fmtSelect.value = this.state.responseFormat;
            fmtSelect.onchange = () => {
                this.state.responseFormat = fmtSelect.value;
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            };
        }

        const numCtxSelect = containerElement.querySelector('.numctx-select');
        if (numCtxSelect) {
            numCtxSelect.value = String(this.state.numCtx);
            numCtxSelect.onchange = () => {
                this.state.numCtx = parseInt(numCtxSelect.value, 10) || 4096;
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            };
        }

        const bindSlider = (sel, valSel, key) => {
            const slider = containerElement.querySelector(sel);
            const label = containerElement.querySelector(valSel);
            if (!slider) return;
            slider.oninput = () => {
                this.state[key] = parseFloat(slider.value);
                if (label) label.textContent = slider.value;
            };
            slider.onchange = () => {
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            };
        };
        bindSlider('.temperature-slider', '.temp-value', 'temperature');
        bindSlider('.topp-slider', '.topp-value', 'topP');
        bindSlider('.repeat-slider', '.repeat-value', 'repeatPenalty');

        containerElement.querySelector('.refresh-models-btn')?.addEventListener('click', () => this.loadModels());
        containerElement.querySelector('.send-btn')?.addEventListener('click', () => this.sendMessage());
        containerElement.querySelector('.clear-history-btn')?.addEventListener('click', () => {
            if (this.adapter) this.adapter.clearHistory();
            this.state.conversationHistory = [];
            this.renderChatHistory();
            if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
        });

        this.renderChatHistory();
        this.loadModels();
    }

    async loadModels() {
        const select = this.containerElement?.querySelector('.model-select');
        if (!select || !this.adapter) return;
        try {
            select.innerHTML = '<option value="">Loading...</option>';
            const models = await this.adapter.fetchModels();
            select.innerHTML = '';
            if (!models || models.length === 0) {
                select.innerHTML = '<option value="">No models found</option>';
                return;
            }
            models.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.name;
                opt.textContent = m.name;
                if (m.name === this.state.selectedModel) opt.selected = true;
                select.appendChild(opt);
            });
            if (!this.state.selectedModel && models.length > 0) {
                this.state.selectedModel = models[0].name;
            }
            select.onchange = () => {
                this.state.selectedModel = select.value;
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            };
        } catch (err) {
            select.innerHTML = '<option value="">Local Ollama offline</option>';
        }
    }

    async sendMessage() {
        const input = this.containerElement?.querySelector('.user-input');
        const sendBtn = this.containerElement?.querySelector('.send-btn');
        if (!input || !sendBtn || !this.adapter) return;

        const message = input.value.trim();
        if (!message || !this.state.selectedModel) return;

        sendBtn.disabled = true;
        input.disabled = true;
        try {
            await this.adapter.sendMessage({
                model: this.state.selectedModel,
                systemPrompt: this.state.systemPrompt,
                userMessage: message,
                temperature: this.state.temperature,
                topP: this.state.topP,
                numCtx: this.state.numCtx,
                repeatPenalty: this.state.repeatPenalty,
                responseFormat: this.state.responseFormat
            });
            input.value = '';
            this.state.conversationHistory = this.adapter.getHistory();
            this.renderChatHistory();
            if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
        } catch (err) {
            const historyEl = this.containerElement?.querySelector('.chat-history');
            if (historyEl) {
                const div = document.createElement('div');
                div.className = 'p-2 rounded bg-danger bg-opacity-10 text-danger font-mono mb-2';
                div.style.fontSize = '10px';
                div.textContent = err.message;
                historyEl.appendChild(div);
            }
        } finally {
            sendBtn.disabled = false;
            input.disabled = false;
        }
    }

    renderChatHistory() {
        const chatContainer = this.containerElement?.querySelector('.chat-history');
        if (!chatContainer) return;
        chatContainer.innerHTML = '';

        if (this.state.conversationHistory.length === 0) {
            chatContainer.innerHTML = `<div class="text-secondary text-center py-3 font-mono" style="font-size: 10px;">Ready for local Ollama inference</div>`;
            return;
        }

        this.state.conversationHistory.forEach(msg => {
            const div = document.createElement('div');
            div.className = `p-2 rounded mb-2 font-mono ${msg.role === 'user' ? 'bg-success bg-opacity-10 text-success' : 'bg-info bg-opacity-10 text-info'}`;
            div.style.fontSize = '11px';
            div.style.whiteSpace = 'pre-wrap';
            div.textContent = `${msg.role.toUpperCase()}: ${msg.content}`;
            chatContainer.appendChild(div);
        });
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    clone() {
        return new OllamaInterfaceContent({
            state: JSON.parse(JSON.stringify(this.state))
        });
    }
}

// =========================================================
// 7. CONCRETE IMPLEMENTATION: FULL RESTORED OBSIDIAN CLI WIDGET
// =========================================================
const OBSIDIAN_COMMAND_SCHEMAS = {
    'file': {
        category: 'Files & Notes',
        label: 'file — Show File Info',
        params: [
            { key: 'file', label: 'File Name', type: 'text', placeholder: 'Note Name' },
            { key: 'path', label: 'Path (Optional)', type: 'text', placeholder: 'folder/note.md' }
        ],
        flags: []
    },
    'files': {
        category: 'Files & Notes',
        label: 'files — List Vault Files',
        params: [
            { key: 'folder', label: 'Folder', type: 'text', placeholder: 'Projects' },
            { key: 'ext', label: 'Extension', type: 'text', placeholder: 'md' },
            { key: 'limit', label: 'Limit', type: 'number', placeholder: '50' }
        ],
        flags: ['total']
    },
    'folders': {
        category: 'Files & Notes',
        label: 'folders — List Folders',
        params: [
            { key: 'folder', label: 'Root Folder', type: 'text', placeholder: '/' }
        ],
        flags: ['total']
    },
    'read': {
        category: 'Files & Notes',
        label: 'read — Read Note Contents',
        params: [
            { key: 'file', label: 'File Name', type: 'text', placeholder: 'Daily Log' },
            { key: 'path', label: 'Path (Optional)', type: 'text', placeholder: 'Notes/Daily Log.md' }
        ],
        flags: []
    },
    'create': {
        category: 'Files & Notes',
        label: 'create — Create New Note',
        params: [
            { key: 'name', label: 'Note Name', type: 'text', placeholder: 'New Note' },
            { key: 'path', label: 'Target Path', type: 'text', placeholder: 'Inbox/New Note.md' },
            { key: 'template', label: 'Template', type: 'text', placeholder: 'Template Name' },
            { key: 'content', label: 'Content', type: 'textarea', placeholder: '# Note Title\n...' }
        ],
        flags: ['overwrite', 'open', 'newtab']
    },
    'append': {
        category: 'Files & Notes',
        label: 'append — Append to Note',
        params: [
            { key: 'file', label: 'File Name', type: 'text', placeholder: 'Scratchpad' },
            { key: 'path', label: 'Path', type: 'text', placeholder: 'Inbox/Scratchpad.md' },
            { key: 'content', label: 'Content to Append', type: 'textarea', placeholder: '- New item' }
        ],
        flags: ['inline']
    },
    'prepend': {
        category: 'Files & Notes',
        label: 'prepend — Prepend to Note',
        params: [
            { key: 'file', label: 'File Name', type: 'text', placeholder: 'Scratchpad' },
            { key: 'path', label: 'Path', type: 'text', placeholder: 'Inbox/Scratchpad.md' },
            { key: 'content', label: 'Content to Prepend', type: 'textarea', placeholder: 'Summary line' }
        ],
        flags: ['inline']
    },
    'move': {
        category: 'Files & Notes',
        label: 'move — Move / Rename Note',
        params: [
            { key: 'file', label: 'File Name', type: 'text', placeholder: 'Old Note' },
            { key: 'path', label: 'Source Path', type: 'text', placeholder: 'Inbox/Old Note.md' },
            { key: 'to', label: 'Destination', type: 'text', placeholder: 'Archive/Old Note.md' }
        ],
        flags: []
    },
    'delete': {
        category: 'Files & Notes',
        label: 'delete — Delete Note',
        params: [
            { key: 'file', label: 'File Name', type: 'text', placeholder: 'Temp Note' },
            { key: 'path', label: 'Path', type: 'text', placeholder: 'Inbox/Temp Note.md' }
        ],
        flags: ['permanent']
    },
    'open': {
        category: 'Files & Notes',
        label: 'open — Open Note in Obsidian',
        params: [
            { key: 'file', label: 'File Name', type: 'text', placeholder: 'Project Hub' },
            { key: 'path', label: 'Path', type: 'text', placeholder: 'Projects/Project Hub.md' }
        ],
        flags: ['newtab']
    },
    'daily': {
        category: 'Daily Notes',
        label: 'daily — Open Daily Note',
        params: [],
        flags: []
    },
    'daily:read': {
        category: 'Daily Notes',
        label: 'daily:read — Read Daily Note',
        params: [],
        flags: []
    },
    'daily:append': {
        category: 'Daily Notes',
        label: 'daily:append — Append to Daily Note',
        params: [
            { key: 'content', label: 'Content', type: 'textarea', placeholder: '- [ ] Task item' }
        ],
        flags: ['inline']
    },
    'daily:prepend': {
        category: 'Daily Notes',
        label: 'daily:prepend — Prepend to Daily Note',
        params: [
            { key: 'content', label: 'Content', type: 'textarea', placeholder: 'Morning focus:' }
        ],
        flags: ['inline']
    },
    'search': {
        category: 'Search & Graph',
        label: 'search — Search Vault',
        params: [
            { key: 'query', label: 'Search Query', type: 'text', placeholder: 'tag:#project status' },
            { key: 'path', label: 'Scope Folder', type: 'text', placeholder: 'Projects' },
            { key: 'limit', label: 'Limit', type: 'number', placeholder: '25' },
            { key: 'format', label: 'Format', type: 'select', options: ['', 'text', 'json'] }
        ],
        flags: ['case', 'matches', 'total']
    },
    'search:open': {
        category: 'Search & Graph',
        label: 'search:open — Open Search in App',
        params: [
            { key: 'query', label: 'Search Query', type: 'text', placeholder: 'roadmap' }
        ],
        flags: []
    },
    'backlinks': {
        category: 'Search & Graph',
        label: 'backlinks — List Backlinks',
        params: [
            { key: 'file', label: 'File Name', type: 'text', placeholder: 'Index' },
            { key: 'path', label: 'Path', type: 'text', placeholder: 'Index.md' }
        ],
        flags: ['counts', 'total']
    },
    'links': {
        category: 'Search & Graph',
        label: 'links — List Outgoing Links',
        params: [
            { key: 'file', label: 'File Name', type: 'text', placeholder: 'Index' },
            { key: 'path', label: 'Path', type: 'text', placeholder: 'Index.md' }
        ],
        flags: ['total']
    },
    'unresolved': {
        category: 'Search & Graph',
        label: 'unresolved — Unresolved Links',
        params: [],
        flags: ['counts', 'total', 'verbose']
    },
    'orphans': {
        category: 'Search & Graph',
        label: 'orphans — Orphan Notes',
        params: [],
        flags: ['total']
    },
    'tags': {
        category: 'Tags, Properties & Tasks',
        label: 'tags — List Tags',
        params: [
            { key: 'file', label: 'File (Optional)', type: 'text', placeholder: 'Note' },
            { key: 'sort', label: 'Sort', type: 'select', options: ['', 'count', 'name'] }
        ],
        flags: ['counts', 'total']
    },
    'properties': {
        category: 'Tags, Properties & Tasks',
        label: 'properties — List Properties',
        params: [
            { key: 'file', label: 'File (Optional)', type: 'text', placeholder: 'Note' },
            { key: 'name', label: 'Property Name', type: 'text', placeholder: 'status' },
            { key: 'format', label: 'Format', type: 'select', options: ['', 'yaml', 'json', 'tsv'] }
        ],
        flags: ['counts', 'total']
    },
    'property:read': {
        category: 'Tags, Properties & Tasks',
        label: 'property:read — Read Property',
        params: [
            { key: 'file', label: 'File Name', type: 'text', placeholder: 'Note' },
            { key: 'path', label: 'Path', type: 'text', placeholder: 'Notes/Note.md' },
            { key: 'name', label: 'Property Name', type: 'text', placeholder: 'status' }
        ],
        flags: []
    },
    'property:set': {
        category: 'Tags, Properties & Tasks',
        label: 'property:set — Set Property',
        params: [
            { key: 'file', label: 'File Name', type: 'text', placeholder: 'Note' },
            { key: 'path', label: 'Path', type: 'text', placeholder: 'Notes/Note.md' },
            { key: 'name', label: 'Property Name', type: 'text', placeholder: 'status' },
            { key: 'value', label: 'Value', type: 'text', placeholder: 'active' },
            { key: 'type', label: 'Type', type: 'select', options: ['', 'text', 'list', 'number', 'checkbox', 'date', 'datetime'] }
        ],
        flags: []
    },
    'tasks': {
        category: 'Tags, Properties & Tasks',
        label: 'tasks — List Tasks',
        params: [
            { key: 'file', label: 'File (Optional)', type: 'text', placeholder: 'Sprint Plan' },
            { key: 'path', label: 'Path', type: 'text', placeholder: 'Projects/Sprint.md' },
            { key: 'status', label: 'Status Char', type: 'text', placeholder: ' ' }
        ],
        flags: ['todo', 'done', 'daily', 'total', 'verbose']
    },
    'task': {
        category: 'Tags, Properties & Tasks',
        label: 'task — Update / Inspect Task',
        params: [
            { key: 'file', label: 'File Name', type: 'text', placeholder: 'Sprint Plan' },
            { key: 'path', label: 'Path', type: 'text', placeholder: 'Projects/Sprint.md' },
            { key: 'ref', label: 'Task Ref', type: 'text', placeholder: 'path:line' },
            { key: 'line', label: 'Line #', type: 'number', placeholder: '12' },
            { key: 'status', label: 'Status Char', type: 'text', placeholder: 'x' }
        ],
        flags: ['toggle', 'done', 'todo']
    },
    'templates': {
        category: 'Templates, Bookmarks & Vault',
        label: 'templates — List Templates',
        params: [],
        flags: ['total']
    },
    'template:read': {
        category: 'Templates, Bookmarks & Vault',
        label: 'template:read — Read Template',
        params: [
            { key: 'name', label: 'Template Name', type: 'text', placeholder: 'Meeting Note' }
        ],
        flags: ['resolve']
    },
    'bookmarks': {
        category: 'Templates, Bookmarks & Vault',
        label: 'bookmarks — List Bookmarks',
        params: [],
        flags: ['total', 'verbose']
    },
    'bookmark': {
        category: 'Templates, Bookmarks & Vault',
        label: 'bookmark — Add Bookmark',
        params: [
            { key: 'file', label: 'File', type: 'text', placeholder: 'Dashboard.md' },
            { key: 'subpath', label: 'Heading/Block', type: 'text', placeholder: '#Overview' },
            { key: 'folder', label: 'Folder', type: 'text', placeholder: 'Projects' },
            { key: 'search', label: 'Search', type: 'text', placeholder: 'tag:#focus' },
            { key: 'url', label: 'URL', type: 'text', placeholder: 'https://...' },
            { key: 'title', label: 'Bookmark Title', type: 'text', placeholder: 'My Bookmark' }
        ],
        flags: []
    },
    'vault': {
        category: 'Templates, Bookmarks & Vault',
        label: 'vault — Vault Info',
        params: [
            { key: 'info', label: 'Info Field', type: 'select', options: ['', 'name', 'path', 'files', 'folders', 'size'] }
        ],
        flags: []
    },
    'vaults': {
        category: 'Templates, Bookmarks & Vault',
        label: 'vaults — List Vaults',
        params: [],
        flags: ['total', 'verbose']
    },
    'plugins': {
        category: 'Templates, Bookmarks & Vault',
        label: 'plugins — List Plugins',
        params: [
            { key: 'filter', label: 'Filter', type: 'select', options: ['', 'core', 'community'] }
        ],
        flags: ['versions']
    },
    'version': {
        category: 'Templates, Bookmarks & Vault',
        label: 'version — Obsidian Version',
        params: [],
        flags: []
    },
    'custom': {
        category: 'Custom',
        label: 'custom — Raw CLI Command',
        params: [
            { key: 'rawCommand', label: 'Raw Arguments', type: 'text', placeholder: 'search query="vde" limit="10"' }
        ],
        flags: []
    }
};

class ObsidianCLIContent extends IPanelContent {
    constructor(config = {}) {
        super(config);
        this.containerElement = null;
        this.activeTab = 'output';
        this.state = Object.assign({
            serverUrl: 'http://localhost:5000',
            selectedCommand: 'files',
            vault: '',
            params: {},
            flags: {},
            lastOutput: 'Ready for command execution...',
            commandHistory: []
        }, config.state || {});

        this.adapter = window.ObsidianAdapter ? new window.ObsidianAdapter(this.state.serverUrl) : null;
        if (this.adapter && Array.isArray(this.state.commandHistory) && this.state.commandHistory.length > 0) {
            this.adapter.setHistory(this.state.commandHistory);
        }
    }

    serializeState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    buildCommandSelectHTML() {
        const categories = Array.from(new Set(Object.values(OBSIDIAN_COMMAND_SCHEMAS).map(s => s.category)));
        return categories.map(cat => {
            const opts = Object.entries(OBSIDIAN_COMMAND_SCHEMAS)
                .filter(([, schema]) => schema.category === cat)
                .map(([cmd, schema]) =>
                    `<option value="${cmd}" ${cmd === this.state.selectedCommand ? 'selected' : ''}>${schema.label}</option>`
                ).join('');
            return `<optgroup label="${cat}">${opts}</optgroup>`;
        }).join('');
    }

    getCurrentPayload() {
        return Object.assign({}, this.state.params || {}, {
            command: this.state.selectedCommand,
            vault: this.state.vault,
            flags: this.state.flags || {}
        });
    }

    render(containerElement) {
        this.containerElement = containerElement;
        containerElement.innerHTML = `
<div class="vde-obsidian-cli h-100 d-flex flex-column p-2 gap-2 overflow-y-auto" style="color: var(--global-text); font-size: 11px;">
  <!-- Top Command & Bridge Row -->
  <div class="row g-2 pb-2 border-bottom border-secondary align-items-end">
    <div class="col-12 col-md-5">
      <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">CLI Command</label>
      <select class="form-select form-select-sm command-select bg-dark text-white border-secondary" style="font-size: 11px;">
        ${this.buildCommandSelectHTML()}
      </select>
    </div>
    <div class="col-6 col-md-3">
      <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Vault (Optional)</label>
      <input type="text" class="form-control form-control-sm vault-input bg-dark text-white border-secondary font-mono" placeholder="Vault name" style="font-size: 11px;" />
    </div>
    <div class="col-6 col-md-4">
      <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Bridge URL &amp; Status</label>
      <div class="input-group input-group-sm">
        <input type="text" class="form-control server-url-input bg-dark text-white border-secondary font-mono" style="font-size: 10.5px;" />
        <button type="button" class="btn btn-outline-secondary check-health-btn font-mono" style="font-size: 10px;">Check</button>
      </div>
    </div>
  </div>

  <!-- Dynamic Parameters & Flags -->
  <div class="obsidian-params-container row g-2"></div>
  <div class="obsidian-flags-container d-flex flex-wrap gap-3 align-items-center"></div>

  <!-- Live Command Preview & URI Actions -->
  <div class="p-2 rounded border border-secondary bg-black bg-opacity-25 d-flex flex-column gap-2">
    <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap">
      <code class="cli-preview-text font-mono text-warning flex-grow-1 text-break" style="font-size: 11px;"></code>
      <div class="d-flex gap-1 shrink-0">
        <button type="button" class="btn btn-sm btn-outline-secondary copy-cli-btn" style="font-size: 10px; padding: 2px 8px;">Copy CLI</button>
        <button type="button" class="btn btn-sm btn-warning execute-cmd-btn fw-semibold" style="font-size: 10.5px; padding: 2px 10px;">
          <i class="bi bi-play-fill me-1"></i>Execute
        </button>
      </div>
    </div>
    <div class="uri-preview-row d-none align-items-center justify-content-between gap-2 pt-1 border-top border-secondary flex-wrap">
      <code class="uri-preview-text font-mono text-info flex-grow-1 text-truncate" style="font-size: 10px;"></code>
      <div class="d-flex gap-1 shrink-0">
        <button type="button" class="btn btn-sm btn-outline-secondary copy-uri-btn" style="font-size: 10px; padding: 1px 7px;">Copy URI</button>
        <a class="btn btn-sm btn-outline-info open-uri-link" href="#" style="font-size: 10px; padding: 1px 8px;">Open in Obsidian</a>
      </div>
    </div>
  </div>

  <!-- Output Console & History Tabs -->
  <div class="flex-grow-1 d-flex flex-column" style="min-height: 110px;">
    <div class="d-flex justify-content-between align-items-center mb-1">
      <div class="btn-group btn-group-sm">
        <button type="button" class="btn btn-outline-secondary tab-output-btn active" style="font-size: 10px; padding: 2px 8px;">Output</button>
        <button type="button" class="btn btn-outline-secondary tab-history-btn" style="font-size: 10px; padding: 2px 8px;">History (<span class="history-count">0</span>)</button>
      </div>
      <div class="d-flex gap-1">
        <button type="button" class="btn btn-sm btn-outline-info send-to-md-btn" style="font-size: 10px; padding: 1px 7px;" title="Create a Markdown panel from this output">To Markdown</button>
        <button type="button" class="btn btn-sm btn-outline-secondary copy-output-btn" style="font-size: 10px; padding: 1px 7px;">Copy</button>
        <button type="button" class="btn btn-sm btn-outline-danger clear-output-btn" style="font-size: 10px; padding: 1px 7px;">Clear</button>
      </div>
    </div>

    <div class="output-console flex-grow-1 bg-dark border border-secondary rounded p-2 overflow-y-auto font-mono" style="font-size: 11px; color: #a6e3a1; white-space: pre-wrap;"></div>
    <div class="history-console d-none flex-grow-1 bg-dark border border-secondary rounded p-2 overflow-y-auto font-mono" style="font-size: 10.5px;"></div>
  </div>
</div>`;

        this.attachEvents();
        this.renderDynamicParams();
        this.updateCommandAndURI();
        this.renderConsoleAndHistory();
        this.checkBridgeHealth();
    }

    attachEvents() {
        const el = this.containerElement;
        if (!el) return;

        const cmdSelect = el.querySelector('.command-select');
        const vaultInput = el.querySelector('.vault-input');
        const serverInput = el.querySelector('.server-url-input');

        if (cmdSelect) {
            cmdSelect.value = this.state.selectedCommand;
            cmdSelect.onchange = () => {
                this.state.selectedCommand = cmdSelect.value;
                this.renderDynamicParams();
                this.updateCommandAndURI();
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            };
        }

        if (vaultInput) {
            vaultInput.value = this.state.vault || '';
            vaultInput.oninput = () => {
                this.state.vault = vaultInput.value;
                this.updateCommandAndURI();
            };
            vaultInput.onchange = () => {
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            };
        }

        if (serverInput) {
            serverInput.value = this.state.serverUrl || 'http://localhost:5000';
            serverInput.onchange = () => {
                this.state.serverUrl = serverInput.value.trim() || 'http://localhost:5000';
                if (this.adapter) this.adapter.setServerUrl(this.state.serverUrl);
                this.checkBridgeHealth();
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            };
        }

        el.querySelector('.check-health-btn')?.addEventListener('click', () => this.checkBridgeHealth());
        el.querySelector('.execute-cmd-btn')?.addEventListener('click', () => this.executeCurrentCommand());

        el.querySelector('.copy-cli-btn')?.addEventListener('click', (e) => {
            const cmd = el.querySelector('.cli-preview-text')?.textContent || '';
            this.copyText(cmd, e.currentTarget, 'Copy CLI');
        });

        el.querySelector('.copy-uri-btn')?.addEventListener('click', (e) => {
            const uri = el.querySelector('.uri-preview-text')?.textContent || '';
            this.copyText(uri, e.currentTarget, 'Copy URI');
        });

        el.querySelector('.copy-output-btn')?.addEventListener('click', (e) => {
            this.copyText(this.state.lastOutput || '', e.currentTarget, 'Copy');
        });

        el.querySelector('.clear-output-btn')?.addEventListener('click', () => {
            if (this.activeTab === 'history') {
                this.state.commandHistory = [];
                if (this.adapter) this.adapter.clearHistory();
            } else {
                this.state.lastOutput = '';
            }
            this.renderConsoleAndHistory();
            if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
        });

        el.querySelector('.send-to-md-btn')?.addEventListener('click', () => {
            if (!this.state.lastOutput || !window.IntegratedGridManager) return;
            const bucketId = this.panel ? this.panel.bucketId : null;
            window.IntegratedGridManager.addMarkdownWidget(this.state.lastOutput, bucketId);
        });

        el.querySelector('.tab-output-btn')?.addEventListener('click', () => {
            this.activeTab = 'output';
            this.renderConsoleAndHistory();
        });

        el.querySelector('.tab-history-btn')?.addEventListener('click', () => {
            this.activeTab = 'history';
            this.renderConsoleAndHistory();
        });
    }

    renderDynamicParams() {
        const el = this.containerElement;
        if (!el) return;

        const paramsWrap = el.querySelector('.obsidian-params-container');
        const flagsWrap = el.querySelector('.obsidian-flags-container');
        if (!paramsWrap || !flagsWrap) return;

        paramsWrap.innerHTML = '';
        flagsWrap.innerHTML = '';

        const schema = OBSIDIAN_COMMAND_SCHEMAS[this.state.selectedCommand] || { params: [], flags: [] };

        schema.params.forEach(field => {
            const colDiv = document.createElement('div');
            colDiv.className = field.type === 'textarea' ? 'col-12' : 'col-6 col-md-4';

            const label = document.createElement('label');
            label.className = 'form-label font-mono text-secondary mb-1';
            label.style.fontSize = '10px';
            label.textContent = field.label;
            colDiv.appendChild(label);

            const currentVal = (this.state.params && this.state.params[field.key]) || '';
            let inputEl;

            if (field.type === 'textarea') {
                inputEl = document.createElement('textarea');
                inputEl.rows = 2;
                inputEl.className = 'form-control form-control-sm bg-dark text-white border-secondary font-mono';
                inputEl.placeholder = field.placeholder || '';
                inputEl.value = currentVal;
            } else if (field.type === 'select') {
                inputEl = document.createElement('select');
                inputEl.className = 'form-select form-select-sm bg-dark text-white border-secondary font-mono';
                (field.options || []).forEach(optVal => {
                    const opt = document.createElement('option');
                    opt.value = optVal;
                    opt.textContent = optVal || '(default)';
                    if (optVal === currentVal) opt.selected = true;
                    inputEl.appendChild(opt);
                });
            } else {
                inputEl = document.createElement('input');
                inputEl.type = field.type || 'text';
                inputEl.className = 'form-control form-control-sm bg-dark text-white border-secondary font-mono';
                inputEl.placeholder = field.placeholder || '';
                inputEl.value = currentVal;
            }

            inputEl.style.fontSize = '11px';
            const onUpdate = () => {
                if (!this.state.params) this.state.params = {};
                this.state.params[field.key] = inputEl.value;
                this.updateCommandAndURI();
            };
            inputEl.addEventListener('input', onUpdate);
            inputEl.addEventListener('change', () => {
                onUpdate();
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            });

            colDiv.appendChild(inputEl);
            paramsWrap.appendChild(colDiv);
        });

        schema.flags.forEach(flag => {
            const checkDiv = document.createElement('div');
            checkDiv.className = 'form-check form-check-inline m-0';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'form-check-input';
            input.id = `obs-flag-${this.panel ? this.panel.id : 'x'}-${flag}`;
            input.checked = Boolean(this.state.flags && this.state.flags[flag]);

            input.onchange = () => {
                if (!this.state.flags) this.state.flags = {};
                this.state.flags[flag] = input.checked;
                this.updateCommandAndURI();
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            };

            const lbl = document.createElement('label');
            lbl.className = 'form-check-label font-mono text-secondary';
            lbl.style.fontSize = '10.5px';
            lbl.setAttribute('for', input.id);
            lbl.textContent = flag;

            checkDiv.appendChild(input);
            checkDiv.appendChild(lbl);
            flagsWrap.appendChild(checkDiv);
        });
    }

    updateCommandAndURI() {
        const el = this.containerElement;
        if (!el || !this.adapter) return;

        const payload = this.getCurrentPayload();
        const cliText = this.adapter.buildCommand(payload);
        const uri = this.adapter.buildURI(payload);

        const cliEl = el.querySelector('.cli-preview-text');
        if (cliEl) cliEl.textContent = cliText;

        const uriRow = el.querySelector('.uri-preview-row');
        const uriEl = el.querySelector('.uri-preview-text');
        const openLink = el.querySelector('.open-uri-link');

        if (uri && uriRow && uriEl && openLink) {
            uriRow.classList.remove('d-none');
            uriRow.classList.add('d-flex');
            uriEl.textContent = uri;
            openLink.setAttribute('href', uri);
        } else if (uriRow) {
            uriRow.classList.add('d-none');
            uriRow.classList.remove('d-flex');
        }
    }

    async checkBridgeHealth() {
        const btn = this.containerElement?.querySelector('.check-health-btn');
        if (!btn || !this.adapter) return;
        btn.textContent = '...';
        const online = await this.adapter.checkHealth();
        if (online) {
            btn.className = 'btn btn-outline-success check-health-btn font-mono';
            btn.textContent = 'Online';
        } else {
            btn.className = 'btn btn-outline-secondary check-health-btn font-mono';
            btn.textContent = 'Offline';
        }
    }

    async executeCurrentCommand() {
        const el = this.containerElement;
        const execBtn = el?.querySelector('.execute-cmd-btn');
        if (!el || !execBtn || !this.adapter) return;

        const payload = this.getCurrentPayload();
        const cmd = this.adapter.buildCommand(payload);

        execBtn.disabled = true;
        this.activeTab = 'output';
        try {
            const res = await this.adapter.executeCommand(cmd);
            this.state.lastOutput = res.output || `Command succeeded: ${res.command}`;
            this.state.commandHistory = this.adapter.getHistory();
            this.checkBridgeHealth();
        } catch (err) {
            this.state.commandHistory = this.adapter.getHistory();
            const uri = this.adapter.buildURI(payload);
            this.state.lastOutput =
                `Local bridge unreachable at ${this.state.serverUrl}/api/execute.\n` +
                `Constructed CLI command:\n  ${cmd}\n` +
                (uri ? `\nDirect Obsidian URI available above:\n  ${uri}\n` : '') +
                `\nDetails: ${err.message}`;
        } finally {
            execBtn.disabled = false;
            this.renderConsoleAndHistory();
            if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
        }
    }

    renderConsoleAndHistory() {
        const el = this.containerElement;
        if (!el) return;

        const outConsole = el.querySelector('.output-console');
        const histConsole = el.querySelector('.history-console');
        const tabOut = el.querySelector('.tab-output-btn');
        const tabHist = el.querySelector('.tab-history-btn');
        const histCount = el.querySelector('.history-count');

        const history = this.state.commandHistory || [];
        if (histCount) histCount.textContent = String(history.length);

        if (this.activeTab === 'history') {
            outConsole?.classList.add('d-none');
            histConsole?.classList.remove('d-none');
            tabOut?.classList.remove('active');
            tabHist?.classList.add('active');
        } else {
            outConsole?.classList.remove('d-none');
            histConsole?.classList.add('d-none');
            tabOut?.classList.add('active');
            tabHist?.classList.remove('active');
        }

        if (outConsole) {
            outConsole.textContent = this.state.lastOutput || 'Ready for command execution...';
        }

        if (histConsole) {
            histConsole.innerHTML = '';
            if (history.length === 0) {
                histConsole.innerHTML = '<div class="text-secondary text-center py-3">No commands executed yet.</div>';
            } else {
                history.forEach(item => {
                    const row = document.createElement('div');
                    row.className = 'd-flex align-items-center justify-content-between gap-2 py-1 border-bottom border-secondary';

                    const info = document.createElement('div');
                    info.className = 'text-truncate';
                    const timeStr = item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : '';
                    info.innerHTML = `<span class="text-secondary me-2">${timeStr}</span><span class="text-warning">${window.HTMLRendererAdapter ? window.HTMLRendererAdapter.escapeHtml(item.command) : item.command}</span>`;

                    const rerunBtn = document.createElement('button');
                    rerunBtn.type = 'button';
                    rerunBtn.className = 'btn btn-sm btn-outline-warning shrink-0';
                    rerunBtn.style.fontSize = '10px';
                    rerunBtn.style.padding = '1px 7px';
                    rerunBtn.textContent = 'Run';
                    rerunBtn.onclick = async () => {
                        this.state.selectedCommand = 'custom';
                        if (!this.state.params) this.state.params = {};
                        this.state.params.rawCommand = item.command;
                        const cmdSel = el.querySelector('.command-select');
                        if (cmdSel) cmdSel.value = 'custom';
                        this.renderDynamicParams();
                        this.updateCommandAndURI();
                        await this.executeCurrentCommand();
                    };

                    row.appendChild(info);
                    row.appendChild(rerunBtn);
                    histConsole.appendChild(row);
                });
            }
        }
    }

    copyText(text, btn, defaultLabel) {
        if (!text) return;
        const markCopied = () => {
            if (btn) {
                btn.textContent = 'Copied';
                setTimeout(() => { btn.textContent = defaultLabel; }, 1200);
            }
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(markCopied).catch(() => {
                this.fallbackCopy(text, markCopied);
            });
        } else {
            this.fallbackCopy(text, markCopied);
        }
    }

    fallbackCopy(text, onDone) {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            if (onDone) onDone();
        } catch (e) { }
    }

    clone() {
        return new ObsidianCLIContent({
            state: JSON.parse(JSON.stringify(this.state))
        });
    }
}

window.IPanelContent = IPanelContent;
window.RichTextContent = RichTextContent;
window.CodeSnippetContent = CodeSnippetContent;
window.HTMLPreviewContent = HTMLPreviewContent;
window.D3ChartContent = D3ChartContent;
window.DataVizDashboardContent = DataVizDashboardContent;
window.OllamaInterfaceContent = OllamaInterfaceContent;
window.ObsidianCLIContent = ObsidianCLIContent;
