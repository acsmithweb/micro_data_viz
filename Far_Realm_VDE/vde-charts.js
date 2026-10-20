// ============================================================================
// VIRTUE EXECUTION MATRIX // V0.2.0 OOP FIXED // VDE-CHARTS.JS
// ============================================================================
// TARGET DOMAIN: 03_Entity_Actors (NPC Engine Visualizers)
// PRIMARY AGENT: System Architect
// DESIGN PATTERN: Polymorphism (Unified Chart Base & Children)
// ============================================================================

/**
 * Helper utility to return transform translate strings.
 */
function translate(x, y) {
    return `translate(${x}, ${y})`;
}

/**
 * Aggregation helper function for dataset transforms.
 */
function getAggregateFunction(type, rows, xKey, yKey) {
    if (!rows || rows.length === 0) return [];
    if (!type || type === "Raw") return rows;

    const validRows = rows.filter(r => r && r[xKey] !== undefined && r[xKey] !== null);
    const grouped = d3.group(validRows, d => String(d[xKey]));

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

/**
 * POLYMORPHIC D3 CHART BASE CLASS
 */
class VizChart {
    constructor(containerElement, config = {}) {
        this.containerElement = containerElement;
        this.container = d3.select(containerElement);
        this.cfg = Object.assign({
            width: 400,
            height: 250,
            margin: { top: 20, right: 30, bottom: 60, left: 60 },
            xKey: "label",
            yKey: "value",
            color: null,
            chartPalette: null,
            textColor: null,
            backgroundColor: null,
            borderColor: null
        }, config);

        this.updateDimensions(this.cfg.width, this.cfg.height);
        this.container.style("position", "relative");

        // Ensure a single persistent tooltip per container element
        this.tooltip = this.container.select(".viz-tooltip");
        if (this.tooltip.empty()) {
            const tooltipBg = this.cfg.backgroundColor || "rgba(13, 13, 13, 0.95)";
            const tooltipBorder = this.cfg.color || "#ff7b00";
            const tooltipText = this.cfg.textColor || "#fff";

            this.tooltip = this.container.append("div")
                .attr("class", "viz-tooltip")
                .style("position", "absolute")
                .style("visibility", "hidden")
                .style("opacity", "0")
                .style("background", tooltipBg)
                .style("color", tooltipText)
                .style("border", `1px solid ${tooltipBorder}`)
                .style("padding", "8px 12px")
                .style("border-radius", "4px")
                .style("font-size", "11px")
                .style("pointer-events", "none")
                .style("box-shadow", "0 4px 15px rgba(0,0,0,0.5)")
                .style("z-index", "1000")
                .style("transition", "opacity 0.1s ease");
        }

        // Ensure table wrappers from previous TableChart instances are removed
        this.container.selectAll(".viz-table-wrapper").remove();

        // Ensure SVG root exists without destroying outer container
        this.svg = this.container.select("svg.viz-svg");
        if (this.svg.empty()) {
            this.svg = this.container.append("svg")
                .attr("class", "viz-svg")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("viewBox", `0 0 ${this.cfg.width} ${this.cfg.height}`)
                .attr("preserveAspectRatio", "xMidYMid meet");
        } else {
            this.svg.attr("viewBox", `0 0 ${this.cfg.width} ${this.cfg.height}`);
            this.svg.style("display", "block");
            this.svg.selectAll("*").remove();
        }

        this.g = this.svg.append("g")
            .attr("transform", translate(this.cfg.margin.left, this.cfg.margin.top));
    }

    /**
     * Recalculates canvas boundaries dynamically on window or panel resize.
     */
    updateDimensions(width, height) {
        this.cfg.width = Math.max(100, width || 400);
        this.cfg.height = Math.max(100, height || 250);
        this.innerWidth = Math.max(10, this.cfg.width - this.cfg.margin.left - this.cfg.margin.right);
        this.innerHeight = Math.max(10, this.cfg.height - this.cfg.margin.top - this.cfg.margin.bottom);
        if (this.svg) {
            this.svg.attr("viewBox", `0 0 ${this.cfg.width} ${this.cfg.height}`);
        }
    }

    showTooltip(html, event) {
        if (!this.tooltip) return;
        this.tooltip.style("visibility", "visible")
            .style("opacity", "1")
            .html(html);
        this.moveTooltip(event);
    }

    moveTooltip(event) {
        if (!this.tooltip || !event) return;
        try {
            const node = this.container.node();
            if (!node) return;
            const [x, y] = d3.pointer(event, node);
            if (isFinite(x) && isFinite(y)) {
                this.tooltip
                    .style("left", (x + 15) + "px")
                    .style("top", (y - 15) + "px");
            }
        } catch (e) {
            // Guard against detached pointer events during DOM updates
        }
    }

    hideTooltip() {
        if (!this.tooltip) return;
        this.tooltip
            .style("visibility", "hidden")
            .style("opacity", "0");
    }

    renderEmptyState(message = "No data matching active criteria") {
        this.g.selectAll("*").remove();
        this.g.append("text")
            .attr("x", this.innerWidth / 2)
            .attr("y", this.innerHeight / 2)
            .attr("text-anchor", "middle")
            .style("fill", this.getAxisColor())
            .style("font-size", "12px")
            .style("font-family", "monospace")
            .text(message);
    }

    getChartColor(index = 0) {
        if (this.cfg.chartPalette && this.cfg.chartPalette.length > 0) {
            return this.cfg.chartPalette[index % this.cfg.chartPalette.length];
        }
        const defaultPalette = ['#89b4fa', '#f5c2e7', '#a6e3a1', '#f9e2af', '#cba6f7', '#fab387', '#f38ba8'];
        return defaultPalette[index % defaultPalette.length];
    }

    getAxisColor() {
        return this.cfg.textColor || "#888";
    }

    getPrimaryColor() {
        return this.cfg.color || "#ff7b00";
    }

    getColorScale(domain) {
        const validDomain = (domain || []).map(String);
        if (this.cfg.chartPalette && this.cfg.chartPalette.length > 0) {
            return d3.scaleOrdinal()
                .domain(validDomain)
                .range(this.cfg.chartPalette);
        }
        const defaultPalette = ['#89b4fa', '#f5c2e7', '#a6e3a1', '#f9e2af', '#cba6f7', '#fab387', '#f38ba8'];
        return d3.scaleOrdinal()
            .domain(validDomain)
            .range(defaultPalette);
    }

    destroy() {
        this.hideTooltip();
        if (this.container) {
            this.container.selectAll(".viz-tooltip").remove();
            this.container.selectAll(".viz-table-wrapper").remove();
            this.container.selectAll("svg.viz-svg").remove();
        }
    }
}

/**
 * CONCRETE BAR CHART CLASS
 */
class BarChart extends VizChart {
    update({ data, xAxis, yAxis, width, height }) {
        if (width || height) this.updateDimensions(width, height);
        this.container.selectAll('.viz-table-wrapper').remove();
        if (this.svg) this.svg.style('display', 'block');
        this.g.selectAll("*").remove();

        if (!data || data.length === 0) {
            this.renderEmptyState("No data matching active criteria");
            return;
        }

        const x = d3.scaleBand()
            .domain(data.map(d => String(d[xAxis])))
            .range([0, this.innerWidth])
            .padding(0.2);

        const rawMax = d3.max(data, d => +d[yAxis] || 0);
        const maxY = Math.max(1, isFinite(rawMax) ? rawMax : 1);

        const y = d3.scaleLinear()
            .domain([0, maxY])
            .nice()
            .range([this.innerHeight, 0]);

        this.g.append("g")
            .attr("transform", translate(0, this.innerHeight))
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .style("fill", this.getAxisColor())
            .style("font-size", "9px");

        this.g.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("fill", this.getAxisColor())
            .style("font-size", "9px");

        this.g.selectAll(".domain").style("stroke", this.cfg.borderColor || "#333");
        this.g.selectAll(".tick line").style("stroke", this.cfg.borderColor || "#333");

        this.g.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(String(d[xAxis])) || 0)
            .attr("y", d => {
                const pos = y(+d[yAxis] || 0);
                return isFinite(pos) ? pos : this.innerHeight;
            })
            .attr("width", x.bandwidth())
            .attr("height", d => {
                const pos = y(+d[yAxis] || 0);
                return isFinite(pos) ? Math.max(0, this.innerHeight - pos) : 0;
            })
            .attr("fill", this.getPrimaryColor())
            .attr("rx", 3)
            .on("mouseover", (event, d) => {
                const html = `<strong>${d[xAxis]}</strong><br/>${yAxis}: ${(+(d[yAxis] || 0)).toLocaleString()}`;
                this.showTooltip(html, event);
            })
            .on("mousemove", (event) => this.moveTooltip(event))
            .on("mouseleave", () => this.hideTooltip());
    }
}

/**
 * CONCRETE LINE CHART CLASS
 */
class LineChart extends VizChart {
    update({ data, xAxis, yAxis, width, height }) {
        if (width || height) this.updateDimensions(width, height);
        this.container.selectAll('.viz-table-wrapper').remove();
        if (this.svg) this.svg.style('display', 'block');
        this.g.selectAll("*").remove();

        if (!data || data.length === 0) {
            this.renderEmptyState("No data matching active criteria");
            return;
        }

        const x = d3.scalePoint()
            .domain(data.map(d => String(d[xAxis])))
            .range([0, this.innerWidth])
            .padding(0.5);

        const rawMax = d3.max(data, d => +d[yAxis] || 0);
        const maxY = Math.max(1, isFinite(rawMax) ? rawMax : 1);

        const y = d3.scaleLinear()
            .domain([0, maxY])
            .nice()
            .range([this.innerHeight, 0]);

        this.g.append("g")
            .attr("transform", translate(0, this.innerHeight))
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .style("fill", this.getAxisColor())
            .style("font-size", "9px");

        this.g.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("fill", this.getAxisColor())
            .style("font-size", "9px");

        this.g.selectAll(".domain").style("stroke", this.cfg.borderColor || "#333");
        this.g.selectAll(".tick line").style("stroke", this.cfg.borderColor || "#333");

        const lineGen = d3.line()
            .x(d => x(String(d[xAxis])) || 0)
            .y(d => {
                const pos = y(+d[yAxis] || 0);
                return isFinite(pos) ? pos : this.innerHeight;
            });

        this.g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", this.getPrimaryColor())
            .attr("stroke-width", 3)
            .attr("d", lineGen);

        this.g.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(String(d[xAxis])) || 0)
            .attr("cy", d => {
                const pos = y(+d[yAxis] || 0);
                return isFinite(pos) ? pos : this.innerHeight;
            })
            .attr("r", 5)
            .attr("fill", this.getChartColor(1))
            .attr("stroke", this.cfg.backgroundColor || "#1a1a1a")
            .attr("stroke-width", 1.5)
            .on("mouseover", (event, d) => {
                const html = `<strong>${d[xAxis]}</strong><br/>${yAxis}: ${(+(d[yAxis] || 0)).toLocaleString()}`;
                this.showTooltip(html, event);
            })
            .on("mousemove", (event) => this.moveTooltip(event))
            .on("mouseleave", () => this.hideTooltip());
    }
}

/**
 * CONCRETE STACKED BAR CHART CLASS
 */
class StackedBarChart extends VizChart {
    update({ data, xAxis, stackKeys, width, height }) {
        if (width || height) this.updateDimensions(width, height);
        this.container.selectAll('.viz-table-wrapper').remove();
        if (this.svg) this.svg.style('display', 'block');
        this.g.selectAll("*").remove();

        if (!data || data.length === 0 || !stackKeys || stackKeys.length === 0) {
            this.renderEmptyState("No data matching active criteria");
            return;
        }

        const validStackKeys = stackKeys.map(String);
        const x = d3.scaleBand()
            .domain(data.map(d => String(d[xAxis])))
            .range([0, this.innerWidth])
            .padding(0.2);

        const rawMax = d3.max(data, d => {
            let sum = 0;
            validStackKeys.forEach(k => sum += (+d[k] || 0));
            return sum;
        });
        const maxY = Math.max(1, isFinite(rawMax) ? rawMax : 1);

        const y = d3.scaleLinear()
            .domain([0, maxY])
            .nice()
            .range([this.innerHeight, 0]);

        const color = this.getColorScale(validStackKeys);
        const stackedData = d3.stack().keys(validStackKeys)(data);

        this.g.append("g")
            .attr("transform", translate(0, this.innerHeight))
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .style("fill", this.getAxisColor())
            .style("font-size", "9px");

        this.g.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .style("fill", this.getAxisColor())
            .style("font-size", "9px");

        this.g.selectAll(".domain").style("stroke", this.cfg.borderColor || "#333");
        this.g.selectAll(".tick line").style("stroke", this.cfg.borderColor || "#333");

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
            .attr("x", d => x(String(d.data[xAxis])) || 0)
            .attr("y", d => {
                const pos = y(d[1]);
                return isFinite(pos) ? pos : this.innerHeight;
            })
            .attr("height", d => {
                const y0 = y(d[0]);
                const y1 = y(d[1]);
                return (isFinite(y0) && isFinite(y1)) ? Math.max(0, y0 - y1) : 0;
            })
            .attr("width", x.bandwidth())
            .on("mouseover", (event, d) => {
                const parentGroup = event.currentTarget.parentNode;
                const segmentKey = d3.select(parentGroup).datum().key;
                const segmentValue = (d[1] - d[0]) || 0;
                const html = `<strong>${d.data[xAxis]}</strong><br/>Category: <span class="badge bg-secondary font-monospace" style="font-size: 9px;">${segmentKey}</span><br/>Value: ${segmentValue.toLocaleString()}`;
                this.showTooltip(html, event);
            })
            .on("mousemove", (event) => this.moveTooltip(event))
            .on("mouseleave", () => this.hideTooltip());
    }
}

/**
 * CONCRETE PIE CHART CLASS
 */
class PieChart extends VizChart {
    update({ data, xAxis, yAxis, width, height }) {
        if (width || height) this.updateDimensions(width, height);
        this.container.selectAll('.viz-table-wrapper').remove();
        if (this.svg) this.svg.style('display', 'block');
        this.g.selectAll("*").remove();

        const validData = (data || []).filter(d => (+d[yAxis] || 0) > 0);
        if (validData.length === 0) {
            this.renderEmptyState("No data matching active criteria");
            return;
        }

        const radius = Math.max(10, Math.min(this.innerWidth, this.innerHeight) / 2);
        const mainG = this.g.append("g")
            .attr("transform", translate(this.innerWidth / 2, this.innerHeight / 2));

        const color = this.getColorScale(validData.map(d => String(d[xAxis])));
        const pie = d3.pie().value(d => +d[yAxis] || 0);
        const arc = d3.arc().innerRadius(radius * 0.4).outerRadius(radius);

        const arcs = mainG.selectAll(".arc")
            .data(pie(validData))
            .enter()
            .append("g")
            .attr("class", "arc");

        arcs.append("path")
            .attr("d", arc)
            .attr("fill", d => color(String(d.data[xAxis])))
            .attr("stroke", this.cfg.backgroundColor || "#151515")
            .attr("stroke-width", 2)
            .on("mouseover", (event, d) => {
                const total = d3.sum(validData, x => +x[yAxis] || 0);
                const percent = total > 0 ? ((d.data[yAxis] / total) * 100).toFixed(1) : 0;
                const html = `<strong>${d.data[xAxis]}</strong><br/>${yAxis}: ${(+(d.data[yAxis] || 0)).toLocaleString()} (${percent}%)`;
                this.showTooltip(html, event);
            })
            .on("mousemove", (event) => this.moveTooltip(event))
            .on("mouseleave", () => this.hideTooltip());
    }
}

/**
 * CONCRETE TABLE CHART CLASS
 */
class TableChart extends VizChart {
    update({ data, xAxis, yAxis }) {
        this.container.selectAll(".viz-table-wrapper").remove();

        if (!data || data.length === 0) {
            this.svg.style("display", "block");
            this.renderEmptyState("No data matching active criteria");
            return;
        }

        this.svg.style("display", "none");
        const wrapper = this.container.append("div")
            .attr("class", "table-responsive viz-table-wrapper")
            .style("height", "100%")
            .style("overflow-y", "auto");

        const table = wrapper.append("table")
            .attr("class", "table table-dark table-striped table-hover table-bordered font-monospace text-start small mt-2")
            .style("margin", "0");

        const thead = table.append("thead").append("tr");
        thead.append("th").style("color", this.getPrimaryColor()).text(xAxis);
        thead.append("th").style("color", this.getPrimaryColor()).text(yAxis);

        const tbody = table.append("tbody");
        const rows = tbody.selectAll("tr")
            .data(data)
            .enter()
            .append("tr");

        rows.append("td").text(d => d[xAxis]);
        rows.append("td").text(d => (+d[yAxis] || 0).toLocaleString());
    }
}

/**
 * CONCRETE WORD CLOUD CHART CLASS
 */
class WordCloudChart extends VizChart {
    update({ data, xAxis, yAxis, width, height }) {
        if (width || height) this.updateDimensions(width, height);
        this.container.selectAll('.viz-table-wrapper').remove();
        if (this.svg) this.svg.style('display', 'block');
        this.g.selectAll("*").remove();

        // Cancel any pending async layout computation before triggering a new run
        if (this.currentLayout) {
            try { this.currentLayout.stop(); } catch (e) {}
            this.currentLayout = null;
        }

        if (!data || data.length === 0) {
            this.renderEmptyState("No data matching active criteria");
            return;
        }

        if (!window.d3 || !window.d3.layout || !window.d3.layout.cloud) {
            this.renderEmptyState("D3 Cloud Layout Library not loaded");
            return;
        }

        const words = data.map(d => ({
            text: String(d[xAxis]),
            size: +d[yAxis] || 10
        }));

        const rawMax = d3.max(words, d => d.size);
        const rawMin = d3.min(words, d => d.size);
        const minSize = Math.max(1, isFinite(rawMin) ? rawMin : 1);
        const maxSize = Math.max(minSize + 1, isFinite(rawMax) ? rawMax : minSize + 1);

        const sizeScale = d3.scaleLinear()
            .domain([minSize, maxSize])
            .range([10, 36]);

        const self = this;
        this.currentLayout = d3.layout.cloud()
            .size([this.innerWidth, this.innerHeight])
            .words(words)
            .padding(4)
            .rotate(() => (Math.random() > 0.5 ? 0 : 90))
            .fontSize(d => sizeScale(d.size))
            .on("end", (drawWords) => {
                self.g.selectAll("*").remove();
                self.g.append("g")
                    .attr("transform", translate(self.innerWidth / 2, self.innerHeight / 2))
                    .selectAll("text")
                    .data(drawWords)
                    .enter()
                    .append("text")
                    .style("font-size", d => `${d.size}px`)
                    .style("font-family", "monospace")
                    .style("fill", (d, i) => self.getChartColor(i))
                    .attr("text-anchor", "middle")
                    .attr("transform", d => translate(d.x, d.y) + `rotate(${d.rotate})`)
                    .text(d => d.text)
                    .on("mouseover", (event, d) => {
                        const html = `<strong>${d.text}</strong><br/>Weight: ${d.size}`;
                        self.showTooltip(html, event);
                    })
                    .on("mousemove", (event) => self.moveTooltip(event))
                    .on("mouseleave", () => self.hideTooltip());
            });

        this.currentLayout.start();
    }
}

// Global polymorphic registry
window.CHART_REGISTRY = {
    "Bar Chart": BarChart,
    "Line Chart": LineChart,
    "Stacked Bar Chart": StackedBarChart,
    "Pie Chart": PieChart,
    "Table Chart": TableChart,
    "Word Cloud Chart": WordCloudChart
};