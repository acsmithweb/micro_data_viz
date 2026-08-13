/**
 *  Project Narayah - Integrated Grid Governance (v0.0.9)
 *  Core Architect: Riker Stonesoul
 *  Pattern: Bridge, Adapter, Singleton, Strategy, Prototype, Observer
 *  
 *  Unified Multi-Bucket Gridstack.js layout and dynamic data-visualization platform.
 *  Allows dynamic workspace grouping, state synchronization, backward compatibility,
 *  and local CSV-based exploratory data visualization.
 */

// =========================================================
// 1. DATA AGGREGATION & GRAPHICS HELPER UTILITIES
// =========================================================

function translate(x, y) {
    return `translate(${x}, ${y})`;
}

function getAggregateFunction(type, rows, xKey, yKey) {
    if (!rows || rows.length === 0) return [];
    if (!type || type === "Raw") return rows;

    // Group elements by the categorical X-Axis Key
    const grouped = d3.group(rows, d => d[xKey]);
    
    return Array.from(grouped, ([key, groupRows]) => {
        const result = { [xKey]: key };
        if (type === "Count") {
            result[yKey] = groupRows.length;
        } else if (type === "Sum") {
            result[yKey] = d3.sum(groupRows, d => +d[yKey] || 0);
        } else if (type === "Avg") {
            result[yKey] = d3.mean(groupRows, d => +d[yKey] || 0) || 0;
        }
        return result;
    });
}

window.getAggregateFunction = getAggregateFunction;

// =========================================================
// 2. POLYMORPHIC D3 CHART LINEAGE (VizChart Base & Children)
// =========================================================

class VizChart {
    constructor(containerElement, config = {}) {
        this.container = d3.select(containerElement);
        this.cfg = Object.assign({
            width: 400,
            height: 250,
            margin: { top: 20, right: 30, bottom: 60, left: 60 },
            xKey: "label",
            yKey: "value"
        }, config);

        this.innerWidth = this.cfg.width - this.cfg.margin.left - this.cfg.margin.right;
        this.innerHeight = this.cfg.height - this.cfg.margin.top - this.cfg.margin.bottom;

        // Ensure absolute positioning context for tooltips
        this.container.style("position", "relative");

        // Sealed Tooltip Reliquary
        this.tooltip = this.container.select(".viz-tooltip");
        if (this.tooltip.empty()) {
            this.tooltip = this.container.append("div")
                .attr("class", "viz-tooltip")
                .style("position", "absolute")
                .style("visibility", "hidden")
                .style("background", "rgba(13, 13, 13, 0.95)")
                .style("color", "#fff")
                .style("border", "1px solid #ff7b00")
                .style("padding", "8px 12px")
                .style("border-radius", "4px")
                .style("font-size", "11px")
                .style("pointer-events", "none")
                .style("box-shadow", "0 4px 15px rgba(0,0,0,0.5)")
                .style("z-index", "1000")
                .style("transition", "opacity 0.1s ease");
        }

        // Svg Canvas Assembly
        this.svg = this.container.select("svg");
        if (this.svg.empty()) {
            this.svg = this.container.append("svg")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("viewBox", `0 0 ${this.cfg.width} ${this.cfg.height}`)
                .attr("preserveAspectRatio", "xMidYMid meet");
        } else {
            this.svg.style("display", "block"); // Reset display state in case Table was active
            this.svg.selectAll("*").remove();
        }

        this.g = this.svg.append("g")
            .attr("transform", `translate(${this.cfg.margin.left}, ${this.cfg.margin.top})`);
    }

    showTooltip(html, event) {
        this.tooltip.style("visibility", "visible")
            .style("opacity", "1")
            .html(html);
        this.moveTooltip(event);
    }

    moveTooltip(event) {
        const [x, y] = d3.pointer(event, this.container.node());
        this.tooltip
            .style("left", (x + 15) + "px")
            .style("top", (y - 15) + "px");
    }

    hideTooltip() {
        this.tooltip
            .style("visibility", "hidden")
            .style("opacity", "0");
    }
}

// ------------------- BAR CHART -------------------
class BarChart extends VizChart {
    update({ data, xAxis, yAxis }) {
        if (!data || data.length === 0) return;
        this.g.selectAll("*").remove();

        const x = d3.scaleBand()
            .domain(data.map(d => d[xAxis]))
            .range([0, this.innerWidth])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d[yAxis] || 0)])
            .nice()
            .range([this.innerHeight, 0]);

        // Render Axes
        this.g.append("g")
            .attr("transform", translate(0, this.innerHeight))
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .style("fill", "#888")
            .style("font-size", "9px");

        this.g.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("fill", "#888")
            .style("font-size", "9px");

        this.g.selectAll(".domain").style("stroke", "#333");
        this.g.selectAll(".tick line").style("stroke", "#333");

        // Draw Bars with Tooltips
        this.g.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d[xAxis]))
            .attr("y", d => y(+d[yAxis] || 0))
            .attr("width", x.bandwidth())
            .attr("height", d => this.innerHeight - y(+d[yAxis] || 0))
            .attr("fill", this.cfg.color || "#ff7b00")
            .attr("rx", 3)
            .on("mouseover", (event, d) => {
                const html = `<strong>${d[xAxis]}</strong><br/>${yAxis}: ${(+d[yAxis]).toLocaleString()}`;
                this.showTooltip(html, event);
            })
            .on("mousemove", (event) => this.moveTooltip(event))
            .on("mouseleave", () => this.hideTooltip());
    }
}

// ------------------- LINE CHART -------------------
class LineChart extends VizChart {
    update({ data, xAxis, yAxis }) {
        if (!data || data.length === 0) return;
        this.g.selectAll("*").remove();

        const x = d3.scalePoint()
            .domain(data.map(d => d[xAxis]))
            .range([0, this.innerWidth])
            .padding(0.5);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d[yAxis] || 0)])
            .nice()
            .range([this.innerHeight, 0]);

        // Render Axes
        this.g.append("g")
            .attr("transform", translate(0, this.innerHeight))
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .style("fill", "#888")
            .style("font-size", "9px");

        this.g.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("fill", "#888")
            .style("font-size", "9px");

        this.g.selectAll(".domain").style("stroke", "#333");
        this.g.selectAll(".tick line").style("stroke", "#333");

        // Line Generator
        const lineGen = d3.line()
            .x(d => x(d[xAxis]))
            .y(d => y(+d[yAxis] || 0));

        this.g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", this.cfg.color || "#ff7b00")
            .attr("stroke-width", 3)
            .attr("d", lineGen);

        // Interactive Dots with Tooltips
        this.g.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d[xAxis]))
            .attr("cy", d => y(+d[yAxis] || 0))
            .attr("r", 5)
            .attr("fill", "#ffaa44")
            .attr("stroke", "#1a1a1a")
            .attr("stroke-width", 1.5)
            .on("mouseover", (event, d) => {
                const html = `<strong>${d[xAxis]}</strong><br/>${yAxis}: ${(+d[yAxis]).toLocaleString()}`;
                this.showTooltip(html, event);
            })
            .on("mousemove", (event) => this.moveTooltip(event))
            .on("mouseleave", () => this.hideTooltip());
    }
}

// ------------------- STACKED BAR CHART -------------------
class StackedBarChart extends VizChart {
    update({ data, xAxis, stackKeys }) {
        if (!data || data.length === 0 || !stackKeys || stackKeys.length === 0) return;
        this.g.selectAll("*").remove();

        const x = d3.scaleBand()
            .domain(data.map(d => d[xAxis]))
            .range([0, this.innerWidth])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => {
                let sum = 0;
                stackKeys.forEach(k => sum += (+d[k] || 0));
                return sum;
            })])
            .nice()
            .range([this.innerHeight, 0]);

        const color = d3.scaleOrdinal()
            .domain(stackKeys)
            .range(["#ff7b00", "#ffaa44", "#39c5bb", "#00ff66", "#0d6efd", "#dc3545", "#e06c00"]);

        const stackedData = d3.stack().keys(stackKeys)(data);

        // Render Axes
        this.g.append("g")
            .attr("transform", translate(0, this.innerHeight))
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .style("fill", "#888")
            .style("font-size", "9px");

        this.g.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("fill", "#888")
            .style("font-size", "9px");

        this.g.selectAll(".domain").style("stroke", "#333");
        this.g.selectAll(".tick line").style("stroke", "#333");

        // Render Layers
        this.g.append("g")
            .selectAll("g")
            .data(stackedData)
            .enter()
            .append("g")
            .attr("fill", d => color(d.key))
            .selectAll("rect")
            .data(d => d)
            .enter()
            .append("rect")
            .attr("x", d => x(d.data[xAxis]))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth())
            .on("mouseover", (event, d) => {
                const parentGroup = event.currentTarget.parentNode;
                const segmentKey = d3.select(parentGroup).datum().key;
                const segmentValue = d[1] - d[0];
                const html = `<strong>${d.data[xAxis]}</strong><br/>Category: <span class="badge bg-secondary font-monospace" style="font-size: 9px;">${segmentKey}</span><br/>Count/Value: ${segmentValue.toLocaleString()}`;
                this.showTooltip(html, event);
            })
            .on("mousemove", (event) => this.moveTooltip(event))
            .on("mouseleave", () => this.hideTooltip());
    }
}

// ------------------- PIE CHART -------------------
class PieChart extends VizChart {
    update({ data, xAxis, yAxis }) {
        if (!data || data.length === 0) return;
        this.g.selectAll("*").remove();

        const radius = Math.min(this.innerWidth, this.innerHeight) / 2;
        const mainG = this.g.append("g")
            .attr("transform", translate(this.innerWidth / 2, this.innerHeight / 2));

        const color = d3.scaleOrdinal()
            .domain(data.map(d => d[xAxis]))
            .range(["#ff7b00", "#ffaa44", "#39c5bb", "#00ff66", "#0d6efd", "#dc3545", "#bd00ff"]);

        const pie = d3.pie().value(d => +d[yAxis] || 0);
        const arc = d3.arc().innerRadius(radius * 0.4).outerRadius(radius); // Donut style configuration

        const arcs = mainG.selectAll(".arc")
            .data(pie(data))
            .enter()
            .append("g")
            .attr("class", "arc");

        arcs.append("path")
            .attr("d", arc)
            .attr("fill", d => color(d.data[xAxis]))
            .attr("stroke", "#151515")
            .attr("stroke-width", 2)
            .on("mouseover", (event, d) => {
                const total = d3.sum(data, x => +x[yAxis] || 0);
                const percent = total > 0 ? ((d.data[yAxis] / total) * 100).toFixed(1) : 0;
                const html = `<strong>${d.data[xAxis]}</strong><br/>${yAxis}: ${(+d.data[yAxis]).toLocaleString()} (${percent}%)`;
                this.showTooltip(html, event);
            })
            .on("mousemove", (event) => this.moveTooltip(event))
            .on("mouseleave", () => this.hideTooltip());
    }
}

// ------------------- TABLE CHART -------------------
class TableChart extends VizChart {
    update({ data, xAxis, yAxis }) {
        if (!data || data.length === 0) return;
        this.container.selectAll("table").remove();
        this.svg.style("display", "none"); // Hide graphical context

        const wrapper = this.container.append("div")
            .attr("class", "table-responsive")
            .style("height", "100%")
            .style("overflow-y", "auto");

        const table = wrapper.append("table")
            .attr("class", "table table-dark table-striped table-hover table-bordered font-monospace text-start small mt-2")
            .style("margin", "0");

        const thead = table.append("thead").append("tr");
        thead.append("th").style("color", "#ff7b00").text(xAxis);
        thead.append("th").style("color", "#ff7b00").text(yAxis);

        const tbody = table.append("tbody");
        const rows = tbody.selectAll("tr")
            .data(data)
            .enter()
            .append("tr");

        rows.append("td").text(d => d[xAxis]);
        rows.append("td").text(d => (+d[yAxis] || 0).toLocaleString());
    }
}

// ------------------- WORD CLOUD CHART -------------------
class WordCloudChart extends VizChart {
    update({ data, xAxis, yAxis }) {
        if (!data || data.length === 0) return;
        this.g.selectAll("*").remove();

        if (!window.d3 || !window.d3.layout || !window.d3.layout.cloud) {
            this.container.append("div")
                .style("color", "#ffaa44")
                .style("padding", "20px")
                .style("font-family", "monospace")
                .text("D3 Cloud Layout Library not loaded. Please include d3.layout.cloud.min.js to view Word Cloud.");
            return;
        }

        const words = data.map(d => ({
            text: String(d[xAxis]),
            size: +d[yAxis] || 10
        }));

        const maxSize = d3.max(words, d => d.size) || 1;
        const minSize = d3.min(words, d => d.size) || 1;

        const sizeScale = d3.scaleLinear()
            .domain([minSize, maxSize])
            .range([14, 50]);

        const layout = d3.layout.cloud()
            .size([this.innerWidth, this.innerHeight])
            .words(words)
            .padding(4)
            .rotate(() => (Math.random() > 0.5 ? 0 : 90))
            .fontSize(d => sizeScale(d.size))
            .on("end", (drawWords) => {
                this.g.append("g")
                    .attr("transform", translate(this.innerWidth / 2, this.innerHeight / 2))
                    .selectAll("text")
                    .data(drawWords)
                    .enter()
                    .append("text")
                    .style("font-size", d => `${d.size}px`)
                    .style("font-family", "monospace")
                    .style("fill", () => d3.schemeCategory10[Math.floor(Math.random() * 10)])
                    .attr("text-anchor", "middle")
                    .attr("transform", d => `translate(${d.x}, ${d.y})rotate(${d.rotate})`)
                    .text(d => d.text)
                    .on("mouseover", (event, d) => {
                        const html = `<strong>${d.text}</strong><br/>Weight: ${d.size}`;
                        this.showTooltip(html, event);
                    })
                    .on("mousemove", (event) => this.moveTooltip(event))
                    .on("mouseleave", () => this.hideTooltip());
            });

        layout.start();
    }
}

// Global registry export
window.CHART_REGISTRY = {
    "Bar Chart": BarChart,
    "Line Chart": LineChart,
    "Stacked Bar Chart": StackedBarChart,
    "Pie Chart": PieChart,
    "Table Chart": TableChart,
    "Word Cloud Chart": WordCloudChart
};

// =========================================================
// 3. THE BRIDGE: IMPLEMENTATION INTERFACE
// =========================================================

class IPanelContent {
    constructor(config = {}) {
        this.config = config;
        this.panel = null; // back-reference to parent BaseGridPanel
    }
    render(containerElement) {
        throw new Error("Render protocol must be implemented by subclasses.");
    }
    update(data) {
        // Optional state hook
    }
    resize(width, height) {
        // Optional resize callback
    }
}

// =========================================================
// 4. CONCRETE IMPLEMENTATION: RICH TEXT CONTENT (MD/HTML)
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

        // Action Menu (Floating controls for editing transitions)
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
            // Render Textarea for active editing state
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
            // Render compiled output preview
            const preview = bodyArea.append("div")
                .attr("class", "vde-markdown-preview text-white")
                .style("font-size", "12px")
                .style("line-height", "1.6");

            if (this.config.contentType === "markdown") {
                preview.html(this.parseMarkdown(this.config.sourceText || ""));
            } else {
                preview.html(this.config.sourceText || "");
            }

            // Bind triggers for double-click transitions
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
        }
    }

    parseMarkdown(text) {
        if (!text) return "";
        let html = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/^&gt; (.*)$/gim, "<blockquote>$1</blockquote>")
            .replace(/^### (.*)$/gim, "<h3>$1</h3>")
            .replace(/^## (.*)$/gim, "<h2>$1</h2>")
            .replace(/^# (.*)$/gim, "<h1>$1</h1>")
            .replace(/\`\`\`([\s\S]*?)\`\`\`/gm, (match, code) => `<pre><code>${code}</code></pre>`)
            .replace(/\`(.*?)\`/g, "<code>$1</code>")
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .replace(/^\* (.*)$/gim, "<li>$1</li>")
            .replace(/^- (.*)$/gim, "<li>$1</li>");
            
        html = html.replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>");
        html = html.replace(/<\/ul>\s*<ul>/g, "");

        return html.trim();
    }
}

// =========================================================
// 5. CONCRETE IMPLEMENTATION: D3 CHART CONTENT
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
        const ChartClass = window.CHART_REGISTRY[chartType];
        
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
    }

    resize(width, height) {
        if (this.containerElement) {
            this.render(this.containerElement);
        }
    }
}

// =========================================================
// 6. CONCRETE IMPLEMENTATION: COMPREHENSIVE DATA VIZ DASHBOARD
// =========================================================

class DataVizDashboardContent extends IPanelContent {
    constructor(config = {}) {
        super(config);
        this.containerElement = null;
        this.chart = null;

        // Establish the sealed internal exploratory state
        this.state = Object.assign({
            data: [],         // Raw parsed CSV rows
            columns: [],      // File headers
            xAxis: "",        // Mapped X category column
            yAxis: "",        // Mapped Y metric column
            transform: "Raw", // Metric transformation selection
            chartType: "Bar Chart",
            filters: []       // Array of filter configurations
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
                        <option value="Raw">Raw (No Aggregation)</option>
                        <option value="Sum">Sum</option>
                        <option value="Avg">Average</option>
                        <option value="Count">Count</option>
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

        // Restore dynamic UI state elements if returning to a hydrated dashboard
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

        // Apply clean filtering
        const filteredData = this.applyFilters(s.data, s.filters);

        // Compute metrics aggregations
        let processedData;
        if (s.transform && s.transform !== "Raw") {
            processedData = getAggregateFunction(s.transform, filteredData, s.xAxis, s.yAxis);
        } else {
            processedData = filteredData;
        }

        const ChartConstructor = window.CHART_REGISTRY[s.chartType];
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
                        row[k] = (row[k] || 0) + 1; // Count segments
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
        }
    }

    resize(width, height) {
        if (this.containerElement && this.state.data && this.state.data.length > 0) {
            this.renderChart();
        }
    }
}

// =========================================================
// 7. THE BRIDGE: ABSTRACTION (THE WIDGET WRAPPER ITEM)
// =========================================================

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

        // Header (Draggable Zone)
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

        const closeBtn = document.createElement("span");
        closeBtn.className = "panel-close-btn text-danger fw-bold";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.fontSize = "13px";
        closeBtn.textContent = "✕";
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            this.destroy();
        };
        header.appendChild(closeBtn);

        inner.appendChild(header);

        // Content body viewport
        const body = document.createElement("div");
        body.className = "vde-panel-body flex-grow-1 overflow-hidden position-relative";
        body.style.height = "calc(100% - 28px)";
        inner.appendChild(body);

        el.appendChild(inner);
        this.el = el;

        // Render concrete implementation over the abstraction bridge
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
}

// =========================================================
// 8. THE CONTAINER VESSEL (GridBucket)
// =========================================================

class GridBucket {
    constructor(id, name, options = {}) {
        this.id = id;
        this.name = name;
        this.options = Object.assign({
            column: 12,
            cellHeight: 25,
            margin: 5,
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
        bucketCard.id = `vde-bucket-${this.id}`;
        bucketCard.style.border = "1px solid #333";
        bucketCard.style.backgroundColor = "#151515";
        bucketCard.style.borderRadius = "6px";
        bucketCard.style.overflow = "hidden";
        bucketCard.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";

        // Header
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

        // Collapsible setup pane
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
                <div class="col-md-2">
                    <label class="text-muted font-monospace small mb-1">Margin (px)</label>
                    <input type="number" class="form-control form-control-sm bucket-margin-input bg-dark text-white border-secondary font-monospace" value="${this.options.margin}">
                </div>
                <div class="col-md-3 text-end pt-3">
                    <button class="btn btn-sm btn-warning apply-bucket-settings-btn font-monospace fw-bold" style="font-size:11px;">Apply Settings</button>
                </div>
            </div>
        `;
        bucketCard.appendChild(settingsPane);

        // Grid stack element canvas wrapper
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

            this.name = nameInput;
            titleDiv.querySelector(".vde-bucket-title").textContent = this.name;
            titleDiv.querySelector(".badge").textContent = `Cols: ${colsInput}`;

            this.options.column = colsInput;
            this.options.cellHeight = heightInput;
            this.options.margin = marginInput;

            if (this.grid) {
                this.grid.column(colsInput);
                this.grid.cellHeight(heightInput);
                this.grid.margin(marginInput);
            }

            settingsPane.classList.add("d-none");
            window.IntegratedGridManager.triggerStateChange();
        };

        // Gridstack V10 setup
        const gridOptions = {
            column: this.options.column,
            cellHeight: this.options.cellHeight,
            margin: this.options.margin,
            acceptWidgets: ".grid-stack-item",
            draggable: { handle: ".vde-panel-header" },
            resizable: { handles: "se" }
        };

        this.grid = GridStack.init(gridOptions, gridElement);

        // Synchronize changes back to model registries
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
                        panel.bucketId = this.id; // Adopt widget inside this bucket
                        panel.x = item.x;
                        panel.y = item.y;
                        panel.w = item.w;
                        panel.h = item.h;

                        // Force responsive content resizing
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

// =========================================================
// 9. THE SINGLETON MATRIX ORCHESTRATOR
// =========================================================

class IntegratedGridManagerClass {
    constructor() {
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
        const text = initialText || `### Codex Unit\nDouble-click to write markdown.`;
        const content = new RichTextContent({
            contentType: "markdown",
            sourceText: text
        });

        return this.createPanel({
            title: "Codex Panel",
            content: content,
            w: 4,
            h: 8
        }, bucketId);
    }

    addChartWidget(chartType = "Bar Chart", bucketId = null) {
        const content = new D3ChartContent({
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
        });

        return this.createPanel({
            title: `${chartType} Panel`,
            content: content,
            w: 5,
            h: 10
        }, bucketId);
    }

    addDashboardWidget(bucketId = null) {
        const content = new DataVizDashboardContent();
        return this.createPanel({
            title: "Dynamic Analysis Sanctuary",
            content: content,
            w: 12,
            h: 14
        }, bucketId);
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
            vde_version: "4.0-Gridstack",
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
                    const panelConfig = {
                        id: panel.id,
                        x: panel.x,
                        y: panel.y,
                        w: panel.w,
                        h: panel.h,
                        title: panel.title,
                        contentType: panel.content instanceof RichTextContent ? "rich-text" : 
                                     panel.content instanceof DataVizDashboardContent ? "data-viz-dashboard" : "d3-chart"
                    };

                    if (panel.content instanceof RichTextContent) {
                        panelConfig.contentConfig = {
                            contentType: panel.content.config.contentType,
                            sourceText: panel.content.config.sourceText
                        };
                    } else if (panel.content instanceof DataVizDashboardContent) {
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
                    } else if (panel.content instanceof D3ChartContent) {
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

            // Backward compatibility checks for flat legacy structures (v3.0)
            if (!payload.buckets && Array.isArray(payload.panels)) {
                const legacyBucket = this.createBucket("Legacy Sanctuary", {
                    column: 12,
                    cellHeight: 25,
                    margin: 5
                });

                payload.panels.forEach(p => {
                    let contentInstance;
                    if (p.contentType === "rich-text") {
                        contentInstance = new RichTextContent(p.contentConfig);
                    } else if (p.contentType === "d3-chart") {
                        contentInstance = new D3ChartContent(p.contentConfig);
                    } else if (p.contentType === "data-viz-dashboard") {
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

            // Standard Multi-Bucket hydration
            if (Array.isArray(payload.buckets)) {
                payload.buckets.forEach(b => {
                    const bucket = this.createBucket(b.name, b.options);
                    if (bucket && Array.isArray(b.widgets)) {
                        b.widgets.forEach(w => {
                            let contentInstance;
                            if (w.contentType === "rich-text") {
                                contentInstance = new RichTextContent(w.contentConfig);
                            } else if (w.contentType === "d3-chart") {
                                contentInstance = new D3ChartContent(w.contentConfig);
                            } else if (w.contentType === "data-viz-dashboard") {
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
        if (this.stateChangeListener) {
            this.stateChangeListener();
        } else {
            const textarea = document.getElementById("vde-json-io");
            if (textarea) {
                textarea.value = this.exportVDE();
            }
        }
    }
}

// Instantiate and bind elements to global scope
const IntegratedGridManager = new IntegratedGridManagerClass();

window.IPanelContent = IPanelContent;
window.D3ChartContent = D3ChartContent;
window.RichTextContent = RichTextContent;
window.DataVizDashboardContent = DataVizDashboardContent;
window.BaseGridPanel = BaseGridPanel;
window.GridBucket = GridBucket;
window.IntegratedGridManager = IntegratedGridManager;

console.log("Narayah System Integration Governance: Active (Version 0.0.9 Multi-Bucket D3-Exploratory Gridstack Engine Instantiated)");
