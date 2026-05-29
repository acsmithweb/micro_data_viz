class BarChart extends VizChart {

    initialize() {
        // Hook for future features
    }

    update(payload) {
        const { rawData, data, xAxis, yAxis, transform } = payload;

        this.data = data || rawData || [];

        // Update scales + axes BEFORE rendering
        this.updateScales(this.data, this.cfg.xKey, this.cfg.yKey);
        this.updateAxes();

        // Now render
        this.render(this.data, this.cfg.xKey, this.cfg.yKey, transform);
    }


    // ---------------------------------------------------------
    // Scale updates
    // ---------------------------------------------------------
    updateScales(data, xKey, yKey) {
        const numericValues = data.map(d => +d[xKey] || 0);

        this.x.domain([0, d3.max(numericValues)]);
        this.y.domain(data.map(d => d[yKey]));

        this.xAxis = d3.axisBottom(this.x);
        this.yAxis = d3.axisLeft(this.y);
    }

    // ---------------------------------------------------------
    // Axis updates
    // ---------------------------------------------------------
    updateAxes() {
        this.xAxisGroup.call(this.xAxis);
        this.yAxisGroup.call(this.yAxis);
    }

    // ---------------------------------------------------------
    // Main render function
    // ---------------------------------------------------------
    render(rawData, xKey, yKey) {
        if (!rawData || rawData.length === 0) return;

        this.data = this.normalizeData(rawData, xKey, yKey);

        this.cfg.xKey = xKey;
        this.cfg.yKey = yKey;

        this.updateScales(this.data, xKey, yKey);
        this.updateAxes();

        const bars = this.g.selectAll(".bar")
            .data(this.data, d => d[yKey]);

        bars.exit().remove();

        const merged = bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("fill", this.cfg.color)
            .merge(bars);

        merged.transition()
            .duration(500)
            .attr("x", 0)
            .attr("y", d => this.y(d[yKey]))
            .attr("height", this.y.bandwidth())
            .attr("width", d => this.x(d[xKey]));

        // Tooltip events
        merged
            .on("mouseover", (event, d) => {
                this.showTooltip(`${d[yKey]} | ${d[xKey]}`, event);
            })
            .on("mousemove", (event, d) => {
                this.showTooltip(`${d[yKey]} | ${d[xKey]}`, event);
            })
            .on("mouseout", () => this.hideTooltip());
    }

    // ---------------------------------------------------------
    // Default config
    // ---------------------------------------------------------
    assignConfig(config) {
        return Object.assign({
            width: 800,
            height: 600,
            margin: { top: 20, right: 20, bottom: 40, left: 150 },
            xKey: "Value",
            yKey: "Name",
            color: "#2E5C31"
        }, config);
    }

    // ---------------------------------------------------------
    // Normalize data
    // ---------------------------------------------------------
    normalizeData(data, xKey, yKey) {
        if (typeof data[0] === "object" && !Array.isArray(data[0])) {
            return data;
        }

        return data.map((value, i) => ({
            [xKey]: value,
            [yKey]: `Category ${i + 1}`
        }));
    }
}
