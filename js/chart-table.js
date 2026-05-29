class TableChart extends VizChart {

    initialize() {
        this.headerHeight = 32;
        this.rowHeight = 28;

        // Create scroll container
        this.scrollContainer = this.container.append("div")
            .attr("class", "table-scroll")
            .style("position", "absolute")
            .style("top", `${this.cfg.margin.top}px`)
            .style("left", `${this.cfg.margin.left}px`)
            .style("right", `${this.cfg.margin.right}px`)
            .style("bottom", `${this.cfg.margin.bottom}px`)
            .style("overflow-y", "auto")
            .style("overflow-x", "auto");

        // Move SVG into scroll container
        this.scrollContainer.node().appendChild(this.svg.node());

        // Header group
        this.headerGroup = this.g.append("g")
            .attr("class", "table-header");

        // Rows group
        this.tableGroup = this.g.append("g")
            .attr("class", "table-body")
            .attr("transform", `translate(0, ${this.headerHeight})`);

        // Spacer for virtual height
        this.spacer = this.scrollContainer.append("div")
            .style("position", "absolute")
            .style("top", "0px")
            .style("left", "0px");

        this.scrollContainer.on("scroll", () => this.renderVisibleRows());
    }

    updateScales() {
        if (!this.data || this.data.length === 0) return;

        this.columns = Object.keys(this.data[0]);

        const minColWidth = 150;
        this.colWidth = Math.max(minColWidth, this.innerWidth / this.columns.length);

        this.tableWidth = this.columns.length * this.colWidth;
        this.tableHeight = this.data.length * this.rowHeight;

        // Resize SVG to fit full table width
        this.svg
            .attr("width", this.tableWidth + this.cfg.margin.left + this.cfg.margin.right)
            .attr("height", this.tableHeight + this.cfg.margin.top + this.cfg.margin.bottom);

        // Resize spacer for vertical scrolling
        this.spacer
            .style("height", `${this.tableHeight}px`)
            .style("width", `${this.Width}px`);
    }

    render({ rawData, aggregatedData, xAxis, yAxis }) {
        if (!rawData || rawData.length === 0) return;

        // Merge rows with aggregates
        this.data = rawData.map(row => {
            const match = aggregatedData.find(a => a[yAxis] === row[yAxis]);
            return {
                ...row,
                Aggregate: match ? match[xAxis] : null
            };
        });

        this.updateScales();
        this.renderHeader();
        this.renderVisibleRows();
    }

    renderHeader() {
        const header = this.headerGroup
            .selectAll(".header-cell")
            .data(this.columns);

        header.enter()
            .append("text")
            .attr("class", "header-cell")
            .attr("y", this.headerHeight - 10)
            .style("font-weight", "bold")
            .style("font-size", "14px")
            .style("pointer-events", "none")
            .merge(header)
            .attr("x", (d, i) => i * this.colWidth + 6)
            .text(d => d.length > 20 ? d.slice(0, 17) + "..." : d);

        header.exit().remove();
    }

    renderVisibleRows() {
        const scrollTop = this.scrollContainer.node().scrollTop;

        const startIndex = Math.floor(scrollTop / this.rowHeight);
        const visibleCount = Math.ceil(this.cfg.height / this.rowHeight) + 5;
        const endIndex = Math.min(this.data.length, startIndex + visibleCount);

        const visibleData = this.data.slice(startIndex, endIndex);

        const rows = this.tableGroup
            .selectAll(".table-row")
            .data(visibleData, (d, i) => startIndex + i);

        // Cells
        const rowsEnter = rows.enter()
            .append("g")
            .attr("class", "table-row");

        // Add background rect
        rowsEnter.append("rect")
            .attr("class", "row-bg")
            .attr("width", this.tableWidth)
            .attr("height", this.rowHeight)
            .attr("x", 0)
            .attr("y", 0);

        rowsEnter.each((d, rowIndex, nodes) => {
            const row = d3.select(nodes[rowIndex]);

            this.columns.forEach((col, colIndex) => {
                row.append("text")
                    .attr("class", "cell-text")
                    .attr("x", colIndex * this.colWidth + 6)
                    .attr("y", this.rowHeight / 2 + 5)
                    .style("font-size", "13px");
            });
        });

        // Update
        rows.merge(rowsEnter)
            .attr("transform", (d, i) =>
                `translate(0, ${(startIndex + i) * this.rowHeight})`
            )
            .each((d, i, nodes) => {
                const row = d3.select(nodes[i]);

                // Alternate row colors
                row.select(".row-bg")
                    .attr("fill", (startIndex + i) % 2 === 0 ? "#bdfab4" : "#ffffff");

                // Update cell text
                row.selectAll(".cell-text")
                    .text((col, colIndex) => {
                        const value = d[this.columns[colIndex]] ?? "";
                        return this.truncateText(String(value), this.colWidth, this.svg);
                    });
            }).on("mousemove", (event, d) => {
                const html = this.columns
                    .map(c => `<b>${c}:</b> ${d[c]}`)
                    .join("<br>");
                this.showTooltip(html, event);
            })
            .on("mouseout", () => this.hideTooltip());;

        rows.exit().remove();
    }

    truncateText(text, maxWidth, svg) {
        const temp = svg.append("text")
            .attr("font-size", 13)
            .text(text);

        let truncated = text;
        while (temp.node().getComputedTextLength() > maxWidth - 12) {
            truncated = truncated.slice(0, -1);
            temp.text(truncated + "…");
        }

        temp.remove();
        return truncated + (truncated !== text ? "…" : "");
    }

    assignConfig(config) {
        return Object.assign({
            width: 800,
            height: 600,
            margin: { top: 10, right: 10, bottom: 40, left: 10 }
        }, config);
    }
}
