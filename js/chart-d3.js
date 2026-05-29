class VizChart {
    constructor(selector, config = {}) {
        this.cfg = this.assignConfig(config);

        this.selector = selector;
        this.container = d3.select(selector);
        this.container.selectAll("*").remove();

        // SVG + main group
        this.svg = this.container.append("svg")
            .attr("width", this.cfg.width)
            .attr("height", this.cfg.height);

        this.innerWidth = this.cfg.width - this.cfg.margin.left - this.cfg.margin.right;
        this.innerHeight = this.cfg.height - this.cfg.margin.top - this.cfg.margin.bottom;

        this.g = this.svg.append("g")
            .attr("transform", `translate(${this.cfg.margin.left},${this.cfg.margin.top})`);

        // Setup
        this.addTooltip();
        this.configureScales();
        this.configureAxes();

        // Hook for subclasses
        this.initialize();
    }

    // ---------------------------------------------------------
    // Lifecycle Hooks (subclasses override)
    // ---------------------------------------------------------
    initialize() { }
    render(data, xKey, yKey, transform) { }

    update(payload) {
        const { rawData, aggregatedData, data, xAxis, yAxis, transform } = payload;

        // Store raw + aggregated data if provided
        this.rawData = rawData || null;
        this.aggregatedData = aggregatedData || null;

        // For non-table charts, "data" is the dataset to render
        this.data = data || rawData || [];

        // Update axes (subclasses override)
        this.updateAxes();

        // TableChart uses a different render signature
        if (this.constructor.name === "TableChart") {
            this.render({
                rawData: rawData,
                aggregatedData: aggregatedData,
                xAxis,
                yAxis,
                transform
            });
        }
        else {
            // All other charts use the old signature
            this.render(this.data, xAxis, yAxis, transform);
        }
    }

    // ---------------------------------------------------------
    // Scales & Axes
    // ---------------------------------------------------------
    configureScales() {
        this.x = d3.scaleLinear().range([0, this.innerWidth]);
        this.y = d3.scaleBand().range([0, this.innerHeight]).padding(0.3);
    }

    configureAxes() {
        this.xAxisGroup = this.g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${this.innerHeight})`);

        this.yAxisGroup = this.g.append("g")
            .attr("class", "y-axis");
    }

    updateScales() {
        // Subclasses override
    }

    updateAxes() {
        if (this.xAxis) this.xAxisGroup.call(this.xAxis);
        if (this.yAxis) this.yAxisGroup.call(this.yAxis);
    }

    // ---------------------------------------------------------
    // Tooltip
    // ---------------------------------------------------------
    addTooltip() {
        this.tooltip = this.container.append("div")
            .attr("class", "viz-tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "white")
            .style("border", "1px solid #ccc")
            .style("padding", "5px")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("z-index", "1000");
    }

    showTooltip(html, event) {
        const containerRect = this.container.node().getBoundingClientRect();

        const x = event.clientX - containerRect.left;
        const y = event.clientY - containerRect.top;

        this.tooltip
            .html(html)
            .style("visibility", "visible")
            .style("left", `${x}px`)
            .style("top", `${y}px`);
    }

    hideTooltip() {
        this.tooltip.style("visibility", "hidden");
    }

    // ---------------------------------------------------------
    // Config
    // ---------------------------------------------------------
    assignConfig(config) {
        return Object.assign({
            width: 800,
            height: 600,
            margin: { top: 20, right: 20, bottom: 40, left: 150 },
            xKey: null,
            yKey: null
        }, config);
    }
}
