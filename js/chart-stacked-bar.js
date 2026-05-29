class StackedBarChart extends VizChart {

  constructor(selector, config = {}) {
    super(selector, Object.assign({
      width: 800,
      height: 600,
      margin: { top: 20, right: 20, bottom: 40, left: 150 },
      xKey: "Category",
      stackKeys: [],   // e.g. ["No Show", "Scheduling Error"]
      colorRange: ["#2E5C31", "#517528", "#808A16", "#BB9C00", "#FFA600"]
    }, config));
  }

  update({ data, xAxis, stackKeys }) {
    if (!data || data.length === 0) return;

    this.data = data;
    this.cfg.xKey = xAxis;
    this.cfg.stackKeys = stackKeys;

    // Normalize numeric values
    this.data = this.data.map(d => {
      const row = { ...d };
      stackKeys.forEach(k => row[k] = +row[k] || 0);
      return row;
    });

    // -----------------------------
    // Update scales
    // -----------------------------
    this.x.domain(this.data.map(d => d[xAxis]))
      .range([0, this.innerWidth]);

    const maxStack = d3.max(this.data, d =>
      d3.sum(stackKeys.map(k => d[k]))
    );

    this.y.domain([0, maxStack])
      .range([this.innerHeight, 0]);

    this.color.domain(stackKeys);

    // -----------------------------
    // Build stacked series
    // -----------------------------
    const stackGen = d3.stack().keys(stackKeys);
    const stackedSeries = stackGen(this.data);

    // -----------------------------
    // JOIN series groups
    // -----------------------------
    const seriesGroups = this.g.selectAll(".series")
      .data(stackedSeries, d => d.key);

    seriesGroups.exit().remove();

    const seriesEnter = seriesGroups.enter()
      .append("g")
      .attr("class", "series")
      .attr("fill", d => this.color(d.key));

    const series = seriesEnter.merge(seriesGroups);

    // -----------------------------
    // JOIN rects inside each series
    // -----------------------------
    const rects = series.selectAll("rect")
      .data(d => d, d => d.data[xAxis]);

    rects.exit().remove();

    rects.enter()
      .append("rect")
      .merge(rects)
      .transition()
      .duration(500)
      .attr("x", d => this.x(d.data[xAxis]))
      .attr("width", this.x.bandwidth())
      .attr("y", d => this.y(d[1]))
      .attr("height", d => this.y(d[0]) - this.y(d[1]));

    // -----------------------------
    // Tooltip events
    // -----------------------------
    series.selectAll("rect")
      .on("mouseover", (event, d) => {
        const segmentKey = d3.select(event.target.parentNode).datum().key;
        this.showTooltip(
          `${d.data[xAxis]}<br>${segmentKey}: ${d.data[segmentKey]}`,
          event
        );
      })
      .on("mousemove", (event, d) => {
        const segmentKey = d3.select(event.target.parentNode).datum().key;
        this.showTooltip(
          `${d.data[xAxis]}<br>${segmentKey}: ${d.data[segmentKey]}`,
          event
        );
      })
      .on("mouseout", () => this.hideTooltip());

    // -----------------------------
    // Axes
    // -----------------------------
    this.xAxisGroup.call(d3.axisBottom(this.x));
    this.yAxisGroup.call(d3.axisLeft(this.y));
  }

  initialize() {
    this.x = d3.scaleBand().padding(0.2);
    this.y = d3.scaleLinear();

    this.color = d3.scaleOrdinal().range(this.cfg.colorRange);

    this.xAxisGroup = this.g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${this.innerHeight})`);

    this.yAxisGroup = this.g.append("g")
      .attr("class", "y-axis");
  }

  // ---------------------------------------------------------
  // Normalize data
  // ---------------------------------------------------------
  normalizeData(data, xKey, stackKeys) {
    return data.map(d => {
      const row = { ...d };
      stackKeys.forEach(k => row[k] = +row[k] || 0);
      return row;
    });
  }

  // ---------------------------------------------------------
  // Update scales
  // ---------------------------------------------------------
  updateScales(data, xKey, stackKeys) {
    this.x.domain(data.map(d => d[xKey])).range([0, this.innerWidth]);

    const maxStack = d3.max(data, d =>
      d3.sum(stackKeys.map(k => d[k]))
    );

    this.y.domain([0, maxStack]).range([this.innerHeight, 0]);

    this.color.domain(stackKeys);
  }

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  render(rawData, xKey, stackKeys) {
    if (!rawData || rawData.length === 0) return;

    this.cfg.xKey = xKey;
    this.cfg.stackKeys = stackKeys;

    this.data = this.normalizeData(rawData, xKey, stackKeys);

    this.updateScales(this.data, xKey, stackKeys);

    const stackGen = d3.stack().keys(stackKeys);
    const stackedSeries = stackGen(this.data);

    // JOIN series groups
    const seriesGroups = this.g.selectAll(".series")
      .data(stackedSeries, d => d.key);

    seriesGroups.exit().remove();

    const seriesEnter = seriesGroups.enter()
      .append("g")
      .attr("class", "series")
      .attr("fill", d => this.color(d.key));

    const series = seriesEnter.merge(seriesGroups);

    // JOIN rects
    const rects = series.selectAll("rect")
      .data(d => d, d => d.data[xKey]);

    rects.exit().remove();

    rects.enter()
      .append("rect")
      .merge(rects)
      .transition()
      .duration(500)
      .attr("x", d => this.x(d.data[xKey]))
      .attr("width", this.x.bandwidth())
      .attr("y", d => this.y(d[1]))
      .attr("height", d => this.y(d[0]) - this.y(d[1]));

    // Tooltip events
    series.selectAll("rect")
      .on("mouseover", (event, d) => {
        const segmentKey = d3.select(event.target.parentNode).datum().key;
        this.showTooltip(`${d.data[xKey]}<br>${segmentKey}: ${d.data[segmentKey]}`, event);
      })
      .on("mousemove", (event, d) => {
        const segmentKey = d3.select(event.target.parentNode).datum().key;
        this.showTooltip(`${d.data[xKey]}<br>${segmentKey}: ${d.data[segmentKey]}`, event);
      })
      .on("mouseout", () => this.hideTooltip());

    // Axes
    this.xAxisGroup.call(d3.axisBottom(this.x));
    this.yAxisGroup.call(d3.axisLeft(this.y));
  }
}
