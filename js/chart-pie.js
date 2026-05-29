class PieChart extends VizChart {

    constructor(selector, config = {}) {
        super(selector, Object.assign({
            width: 450,
            height: 450,
            margin: { top: 10, right: 10, bottom: 10, left: 10 },
            colorRange: ["#2E5C31", "#517528", "#808A16", "#BB9C00", "#FFA600"],
            valueKey: "Value",
            labelKey: "Name"
        }, config));
    }

    initialize() {
        this.recalculateGeometry();

        this.chartG = this.g.append("g")
            .attr("class", "pie-root")
            .attr("transform", `translate(${this.centerX}, ${this.centerY})`);

        this.color = d3.scaleOrdinal().range(this.cfg.colorRange);

        this.arc = d3.arc()
            .innerRadius(0)
            .outerRadius(this.radius);

        this.pie = d3.pie()
            .value(d => d[this.cfg.valueKey])
            .sort(null);
    }

    // ---------------------------------------------------------
    // Geometry recalculation
    // ---------------------------------------------------------
    recalculateGeometry() {
        this.radius = Math.min(this.innerWidth, this.innerHeight) / 2;
        this.centerX = this.innerWidth / 2;
        this.centerY = this.innerHeight / 2;
    }

    // ---------------------------------------------------------
    // Normalize data (BarChart-style)
    // ---------------------------------------------------------
    normalizeData(data, valueKey, labelKey) {
        // Ensure numeric values
        return data.map(d => ({
            ...d,
            [valueKey]: +d[valueKey] || 0
        }));
    }

    // ---------------------------------------------------------
    // Update color scale
    // ---------------------------------------------------------
    updateScales(data, labelKey) {
        this.color.domain(data.map(d => d[labelKey]));
    }

    // ---------------------------------------------------------
    // Main render function
    // ---------------------------------------------------------
    render(rawData, valueKey, labelKey) {
        if (!rawData || rawData.length === 0) return;

        this.cfg.valueKey = valueKey;
        this.cfg.labelKey = labelKey;

        this.data = this.normalizeData(rawData, valueKey, labelKey);

        this.recalculateGeometry();
        this.chartG.attr("transform", `translate(${this.centerX}, ${this.centerY})`);

        this.updateScales(this.data, labelKey);

        const pieData = this.pie(this.data);

        // -----------------------------
        // SLICES
        // -----------------------------
        const slices = this.chartG.selectAll("path.slice")
            .data(pieData, d => d.data[labelKey]);

        slices.exit().remove();

        const merged = slices.enter()
            .append("path")
            .attr("class", "slice")
            .merge(slices);

        merged.transition()
            .duration(500)
            .attr("d", this.arc)
            .attr("fill", d => this.color(d.data[labelKey]))
            .attr("stroke", "white")
            .style("stroke-width", "2px")
            .style("opacity", 0.9);

        // -----------------------------
        // LABELS
        // -----------------------------
        const labels = this.chartG.selectAll("text.slice-label")
            .data(pieData, d => d.data[labelKey]);

        labels.exit().remove();

        labels.enter()
            .append("text")
            .attr("class", "slice-label")
            .merge(labels)
            .transition()
            .duration(500)
            .attr("transform", d => `translate(${this.arc.centroid(d)})`)
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .text(d => d.data[labelKey]);

        // -----------------------------
        // TOOLTIP EVENTS
        // -----------------------------
        merged
            .on("mouseover", (event, d) => {
                this.showTooltip(`${d.data[labelKey]} | ${d.data[valueKey]}`, event);
            })
            .on("mousemove", (event, d) => {
                this.showTooltip(`${d.data[labelKey]} | ${d.data[valueKey]}`, event);
            })
            .on("mouseout", () => this.hideTooltip());
    }
}
