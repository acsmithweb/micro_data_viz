class LineChart extends VizChart {

    initialize() {
        // Line generator (updated dynamically when scales change)
        this.line = d3.line()
            .x(d => this.x(this.parseX(d[this.cfg.xKey])))
            .y(d => this.y(d[this.cfg.yKey]));

        // Path for the line
        this.path = this.g.append("path")
            .attr("class", "line-path")
            .attr("fill", "none")
            .attr("stroke", this.cfg.color)
            .attr("stroke-width", 2);

        // Group for points
        this.pointsG = this.g.append("g")
            .attr("class", "points-group");
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
    // Scales
    // ---------------------------------------------------------
    configureScales() {
        // X scale is dynamic (time or point)
        this.x = null;

        // Y is always numeric
        this.y = d3.scaleLinear()
            .range([this.innerHeight, 0]);
    }

    updateScales(data, xKey, yKey) {
        // Convert X to Date objects once
        const parsedData = data.map(d => ({
            ...d,
            __x: new Date(d[xKey]),
            __y: +d[yKey]
        }));

        // Sort by date
        parsedData.sort((a, b) => a.__x - b.__x);

        this.data = parsedData;

        // X scale
        this.x = d3.scaleTime()
            .range([0, this.innerWidth])
            .domain(d3.extent(parsedData, d => d.__x));

        this.xAxis = d3.axisBottom(this.x)
            .ticks(6)
            .tickFormat(d3.timeFormat("%Y-%m-%d"));

        // Y scale
        this.y.domain(d3.extent(parsedData, d => d.__y));
        this.yAxis = d3.axisLeft(this.y);

        // Update line generator
        this.line = d3.line()
            .x(d => this.x(d.__x))
            .y(d => this.y(d.__y));
    }



    // ---------------------------------------------------------
    // Axes
    // ---------------------------------------------------------
    updateAxes() {
        this.xAxisGroup.call(this.xAxis);
        this.yAxisGroup.call(this.yAxis);
    }

    // ---------------------------------------------------------
    // Rendering
    // ---------------------------------------------------------
    render(data, xKey, yKey) {

        // Update line path
        this.path
            .datum(data)
            .transition()
            .duration(600)
            .attr("d", this.line);

        // Update points
        const points = this.pointsG.selectAll("circle.point")
            .data(data, d => d[xKey]);

        points.exit().remove();

        const merged = points.enter()
            .append("circle")
            .attr("class", "point")
            .attr("r", 4)
            .attr("fill", this.cfg.color)
            .merge(points);

        merged.transition()
            .duration(600)
            .attr("cx", d => this.x(this.parseX(d[xKey])))
            .attr("cy", d => this.y(d[yKey]));

        // Tooltip events
        merged
            .on("mouseover", (event, d) => {
                const dateStr = d3.timeFormat("%Y-%m-%d")(d.__x);
                this.showTooltip(`${dateStr} | ${d.__y}`, event);
            })
            .on("mousemove", (event, d) => {
                const dateStr = d3.timeFormat("%Y-%m-%d")(d.__x);
                this.showTooltip(`${dateStr} | ${d.__y}`, event);
            })
            .on("mouseout", () => this.hideTooltip());
    }

    // ---------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------
    isValidDate(value) {
        if (typeof value !== "string") return false;
        const d = new Date(value);
        return d instanceof Date && !isNaN(d.getTime()) && value.includes("-");
    }


    parseX(value) {
        return this.isValidDate(value) ? new Date(value) : value;
    }

    // ---------------------------------------------------------
    // Config
    // ---------------------------------------------------------
    assignConfig(config) {
        return Object.assign({
            width: 800,
            height: 600,
            margin: { top: 20, right: 20, bottom: 40, left: 60 },
            xKey: "x",
            yKey: "y",
            color: "#2E5C31"
        }, config);
    }
}
