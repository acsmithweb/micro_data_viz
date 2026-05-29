class BarChart {
  constructor(selector, config) {
    this.cfg = Object.assign({
      width: 800,
      height: 600,
      margin: { top: 20, right: 20, bottom: 40, left: 150 },
      xKey: "value",
      yKey: "label",
      color: "#2E5C31"
    }, config);

    this.container = d3.select(selector);
    this.container.selectAll("*").remove();

    this.svg = this.container.append("svg")
      .attr("width", this.cfg.width)
      .attr("height", this.cfg.height);

    this.innerWidth = this.cfg.width - this.cfg.margin.left - this.cfg.margin.right;
    this.innerHeight = this.cfg.height - this.cfg.margin.top - this.cfg.margin.bottom;

    this.g = this.svg.append("g")
      .attr("transform", `translate(${this.cfg.margin.left},${this.cfg.margin.top})`);

    this.x = d3.scaleLinear().range([0, this.innerWidth]);
    this.y = d3.scaleBand().range([0, this.innerHeight]).padding(0.3);

    this.xAxis = this.g.append("g")
      .attr("transform", `translate(0,${this.innerHeight})`);

    this.yAxis = this.g.append("g");

    this.tooltip = this.container.append("div")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "5px")
      .style("border-radius", "4px");
  }

  update(data) {
    this.data = data;

    this.x.domain([0, d3.max(data, d => +d[this.cfg.xKey])]);
    this.y.domain(data.map(d => d[this.cfg.yKey]));

    const bars = this.g.selectAll("rect").data(data, d => d[this.cfg.yKey]);

    bars.exit().remove();

    bars.enter()
      .append("rect")
      .attr("x", 0)
      .attr("y", d => this.y(d[this.cfg.yKey]))
      .attr("height", this.y.bandwidth())
      .attr("width", 0)
      .attr("fill", this.cfg.color)
      .merge(bars)
      .transition()
      .duration(500)
      .attr("width", d => this.x(d[this.cfg.xKey]))
      .attr("y", d => this.y(d[this.cfg.yKey]));

    this.xAxis.call(d3.axisBottom(this.x));
    this.yAxis.call(d3.axisLeft(this.y));

    this.g.selectAll("rect")
      .on("mouseover", () => this.tooltip.style("visibility", "visible"))
      .on("mousemove", (event, d) => {
        this.tooltip
          .text(`${d[this.cfg.yKey]} | ${d[this.cfg.xKey]}`)
          .style("top", event.offsetY + 20 + "px")
          .style("left", event.offsetX + 20 + "px");
      })
      .on("mouseout", () => this.tooltip.style("visibility", "hidden"));
  }
}