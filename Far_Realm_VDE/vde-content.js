/**
 * vde-content.js
 * Virtue Execution Matrix - Content Bridge Layer
 * Formulated with Utilitarian Spite under the Clerical Mandate of Project Narayah
 * Separates UI panel representation (Abstraction) from dynamic content loading (Implementation).
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
    
    clone() {
        throw new Error("Clone ritual must be implemented by content implementations.");
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
        const container = d3.select(containerElement);
        container.selectAll("*").remove();

        const wrapper = container.append("div")
            .attr("class", "rich-text-wrapper")
            .style("width", "100%")
            .style("height", "100%")
            .style("box-sizing", "border-box")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("position", "relative");

        const menu = wrapper.append("div")
            .attr("class", "panel-action-menu")
            .style("position", "absolute")
            .style("top", "5px")
            .style("right", "5px")
            .style("z-index", "5");

        const editBtn = menu.append("button")
            .attr("class", "btn btn-sm btn-outline-warning")
            .style("background", "rgba(13,13,13,0.85)")
            .style("font-size", "10px")
            .style("padding", "2px 6px")
            .text(this.isEditing ? "Save Codex" : "Edit Mode");

        const bodyArea = wrapper.append("div")
            .attr("class", "panel-text-body")
            .style("flex-grow", "1")
            .style("overflow-y", "auto")
            .style("padding", "10px")
            .style("box-sizing", "border-box")
            .style("height", "100%");

        if (this.isEditing) {
            const textarea = bodyArea.append("textarea")
                .style("width", "100%")
                .style("height", "100%")
                .style("background", "#0d0d0d")
                .style("color", "#00ff66")
                .style("font-family", "Consolas, monospace")
                .style("font-size", "11px")
                .style("border", "1px solid #333")
                .style("box-sizing", "border-box")
                .style("resize", "none")
                .property("value", this.config.sourceText || "");

            editBtn.on("click", () => {
                this.config.sourceText = textarea.property("value");
                this.isEditing = false;
                this.render(containerElement);
                if (window.IntegratedGridManager) {
                    window.IntegratedGridManager.triggerStateChange();
                }
            });
        } else {
            const preview = bodyArea.append("div")
                .attr("class", "vde-markdown-preview text-white")
                .style("font-size", "12px")
                .style("line-height", "1.6");

            // Shield the system by using our Formatter Adapter for pure rendering
            const raw = this.config.sourceText || "";
            const type = this.config.contentType || "markdown";
            preview.html(window.Formatter ? window.Formatter.render(raw, type) : raw);

            preview.on("dblclick", () => {
                this.isEditing = true;
                this.render(containerElement);
            });

            editBtn.on("click", () => {
                this.isEditing = true;
                this.render(containerElement);
            });
        }
    }

    update(data) {
        if (data && data.sourceText !== undefined) {
            this.config.sourceText = data.sourceText;
            this.render(this.containerElement);
            if (window.IntegratedGridManager) {
                window.IntegratedGridManager.triggerStateChange();
            }
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
// 3. CONCRETE IMPLEMENTATION: RAW CODE SNIPPET (With Slicing)
// =========================================================
class CodeSnippetContent extends IPanelContent {
    constructor(config = {}) {
        super(config);
        this.isEditing = false;
        this.containerElement = null;
    }

    render(containerElement) {
        this.containerElement = containerElement;
        const container = d3.select(containerElement);
        container.selectAll("*").remove();

        const wrapper = container.append("div")
            .attr("class", "code-snippet-wrapper h-100 d-flex flex-column position-relative");

        // Action Menu (Floating controls for editing and digestion)
        const menu = wrapper.append("div")
            .attr("class", "panel-action-menu position-absolute")
            .style("top", "5px")
            .style("right", "5px")
            .style("z-index", "5");

        // Render Slicing Trigger ONLY when in View Mode and content exists
        if (!this.isEditing && this.config.sourceText) {
            const digestBtn = menu.append("button")
                .attr("class", "btn btn-sm btn-outline-info me-1")
                .style("background", "rgba(13,13,13,0.85)")
                .style("font-size", "10px")
                .style("padding", "2px 6px")
                .attr("title", "Digest Code into individual declarations")
                .html("Digest");

            digestBtn.on("click", () => {
                this.triggerDigestion();
            });
        }

        const editBtn = menu.append("button")
            .attr("class", "btn btn-sm btn-outline-warning")
            .style("background", "rgba(13,13,13,0.85)")
            .style("font-size", "10px")
            .style("padding", "2px 6px")
            .text(this.isEditing ? "Save Code" : "Edit Code");

        const bodyArea = wrapper.append("div")
            .attr("class", "panel-text-body flex-grow-1 overflow-y-auto p-2 h-100")
            .style("box-sizing", "border-box");

        if (this.isEditing) {
            const textarea = bodyArea.append("textarea")
                .style("width", "100%")
                .style("height", "100%")
                .style("background", "#0d0d0d")
                .style("color", "#00ff66")
                .style("font-family", "Consolas, monospace")
                .style("font-size", "11px")
                .style("border", "1px solid #333")
                .style("box-sizing", "border-box")
                .style("resize", "none")
                .property("value", this.config.sourceText || "");

            editBtn.on("click", () => {
                this.config.sourceText = textarea.property("value");
                this.isEditing = false;
                this.render(containerElement);
                if (window.IntegratedGridManager) {
                    window.IntegratedGridManager.triggerStateChange();
                }
            });
        } else {
            const preview = bodyArea.append("pre")
                .attr("class", "h-100 m-0 p-2")
                .style("background", "#0d0d0d")
                .style("border", "1px solid #2a2a2a")
                .style("border-radius", "4px")
                .style("overflow", "auto");

            const escaped = this.escapeHtml(this.config.sourceText || "");
            
            preview.append("code")
                .style("font-family", "Consolas, monospace")
                .style("color", "#39c5bb")
                .style("font-size", "11.5px")
                .html(escaped);

            preview.on("dblclick", () => {
                this.isEditing = true;
                this.render(containerElement);
            });

            editBtn.on("click", () => {
                this.isEditing = true;
                this.render(containerElement);
            });
        }
    }

    // Dynamic Slicing Routine via Bridge Back-Reference
    triggerDigestion() {
        const rawText = this.config.sourceText || "";
        const digester = window.ContentDigester || window.Digester;
        if (!digester) {
            console.error("Narayah Digester engine not loaded.");
            return;
        }

        // Delegate to Strategy-based digestion algorithm
        const fragments = digester.digest(rawText, "code");

        if (fragments.length <= 1) {
            alert("No natural boundaries (functions, classes, or declarations) were detected. Slicing aborted.");
            return;
        }

        const manager = window.IntegratedGridManager;
        const parentPanel = this.panel; // Bridge back-reference to our Abstraction

        if (manager && parentPanel) {
            const bucketId = parentPanel.bucketId;

            // Remove the parent panel container from the layout grid
            manager.removePanel(parentPanel.id);

            // Re-instantiate individual fragments back into the container
            fragments.forEach(frag => {
                manager.addCodeWidget(frag, bucketId);
            });
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    update(data) {
        if (data && data.sourceText !== undefined) {
            this.config.sourceText = data.sourceText;
            this.render(this.containerElement);
            if (window.IntegratedGridManager) {
                window.IntegratedGridManager.triggerStateChange();
            }
        }
    }

    resize(width, height) {
        if (this.containerElement) {
            this.render(this.containerElement);
        }
    }

    clone() {
        return new CodeSnippetContent({
            sourceText: this.config.sourceText
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
    }

    render(containerElement) {
        this.containerElement = containerElement;
        const container = d3.select(containerElement);
        container.selectAll("*").remove();

        const chartType = this.config.chartType || "Bar Chart";
        const ChartClass = window.CHART_REGISTRY ? window.CHART_REGISTRY[chartType] : null;
        
        if (ChartClass) {
            const width = containerElement.clientWidth || 300;
            const height = containerElement.clientHeight || 200;
            
            const chartConfig = Object.assign({}, this.config.chartConfig || {}, {
                width: width,
                height: height
            });
            
            this.chart = new ChartClass(containerElement, chartConfig);
            if (this.config.data) {
                this.chart.update({
                    data: this.config.data.data || this.config.data,
                    xAxis: this.config.data.xAxis || "label",
                    yAxis: this.config.data.yAxis || "value"
                });
            }
        } else {
            container.append("div")
                .style("color", "#ff4444")
                .style("padding", "20px")
                .text(`Chart lineage '${chartType}' not found in registry.`);
        }
    }

    update(data) {
        if (data) {
            this.config.data = data;
        }
        if (this.chart && this.config.data) {
            this.chart.update({
                data: this.config.data.data || this.config.data,
                xAxis: this.config.data.xAxis || "label",
                yAxis: this.config.data.yAxis || "value"
            });
        }
        if (window.IntegratedGridManager) {
            window.IntegratedGridManager.triggerStateChange();
        }
    }

    resize(width, height) {
        if (this.containerElement) {
            this.render(this.containerElement);
        }
    }

    clone() {
        return new D3ChartContent({
            chartType: this.config.chartType,
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

        this.state = Object.assign({
            data: [],
            columns: [],
            xAxis: "",
            yAxis: "",
            transform: "Raw",
            chartType: "Bar Chart",
            filters: []
        }, config.state || {});
    }

    getHTMLTemplate() {
        return `
<div class="vde-viz-dashboard h-100 d-flex flex-column" style="padding: 10px; background-color: #1a1a1a; color: #fff; font-size: 11px;">
    <!-- SECTION 1: DATA UTILITY INTERFACE -->
    <div class="row g-2 mb-2 align-items-end border-bottom border-secondary pb-2">
        <div class="col-md-3">
            <label class="form-label font-monospace text-muted small mb-1">1. Summon Dataset (CSV)</label>
            <input type="file" class="form-control form-control-sm file-input bg-dark border-secondary text-white small" accept=".csv" />
        </div>
        <div class="col-md-9 d-none config-controls">
            <div class="row g-2">
                <div class="col-md-3">
                    <label class="form-label font-monospace text-muted small mb-1">2. X-Axis (Label)</label>
                    <select class="form-select form-select-sm x-axis-menu bg-dark text-white border-secondary small"></select>
                </div>
                <div class="col-md-3">
                    <label class="form-label font-monospace text-muted small mb-1">3. Y-Axis (Metric)</label>
                    <select class="form-select form-select-sm y-axis-menu bg-dark text-white border-secondary small"></select>
                </div>
                <div class="col-md-3">
                    <label class="form-label font-monospace text-muted small mb-1">4. Aggregation</label>
                    <select class="form-select form-select-sm transform-menu bg-dark text-white border-secondary small">
                        <option value="Raw">Raw Rows (None)</option>
                        <option value="Count">Row Count</option>
                        <option value="Sum">Sum of Y</option>
                        <option value="Avg">Average of Y</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label font-monospace text-muted small mb-1">5. Visual Lineage</label>
                    <select class="form-select form-select-sm chart-type-menu bg-dark text-white border-secondary small">
                        <option value="Bar Chart">Bar Chart</option>
                        <option value="Line Chart">Line Chart</option>
                        <option value="Stacked Bar Chart">Stacked Bar Chart</option>
                        <option value="Pie Chart">Pie Chart</option>
                        <option value="Table Chart">Table Chart</option>
                        <option value="Word Cloud Chart">Word Cloud Chart</option>
                    </select>
                </div>
            </div>
        </div>
    </div>

    <!-- SECTION 2: LOCAL FILTER NAVIGATION -->
    <div class="d-none config-controls mb-2">
        <div class="d-flex align-items-center gap-2 bg-black bg-opacity-50 p-2 rounded border border-secondary flex-wrap">
            <span class="font-monospace text-warning me-1"><i class="bi bi-funnel"></i> Filters:</span>
            <select class="form-select form-select-sm filter-column bg-dark text-white border-secondary small" style="width: auto;"></select>
            <select class="form-select form-select-sm filter-operator bg-dark text-white border-secondary small" style="width: auto;">
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
            <input type="text" class="form-control form-control-sm filter-value bg-dark text-white border-secondary small" placeholder="Value..." style="width: 100px;" />
            <button class="btn btn-sm btn-outline-warning add-filter-btn" style="padding: 2px 8px; font-size:11px;">Apply</button>
            
            <div class="active-filters-container d-flex gap-1 align-items-center flex-wrap" style="margin-left: 10px;"></div>
        </div>
    </div>

    <!-- SECTION 3: VISUALIZATION CANVAS -->
    <div class="viz-container flex-grow-1 border border-secondary rounded bg-dark p-2 overflow-hidden position-relative" style="min-height: 180px;">
        <div class="text-center text-muted py-5 initial-message">
            <i class="bi bi-file-earmark-bar-graph fs-2 d-block text-warning mb-2"></i>
            Please load a local CSV dataset to initiate the visual liturgy.
        </div>
    </div>
</div>
`;
    }

    render(containerElement) {
        this.containerElement = containerElement;
        const container = d3.select(containerElement);
        container.selectAll("*").remove();

        container.html(this.getHTMLTemplate());
        this.attachEvents();

        if (this.state.data && this.state.data.length > 0) {
            this.restoreUIState();
            this.renderChart();
        }
    }

    attachEvents() {
        const el = this.containerElement;
        if (!el) return;

        const fileInput = el.querySelector(".file-input");
        if (fileInput) {
            fileInput.addEventListener("change", (e) => this.loadCSV(e));
        }

        const xMenu = el.querySelector(".x-axis-menu");
        if (xMenu) {
            xMenu.addEventListener("change", (e) => {
                this.state.xAxis = e.target.value;
                this.renderChart();
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            });
        }

        const yMenu = el.querySelector(".y-axis-menu");
        if (yMenu) {
            yMenu.addEventListener("change", (e) => {
                this.state.yAxis = e.target.value;
                this.renderChart();
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            });
        }

        const transformMenu = el.querySelector(".transform-menu");
        if (transformMenu) {
            transformMenu.addEventListener("change", (e) => {
                this.state.transform = e.target.value;
                this.renderChart();
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            });
        }

        const chartTypeMenu = el.querySelector(".chart-type-menu");
        if (chartTypeMenu) {
            chartTypeMenu.addEventListener("change", (e) => {
                this.state.chartType = e.target.value;
                this.renderChart();
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            });
        }

        const addFilterBtn = el.querySelector(".add-filter-btn");
        if (addFilterBtn) {
            addFilterBtn.addEventListener("click", () => {
                const col = el.querySelector(".filter-column").value;
                const op = el.querySelector(".filter-operator").value;
                const val = el.querySelector(".filter-value").value;

                if (!col) return;
                if (!this.state.filters) this.state.filters = [];

                this.state.filters.push({ col, op, val });
                el.querySelector(".filter-value").value = "";
                this.renderFilters();
                this.renderChart();
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            });
        }
    }

    loadCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const data = d3.csvParse(text);
            
            if (data && data.length > 0) {
                this.state.data = data;
                this.state.columns = Object.keys(data[0] || {});
                this.state.xAxis = this.state.columns[0] || "";
                this.state.yAxis = this.state.columns[1] || this.state.columns[0] || "";
                this.state.filters = [];
                this.state.transform = "Raw";
                this.state.chartType = "Bar Chart";

                this.restoreUIState();
                this.renderChart();
                
                if (window.IntegratedGridManager) {
                    window.IntegratedGridManager.triggerStateChange();
                }
            }
        };
        reader.readAsText(file);
    }

    restoreUIState() {
        const el = this.containerElement;
        if (!el) return;

        el.querySelectorAll(".config-controls").forEach(c => c.classList.remove("d-none"));
        const initMsg = el.querySelector(".initial-message");
        if (initMsg) initMsg.classList.add("d-none");

        this.populateDropdowns();
        this.renderFilters();
    }

    populateDropdowns() {
        const el = this.containerElement;
        const xMenu = el.querySelector(".x-axis-menu");
        const yMenu = el.querySelector(".y-axis-menu");
        const filterCol = el.querySelector(".filter-column");

        if (!xMenu || !yMenu || !filterCol) return;

        xMenu.innerHTML = "";
        yMenu.innerHTML = "";
        filterCol.innerHTML = "";

        this.state.columns.forEach(col => {
            const xSelected = col === this.state.xAxis ? "selected" : "";
            const ySelected = col === this.state.yAxis ? "selected" : "";
            
            xMenu.insertAdjacentHTML("beforeend", `<option value="${col}" ${xSelected}>${col}</option>`);
            yMenu.insertAdjacentHTML("beforeend", `<option value="${col}" ${ySelected}>${col}</option>`);
            filterCol.insertAdjacentHTML("beforeend", `<option value="${col}">${col}</option>`);
        });

        const transformMenu = el.querySelector(".transform-menu");
        if (transformMenu) {
            transformMenu.value = this.state.transform || "Raw";
        }

        const chartTypeMenu = el.querySelector(".chart-type-menu");
        if (chartTypeMenu) {
            chartTypeMenu.value = this.state.chartType || "Bar Chart";
        }
    }

    renderFilters() {
        const el = this.containerElement;
        const container = el.querySelector(".active-filters-container");
        if (!container) return;
        container.innerHTML = "";

        if (!this.state.filters || this.state.filters.length === 0) {
            container.innerHTML = `<span class="text-muted" style="font-size: 10px;">No active filters</span>`;
            return;
        }

        this.state.filters.forEach((f, idx) => {
            const badge = document.createElement("span");
            badge.className = "badge bg-dark text-warning d-inline-flex align-items-center gap-1 p-2 border border-secondary font-monospace";
            badge.style.fontSize = "9px";
            badge.innerHTML = `
                <span>${f.col} ${this.describeOperator(f.op)} "${f.val}"</span>
                <button type="button" class="btn-close btn-close-white btn-sm p-0 ms-1 remove-filter-single" data-index="${idx}" style="font-size: 8px; width: 8px; height: 8px;"></button>
            `;
            container.appendChild(badge);
        });

        container.querySelectorAll(".remove-filter-single").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute("data-index"));
                this.state.filters.splice(idx, 1);
                this.renderFilters();
                this.renderChart();
                if (window.IntegratedGridManager) window.IntegratedGridManager.triggerStateChange();
            };
        });
    }

    describeOperator(op) {
        const map = {
            eq: "=",
            neq: "≠",
            gt: ">",
            gte: "≥",
            lt: "<",
            lte: "≤",
            contains: "contains",
            starts: "starts with",
            ends: "ends with",
            null: "is null",
            notnull: "is not null"
        };
        return map[op] || op;
    }

    applyFilters(data, filters) {
        if (!filters || filters.length === 0) return data;
        return data.filter(row => {
            return filters.every(f => {
                const val = row[f.col];
                const filterVal = f.val;

                if (f.op === 'null') return val === undefined || val === null || val === "";
                if (f.op === 'notnull') return val !== undefined && val !== null && val !== "";

                if (val === undefined || val === null) return false;

                const numVal = Number(val);
                const numFilterVal = Number(filterVal);
                const isNumeric = !isNaN(numVal) && !isNaN(numFilterVal) && val !== "" && filterVal !== "";

                switch (f.op) {
                    case 'eq':
                        return isNumeric ? numVal === numFilterVal : String(val).toLowerCase() === String(filterVal).toLowerCase();
                    case 'neq':
                        return isNumeric ? numVal !== numFilterVal : String(val).toLowerCase() !== String(filterVal).toLowerCase();
                    case 'gt':
                        return isNumeric ? numVal > numFilterVal : String(val).toLowerCase() > String(filterVal).toLowerCase();
                    case 'gte':
                        return isNumeric ? numVal >= numFilterVal : String(val).toLowerCase() >= String(filterVal).toLowerCase();
                    case 'lt':
                        return isNumeric ? numVal < numFilterVal : String(val).toLowerCase() < String(filterVal).toLowerCase();
                    case 'lte':
                        return isNumeric ? numVal <= numFilterVal : String(val).toLowerCase() <= String(filterVal).toLowerCase();
                    case 'contains':
                        return String(val).toLowerCase().includes(String(filterVal).toLowerCase());
                    case 'starts':
                        return String(val).toLowerCase().startsWith(String(filterVal).toLowerCase());
                    case 'ends':
                        return String(val).toLowerCase().endsWith(String(filterVal).toLowerCase());
                    default:
                        return true;
                }
            });
        });
    }

    renderChart() {
        const s = this.state;
        const canvas = this.containerElement.querySelector(".viz-container");
        if (!canvas) return;
        
        const d3Canvas = d3.select(canvas);
        d3Canvas.selectAll("svg").remove();
        d3Canvas.selectAll("table").remove();

        if (!s.data || s.data.length === 0) return;

        const filteredData = this.applyFilters(s.data, s.filters);

        let processedData;
        if (s.transform && s.transform !== "Raw") {
            processedData = window.getAggregateFunction ? window.getAggregateFunction(s.transform, filteredData, s.xAxis, s.yAxis) : filteredData;
        } else {
            processedData = filteredData;
        }

        const ChartConstructor = window.CHART_REGISTRY ? window.CHART_REGISTRY[s.chartType] : null;
        if (ChartConstructor) {
            const width = canvas.clientWidth || 400;
            const height = canvas.clientHeight || 200;

            if (s.chartType === "Stacked Bar Chart") {
                const xKey = s.xAxis;
                const stackKeys = Array.from(new Set(filteredData.map(d => d[s.yAxis])));
                const grouped = d3.group(filteredData, d => d[xKey]);
                const stackedData = Array.from(grouped, ([xValue, rows]) => {
                    const row = { [xKey]: xValue };
                    stackKeys.forEach(k => row[k] = 0);
                    rows.forEach(r => {
                        const k = r[s.yAxis];
                        row[k] = (row[k] || 0) + 1;
                    });
                    return row;
                });

                this.chart = new ChartConstructor(canvas, {
                    width: width,
                    height: height,
                    xAxis: s.xAxis,
                    stackKeys: stackKeys
                });
                this.chart.update({ data: stackedData, xAxis: s.xAxis, stackKeys: stackKeys });
            } else {
                this.chart = new ChartConstructor(canvas, {
                    width: width,
                    height: height,
                    xAxis: s.xAxis,
                    yAxis: s.yAxis
                });
                this.chart.update({
                    data: processedData,
                    xAxis: s.xAxis,
                    yAxis: s.yAxis
                });
            }
        }
    }

    update(data) {
        if (data && data.data) {
            this.state.data = data.data;
            this.state.columns = Object.keys(this.state.data[0] || {});
            this.restoreUIState();
            this.renderChart();
            if (window.IntegratedGridManager) {
                window.IntegratedGridManager.triggerStateChange();
            }
        }
    }

    resize(width, height) {
        if (this.containerElement && this.state.data && this.state.data.length > 0) {
            this.renderChart();
        }
    }

    clone() {
        return new DataVizDashboardContent({
            state: JSON.parse(JSON.stringify(this.state))
        });
    }
}

// Bind subclasses to window registry if needed for modular access
window.IPanelContent = IPanelContent;
window.RichTextContent = RichTextContent;
window.CodeSnippetContent = CodeSnippetContent;
window.D3ChartContent = D3ChartContent;
window.DataVizDashboardContent = DataVizDashboardContent;