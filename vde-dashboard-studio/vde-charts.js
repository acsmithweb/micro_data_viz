/**
 * vde-charts.js
 * Object-Oriented D3.js Visualization Engine (20 Modular Chart Components)
 * Pure browser-native implementation with zero build step required.
 */

const DEFAULT_CHART_PALETTE = [
    '#89b4fa', '#f5c2e7', '#a6e3a1', '#f9e2af',
    '#cba6f7', '#fab387', '#f38ba8', '#94e2d5'
];

function translate(x, y) {
    return `translate(${x}, ${y})`;
}

function formatNumericValue(val) {
    if (!isFinite(val)) return '0';
    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(2)}M`;
    if (Math.abs(val) >= 10000) return `${(val / 1000).toFixed(1)}k`;
    if (Number.isInteger(val)) return val.toLocaleString();
    return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatDateByGranularity(dateVal, granularity) {
    if (dateVal === undefined || dateVal === null || !granularity || granularity === 'Raw') {
        return String(dateVal ?? '');
    }

    const d = new Date(String(dateVal));
    if (isNaN(d.getTime())) return String(dateVal);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');

    switch (granularity) {
        case 'Year':
            return `${year}`;
        case 'Quarter': {
            const q = Math.floor(d.getMonth() / 3) + 1;
            return `${year}-Q${q}`;
        }
        case 'Month':
            return `${year}-${month}`;
        case 'Day':
            return `${year}-${month}-${day}`;
        case 'Hour':
            return `${year}-${month}-${day} ${hours}:00`;
        default:
            return String(dateVal);
    }
}

function getAggregateFunction(type, rows, xKey, yKey, dateGranularity = 'Raw') {
    if (!rows || rows.length === 0) return [];

    const processedRows = rows.map(r => {
        if (!r || r[xKey] === undefined || r[xKey] === null) return r;
        const formattedX = formatDateByGranularity(r[xKey], dateGranularity);
        return Object.assign({}, r, { [xKey]: formattedX });
    });

    if (!type || type === 'Raw') return processedRows;

    const validRows = processedRows.filter(r => r && r[xKey] !== undefined && r[xKey] !== null);
    const grouped = d3.group(validRows, d => String(d[xKey]));

    return Array.from(grouped, ([key, groupRows]) => {
        const result = { [xKey]: key };
        const nums = groupRows.map(d => Number(d[yKey]) || 0);

        if (type === 'Count') {
            result[yKey] = groupRows.length;
        } else if (type === 'Sum') {
            result[yKey] = d3.sum(nums);
        } else if (type === 'Avg') {
            result[yKey] = d3.mean(nums) ?? 0;
        } else if (type === 'Min') {
            result[yKey] = d3.min(nums) ?? 0;
        } else if (type === 'Max') {
            result[yKey] = d3.max(nums) ?? 0;
        }

        return result;
    });
}

function buildSeriesMatrix(data, xAxis, yAxis, groupKey, providedStackKeys) {
    if (providedStackKeys && providedStackKeys.length > 0 && data.length > 0 && providedStackKeys[0] in data[0]) {
        return { matrix: data, keys: providedStackKeys.map(String) };
    }

    const effectiveGroup = groupKey && groupKey !== xAxis ? groupKey : yAxis;
    const numericValueMode = groupKey && groupKey !== xAxis && groupKey !== yAxis;

    const keys = Array.from(new Set(data.map(d => String(d[effectiveGroup] ?? 'Other')))).slice(0, 10);
    const grouped = d3.group(data, d => String(d[xAxis] ?? ''));

    const matrix = Array.from(grouped, ([xVal, rows]) => {
        const row = { [xAxis]: xVal };
        keys.forEach(k => { row[k] = 0; });
        rows.forEach(r => {
            const k = String(r[effectiveGroup] ?? 'Other');
            if (!keys.includes(k)) return;
            const increment = numericValueMode ? (Number(r[yAxis]) || 0) : 1;
            row[k] = Number(row[k] || 0) + increment;
        });
        return row;
    });

    return { matrix, keys };
}

/**
 * POLYMORPHIC D3 CHART BASE CLASS
 */
class VizChart {
    constructor(containerElement, config = {}) {
        this.containerElement = containerElement;
        this.container = d3.select(containerElement);

        const defaultMargin = { top: 24, right: 24, bottom: 52, left: 56 };
        const mergedMargin = Object.assign({}, defaultMargin, config.margin || {});

        this.cfg = Object.assign({
            width: 420,
            height: 260,
            xKey: 'label',
            yKey: 'value',
            groupKey: '',
            color: null,
            chartPalette: null,
            textColor: null,
            backgroundColor: null,
            borderColor: null,
            showGrid: true,
            showLegend: true,
            enableZoom: true
        }, config, { margin: mergedMargin });

        this.updateDimensions(this.cfg.width, this.cfg.height);
        this.container.style('position', 'relative');

        this.tooltip = this.container.select('.viz-tooltip');
        if (this.tooltip.empty()) {
            const tooltipBg = this.cfg.backgroundColor || 'rgba(16, 18, 22, 0.96)';
            const tooltipBorder = this.cfg.color || '#ff7b00';
            const tooltipText = this.cfg.textColor || '#e2e4e9';

            this.tooltip = this.container.append('div')
                .attr('class', 'viz-tooltip')
                .style('position', 'absolute')
                .style('visibility', 'hidden')
                .style('opacity', '0')
                .style('background', tooltipBg)
                .style('color', tooltipText)
                .style('border', `1px solid ${tooltipBorder}`)
                .style('padding', '7px 11px')
                .style('border-radius', '5px')
                .style('font-size', '11px')
                .style('pointer-events', 'none')
                .style('box-shadow', '0 6px 20px rgba(0, 0, 0, 0.45)')
                .style('z-index', '1000')
                .style('transition', 'opacity 0.1s ease');
        }

        this.container.selectAll('.viz-table-wrapper').remove();

        this.svg = this.container.select('svg.viz-svg');
        if (this.svg.empty()) {
            this.svg = this.container.append('svg')
                .attr('class', 'viz-svg')
                .attr('width', '100%')
                .attr('height', '100%')
                .attr('viewBox', `0 0 ${this.cfg.width} ${this.cfg.height}`)
                .attr('preserveAspectRatio', 'xMidYMid meet');
        } else {
            this.svg.attr('viewBox', `0 0 ${this.cfg.width} ${this.cfg.height}`).style('display', 'block');
            this.svg.selectAll('*').remove();
        }

        this.defs = this.svg.append('defs');
        this.g = this.svg.append('g')
            .attr('class', 'viz-root-group')
            .attr('transform', translate(this.cfg.margin.left, this.cfg.margin.top));

        if (this.cfg.enableZoom) {
            this.zoom = d3.zoom()
                .scaleExtent([0.6, 8])
                .on('zoom', (event) => {
                    if (this.g) {
                        this.g.attr(
                            'transform',
                            `translate(${this.cfg.margin.left + event.transform.x}, ${this.cfg.margin.top + event.transform.y}) scale(${event.transform.k})`
                        );
                    }
                });
            this.svg.call(this.zoom);
        }
    }

    resetZoom() {
        if (this.zoom && this.svg) {
            this.svg.transition().duration(200).call(this.zoom.transform, d3.zoomIdentity);
        }
    }

    updateDimensions(width, height) {
        this.cfg.width = Math.max(140, width || this.cfg.width || 420);
        this.cfg.height = Math.max(120, height || this.cfg.height || 260);
        this.innerWidth = Math.max(20, this.cfg.width - this.cfg.margin.left - this.cfg.margin.right);
        this.innerHeight = Math.max(20, this.cfg.height - this.cfg.margin.top - this.cfg.margin.bottom);

        if (this.svg) {
            this.svg.attr('viewBox', `0 0 ${this.cfg.width} ${this.cfg.height}`);
        }
    }

    prepareCanvas(payload) {
        if (payload && (payload.width || payload.height)) {
            this.updateDimensions(payload.width, payload.height);
        }
        this.container.selectAll('.viz-table-wrapper').remove();
        if (this.svg) this.svg.style('display', 'block');
        if (this.g) this.g.selectAll('*').remove();
        if (this.defs) this.defs.selectAll('*').remove();
    }

    renderHorizontalGridlines(yScale) {
        if (!this.cfg.showGrid) return;
        this.g.append('g')
            .attr('class', 'viz-grid-y')
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-this.innerWidth).tickFormat(() => ''))
            .call(g => g.select('.domain').remove())
            .selectAll('line')
            .style('stroke', this.getBorderColor())
            .style('stroke-opacity', '0.45')
            .style('stroke-dasharray', '2,3');
    }

    renderVerticalGridlines(xScale) {
        if (!this.cfg.showGrid) return;
        this.g.append('g')
            .attr('class', 'viz-grid-x')
            .attr('transform', translate(0, this.innerHeight))
            .call(d3.axisBottom(xScale).ticks(5).tickSize(-this.innerHeight).tickFormat(() => ''))
            .call(g => g.select('.domain').remove())
            .selectAll('line')
            .style('stroke', this.getBorderColor())
            .style('stroke-opacity', '0.35')
            .style('stroke-dasharray', '2,3');
    }

    renderCategoricalXAxis(xScale, rotate = true) {
        const domain = xScale.domain();
        const maxLabels = Math.max(4, Math.floor(this.innerWidth / 44));
        const step = domain.length > maxLabels ? Math.ceil(domain.length / maxLabels) : 1;

        const axis = d3.axisBottom(xScale).tickFormat((d, i) => {
            if (i % step !== 0) return '';
            const label = String(d);
            return label.length > 14 ? label.slice(0, 12) + '…' : label;
        });

        const axisG = this.g.append('g')
            .attr('class', 'viz-axis-x')
            .attr('transform', translate(0, this.innerHeight))
            .call(axis);

        const texts = axisG.selectAll('text')
            .style('fill', this.getAxisColor())
            .style('font-size', '9.5px')
            .style('font-family', '"JetBrains Mono", monospace');

        if (rotate && domain.length > 5) {
            texts
                .attr('transform', 'rotate(-35)')
                .attr('dx', '-0.5em')
                .attr('dy', '0.35em')
                .style('text-anchor', 'end');
        }

        this.styleAxisLines(axisG);
    }

    renderLinearXAxis(xScale) {
        const axisG = this.g.append('g')
            .attr('class', 'viz-axis-x')
            .attr('transform', translate(0, this.innerHeight))
            .call(
                d3.axisBottom(xScale)
                    .ticks(Math.max(4, Math.floor(this.innerWidth / 70)))
                    .tickFormat(d => formatNumericValue(Number(d)))
            );

        axisG.selectAll('text')
            .style('fill', this.getAxisColor())
            .style('font-size', '9.5px')
            .style('font-family', '"JetBrains Mono", monospace');
        this.styleAxisLines(axisG);
    }

    renderLinearYAxis(yScale) {
        const axisG = this.g.append('g')
            .attr('class', 'viz-axis-y')
            .call(
                d3.axisLeft(yScale)
                    .ticks(5)
                    .tickFormat(d => formatNumericValue(Number(d)))
            );

        axisG.selectAll('text')
            .style('fill', this.getAxisColor())
            .style('font-size', '9.5px')
            .style('font-family', '"JetBrains Mono", monospace');
        this.styleAxisLines(axisG);
    }

    styleAxisLines(axisG) {
        axisG.selectAll('.domain').style('stroke', this.getBorderColor());
        axisG.selectAll('.tick line').style('stroke', this.getBorderColor());
    }

    renderLegend(items, colorScale) {
        if (!this.cfg.showLegend || !items || items.length === 0) return;

        const visibleItems = items.slice(0, 8);
        const legendG = this.g.append('g')
            .attr('class', 'viz-legend')
            .attr('transform', translate(0, -14));

        let offsetX = 0;
        visibleItems.forEach(item => {
            const label = item.length > 12 ? item.slice(0, 11) + '…' : item;
            const itemWidth = label.length * 6.2 + 20;
            if (offsetX + itemWidth > this.innerWidth) return;

            const entry = legendG.append('g').attr('transform', translate(offsetX, 0));
            entry.append('rect')
                .attr('width', 8)
                .attr('height', 8)
                .attr('rx', 2)
                .attr('y', -7)
                .attr('fill', colorScale(item));

            entry.append('text')
                .attr('x', 12)
                .attr('y', 0)
                .style('font-size', '9.5px')
                .style('fill', this.getAxisColor())
                .style('font-family', '"JetBrains Mono", monospace')
                .text(label);

            offsetX += itemWidth;
        });
    }

    showTooltip(html, event) {
        if (!this.tooltip) return;
        this.tooltip.style('visibility', 'visible').style('opacity', '1').html(html);
        this.moveTooltip(event);
    }

    moveTooltip(event) {
        if (!this.tooltip || !event) return;
        try {
            const node = this.container.node();
            if (!node) return;
            const [x, y] = d3.pointer(event, node);
            if (!isFinite(x) || !isFinite(y)) return;

            const tipNode = this.tooltip.node();
            const tipW = tipNode ? tipNode.offsetWidth : 140;
            const tipH = tipNode ? tipNode.offsetHeight : 50;
            const maxX = node.clientWidth - tipW - 10;
            const maxY = node.clientHeight - tipH - 10;

            const left = Math.max(8, Math.min(x + 14, maxX > 8 ? maxX : x + 14));
            const top = Math.max(8, Math.min(y - 16, maxY > 8 ? maxY : y - 16));

            this.tooltip.style('left', `${left}px`).style('top', `${top}px`);
        } catch (e) { }
    }

    hideTooltip() {
        if (!this.tooltip) return;
        this.tooltip.style('visibility', 'hidden').style('opacity', '0');
    }

    renderEmptyState(message = 'No data matching active criteria') {
        this.g.selectAll('*').remove();
        this.g.append('text')
            .attr('x', this.innerWidth / 2)
            .attr('y', this.innerHeight / 2)
            .attr('text-anchor', 'middle')
            .style('fill', this.getAxisColor())
            .style('font-size', '12px')
            .style('font-family', '"JetBrains Mono", monospace')
            .text(message);
    }

    getPalette() {
        if (this.cfg.chartPalette && this.cfg.chartPalette.length > 0) {
            return this.cfg.chartPalette;
        }
        return DEFAULT_CHART_PALETTE;
    }

    getChartColor(index = 0) {
        const palette = this.getPalette();
        return palette[index % palette.length];
    }

    getAxisColor() { return this.cfg.textColor || '#9aa1b0'; }
    getBorderColor() { return this.cfg.borderColor || '#2f333d'; }
    getBackgroundColor() { return this.cfg.backgroundColor || '#181a1f'; }
    getPrimaryColor() { return this.cfg.color || '#ff7b00'; }

    getColorScale(domain) {
        const validDomain = (domain || []).map(String);
        return d3.scaleOrdinal().domain(validDomain).range(this.getPalette());
    }

    getSequentialColorScale(minVal, maxVal) {
        const palette = this.getPalette();
        const low = this.getBackgroundColor();
        const mid = palette[0] || '#89b4fa';
        const high = this.getPrimaryColor();
        const safeMax = maxVal <= minVal ? minVal + 1 : maxVal;

        return d3.scaleLinear()
            .domain([minVal, (minVal + safeMax) / 2, safeMax])
            .range([low, mid, high]);
    }

    destroy() {
        this.hideTooltip();
        if (this.container) {
            this.container.selectAll('.viz-tooltip').remove();
            this.container.selectAll('.viz-table-wrapper').remove();
            this.container.selectAll('svg.viz-svg').remove();
        }
    }
}

/* ============================================================================
 * 1-7: BAR, HORIZONTAL BAR, GROUPED BAR, STACKED BAR, LINE, AREA, STACKED AREA
 * ============================================================================ */

class BarChart extends VizChart {
    update(payload) {
        this.prepareCanvas(payload);
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;
        if (!data || data.length === 0) { this.renderEmptyState(); return; }

        const x = d3.scaleBand().domain(data.map(d => String(d[xAxis] ?? ''))).range([0, this.innerWidth]).padding(0.22);
        const rawMax = d3.max(data, d => Number(d[yAxis]) || 0) ?? 0;
        const y = d3.scaleLinear().domain([0, Math.max(1, isFinite(rawMax) ? rawMax : 1)]).nice().range([this.innerHeight, 0]);

        this.renderHorizontalGridlines(y);
        this.renderCategoricalXAxis(x);
        this.renderLinearYAxis(y);

        const primary = this.getPrimaryColor();

        this.g.selectAll('.bar')
            .data(data)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(String(d[xAxis] ?? '')) ?? 0)
            .attr('y', d => { const pos = y(Number(d[yAxis]) || 0); return isFinite(pos) ? pos : this.innerHeight; })
            .attr('width', x.bandwidth())
            .attr('height', d => { const pos = y(Number(d[yAxis]) || 0); return isFinite(pos) ? Math.max(0, this.innerHeight - pos) : 0; })
            .attr('fill', primary)
            .attr('rx', 3)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget).attr('fill', this.getChartColor(0));
                this.showTooltip(`<strong>${d[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(Number(d[yAxis]) || 0)}`, event);
            })
            .on('mousemove', event => this.moveTooltip(event))
            .on('mouseleave', event => {
                d3.select(event.currentTarget).attr('fill', primary);
                this.hideTooltip();
            });
    }
}

class HorizontalBarChart extends VizChart {
    constructor(containerElement, config = {}) {
        super(containerElement, Object.assign({}, config, {
            margin: Object.assign({ top: 20, right: 28, bottom: 38, left: 105 }, config.margin || {})
        }));
    }

    update(payload) {
        this.prepareCanvas(payload);
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;
        if (!data || data.length === 0) { this.renderEmptyState(); return; }

        const sorted = [...data].sort((a, b) => (Number(b[yAxis]) || 0) - (Number(a[yAxis]) || 0));
        const y = d3.scaleBand().domain(sorted.map(d => String(d[xAxis] ?? ''))).range([0, this.innerHeight]).padding(0.22);
        const rawMax = d3.max(sorted, d => Number(d[yAxis]) || 0) ?? 0;
        const x = d3.scaleLinear().domain([0, Math.max(1, isFinite(rawMax) ? rawMax : 1)]).nice().range([0, this.innerWidth]);

        this.renderVerticalGridlines(x);
        this.renderLinearXAxis(x);

        const yAxisG = this.g.append('g').attr('class', 'viz-axis-y')
            .call(d3.axisLeft(y).tickFormat(d => {
                const s = String(d);
                return s.length > 15 ? s.slice(0, 13) + '…' : s;
            }));
        yAxisG.selectAll('text').style('fill', this.getAxisColor()).style('font-size', '9.5px').style('font-family', '"JetBrains Mono", monospace');
        this.styleAxisLines(yAxisG);

        const primary = this.getPrimaryColor();

        this.g.selectAll('.hbar')
            .data(sorted)
            .enter()
            .append('rect')
            .attr('class', 'hbar')
            .attr('x', 0)
            .attr('y', d => y(String(d[xAxis] ?? '')) ?? 0)
            .attr('height', y.bandwidth())
            .attr('width', d => Math.max(0, x(Number(d[yAxis]) || 0)))
            .attr('fill', primary)
            .attr('rx', 3)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget).attr('fill', this.getChartColor(0));
                this.showTooltip(`<strong>${d[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(Number(d[yAxis]) || 0)}`, event);
            })
            .on('mousemove', event => this.moveTooltip(event))
            .on('mouseleave', event => {
                d3.select(event.currentTarget).attr('fill', primary);
                this.hideTooltip();
            });
    }
}

class GroupedBarChart extends VizChart {
    update(payload) {
        this.prepareCanvas(payload);
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey, groupKey = this.cfg.groupKey, stackKeys } = payload;
        if (!data || data.length === 0) { this.renderEmptyState(); return; }

        const { matrix, keys } = buildSeriesMatrix(data, xAxis, yAxis, groupKey, stackKeys);
        if (matrix.length === 0 || keys.length === 0) { this.renderEmptyState(); return; }

        const x0 = d3.scaleBand().domain(matrix.map(d => String(d[xAxis] ?? ''))).range([0, this.innerWidth]).padding(0.2);
        const x1 = d3.scaleBand().domain(keys).range([0, x0.bandwidth()]).padding(0.08);
        const rawMax = d3.max(matrix, row => d3.max(keys, k => Number(row[k]) || 0) ?? 0) ?? 0;
        const y = d3.scaleLinear().domain([0, Math.max(1, isFinite(rawMax) ? rawMax : 1)]).nice().range([this.innerHeight, 0]);
        const color = this.getColorScale(keys);

        this.renderHorizontalGridlines(y);
        this.renderCategoricalXAxis(x0);
        this.renderLinearYAxis(y);
        this.renderLegend(keys, color);

        const groups = this.g.selectAll('.bar-group')
            .data(matrix)
            .enter()
            .append('g')
            .attr('class', 'bar-group')
            .attr('transform', d => translate(x0(String(d[xAxis] ?? '')) ?? 0, 0));

        groups.selectAll('rect')
            .data(d => keys.map(key => ({ key, value: Number(d[key]) || 0, xLabel: String(d[xAxis] ?? '') })))
            .enter()
            .append('rect')
            .attr('x', d => x1(d.key) ?? 0)
            .attr('y', d => y(d.value))
            .attr('width', x1.bandwidth())
            .attr('height', d => Math.max(0, this.innerHeight - y(d.value)))
            .attr('fill', d => color(d.key))
            .attr('rx', 2)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget).style('opacity', 0.85);
                this.showTooltip(`<strong>${d.xLabel}</strong><br/>${d.key}: ${formatNumericValue(d.value)}`, event);
            })
            .on('mousemove', event => this.moveTooltip(event))
            .on('mouseleave', event => {
                d3.select(event.currentTarget).style('opacity', 1);
                this.hideTooltip();
            });
    }
}

class StackedBarChart extends VizChart {
    update(payload) {
        this.prepareCanvas(payload);
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey, groupKey = this.cfg.groupKey, stackKeys } = payload;
        if (!data || data.length === 0) { this.renderEmptyState(); return; }

        const { matrix, keys } = buildSeriesMatrix(data, xAxis, yAxis, groupKey, stackKeys);
        if (matrix.length === 0 || keys.length === 0) { this.renderEmptyState(); return; }

        const x = d3.scaleBand().domain(matrix.map(d => String(d[xAxis] ?? ''))).range([0, this.innerWidth]).padding(0.2);
        const rawMax = d3.max(matrix, d => keys.reduce((acc, k) => acc + (Number(d[k]) || 0), 0)) ?? 0;
        const y = d3.scaleLinear().domain([0, Math.max(1, isFinite(rawMax) ? rawMax : 1)]).nice().range([this.innerHeight, 0]);
        const color = this.getColorScale(keys);
        const stackedData = d3.stack().keys(keys).value((d, key) => Number(d[key]) || 0)(matrix);

        this.renderHorizontalGridlines(y);
        this.renderCategoricalXAxis(x);
        this.renderLinearYAxis(y);
        this.renderLegend(keys, color);

        this.g.append('g')
            .selectAll('g')
            .data(stackedData)
            .enter()
            .append('g')
            .attr('fill', d => color(d.key))
            .selectAll('rect')
            .data(d => d)
            .enter()
            .append('rect')
            .attr('x', d => x(String(d.data[xAxis] ?? '')) ?? 0)
            .attr('y', d => { const pos = y(d[1]); return isFinite(pos) ? pos : this.innerHeight; })
            .attr('height', d => { const y0 = y(d[0]); const y1 = y(d[1]); return (isFinite(y0) && isFinite(y1)) ? Math.max(0, y0 - y1) : 0; })
            .attr('width', x.bandwidth())
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                const parentNode = event.currentTarget.parentNode;
                const segmentKey = parentNode ? d3.select(parentNode).datum().key : '';
                const segmentValue = (d[1] - d[0]) || 0;
                this.showTooltip(`<strong>${d.data[xAxis]}</strong><br/>Series: ${segmentKey}<br/>Value: ${formatNumericValue(segmentValue)}`, event);
            })
            .on('mousemove', event => this.moveTooltip(event))
            .on('mouseleave', () => this.hideTooltip());
    }
}

class LineChart extends VizChart {
    update(payload) {
        this.prepareCanvas(payload);
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;
        if (!data || data.length === 0) { this.renderEmptyState(); return; }

        const x = d3.scalePoint().domain(data.map(d => String(d[xAxis] ?? ''))).range([0, this.innerWidth]).padding(0.5);
        const rawMax = d3.max(data, d => Number(d[yAxis]) || 0) ?? 0;
        const rawMin = d3.min(data, d => Number(d[yAxis]) || 0) ?? 0;
        const minY = Math.min(0, rawMin);
        const y = d3.scaleLinear().domain([minY, Math.max(minY + 1, isFinite(rawMax) ? rawMax : 1)]).nice().range([this.innerHeight, 0]);

        this.renderHorizontalGridlines(y);
        this.renderCategoricalXAxis(x);
        this.renderLinearYAxis(y);

        const lineGen = d3.line()
            .x(d => x(String(d[xAxis] ?? '')) ?? 0)
            .y(d => { const pos = y(Number(d[yAxis]) || 0); return isFinite(pos) ? pos : this.innerHeight; })
            .curve(d3.curveMonotoneX);

        this.g.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', this.getPrimaryColor())
            .attr('stroke-width', 2.5)
            .attr('d', lineGen);

        this.g.selectAll('.dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'dot')
            .attr('cx', d => x(String(d[xAxis] ?? '')) ?? 0)
            .attr('cy', d => { const pos = y(Number(d[yAxis]) || 0); return isFinite(pos) ? pos : this.innerHeight; })
            .attr('r', 4.5)
            .attr('fill', this.getChartColor(0))
            .attr('stroke', this.getBackgroundColor())
            .attr('stroke-width', 1.5)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget).attr('r', 6.5);
                this.showTooltip(`<strong>${d[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(Number(d[yAxis]) || 0)}`, event);
            })
            .on('mousemove', event => this.moveTooltip(event))
            .on('mouseleave', event => {
                d3.select(event.currentTarget).attr('r', 4.5);
                this.hideTooltip();
            });
    }
}

class AreaChart extends VizChart {
    update(payload) {
        this.prepareCanvas(payload);
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;
        if (!data || data.length === 0) { this.renderEmptyState(); return; }

        const x = d3.scalePoint().domain(data.map(d => String(d[xAxis] ?? ''))).range([0, this.innerWidth]).padding(0.2);
        const rawMax = d3.max(data, d => Number(d[yAxis]) || 0) ?? 0;
        const y = d3.scaleLinear().domain([0, Math.max(1, isFinite(rawMax) ? rawMax : 1)]).nice().range([this.innerHeight, 0]);

        this.renderHorizontalGridlines(y);
        this.renderCategoricalXAxis(x);
        this.renderLinearYAxis(y);

        const primary = this.getPrimaryColor();
        const gradId = `area-grad-${Math.random().toString(36).slice(2, 9)}`;
        const grad = this.defs.append('linearGradient').attr('id', gradId).attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
        grad.append('stop').attr('offset', '0%').attr('stop-color', primary).attr('stop-opacity', 0.45);
        grad.append('stop').attr('offset', '100%').attr('stop-color', primary).attr('stop-opacity', 0.02);

        const areaGen = d3.area().x(d => x(String(d[xAxis] ?? '')) ?? 0).y0(this.innerHeight).y1(d => y(Number(d[yAxis]) || 0)).curve(d3.curveMonotoneX);
        const lineGen = d3.line().x(d => x(String(d[xAxis] ?? '')) ?? 0).y(d => y(Number(d[yAxis]) || 0)).curve(d3.curveMonotoneX);

        this.g.append('path').datum(data).attr('fill', `url(#${gradId})`).attr('d', areaGen);
        this.g.append('path').datum(data).attr('fill', 'none').attr('stroke', primary).attr('stroke-width', 2.5).attr('d', lineGen);

        this.g.selectAll('.area-dot')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'area-dot')
            .attr('cx', d => x(String(d[xAxis] ?? '')) ?? 0)
            .attr('cy', d => y(Number(d[yAxis]) || 0))
            .attr('r', 4)
            .attr('fill', primary)
            .attr('stroke', this.getBackgroundColor())
            .attr('stroke-width', 1.5)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget).attr('r', 6);
                this.showTooltip(`<strong>${d[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(Number(d[yAxis]) || 0)}`, event);
            })
            .on('mousemove', event => this.moveTooltip(event))
            .on('mouseleave', event => {
                d3.select(event.currentTarget).attr('r', 4);
                this.hideTooltip();
            });
    }
}

class StackedAreaChart extends VizChart {
    update(payload) {
        this.prepareCanvas(payload);
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey, groupKey = this.cfg.groupKey, stackKeys } = payload;
        if (!data || data.length === 0) { this.renderEmptyState(); return; }

        const { matrix, keys } = buildSeriesMatrix(data, xAxis, yAxis, groupKey, stackKeys);
        if (matrix.length === 0 || keys.length === 0) { this.renderEmptyState(); return; }

        const x = d3.scalePoint().domain(matrix.map(d => String(d[xAxis] ?? ''))).range([0, this.innerWidth]).padding(0.15);
        const rawMax = d3.max(matrix, d => keys.reduce((acc, k) => acc + (Number(d[k]) || 0), 0)) ?? 0;
        const y = d3.scaleLinear().domain([0, Math.max(1, isFinite(rawMax) ? rawMax : 1)]).nice().range([this.innerHeight, 0]);
        const color = this.getColorScale(keys);
        const stackedData = d3.stack().keys(keys).value((d, key) => Number(d[key]) || 0)(matrix);

        this.renderHorizontalGridlines(y);
        this.renderCategoricalXAxis(x);
        this.renderLinearYAxis(y);
        this.renderLegend(keys, color);

        const areaGen = d3.area()
            .x(d => x(String(d.data[xAxis] ?? '')) ?? 0)
            .y0(d => y(d[0]))
            .y1(d => y(d[1]))
            .curve(d3.curveMonotoneX);

        this.g.selectAll('.stacked-area-layer')
            .data(stackedData)
            .enter()
            .append('path')
            .attr('class', 'stacked-area-layer')
            .attr('fill', d => color(d.key))
            .attr('fill-opacity', 0.72)
            .attr('stroke', d => color(d.key))
            .attr('stroke-width', 1.5)
            .attr('d', areaGen)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget).attr('fill-opacity', 0.92);
                const total = d3.sum(d, pt => pt[1] - pt[0]);
                this.showTooltip(`<strong>${d.key}</strong><br/>Cumulative Total: ${formatNumericValue(total)}`, event);
            })
            .on('mousemove', event => this.moveTooltip(event))
            .on('mouseleave', event => {
                d3.select(event.currentTarget).attr('fill-opacity', 0.72);
                this.hideTooltip();
            });
    }
}

/* ============================================================================
 * 8-12: SCATTER PLOT, BUBBLE CHART, HISTOGRAM, BOX PLOT, HEATMAP
 * ============================================================================ */

class ScatterPlotChart extends VizChart {
    update(payload) {
        this.prepareCanvas(payload);
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey, groupKey = this.cfg.groupKey } = payload;
        if (!data || data.length === 0) { this.renderEmptyState(); return; }

        const numericXs = data.map(d => Number(d[xAxis]));
        const isNumericX = numericXs.every((n, i) => data[i][xAxis] !== '' && !isNaN(n) && isFinite(n));

        const yVals = data.map(d => Number(d[yAxis]) || 0);
        const yExtent = d3.extent(yVals);
        const minY = Math.min(0, yExtent[0] ?? 0);
        const maxY = Math.max(minY + 1, yExtent[1] ?? 1);
        const y = d3.scaleLinear().domain([minY, maxY]).nice().range([this.innerHeight, 0]);

        let getX;
        if (isNumericX) {
            const xExtent = d3.extent(numericXs);
            const minX = xExtent[0] ?? 0;
            const maxX = xExtent[1] <= minX ? minX + 1 : xExtent[1];
            const x = d3.scaleLinear().domain([minX, maxX]).nice().range([0, this.innerWidth]);
            this.renderVerticalGridlines(x);
            this.renderHorizontalGridlines(y);
            this.renderLinearXAxis(x);
            this.renderLinearYAxis(y);
            getX = d => x(Number(d[xAxis]) || 0);
        } else {
            const x = d3.scalePoint().domain(data.map(d => String(d[xAxis] ?? ''))).range([0, this.innerWidth]).padding(0.5);
            this.renderHorizontalGridlines(y);
            this.renderCategoricalXAxis(x);
            this.renderLinearYAxis(y);
            getX = d => x(String(d[xAxis] ?? '')) ?? 0;
        }

        const activeGroup = groupKey && groupKey !== xAxis && groupKey !== yAxis ? groupKey : null;
        const groups = activeGroup ? Array.from(new Set(data.map(d => String(d[activeGroup] ?? 'Other')))) : [];
        const color = activeGroup ? this.getColorScale(groups) : null;
        if (color && groups.length > 0) this.renderLegend(groups, color);

        const primary = this.getPrimaryColor();

        this.g.selectAll('.scatter-point')
            .data(data)
            .enter()
            .append('circle')
            .attr('class', 'scatter-point')
            .attr('cx', getX)
            .attr('cy', d => y(Number(d[yAxis]) || 0))
            .attr('r', 5.5)
            .attr('fill', d => (color && activeGroup ? color(String(d[activeGroup] ?? 'Other')) : primary))
            .attr('fill-opacity', 0.8)
            .attr('stroke', this.getBackgroundColor())
            .attr('stroke-width', 1.2)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget).attr('r', 8).attr('fill-opacity', 1);
                const groupInfo = activeGroup ? `<br/>${activeGroup}: ${d[activeGroup]}` : '';
                this.showTooltip(`<strong>${xAxis}: ${d[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(Number(d[yAxis]) || 0)}${groupInfo}`, event);
            })
            .on('mousemove', event => this.moveTooltip(event))
            .on('mouseleave', event => {
                d3.select(event.currentTarget).attr('r', 5.5).attr('fill-opacity', 0.8);
                this.hideTooltip();
            });
    }
}

class BubbleChart extends VizChart {
    constructor(containerElement, config = {}) {
        super(containerElement, Object.assign({}, config, {
            margin: Object.assign({ top: 18, right: 18, bottom: 18, left: 18 }, config.margin || {})
        }));
    }

    update(payload) {
        this.prepareCanvas(payload);
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey, groupKey } = payload;

        const validData = (data || []).filter(d => (Number(d[yAxis]) || 0) > 0);
        if (validData.length === 0) {
            this.renderEmptyState('Positive numeric metric required for bubbles');
            return;
        }

        const diameter = Math.max(60, Math.min(this.innerWidth, this.innerHeight));
        const offsetX = (this.innerWidth - diameter) / 2;
        const offsetY = (this.innerHeight - diameter) / 2;

        const root = d3.hierarchy({ children: validData })
            .sum(d => ('children' in d ? 0 : Math.max(0.1, Number(d[yAxis]) || 0)));

        const nodes = d3.pack().size([diameter, diameter]).padding(4)(root).leaves();
        const colorField = groupKey && groupKey !== yAxis ? groupKey : xAxis;
        const color = this.getColorScale(validData.map(d => String(d[colorField] ?? '')));

        const bubbleG = this.g.append('g').attr('transform', translate(offsetX, offsetY));
        const leaf = bubbleG.selectAll('g.bubble-node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'bubble-node')
            .attr('transform', d => translate(d.x, d.y))
            .style('cursor', 'pointer');

        leaf.append('circle')
            .attr('r', d => Math.max(2, d.r))
            .attr('fill', d => color(String(d.data[colorField] ?? '')))
            .attr('fill-opacity', 0.82)
            .attr('stroke', this.getBackgroundColor())
            .attr('stroke-width', 1.5);

        leaf.filter(d => d.r > 18)
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.32em')
            .style('font-size', d => `${Math.min(12, Math.max(8, d.r / 3.4))}px`)
            .style('font-family', '"JetBrains Mono", monospace')
            .style('fill', '#111216')
            .style('font-weight', '600')
            .style('pointer-events', 'none')
            .text(d => {
                const label = String(d.data[xAxis] ?? '');
                const maxChars = Math.max(3, Math.floor(d.r / 4));
                return label.length > maxChars ? label.slice(0, maxChars - 1) + '…' : label;
            });

        leaf.on('mouseover', (event, d) => {
            d3.select(event.currentTarget).select('circle').attr('fill-opacity', 1).attr('stroke-width', 2.5);
            this.showTooltip(`<strong>${d.data[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(Number(d.data[yAxis]) || 0)}`, event);
        })
            .on('mousemove', event => this.moveTooltip(event))
            .on('mouseleave', event => {
                d3.select(event.currentTarget).select('circle').attr('fill-opacity', 0.82).attr('stroke-width', 1.5);
                this.hideTooltip();
            });
    }
}

class HistogramChart extends VizChart {
    update(payload) {
        this.prepareCanvas(payload);
        const { data, yAxis = this.cfg.yKey, xAxis = this.cfg.xKey } = payload;
        if (!data || data.length === 0) { this.renderEmptyState(); return; }

        let targetKey = yAxis;
        let values = data.map(d => Number(d[yAxis])).filter(v => !isNaN(v) && isFinite(v));
        if (values.length === 0) {
            targetKey = xAxis;
            values = data.map(d => Number(d[xAxis])).filter(v => !isNaN(v) && isFinite(v));
        }

        if (values.length === 0) {
            this.renderEmptyState('Numeric values required for Histogram');
            return;
        }

        const extent = d3.extent(values);
        const minVal = extent[0];
        const maxVal = extent[1] <= minVal ? minVal + 1 : extent[1];
        const x = d3.scaleLinear().domain([minVal, maxVal]).nice().range([0, this.innerWidth]);
        const bins = d3.bin().domain(x.domain()).thresholds(x.ticks(Math.min(16, Math.max(5, Math.ceil(Math.sqrt(values.length))))))(values);
        const maxCount = Math.max(1, d3.max(bins, b => b.length) ?? 1);
        const y = d3.scaleLinear().domain([0, maxCount]).nice().range([this.innerHeight, 0]);

        this.renderHorizontalGridlines(y);
        this.renderLinearXAxis(x);
        this.renderLinearYAxis(y);

        const primary = this.getPrimaryColor();

        this.g.selectAll('.hist-bar')
            .data(bins)
            .enter()
            .append('rect')
            .attr('class', 'hist-bar')
            .attr('x', d => x(d.x0 ?? 0) + 1)
            .attr('y', d => y(d.length))
            .attr('width', d => Math.max(1, x(d.x1 ?? 0) - x(d.x0 ?? 0) - 2))
            .attr('height', d => Math.max(0, this.innerHeight - y(d.length)))
            .attr('fill', primary)
            .attr('rx', 2)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget).attr('fill', this.getChartColor(0));
                this.showTooltip(`<strong>${targetKey} Bin</strong><br/>Range: [${formatNumericValue(d.x0 ?? 0)}, ${formatNumericValue(d.x1 ?? 0)})<br/>Count: ${d.length}`, event);
            })
            .on('mousemove', event => this.moveTooltip(event))
            .on('mouseleave', event => {
                d3.select(event.currentTarget).attr('fill', primary);
                this.hideTooltip();
            });
    }
}

class BoxPlotChart extends VizChart {
    update(payload) {
        this.prepareCanvas(payload);
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;
        if (!data || data.length === 0) { this.renderEmptyState(); return; }

        const grouped = d3.group(data, d => String(d[xAxis] ?? 'All'));
        const stats = [];

        grouped.forEach((rows, key) => {
            const nums = rows.map(r => Number(r[yAxis])).filter(v => !isNaN(v) && isFinite(v)).sort(d3.ascending);
            if (nums.length === 0) return;

            const q1 = d3.quantile(nums, 0.25) ?? nums[0];
            const median = d3.quantile(nums, 0.5) ?? nums[0];
            const q3 = d3.quantile(nums, 0.75) ?? nums[nums.length - 1];
            const iqr = q3 - q1;
            const lowerFence = q1 - 1.5 * iqr;
            const upperFence = q3 + 1.5 * iqr;
            const inliers = nums.filter(v => v >= lowerFence && v <= upperFence);
            const outliers = nums.filter(v => v < lowerFence || v > upperFence);

            stats.push({
                key,
                min: inliers.length > 0 ? inliers[0] : nums[0],
                q1,
                median,
                q3,
                max: inliers.length > 0 ? inliers[inliers.length - 1] : nums[nums.length - 1],
                outliers,
                count: nums.length
            });
        });

        if (stats.length === 0) {
            this.renderEmptyState('Numeric values required for Box Plot');
            return;
        }

        const x = d3.scaleBand().domain(stats.map(s => s.key)).range([0, this.innerWidth]).padding(0.35);
        const allMin = d3.min(stats, s => Math.min(s.min, ...s.outliers)) ?? 0;
        const allMax = d3.max(stats, s => Math.max(s.max, ...s.outliers)) ?? 1;
        const y = d3.scaleLinear().domain([allMin, allMax <= allMin ? allMin + 1 : allMax]).nice().range([this.innerHeight, 0]);

        this.renderHorizontalGridlines(y);
        this.renderCategoricalXAxis(x);
        this.renderLinearYAxis(y);

        const boxWidth = Math.min(48, Math.max(12, x.bandwidth()));
        const primary = this.getPrimaryColor();
        const accent2 = this.getChartColor(0);

        const boxG = this.g.selectAll('.boxplot-group')
            .data(stats)
            .enter()
            .append('g')
            .attr('class', 'boxplot-group')
            .attr('transform', d => translate((x(d.key) ?? 0) + x.bandwidth() / 2, 0));

        boxG.append('line').attr('x1', 0).attr('x2', 0).attr('y1', d => y(d.min)).attr('y2', d => y(d.max)).attr('stroke', this.getAxisColor()).attr('stroke-width', 1.5);
        boxG.append('line').attr('x1', -boxWidth * 0.3).attr('x2', boxWidth * 0.3).attr('y1', d => y(d.min)).attr('y2', d => y(d.min)).attr('stroke', this.getAxisColor()).attr('stroke-width', 1.5);
        boxG.append('line').attr('x1', -boxWidth * 0.3).attr('x2', boxWidth * 0.3).attr('y1', d => y(d.max)).attr('y2', d => y(d.max)).attr('stroke', this.getAxisColor()).attr('stroke-width', 1.5);

        boxG.append('rect')
            .attr('x', -boxWidth / 2)
            .attr('y', d => y(d.q3))
            .attr('width', boxWidth)
            .attr('height', d => Math.max(2, y(d.q1) - y(d.q3)))
            .attr('fill', accent2)
            .attr('fill-opacity', 0.45)
            .attr('stroke', accent2)
            .attr('stroke-width', 1.5)
            .attr('rx', 2)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                this.showTooltip(
                    `<strong>${d.key}</strong> (n=${d.count})<br/>Max: ${formatNumericValue(d.max)}<br/>Q3: ${formatNumericValue(d.q3)}<br/>Median: ${formatNumericValue(d.median)}<br/>Q1: ${formatNumericValue(d.q1)}<br/>Min: ${formatNumericValue(d.min)}`,
                    event
                );
            })
            .on('mousemove', event => this.moveTooltip(event))
            .on('mouseleave', () => this.hideTooltip());

        boxG.append('line')
            .attr('x1', -boxWidth / 2)
            .attr('x2', boxWidth / 2)
            .attr('y1', d => y(d.median))
            .attr('y2', d => y(d.median))
            .attr('stroke', primary)
            .attr('stroke-width', 2.5);

        boxG.each((d, i, nodes) => {
            const sel = d3.select(nodes[i]);
            d.outliers.forEach(out => {
                sel.append('circle').attr('cx', 0).attr('cy', y(out)).attr('r', 3).attr('fill', primary).attr('stroke', this.getBackgroundColor());
            });
        });
    }
}

class HeatmapChart extends VizChart {
    constructor(containerElement, config = {}) {
        super(containerElement, Object.assign({}, config, {
            margin: Object.assign({ top: 24, right: 24, bottom: 52, left: 86 }, config.margin || {})
        }));
    }

    update(payload) {
        this.prepareCanvas(payload);
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey, groupKey = this.cfg.groupKey } = payload;
        if (!data || data.length === 0) { this.renderEmptyState(); return; }

        const rowKey = (groupKey && groupKey !== xAxis)
            ? groupKey
            : (Object.keys(data[0]).find(k => k !== xAxis && k !== yAxis) || yAxis);

        const xDomain = Array.from(new Set(data.map(d => String(d[xAxis] ?? ''))));
        const yDomain = Array.from(new Set(data.map(d => String(d[rowKey] ?? ''))));

        const cellMap = new Map();
        data.forEach(d => {
            const xv = String(d[xAxis] ?? '');
            const yv = String(d[rowKey] ?? '');
            const val = rowKey === yAxis ? 1 : (Number(d[yAxis]) || 0);
            const id = `${xv}::${yv}`;
            const existing = cellMap.get(id);
            if (existing) existing.value += val;
            else cellMap.set(id, { x: xv, y: yv, value: val });
        });

        const cells = Array.from(cellMap.values());
        const minVal = d3.min(cells, c => c.value) ?? 0;
        const maxVal = d3.max(cells, c => c.value) ?? 1;

        const x = d3.scaleBand().domain(xDomain).range([0, this.innerWidth]).padding(0.06);
        const y = d3.scaleBand().domain(yDomain).range([0, this.innerHeight]).padding(0.06);
        const color = this.getSequentialColorScale(minVal, maxVal);

        this.renderCategoricalXAxis(x);

        const yAxisG = this.g.append('g').attr('class', 'viz-axis-y')
            .call(d3.axisLeft(y).tickFormat(d => {
                const s = String(d);
                return s.length > 12 ? s.slice(0, 10) + '…' : s;
            }));
        yAxisG.selectAll('text').style('fill', this.getAxisColor()).style('font-size', '9.5px').style('font-family', '"JetBrains Mono", monospace');
        this.styleAxisLines(yAxisG);

        this.g.selectAll('.heatmap-cell')
            .data(cells)
            .enter()
            .append('rect')
            .attr('class', 'heatmap-cell')
            .attr('x', d => x(d.x) ?? 0)
            .attr('y', d => y(d.y) ?? 0)
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth())
            .attr('rx', 3)
            .attr('fill', d => color(d.value))
            .attr('stroke', this.getBorderColor())
            .attr('stroke-width', 0.5)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget).attr('stroke', '#ffffff').attr('stroke-width', 1.5);
                this.showTooltip(`<strong>${d.x} × ${d.y}</strong><br/>Value: ${formatNumericValue(d.value)}`, event);
            })
            .on('mousemove', event => this.moveTooltip(event))
            .on('mouseleave', event => {
                d3.select(event.currentTarget).attr('stroke', this.getBorderColor()).attr('stroke-width', 0.5);
                this.hideTooltip();
            });
    }
}

/* ============================================================================
 * 13-16: PIE, DONUT, TREEMAP, FUNNEL
 * ============================================================================ */

class PieChart extends VizChart {
    constructor(containerElement, config = {}) {
        super(containerElement, Object.assign({}, config, {
            margin: Object.assign({ top: 20, right: 20, bottom: 20, left: 20 }, config.margin || {})
        }));
    }

    update(payload) {
        this.prepareCanvas(payload);
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;

        const validData = (data || []).filter(d => (Number(d[yAxis]) || 0) > 0);
        if (validData.length === 0) { this.renderEmptyState('Positive values required for Pie Chart'); return; }

        const radius = Math.max(16, Math.min(this.innerWidth, this.innerHeight) / 2);
        const mainG = this.g.append('g').attr('transform', translate(this.innerWidth / 2, this.innerHeight / 2));
        const color = this.getColorScale(validData.map(d => String(d[xAxis] ?? '')));
        const pie = d3.pie().value(d => Number(d[yAxis]) || 0).sort(null);
        const arc = d3.arc().innerRadius(0).outerRadius(radius);
        const arcHover = d3.arc().innerRadius(0).outerRadius(radius + 5);
        const total = d3.sum(validData, d => Number(d[yAxis]) || 0);

        const arcs = mainG.selectAll('.arc').data(pie(validData)).enter().append('g').attr('class', 'arc').style('cursor', 'pointer');

        arcs.append('path')
            .attr('d', arc)
            .attr('fill', d => color(String(d.data[xAxis] ?? '')))
            .attr('stroke', this.getBackgroundColor())
            .attr('stroke-width', 2)
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget).transition().duration(120).attr('d', arcHover(d) || '');
                const val = Number(d.data[yAxis]) || 0;
                const percent = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                this.showTooltip(`<strong>${d.data[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(val)} (${percent}%)`, event);
            })
            .on('mousemove', event => this.moveTooltip(event))
            .on('mouseleave', (event, d) => {
                d3.select(event.currentTarget).transition().duration(120).attr('d', arc(d) || '');
                this.hideTooltip();
            });

        arcs.filter(d => d.endAngle - d.startAngle > 0.38)
            .append('text')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .style('font-size', '10px')
            .style('font-family', '"JetBrains Mono", monospace')
            .style('font-weight', '600')
            .style('fill', '#111216')
            .style('pointer-events', 'none')
            .text(d => {
                const val = Number(d.data[yAxis]) || 0;
                return total > 0 ? `${Math.round((val / total) * 100)}%` : '';
            });
    }
}

class DonutChart extends VizChart {
    constructor(containerElement, config = {}) {
        super(containerElement, Object.assign({}, config, {
            margin: Object.assign({ top: 20, right: 20, bottom: 20, left: 20 }, config.margin || {})
        }));
    }

    update(payload) {
        this.prepareCanvas(payload);
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;

        const validData = (data || []).filter(d => (Number(d[yAxis]) || 0) > 0);
        if (validData.length === 0) { this.renderEmptyState('Positive values required for Donut Chart'); return; }

        const radius = Math.max(20, Math.min(this.innerWidth, this.innerHeight) / 2);
        const innerRadius = radius * 0.54;
        const mainG = this.g.append('g').attr('transform', translate(this.innerWidth / 2, this.innerHeight / 2));

        const color = this.getColorScale(validData.map(d => String(d[xAxis] ?? '')));
        const pie = d3.pie().value(d => Number(d[yAxis]) || 0).padAngle(0.02);
        const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius);
        const arcHover = d3.arc().innerRadius(innerRadius).outerRadius(radius + 5);
        const total = d3.sum(validData, d => Number(d[yAxis]) || 0);

        const centerTitle = mainG.append('text').attr('text-anchor', 'middle').attr('dy', '-0.25em')
            .style('font-size', '10px').style('font-family', '"JetBrains Mono", monospace').style('fill', this.getAxisColor()).text('TOTAL');
        const centerVal = mainG.append('text').attr('text-anchor', 'middle').attr('dy', '0.95em')
            .style('font-size', `${Math.max(12, Math.min(18, radius * 0.22))}px`).style('font-family', '"JetBrains Mono", monospace')
            .style('font-weight', '700').style('fill', this.getPrimaryColor()).text(formatNumericValue(total));

        mainG.selectAll('.arc')
            .data(pie(validData))
            .enter()
            .append('path')
            .attr('class', 'arc')
            .attr('d', arc)
            .attr('fill', d => color(String(d.data[xAxis] ?? '')))
            .attr('stroke', this.getBackgroundColor())
            .attr('stroke-width', 1.5)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget).transition().duration(120).attr('d', arcHover(d) || '');
                const val = Number(d.data[yAxis]) || 0;
                const percent = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                centerTitle.text(String(d.data[xAxis] ?? '').slice(0, 12));
                centerVal.text(`${percent}%`);
                this.showTooltip(`<strong>${d.data[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(val)} (${percent}%)`, event);
            })
            .on('mousemove', event => this.moveTooltip(event))
            .on('mouseleave', (event, d) => {
                d3.select(event.currentTarget).transition().duration(120).attr('d', arc(d) || '');
                centerTitle.text('TOTAL');
                centerVal.text(formatNumericValue(total));
                this.hideTooltip();
            });
    }
}

class TreemapChart extends VizChart {
    constructor(containerElement, config = {}) {
        super(containerElement, Object.assign({}, config, {
            margin: Object.assign({ top: 14, right: 14, bottom: 14, left: 14 }, config.margin || {})
        }));
    }

    update(payload) {
        this.prepareCanvas(payload);
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey, groupKey } = payload;

        const validData = (data || []).filter(d => (Number(d[yAxis]) || 0) > 0);
        if (validData.length === 0) { this.renderEmptyState('Positive numeric metric required for Treemap'); return; }

        const root = d3.hierarchy({ children: validData })
            .sum(d => ('children' in d ? 0 : Math.max(0.01, Number(d[yAxis]) || 0)))
            .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

        d3.treemap().size([this.innerWidth, this.innerHeight]).padding(3).round(true)(root);
        const leaves = root.leaves();
        const colorField = groupKey && groupKey !== yAxis ? groupKey : xAxis;
        const color = this.getColorScale(validData.map(d => String(d[colorField] ?? '')));

        const cell = this.g.selectAll('.treemap-cell')
            .data(leaves)
            .enter()
            .append('g')
            .attr('class', 'treemap-cell')
            .attr('transform', d => translate(d.x0, d.y0))
            .style('cursor', 'pointer');

        cell.append('rect')
            .attr('width', d => Math.max(0, d.x1 - d.x0))
            .attr('height', d => Math.max(0, d.y1 - d.y0))
            .attr('rx', 3)
            .attr('fill', d => color(String(d.data[colorField] ?? '')))
            .attr('fill-opacity', 0.85)
            .attr('stroke', this.getBackgroundColor())
            .attr('stroke-width', 1);

        cell.filter(d => (d.x1 - d.x0) > 46 && (d.y1 - d.y0) > 26)
            .append('text')
            .attr('x', 6).attr('y', 15)
            .style('font-size', '10px').style('font-family', '"JetBrains Mono", monospace')
            .style('font-weight', '600').style('fill', '#111216').style('pointer-events', 'none')
            .text(d => {
                const w = d.x1 - d.x0;
                const maxChars = Math.max(3, Math.floor((w - 10) / 6.5));
                const label = String(d.data[xAxis] ?? '');
                return label.length > maxChars ? label.slice(0, maxChars - 1) + '…' : label;
            });

        cell.filter(d => (d.x1 - d.x0) > 46 && (d.y1 - d.y0) > 40)
            .append('text')
            .attr('x', 6).attr('y', 29)
            .style('font-size', '9.5px').style('font-family', '"JetBrains Mono", monospace')
            .style('fill', 'rgba(17, 18, 22, 0.8)').style('pointer-events', 'none')
            .text(d => formatNumericValue(Number(d.data[yAxis]) || 0));

        cell.on('mouseover', (event, d) => {
            d3.select(event.currentTarget).select('rect').attr('fill-opacity', 1);
            this.showTooltip(`<strong>${d.data[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(Number(d.data[yAxis]) || 0)}`, event);
        })
            .on('mousemove', event => this.moveTooltip(event))
            .on('mouseleave', event => {
                d3.select(event.currentTarget).select('rect').attr('fill-opacity', 0.85);
                this.hideTooltip();
            });
    }
}

class FunnelChart extends VizChart {
    constructor(containerElement, config = {}) {
        super(containerElement, Object.assign({}, config, {
            margin: Object.assign({ top: 20, right: 24, bottom: 20, left: 24 }, config.margin || {})
        }));
    }

    update(payload) {
        this.prepareCanvas(payload);
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;

        const validData = (data || []).filter(d => (Number(d[yAxis]) || 0) >= 0);
        if (validData.length === 0) { this.renderEmptyState(); return; }

        const maxVal = Math.max(1, d3.max(validData, d => Number(d[yAxis]) || 0) ?? 1);
        const n = validData.length;
        const stepH = this.innerHeight / n;
        const gap = Math.min(4, stepH * 0.14);
        const centerX = this.innerWidth / 2;
        const maxW = this.innerWidth * 0.88;
        const color = this.getColorScale(validData.map(d => String(d[xAxis] ?? '')));

        validData.forEach((d, idx) => {
            const val = Number(d[yAxis]) || 0;
            const nextVal = idx < n - 1 ? (Number(validData[idx + 1][yAxis]) || 0) : val * 0.72;
            const topW = Math.max(24, (val / maxVal) * maxW);
            const botW = Math.max(18, (nextVal / maxVal) * maxW);
            const y0 = idx * stepH + gap / 2;
            const y1 = (idx + 1) * stepH - gap / 2;

            const points = [
                [centerX - topW / 2, y0],
                [centerX + topW / 2, y0],
                [centerX + botW / 2, y1],
                [centerX - botW / 2, y1]
            ].map(p => p.join(',')).join(' ');

            const label = String(d[xAxis] ?? '');
            const baseVal = Number(validData[0][yAxis]) || 1;
            const convPct = ((val / baseVal) * 100).toFixed(1);

            const stageG = this.g.append('g').style('cursor', 'pointer');
            stageG.append('polygon')
                .attr('points', points)
                .attr('fill', color(label))
                .attr('fill-opacity', 0.85)
                .attr('stroke', this.getBackgroundColor())
                .attr('stroke-width', 1.5);

            if (stepH > 18) {
                stageG.append('text')
                    .attr('x', centerX).attr('y', (y0 + y1) / 2).attr('dy', '0.35em').attr('text-anchor', 'middle')
                    .style('font-size', '10.5px').style('font-family', '"JetBrains Mono", monospace')
                    .style('font-weight', '600').style('fill', '#111216').style('pointer-events', 'none')
                    .text(`${label}: ${formatNumericValue(val)} (${convPct}%)`);
            }

            stageG.on('mouseover', event => {
                stageG.select('polygon').attr('fill-opacity', 1);
                this.showTooltip(`<strong>${label}</strong><br/>${yAxis}: ${formatNumericValue(val)}<br/>Retention from Top: ${convPct}%`, event);
            })
                .on('mousemove', event => this.moveTooltip(event))
                .on('mouseleave', () => {
                    stageG.select('polygon').attr('fill-opacity', 0.85);
                    this.hideTooltip();
                });
        });
    }
}

/* ============================================================================
 * 17-20: RADAR, RADIAL BAR, WORD CLOUD, TABLE
 * ============================================================================ */

class RadarChart extends VizChart {
    constructor(containerElement, config = {}) {
        super(containerElement, Object.assign({}, config, {
            margin: Object.assign({ top: 28, right: 36, bottom: 28, left: 36 }, config.margin || {})
        }));
    }

    update(payload) {
        this.prepareCanvas(payload);
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey, groupKey = this.cfg.groupKey } = payload;

        if (!data || data.length < 3) {
            this.renderEmptyState('At least 3 axes/rows required for Radar Chart');
            return;
        }

        const radius = Math.max(30, Math.min(this.innerWidth, this.innerHeight) / 2 - 14);
        const centerG = this.g.append('g').attr('transform', translate(this.innerWidth / 2, this.innerHeight / 2));

        const axes = Array.from(new Set(data.map(d => String(d[xAxis] ?? '')))).slice(0, 12);
        const angleSlice = (Math.PI * 2) / axes.length;
        const maxVal = Math.max(1, d3.max(data, d => Number(d[yAxis]) || 0) ?? 1);
        const rScale = d3.scaleLinear().domain([0, maxVal]).range([0, radius]);

        for (let lvl = 1; lvl <= 4; lvl++) {
            centerG.append('circle')
                .attr('r', (radius / 4) * lvl)
                .attr('fill', 'none')
                .attr('stroke', this.getBorderColor())
                .attr('stroke-dasharray', '2,3')
                .attr('stroke-opacity', 0.7);
        }

        axes.forEach((axisLabel, i) => {
            const angle = angleSlice * i - Math.PI / 2;
            centerG.append('line')
                .attr('x1', 0).attr('y1', 0)
                .attr('x2', Math.cos(angle) * radius).attr('y2', Math.sin(angle) * radius)
                .attr('stroke', this.getBorderColor()).attr('stroke-width', 1);

            const lx = Math.cos(angle) * (radius + 12);
            const ly = Math.sin(angle) * (radius + 12);
            centerG.append('text')
                .attr('x', lx).attr('y', ly)
                .attr('text-anchor', Math.abs(lx) < 8 ? 'middle' : (lx > 0 ? 'start' : 'end'))
                .attr('dy', '0.35em')
                .style('font-size', '9px').style('font-family', '"JetBrains Mono", monospace').style('fill', this.getAxisColor())
                .text(axisLabel.length > 10 ? axisLabel.slice(0, 9) + '…' : axisLabel);
        });

        const activeGroup = groupKey && groupKey !== xAxis && groupKey !== yAxis ? groupKey : null;
        const seriesNames = activeGroup ? Array.from(new Set(data.map(d => String(d[activeGroup] ?? 'Series')))).slice(0, 5) : [yAxis];
        const color = this.getColorScale(seriesNames);

        const radarLine = d3.lineRadial()
            .radius(d => rScale(d.value))
            .angle(d => d.angle)
            .curve(d3.curveLinearClosed);

        seriesNames.forEach(series => {
            const subset = activeGroup ? data.filter(d => String(d[activeGroup] ?? 'Series') === series) : data;
            const valMap = new Map();
            subset.forEach(d => valMap.set(String(d[xAxis] ?? ''), Number(d[yAxis]) || 0));

            const points = axes.map((ax, idx) => ({
                axis: ax,
                angle: angleSlice * idx,
                value: valMap.get(ax) ?? 0
            }));

            const seriesColor = seriesNames.length === 1 ? this.getPrimaryColor() : color(series);

            centerG.append('path')
                .datum(points)
                .attr('d', radarLine)
                .attr('fill', seriesColor)
                .attr('fill-opacity', 0.22)
                .attr('stroke', seriesColor)
                .attr('stroke-width', 2);

            centerG.selectAll(`.radar-dot-${series.replace(/\W+/g, '_')}`)
                .data(points)
                .enter()
                .append('circle')
                .attr('cx', d => rScale(d.value) * Math.cos(d.angle - Math.PI / 2))
                .attr('cy', d => rScale(d.value) * Math.sin(d.angle - Math.PI / 2))
                .attr('r', 4)
                .attr('fill', seriesColor)
                .attr('stroke', this.getBackgroundColor())
                .attr('stroke-width', 1.2)
                .style('cursor', 'pointer')
                .on('mouseover', (event, d) => {
                    d3.select(event.currentTarget).attr('r', 6);
                    this.showTooltip(`<strong>${d.axis}</strong><br/>${series}: ${formatNumericValue(d.value)}`, event);
                })
                .on('mousemove', event => this.moveTooltip(event))
                .on('mouseleave', event => {
                    d3.select(event.currentTarget).attr('r', 4);
                    this.hideTooltip();
                });
        });

        if (seriesNames.length > 1) {
            this.renderLegend(seriesNames, color);
        }
    }
}

class RadialBarChart extends VizChart {
    constructor(containerElement, config = {}) {
        super(containerElement, Object.assign({}, config, {
            margin: Object.assign({ top: 20, right: 20, bottom: 20, left: 20 }, config.margin || {})
        }));
    }

    update(payload) {
        this.prepareCanvas(payload);
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;

        const validData = (data || []).filter(d => (Number(d[yAxis]) || 0) >= 0);
        if (validData.length === 0) { this.renderEmptyState(); return; }

        const outerRadius = Math.max(30, Math.min(this.innerWidth, this.innerHeight) / 2 - 10);
        const innerRadius = outerRadius * 0.28;
        const centerG = this.g.append('g').attr('transform', translate(this.innerWidth / 2, this.innerHeight / 2));

        const x = d3.scaleBand().domain(validData.map(d => String(d[xAxis] ?? ''))).range([0, Math.PI * 2]).padding(0.14);
        const maxVal = Math.max(1, d3.max(validData, d => Number(d[yAxis]) || 0) ?? 1);
        const y = d3.scaleRadial().domain([0, maxVal]).range([innerRadius, outerRadius]);
        const color = this.getColorScale(validData.map(d => String(d[xAxis] ?? '')));

        const arcGen = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(d => y(Number(d[yAxis]) || 0))
            .startAngle(d => x(String(d[xAxis] ?? '')) ?? 0)
            .endAngle(d => (x(String(d[xAxis] ?? '')) ?? 0) + x.bandwidth())
            .padAngle(0.02)
            .padRadius(innerRadius);

        centerG.selectAll('.radial-bar')
            .data(validData)
            .enter()
            .append('path')
            .attr('class', 'radial-bar')
            .attr('d', d => arcGen(d) || '')
            .attr('fill', d => color(String(d[xAxis] ?? '')))
            .attr('fill-opacity', 0.88)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                d3.select(event.currentTarget).attr('fill-opacity', 1);
                this.showTooltip(`<strong>${d[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(Number(d[yAxis]) || 0)}`, event);
            })
            .on('mousemove', event => this.moveTooltip(event))
            .on('mouseleave', event => {
                d3.select(event.currentTarget).attr('fill-opacity', 0.88);
                this.hideTooltip();
            });

        centerG.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .style('font-size', '10px')
            .style('font-family', '"JetBrains Mono", monospace')
            .style('fill', this.getAxisColor())
            .text(`${validData.length} items`);
    }
}

class WordCloudChart extends VizChart {
    constructor(containerElement, config = {}) {
        super(containerElement, Object.assign({}, config, {
            margin: Object.assign({ top: 12, right: 12, bottom: 12, left: 12 }, config.margin || {})
        }));
        this.currentLayout = null;
    }

    update(payload) {
        this.prepareCanvas(payload);
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;

        if (this.currentLayout) {
            try { this.currentLayout.stop(); } catch (e) { }
            this.currentLayout = null;
        }

        if (!data || data.length === 0) { this.renderEmptyState(); return; }
        if (!window.d3 || !window.d3.layout || !window.d3.layout.cloud) {
            this.renderEmptyState('d3-cloud layout library not loaded');
            return;
        }

        const words = data.map(d => ({
            text: String(d[xAxis] ?? ''),
            weight: Math.max(1, Number(d[yAxis]) || 10)
        })).filter(w => w.text.trim().length > 0);

        if (words.length === 0) { this.renderEmptyState(); return; }

        const rawMin = d3.min(words, d => d.weight) ?? 1;
        const rawMax = d3.max(words, d => d.weight) ?? rawMin + 1;
        const minW = Math.max(1, isFinite(rawMin) ? rawMin : 1);
        const maxW = Math.max(minW + 1, isFinite(rawMax) ? rawMax : minW + 1);
        const sizeScale = d3.scaleLinear().domain([minW, maxW]).range([13, 34]);

        this.currentLayout = d3.layout.cloud()
            .size([this.innerWidth, this.innerHeight])
            .words(words)
            .padding(4)
            .rotate(() => (Math.random() > 0.7 ? 90 : 0))
            .font('"JetBrains Mono", monospace')
            .fontSize(d => sizeScale(d.weight))
            .on('end', drawWords => {
                this.g.selectAll('*').remove();
                this.g.append('g')
                    .attr('transform', translate(this.innerWidth / 2, this.innerHeight / 2))
                    .selectAll('text')
                    .data(drawWords)
                    .enter()
                    .append('text')
                    .style('font-size', d => `${d.size}px`)
                    .style('font-family', '"JetBrains Mono", monospace')
                    .style('font-weight', '600')
                    .style('fill', (_d, i) => this.getChartColor(i))
                    .attr('text-anchor', 'middle')
                    .attr('transform', d => translate(d.x, d.y) + ` rotate(${d.rotate})`)
                    .text(d => d.text)
                    .style('cursor', 'pointer')
                    .on('mouseover', (event, d) => {
                        this.showTooltip(`<strong>${d.text}</strong><br/>${yAxis}: ${formatNumericValue(d.weight)}`, event);
                    })
                    .on('mousemove', event => this.moveTooltip(event))
                    .on('mouseleave', () => this.hideTooltip());
            });

        this.currentLayout.start();
    }

    destroy() {
        if (this.currentLayout) {
            try { this.currentLayout.stop(); } catch (e) { }
            this.currentLayout = null;
        }
        super.destroy();
    }
}

class TableChart extends VizChart {
    update(payload) {
        const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey, selectedColumns } = payload;
        this.container.selectAll('.viz-table-wrapper').remove();

        if (!data || data.length === 0) {
            if (this.svg) this.svg.style('display', 'block');
            this.renderEmptyState();
            return;
        }

        if (this.svg) this.svg.style('display', 'none');

        const wrapper = this.container.append('div')
            .attr('class', 'table-responsive viz-table-wrapper')
            .style('height', '100%')
            .style('overflow-y', 'auto');

        const table = wrapper.append('table')
            .attr('class', 'table table-dark table-striped table-hover table-sm table-bordered font-mono tabular-nums text-start small mb-0')
            .style('font-size', '11px');

        let cols = (selectedColumns && Array.isArray(selectedColumns) && selectedColumns.length > 0)
            ? selectedColumns
            : [xAxis, yAxis].filter(Boolean);

        if (cols.length === 0 && data.length > 0) {
            cols = Object.keys(data[0]);
        }

        const thead = table.append('thead').append('tr');
        cols.forEach(col => {
            thead.append('th')
                .style('color', this.getPrimaryColor())
                .style('position', 'sticky')
                .style('top', '0')
                .style('background-color', '#14161a')
                .text(col);
        });

        const tbody = table.append('tbody');
        const rows = tbody.selectAll('tr').data(data).enter().append('tr');

        rows.each(function (d) {
            const tr = d3.select(this);
            cols.forEach(col => {
                const rawVal = d[col];
                const numVal = Number(rawVal);
                const isNum = !isNaN(numVal) && rawVal !== '' && rawVal !== null && rawVal !== undefined && typeof rawVal !== 'boolean';
                const displayVal = isNum
                    ? formatNumericValue(numVal)
                    : (rawVal !== undefined && rawVal !== null ? String(rawVal) : '');
                tr.append('td').style('text-align', isNum ? 'right' : 'left').text(displayVal);
            });
        });
    }
}

/* ============================================================================
 * GLOBAL REGISTRIES & CATALOG
 * ============================================================================ */

window.CHART_REGISTRY = {
    'Bar Chart': BarChart,
    'Horizontal Bar Chart': HorizontalBarChart,
    'Grouped Bar Chart': GroupedBarChart,
    'Stacked Bar Chart': StackedBarChart,
    'Line Chart': LineChart,
    'Area Chart': AreaChart,
    'Stacked Area Chart': StackedAreaChart,
    'Scatter Plot': ScatterPlotChart,
    'Bubble Chart': BubbleChart,
    'Histogram': HistogramChart,
    'Box Plot': BoxPlotChart,
    'Heatmap': HeatmapChart,
    'Pie Chart': PieChart,
    'Donut Chart': DonutChart,
    'Treemap': TreemapChart,
    'Funnel Chart': FunnelChart,
    'Radar Chart': RadarChart,
    'Radial Bar Chart': RadialBarChart,
    'Word Cloud Chart': WordCloudChart,
    'Table Chart': TableChart
};

const CHART_CLASS_ALIASES = {
    BarChart,
    HorizontalBarChart,
    GroupedBarChart,
    StackedBarChart,
    LineChart,
    AreaChart,
    StackedAreaChart,
    ScatterPlotChart,
    ScatterChart: ScatterPlotChart,
    BubbleChart,
    HistogramChart,
    Histogram: HistogramChart,
    BoxPlotChart,
    HeatmapChart,
    PieChart,
    DonutChart,
    TreemapChart,
    FunnelChart,
    RadarChart,
    RadialBarChart,
    WordCloudChart,
    WordCloud: WordCloudChart,
    TableChart
};

window.resolveChartClass = function resolveChartClass(typeOrName) {
    if (!typeOrName) return BarChart;
    if (window.CHART_REGISTRY[typeOrName]) return window.CHART_REGISTRY[typeOrName];
    if (CHART_CLASS_ALIASES[typeOrName]) return CHART_CLASS_ALIASES[typeOrName];
    const normalized = String(typeOrName).trim().toLowerCase();
    for (const [key, cls] of Object.entries(window.CHART_REGISTRY)) {
        if (key.toLowerCase() === normalized) return cls;
    }
    for (const [key, cls] of Object.entries(CHART_CLASS_ALIASES)) {
        if (key.toLowerCase() === normalized) return cls;
    }
    return null;
};

window.CHART_CATALOG = [
    { type: 'Bar Chart', category: 'Comparison', description: 'Vertical categorical comparison bars with hover readouts.', icon: 'bi-bar-chart-fill' },
    { type: 'Horizontal Bar Chart', category: 'Comparison', description: 'Sorted horizontal bars ideal for long category labels.', icon: 'bi-bar-chart-steps' },
    { type: 'Grouped Bar Chart', category: 'Comparison', description: 'Side-by-side multi-series comparison across categories.', icon: 'bi-bar-chart-line' },
    { type: 'Stacked Bar Chart', category: 'Composition', description: 'Part-to-whole stacked bars broken down by series.', icon: 'bi-layers-fill' },
    { type: 'Line Chart', category: 'Trend', description: 'Smooth monotone trend line with interactive markers.', icon: 'bi-graph-up' },
    { type: 'Area Chart', category: 'Trend', description: 'Gradient-shaded area progression over ordered intervals.', icon: 'bi-soundwave' },
    { type: 'Stacked Area Chart', category: 'Trend', description: 'Cumulative multi-series area composition over time.', icon: 'bi-stack' },
    { type: 'Scatter Plot', category: 'Correlation', description: 'X/Y coordinate dispersion with optional category grouping.', icon: 'bi-asterisk' },
    { type: 'Bubble Chart', category: 'Composition', description: 'D3 circle-packing layout sized proportionally by metric.', icon: 'bi-circle-fill' },
    { type: 'Histogram', category: 'Distribution', description: 'Automatic D3 binning of numeric value frequencies.', icon: 'bi-bar-chart' },
    { type: 'Box Plot', category: 'Distribution', description: 'Quartiles, median, IQR whiskers, and statistical outliers.', icon: 'bi-distribute-vertical' },
    { type: 'Heatmap', category: 'Correlation', description: '2D matrix intensity grid with sequential color ramp.', icon: 'bi-grid-3x3-gap-fill' },
    { type: 'Pie Chart', category: 'Composition', description: 'Classic proportional slices with percentage labels.', icon: 'bi-pie-chart-fill' },
    { type: 'Donut Chart', category: 'Composition', description: 'Ring breakdown displaying aggregate KPI in the center.', icon: 'bi-vinyl-fill' },
    { type: 'Treemap', category: 'Composition', description: 'Space-filling proportional hierarchy rectangles.', icon: 'bi-grid-1x2-fill' },
    { type: 'Funnel Chart', category: 'Composition', description: 'Sequential stage conversion and retention drop-off view.', icon: 'bi-funnel-fill' },
    { type: 'Radar Chart', category: 'Comparison', description: 'Polar multi-axis polygon comparison across dimensions.', icon: 'bi-pentagon-fill' },
    { type: 'Radial Bar Chart', category: 'Comparison', description: 'Circular polar bars radiating from a central ring.', icon: 'bi-bullseye' },
    { type: 'Word Cloud Chart', category: 'Distribution', description: 'Weighted text layout powered by d3-cloud.', icon: 'bi-cloud-fill' },
    { type: 'Table Chart', category: 'Tabular', description: 'High-density tabular view with selectable columns.', icon: 'bi-table' }
];

window.VizChart = VizChart;
window.BarChart = BarChart;
window.HorizontalBarChart = HorizontalBarChart;
window.GroupedBarChart = GroupedBarChart;
window.StackedBarChart = StackedBarChart;
window.LineChart = LineChart;
window.AreaChart = AreaChart;
window.StackedAreaChart = StackedAreaChart;
window.ScatterPlotChart = ScatterPlotChart;
window.BubbleChart = BubbleChart;
window.HistogramChart = HistogramChart;
window.BoxPlotChart = BoxPlotChart;
window.HeatmapChart = HeatmapChart;
window.PieChart = PieChart;
window.DonutChart = DonutChart;
window.TreemapChart = TreemapChart;
window.FunnelChart = FunnelChart;
window.RadarChart = RadarChart;
window.RadialBarChart = RadialBarChart;
window.WordCloudChart = WordCloudChart;
window.TableChart = TableChart;
window.DEFAULT_CHART_PALETTE = DEFAULT_CHART_PALETTE;
window.formatDateByGranularity = formatDateByGranularity;
window.getAggregateFunction = getAggregateFunction;
window.translate = translate;
