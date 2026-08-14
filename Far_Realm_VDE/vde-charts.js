// ============================================================================
// VIRTUE EXECUTION MATRIX // V0.1.0 OOP // VDE-CHARTS.JS
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
 * 1. DATA AGGREGATION & GRAPHICS HELPER UTILITIES
 */
function getAggregateFunction(type, rows, xKey, yKey) {
    if (!rows || rows.length === 0) return [];
    if (!type || type === "Raw") return rows;

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

/**
 * 2. POLYMORPHIC D3 CHART LINEAGE (VizChart Base & Children)
 */
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

        this.container.style("position", "relative");

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

        this.svg = this.container.select("svg");
        if (this.svg.empty()) {
            this.svg = this.container.append("svg")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("viewBox", `0 0 ${this.cfg.width} ${this.cfg.height}`)
                .attr("preserveAspectRatio", "xMidYMid meet");
        } else {
            this.svg.style("display", "block");
            this.svg.selectAll("*").remove();
        }

        this.g = this.svg.append("g")
            .attr("transform", translate(this.cfg.margin.left, this.cfg.margin.top));
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

        const lineGen = d3.line()
            .x(d => x(d[xAxis]))
            .y(d => y(+d[yAxis] || 0));

        this.g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", this.cfg.color || "#ff7b00")
            .attr("stroke-width", 3)
            .attr("d", lineGen);

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
        const arc = d3.arc().innerRadius(radius * 0.4).outerRadius(radius);

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

class TableChart extends VizChart {
    update({ data, xAxis, yAxis }) {
        if (!data || data.length === 0) return;
        this.container.selectAll("table").remove();
        this.svg.style("display", "none");

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
                    .attr("transform", d => translate(d.x, d.y) + `rotate(${d.rotate})`)
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

// Global polymorphic lineage registration
window.CHART_REGISTRY = {
    "Bar Chart": BarChart,
    "Line Chart": LineChart,
    "Stacked Bar Chart": StackedBarChart,
    "Pie Chart": PieChart,
    "Table Chart": TableChart,
    "Word Cloud Chart": WordCloudChart
};
