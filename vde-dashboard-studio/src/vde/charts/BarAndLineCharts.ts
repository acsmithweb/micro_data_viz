import * as d3 from 'd3';
import {
  VizChart,
  ChartConfig,
  ChartUpdatePayload,
  DataRow,
  translate,
  formatNumericValue,
} from './VizChart';

/**
 * Helper to derive multi-series stacked/grouped matrix from tabular rows
 * when explicit stackKeys are not passed directly.
 */
function buildSeriesMatrix(
  data: DataRow[],
  xAxis: string,
  yAxis: string,
  groupKey?: string,
  providedStackKeys?: string[]
): { matrix: DataRow[]; keys: string[] } {
  if (providedStackKeys && providedStackKeys.length > 0 && data.length > 0 && providedStackKeys[0] in data[0]) {
    return { matrix: data, keys: providedStackKeys.map(String) };
  }

  const effectiveGroup = groupKey && groupKey !== xAxis ? groupKey : yAxis;
  const numericValueMode = groupKey && groupKey !== xAxis && groupKey !== yAxis;

  const keys = Array.from(new Set(data.map((d) => String(d[effectiveGroup] ?? 'Other')))).slice(0, 10);
  const grouped = d3.group(data, (d) => String(d[xAxis] ?? ''));

  const matrix = Array.from(grouped, ([xVal, rows]) => {
    const row: DataRow = { [xAxis]: xVal };
    keys.forEach((k) => (row[k] = 0));
    rows.forEach((r) => {
      const k = String(r[effectiveGroup] ?? 'Other');
      if (!keys.includes(k)) return;
      const increment = numericValueMode ? Number(r[yAxis]) || 0 : 1;
      row[k] = Number(row[k] || 0) + increment;
    });
    return row;
  });

  return { matrix, keys };
}

export class BarChart extends VizChart {
  public update(payload: ChartUpdatePayload): void {
    this.prepareCanvas(payload);
    const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;

    if (!data || data.length === 0) {
      this.renderEmptyState();
      return;
    }

    const x = d3
      .scaleBand<string>()
      .domain(data.map((d) => String(d[xAxis] ?? '')))
      .range([0, this.innerWidth])
      .padding(0.22);

    const rawMax = d3.max(data, (d) => Number(d[yAxis]) || 0) ?? 0;
    const maxY = Math.max(1, isFinite(rawMax) ? rawMax : 1);

    const y = d3.scaleLinear().domain([0, maxY]).nice().range([this.innerHeight, 0]);

    this.renderHorizontalGridlines(y);
    this.renderCategoricalXAxis(x);
    this.renderLinearYAxis(y);

    const primary = this.getPrimaryColor();

    this.g
      .selectAll<SVGRectElement, DataRow>('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(String(d[xAxis] ?? '')) ?? 0)
      .attr('y', (d) => {
        const pos = y(Number(d[yAxis]) || 0);
        return isFinite(pos) ? pos : this.innerHeight;
      })
      .attr('width', x.bandwidth())
      .attr('height', (d) => {
        const pos = y(Number(d[yAxis]) || 0);
        return isFinite(pos) ? Math.max(0, this.innerHeight - pos) : 0;
      })
      .attr('fill', primary)
      .attr('rx', 3)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget as Element).attr('fill', this.getChartColor(0));
        const val = Number(d[yAxis]) || 0;
        this.showTooltip(
          `<strong>${d[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(val)}`,
          event
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget as Element).attr('fill', primary);
        this.hideTooltip();
      });
  }
}

export class HorizontalBarChart extends VizChart {
  constructor(containerElement: HTMLElement, config: ChartConfig = {}) {
    super(containerElement, {
      ...config,
      margin: Object.assign({ top: 20, right: 28, bottom: 38, left: 105 }, config.margin || {}),
    });
  }

  public update(payload: ChartUpdatePayload): void {
    this.prepareCanvas(payload);
    const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;

    if (!data || data.length === 0) {
      this.renderEmptyState();
      return;
    }

    const sorted = [...data].sort((a, b) => (Number(b[yAxis]) || 0) - (Number(a[yAxis]) || 0));

    const y = d3
      .scaleBand<string>()
      .domain(sorted.map((d) => String(d[xAxis] ?? '')))
      .range([0, this.innerHeight])
      .padding(0.22);

    const rawMax = d3.max(sorted, (d) => Number(d[yAxis]) || 0) ?? 0;
    const maxX = Math.max(1, isFinite(rawMax) ? rawMax : 1);
    const x = d3.scaleLinear().domain([0, maxX]).nice().range([0, this.innerWidth]);

    this.renderVerticalGridlines(x);
    this.renderLinearXAxis(x);

    const yAxisG = this.g
      .append('g')
      .attr('class', 'viz-axis-y')
      .call(
        d3.axisLeft(y).tickFormat((d) => {
          const s = String(d);
          return s.length > 15 ? s.slice(0, 13) + '…' : s;
        })
      );

    yAxisG
      .selectAll('text')
      .style('fill', this.getAxisColor())
      .style('font-size', '9.5px')
      .style('font-family', '"JetBrains Mono", monospace');
    this.styleAxisLines(yAxisG);

    const primary = this.getPrimaryColor();

    this.g
      .selectAll<SVGRectElement, DataRow>('.hbar')
      .data(sorted)
      .enter()
      .append('rect')
      .attr('class', 'hbar')
      .attr('x', 0)
      .attr('y', (d) => y(String(d[xAxis] ?? '')) ?? 0)
      .attr('height', y.bandwidth())
      .attr('width', (d) => Math.max(0, x(Number(d[yAxis]) || 0)))
      .attr('fill', primary)
      .attr('rx', 3)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget as Element).attr('fill', this.getChartColor(0));
        const val = Number(d[yAxis]) || 0;
        this.showTooltip(
          `<strong>${d[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(val)}`,
          event
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget as Element).attr('fill', primary);
        this.hideTooltip();
      });
  }
}

export class GroupedBarChart extends VizChart {
  public update(payload: ChartUpdatePayload): void {
    this.prepareCanvas(payload);
    const {
      data,
      xAxis = this.cfg.xKey,
      yAxis = this.cfg.yKey,
      groupKey = this.cfg.groupKey,
      stackKeys,
    } = payload;

    if (!data || data.length === 0) {
      this.renderEmptyState();
      return;
    }

    const { matrix, keys } = buildSeriesMatrix(data, xAxis, yAxis, groupKey, stackKeys);
    if (matrix.length === 0 || keys.length === 0) {
      this.renderEmptyState();
      return;
    }

    const x0 = d3
      .scaleBand<string>()
      .domain(matrix.map((d) => String(d[xAxis] ?? '')))
      .range([0, this.innerWidth])
      .padding(0.2);

    const x1 = d3
      .scaleBand<string>()
      .domain(keys)
      .range([0, x0.bandwidth()])
      .padding(0.08);

    const rawMax =
      d3.max(matrix, (row) => d3.max(keys, (k) => Number(row[k]) || 0) ?? 0) ?? 0;
    const maxY = Math.max(1, isFinite(rawMax) ? rawMax : 1);

    const y = d3.scaleLinear().domain([0, maxY]).nice().range([this.innerHeight, 0]);
    const color = this.getColorScale(keys);

    this.renderHorizontalGridlines(y);
    this.renderCategoricalXAxis(x0);
    this.renderLinearYAxis(y);
    this.renderLegend(keys, color);

    const groups = this.g
      .selectAll<SVGGElement, DataRow>('.bar-group')
      .data(matrix)
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .attr('transform', (d) => translate(x0(String(d[xAxis] ?? '')) ?? 0, 0));

    groups
      .selectAll('rect')
      .data((d) => keys.map((key) => ({ key, value: Number(d[key]) || 0, xLabel: String(d[xAxis] ?? '') })))
      .enter()
      .append('rect')
      .attr('x', (d) => x1(d.key) ?? 0)
      .attr('y', (d) => y(d.value))
      .attr('width', x1.bandwidth())
      .attr('height', (d) => Math.max(0, this.innerHeight - y(d.value)))
      .attr('fill', (d) => color(d.key))
      .attr('rx', 2)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget as Element).style('opacity', 0.85);
        this.showTooltip(
          `<strong>${d.xLabel}</strong><br/>${d.key}: ${formatNumericValue(d.value)}`,
          event
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget as Element).style('opacity', 1);
        this.hideTooltip();
      });
  }
}

export class StackedBarChart extends VizChart {
  public update(payload: ChartUpdatePayload): void {
    this.prepareCanvas(payload);
    const {
      data,
      xAxis = this.cfg.xKey,
      yAxis = this.cfg.yKey,
      groupKey = this.cfg.groupKey,
      stackKeys,
    } = payload;

    if (!data || data.length === 0) {
      this.renderEmptyState();
      return;
    }

    const { matrix, keys } = buildSeriesMatrix(data, xAxis, yAxis, groupKey, stackKeys);
    if (matrix.length === 0 || keys.length === 0) {
      this.renderEmptyState();
      return;
    }

    const x = d3
      .scaleBand<string>()
      .domain(matrix.map((d) => String(d[xAxis] ?? '')))
      .range([0, this.innerWidth])
      .padding(0.2);

    const rawMax =
      d3.max(matrix, (d) => keys.reduce((acc, k) => acc + (Number(d[k]) || 0), 0)) ?? 0;
    const maxY = Math.max(1, isFinite(rawMax) ? rawMax : 1);

    const y = d3.scaleLinear().domain([0, maxY]).nice().range([this.innerHeight, 0]);
    const color = this.getColorScale(keys);
    const stackedData = d3
      .stack<DataRow>()
      .keys(keys)
      .value((d, key) => Number(d[key]) || 0)(matrix);

    this.renderHorizontalGridlines(y);
    this.renderCategoricalXAxis(x);
    this.renderLinearYAxis(y);
    this.renderLegend(keys, color);

    this.g
      .append('g')
      .selectAll('g')
      .data(stackedData)
      .enter()
      .append('g')
      .attr('fill', (d) => color(d.key))
      .selectAll('rect')
      .data((d) => d)
      .enter()
      .append('rect')
      .attr('x', (d) => x(String(d.data[xAxis] ?? '')) ?? 0)
      .attr('y', (d) => {
        const pos = y(d[1]);
        return isFinite(pos) ? pos : this.innerHeight;
      })
      .attr('height', (d) => {
        const y0 = y(d[0]);
        const y1 = y(d[1]);
        return isFinite(y0) && isFinite(y1) ? Math.max(0, y0 - y1) : 0;
      })
      .attr('width', x.bandwidth())
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        const currentEl = event.currentTarget as Element | null;
        const parentNode = currentEl?.parentNode as SVGGElement | null;
        const segmentKey = parentNode ? d3.select<SVGGElement, d3.Series<DataRow, string>>(parentNode).datum().key : '';
        const segmentValue = d[1] - d[0] || 0;
        this.showTooltip(
          `<strong>${d.data[xAxis]}</strong><br/>Series: ${segmentKey}<br/>Value: ${formatNumericValue(segmentValue)}`,
          event
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseleave', () => this.hideTooltip());
  }
}

export class LineChart extends VizChart {
  public update(payload: ChartUpdatePayload): void {
    this.prepareCanvas(payload);
    const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;

    if (!data || data.length === 0) {
      this.renderEmptyState();
      return;
    }

    const x = d3
      .scalePoint<string>()
      .domain(data.map((d) => String(d[xAxis] ?? '')))
      .range([0, this.innerWidth])
      .padding(0.5);

    const rawMax = d3.max(data, (d) => Number(d[yAxis]) || 0) ?? 0;
    const rawMin = d3.min(data, (d) => Number(d[yAxis]) || 0) ?? 0;
    const minY = Math.min(0, rawMin);
    const maxY = Math.max(minY + 1, isFinite(rawMax) ? rawMax : 1);

    const y = d3.scaleLinear().domain([minY, maxY]).nice().range([this.innerHeight, 0]);

    this.renderHorizontalGridlines(y);
    this.renderCategoricalXAxis(x);
    this.renderLinearYAxis(y);

    const lineGen = d3
      .line<DataRow>()
      .x((d) => x(String(d[xAxis] ?? '')) ?? 0)
      .y((d) => {
        const pos = y(Number(d[yAxis]) || 0);
        return isFinite(pos) ? pos : this.innerHeight;
      })
      .curve(d3.curveMonotoneX);

    this.g
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', this.getPrimaryColor())
      .attr('stroke-width', 2.5)
      .attr('d', lineGen);

    this.g
      .selectAll<SVGCircleElement, DataRow>('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d) => x(String(d[xAxis] ?? '')) ?? 0)
      .attr('cy', (d) => {
        const pos = y(Number(d[yAxis]) || 0);
        return isFinite(pos) ? pos : this.innerHeight;
      })
      .attr('r', 4.5)
      .attr('fill', this.getChartColor(0))
      .attr('stroke', this.getBackgroundColor())
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget as Element).attr('r', 6.5);
        const val = Number(d[yAxis]) || 0;
        this.showTooltip(
          `<strong>${d[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(val)}`,
          event
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget as Element).attr('r', 4.5);
        this.hideTooltip();
      });
  }
}

export class AreaChart extends VizChart {
  public update(payload: ChartUpdatePayload): void {
    this.prepareCanvas(payload);
    const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;

    if (!data || data.length === 0) {
      this.renderEmptyState();
      return;
    }

    const x = d3
      .scalePoint<string>()
      .domain(data.map((d) => String(d[xAxis] ?? '')))
      .range([0, this.innerWidth])
      .padding(0.2);

    const rawMax = d3.max(data, (d) => Number(d[yAxis]) || 0) ?? 0;
    const maxY = Math.max(1, isFinite(rawMax) ? rawMax : 1);
    const y = d3.scaleLinear().domain([0, maxY]).nice().range([this.innerHeight, 0]);

    this.renderHorizontalGridlines(y);
    this.renderCategoricalXAxis(x);
    this.renderLinearYAxis(y);

    const primary = this.getPrimaryColor();
    const gradId = `area-grad-${Math.random().toString(36).slice(2, 9)}`;
    const grad = this.defs
      .append('linearGradient')
      .attr('id', gradId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', primary).attr('stop-opacity', 0.45);
    grad.append('stop').attr('offset', '100%').attr('stop-color', primary).attr('stop-opacity', 0.02);

    const areaGen = d3
      .area<DataRow>()
      .x((d) => x(String(d[xAxis] ?? '')) ?? 0)
      .y0(this.innerHeight)
      .y1((d) => y(Number(d[yAxis]) || 0))
      .curve(d3.curveMonotoneX);

    const lineGen = d3
      .line<DataRow>()
      .x((d) => x(String(d[xAxis] ?? '')) ?? 0)
      .y((d) => y(Number(d[yAxis]) || 0))
      .curve(d3.curveMonotoneX);

    this.g.append('path').datum(data).attr('fill', `url(#${gradId})`).attr('d', areaGen);

    this.g
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', primary)
      .attr('stroke-width', 2.5)
      .attr('d', lineGen);

    this.g
      .selectAll<SVGCircleElement, DataRow>('.area-dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'area-dot')
      .attr('cx', (d) => x(String(d[xAxis] ?? '')) ?? 0)
      .attr('cy', (d) => y(Number(d[yAxis]) || 0))
      .attr('r', 4)
      .attr('fill', primary)
      .attr('stroke', this.getBackgroundColor())
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget as Element).attr('r', 6);
        const val = Number(d[yAxis]) || 0;
        this.showTooltip(
          `<strong>${d[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(val)}`,
          event
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget as Element).attr('r', 4);
        this.hideTooltip();
      });
  }
}

export class StackedAreaChart extends VizChart {
  public update(payload: ChartUpdatePayload): void {
    this.prepareCanvas(payload);
    const {
      data,
      xAxis = this.cfg.xKey,
      yAxis = this.cfg.yKey,
      groupKey = this.cfg.groupKey,
      stackKeys,
    } = payload;

    if (!data || data.length === 0) {
      this.renderEmptyState();
      return;
    }

    const { matrix, keys } = buildSeriesMatrix(data, xAxis, yAxis, groupKey, stackKeys);
    if (matrix.length === 0 || keys.length === 0) {
      this.renderEmptyState();
      return;
    }

    const x = d3
      .scalePoint<string>()
      .domain(matrix.map((d) => String(d[xAxis] ?? '')))
      .range([0, this.innerWidth])
      .padding(0.15);

    const rawMax =
      d3.max(matrix, (d) => keys.reduce((acc, k) => acc + (Number(d[k]) || 0), 0)) ?? 0;
    const maxY = Math.max(1, isFinite(rawMax) ? rawMax : 1);

    const y = d3.scaleLinear().domain([0, maxY]).nice().range([this.innerHeight, 0]);
    const color = this.getColorScale(keys);
    const stackedData = d3
      .stack<DataRow>()
      .keys(keys)
      .value((d, key) => Number(d[key]) || 0)(matrix);

    this.renderHorizontalGridlines(y);
    this.renderCategoricalXAxis(x);
    this.renderLinearYAxis(y);
    this.renderLegend(keys, color);

    const areaGen = d3
      .area<d3.SeriesPoint<DataRow>>()
      .x((d) => x(String(d.data[xAxis] ?? '')) ?? 0)
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]))
      .curve(d3.curveMonotoneX);

    this.g
      .selectAll('.stacked-area-layer')
      .data(stackedData)
      .enter()
      .append('path')
      .attr('class', 'stacked-area-layer')
      .attr('fill', (d) => color(d.key))
      .attr('fill-opacity', 0.72)
      .attr('stroke', (d) => color(d.key))
      .attr('stroke-width', 1.5)
      .attr('d', areaGen)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget as Element).attr('fill-opacity', 0.92);
        const total = d3.sum(d, (pt) => pt[1] - pt[0]);
        this.showTooltip(
          `<strong>${d.key}</strong><br/>Cumulative Total: ${formatNumericValue(total)}`,
          event
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget as Element).attr('fill-opacity', 0.72);
        this.hideTooltip();
      });
  }
}
