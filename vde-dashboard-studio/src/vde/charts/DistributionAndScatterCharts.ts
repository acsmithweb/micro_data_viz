import * as d3 from 'd3';
import {
  VizChart,
  ChartConfig,
  ChartUpdatePayload,
  DataRow,
  translate,
  formatNumericValue,
} from './VizChart';

export class ScatterPlotChart extends VizChart {
  public update(payload: ChartUpdatePayload): void {
    this.prepareCanvas(payload);
    const {
      data,
      xAxis = this.cfg.xKey,
      yAxis = this.cfg.yKey,
      groupKey = this.cfg.groupKey,
    } = payload;

    if (!data || data.length === 0) {
      this.renderEmptyState();
      return;
    }

    const numericXs = data.map((d) => Number(d[xAxis]));
    const isNumericX = numericXs.every((n, i) => data[i][xAxis] !== '' && !isNaN(n) && isFinite(n));

    const yVals = data.map((d) => Number(d[yAxis]) || 0);
    const yExtent = d3.extent(yVals) as [number, number];
    const minY = Math.min(0, yExtent[0] ?? 0);
    const maxY = Math.max(minY + 1, yExtent[1] ?? 1);
    const y = d3.scaleLinear().domain([minY, maxY]).nice().range([this.innerHeight, 0]);

    let getX: (d: DataRow) => number;
    if (isNumericX) {
      const xExtent = d3.extent(numericXs) as [number, number];
      const minX = xExtent[0] ?? 0;
      const maxX = xExtent[1] <= minX ? minX + 1 : xExtent[1];
      const x = d3.scaleLinear().domain([minX, maxX]).nice().range([0, this.innerWidth]);
      this.renderVerticalGridlines(x);
      this.renderHorizontalGridlines(y);
      this.renderLinearXAxis(x);
      this.renderLinearYAxis(y);
      getX = (d) => x(Number(d[xAxis]) || 0);
    } else {
      const x = d3
        .scalePoint<string>()
        .domain(data.map((d) => String(d[xAxis] ?? '')))
        .range([0, this.innerWidth])
        .padding(0.5);
      this.renderHorizontalGridlines(y);
      this.renderCategoricalXAxis(x);
      this.renderLinearYAxis(y);
      getX = (d) => x(String(d[xAxis] ?? '')) ?? 0;
    }

    const activeGroup = groupKey && groupKey !== xAxis && groupKey !== yAxis ? groupKey : null;
    const groups = activeGroup
      ? Array.from(new Set(data.map((d) => String(d[activeGroup] ?? 'Other'))))
      : [];
    const color = activeGroup ? this.getColorScale(groups) : null;

    if (color && groups.length > 0) {
      this.renderLegend(groups, color);
    }

    const primary = this.getPrimaryColor();

    this.g
      .selectAll<SVGCircleElement, DataRow>('.scatter-point')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'scatter-point')
      .attr('cx', getX)
      .attr('cy', (d) => y(Number(d[yAxis]) || 0))
      .attr('r', 5.5)
      .attr('fill', (d) => (color && activeGroup ? color(String(d[activeGroup] ?? 'Other')) : primary))
      .attr('fill-opacity', 0.8)
      .attr('stroke', this.getBackgroundColor())
      .attr('stroke-width', 1.2)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget as Element).attr('r', 8).attr('fill-opacity', 1);
        const groupInfo = activeGroup ? `<br/>${activeGroup}: ${d[activeGroup]}` : '';
        this.showTooltip(
          `<strong>${xAxis}: ${d[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(Number(d[yAxis]) || 0)}${groupInfo}`,
          event
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget as Element).attr('r', 5.5).attr('fill-opacity', 0.8);
        this.hideTooltip();
      });
  }
}

export class BubbleChart extends VizChart {
  constructor(containerElement: HTMLElement, config: ChartConfig = {}) {
    super(containerElement, {
      ...config,
      margin: Object.assign({ top: 18, right: 18, bottom: 18, left: 18 }, config.margin || {}),
    });
  }

  public update(payload: ChartUpdatePayload): void {
    this.prepareCanvas(payload);
    const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey, groupKey } = payload;

    const validData = (data || []).filter((d) => (Number(d[yAxis]) || 0) > 0);
    if (validData.length === 0) {
      this.renderEmptyState('Positive numeric metric required for bubbles');
      return;
    }

    const diameter = Math.max(60, Math.min(this.innerWidth, this.innerHeight));
    const offsetX = (this.innerWidth - diameter) / 2;
    const offsetY = (this.innerHeight - diameter) / 2;

    const root = d3
      .hierarchy<{ children: DataRow[] } | DataRow>({ children: validData })
      .sum((d) => ('children' in d ? 0 : Math.max(0.1, Number(d[yAxis]) || 0)));

    const pack = d3.pack<{ children: DataRow[] } | DataRow>().size([diameter, diameter]).padding(4);
    const nodes = pack(root).leaves();

    const colorField = groupKey && groupKey !== yAxis ? groupKey : xAxis;
    const color = this.getColorScale(validData.map((d) => String(d[colorField] ?? '')));

    const bubbleG = this.g
      .append('g')
      .attr('transform', translate(offsetX, offsetY));

    const leaf = bubbleG
      .selectAll('g.bubble-node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'bubble-node')
      .attr('transform', (d) => translate(d.x, d.y))
      .style('cursor', 'pointer');

    leaf
      .append('circle')
      .attr('r', (d) => Math.max(2, d.r))
      .attr('fill', (d) => color(String((d.data as DataRow)[colorField] ?? '')))
      .attr('fill-opacity', 0.82)
      .attr('stroke', this.getBackgroundColor())
      .attr('stroke-width', 1.5);

    leaf
      .filter((d) => d.r > 18)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.32em')
      .style('font-size', (d) => `${Math.min(12, Math.max(8, d.r / 3.4))}px`)
      .style('font-family', '"JetBrains Mono", monospace')
      .style('fill', '#111216')
      .style('font-weight', '600')
      .style('pointer-events', 'none')
      .text((d) => {
        const label = String((d.data as DataRow)[xAxis] ?? '');
        const maxChars = Math.max(3, Math.floor(d.r / 4));
        return label.length > maxChars ? label.slice(0, maxChars - 1) + '…' : label;
      });

    leaf
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget as Element).select('circle').attr('fill-opacity', 1).attr('stroke-width', 2.5);
        const row = d.data as DataRow;
        const val = Number(row[yAxis]) || 0;
        this.showTooltip(
          `<strong>${row[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(val)}`,
          event
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget as Element).select('circle').attr('fill-opacity', 0.82).attr('stroke-width', 1.5);
        this.hideTooltip();
      });
  }
}

export class HistogramChart extends VizChart {
  public update(payload: ChartUpdatePayload): void {
    this.prepareCanvas(payload);
    const { data, yAxis = this.cfg.yKey, xAxis = this.cfg.xKey } = payload;

    if (!data || data.length === 0) {
      this.renderEmptyState();
      return;
    }

    // Prefer yAxis numeric values, fallback to xAxis if yAxis has no finite numbers
    let targetKey = yAxis;
    let values = data.map((d) => Number(d[yAxis])).filter((v) => !isNaN(v) && isFinite(v));
    if (values.length === 0) {
      targetKey = xAxis;
      values = data.map((d) => Number(d[xAxis])).filter((v) => !isNaN(v) && isFinite(v));
    }

    if (values.length === 0) {
      this.renderEmptyState('Numeric values required for Histogram');
      return;
    }

    const extent = d3.extent(values) as [number, number];
    const minVal = extent[0];
    const maxVal = extent[1] <= minVal ? minVal + 1 : extent[1];

    const x = d3.scaleLinear().domain([minVal, maxVal]).nice().range([0, this.innerWidth]);
    const binGen = d3
      .bin()
      .domain(x.domain() as [number, number])
      .thresholds(x.ticks(Math.min(16, Math.max(5, Math.ceil(Math.sqrt(values.length))))));

    const bins = binGen(values);
    const maxCount = Math.max(1, d3.max(bins, (b) => b.length) ?? 1);
    const y = d3.scaleLinear().domain([0, maxCount]).nice().range([this.innerHeight, 0]);

    this.renderHorizontalGridlines(y);
    this.renderLinearXAxis(x);
    this.renderLinearYAxis(y);

    const primary = this.getPrimaryColor();

    this.g
      .selectAll('.hist-bar')
      .data(bins)
      .enter()
      .append('rect')
      .attr('class', 'hist-bar')
      .attr('x', (d) => x(d.x0 ?? 0) + 1)
      .attr('y', (d) => y(d.length))
      .attr('width', (d) => Math.max(1, x(d.x1 ?? 0) - x(d.x0 ?? 0) - 2))
      .attr('height', (d) => Math.max(0, this.innerHeight - y(d.length)))
      .attr('fill', primary)
      .attr('rx', 2)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget as Element).attr('fill', this.getChartColor(0));
        this.showTooltip(
          `<strong>${targetKey} Bin</strong><br/>Range: [${formatNumericValue(d.x0 ?? 0)}, ${formatNumericValue(d.x1 ?? 0)})<br/>Count: ${d.length}`,
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

export class BoxPlotChart extends VizChart {
  public update(payload: ChartUpdatePayload): void {
    this.prepareCanvas(payload);
    const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;

    if (!data || data.length === 0) {
      this.renderEmptyState();
      return;
    }

    const grouped = d3.group(data, (d) => String(d[xAxis] ?? 'All'));
    interface BoxStats {
      key: string;
      min: number;
      q1: number;
      median: number;
      q3: number;
      max: number;
      outliers: number[];
      count: number;
    }

    const stats: BoxStats[] = [];
    grouped.forEach((rows, key) => {
      const nums = rows
        .map((r) => Number(r[yAxis]))
        .filter((v) => !isNaN(v) && isFinite(v))
        .sort(d3.ascending);
      if (nums.length === 0) return;

      const q1 = d3.quantile(nums, 0.25) ?? nums[0];
      const median = d3.quantile(nums, 0.5) ?? nums[0];
      const q3 = d3.quantile(nums, 0.75) ?? nums[nums.length - 1];
      const iqr = q3 - q1;
      const lowerFence = q1 - 1.5 * iqr;
      const upperFence = q3 + 1.5 * iqr;
      const inliers = nums.filter((v) => v >= lowerFence && v <= upperFence);
      const outliers = nums.filter((v) => v < lowerFence || v > upperFence);

      stats.push({
        key,
        min: inliers.length > 0 ? inliers[0] : nums[0],
        q1,
        median,
        q3,
        max: inliers.length > 0 ? inliers[inliers.length - 1] : nums[nums.length - 1],
        outliers,
        count: nums.length,
      });
    });

    if (stats.length === 0) {
      this.renderEmptyState('Numeric values required for Box Plot');
      return;
    }

    const x = d3
      .scaleBand<string>()
      .domain(stats.map((s) => s.key))
      .range([0, this.innerWidth])
      .padding(0.35);

    const allMin = d3.min(stats, (s) => Math.min(s.min, ...s.outliers)) ?? 0;
    const allMax = d3.max(stats, (s) => Math.max(s.max, ...s.outliers)) ?? 1;
    const y = d3
      .scaleLinear()
      .domain([allMin, allMax <= allMin ? allMin + 1 : allMax])
      .nice()
      .range([this.innerHeight, 0]);

    this.renderHorizontalGridlines(y);
    this.renderCategoricalXAxis(x);
    this.renderLinearYAxis(y);

    const boxWidth = Math.min(48, Math.max(12, x.bandwidth()));
    const primary = this.getPrimaryColor();
    const accent2 = this.getChartColor(0);

    const boxG = this.g
      .selectAll<SVGGElement, BoxStats>('.boxplot-group')
      .data(stats)
      .enter()
      .append('g')
      .attr('class', 'boxplot-group')
      .attr('transform', (d) => translate((x(d.key) ?? 0) + x.bandwidth() / 2, 0));

    // Whisker vertical line
    boxG
      .append('line')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', (d) => y(d.min))
      .attr('y2', (d) => y(d.max))
      .attr('stroke', this.getAxisColor())
      .attr('stroke-width', 1.5);

    // Min & Max caps
    boxG
      .append('line')
      .attr('x1', -boxWidth * 0.3)
      .attr('x2', boxWidth * 0.3)
      .attr('y1', (d) => y(d.min))
      .attr('y2', (d) => y(d.min))
      .attr('stroke', this.getAxisColor())
      .attr('stroke-width', 1.5);

    boxG
      .append('line')
      .attr('x1', -boxWidth * 0.3)
      .attr('x2', boxWidth * 0.3)
      .attr('y1', (d) => y(d.max))
      .attr('y2', (d) => y(d.max))
      .attr('stroke', this.getAxisColor())
      .attr('stroke-width', 1.5);

    // IQR Box
    boxG
      .append('rect')
      .attr('x', -boxWidth / 2)
      .attr('y', (d) => y(d.q3))
      .attr('width', boxWidth)
      .attr('height', (d) => Math.max(2, y(d.q1) - y(d.q3)))
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
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseleave', () => this.hideTooltip());

    // Median line
    boxG
      .append('line')
      .attr('x1', -boxWidth / 2)
      .attr('x2', boxWidth / 2)
      .attr('y1', (d) => y(d.median))
      .attr('y2', (d) => y(d.median))
      .attr('stroke', primary)
      .attr('stroke-width', 2.5);

    // Outliers
    boxG.each((d, i, nodes) => {
      const sel = d3.select(nodes[i]);
      d.outliers.forEach((out) => {
        sel
          .append('circle')
          .attr('cx', 0)
          .attr('cy', y(out))
          .attr('r', 3)
          .attr('fill', primary)
          .attr('stroke', this.getBackgroundColor());
      });
    });
  }
}

export class HeatmapChart extends VizChart {
  constructor(containerElement: HTMLElement, config: ChartConfig = {}) {
    super(containerElement, {
      ...config,
      margin: Object.assign({ top: 24, right: 24, bottom: 52, left: 86 }, config.margin || {}),
    });
  }

  public update(payload: ChartUpdatePayload): void {
    this.prepareCanvas(payload);
    const {
      data,
      xAxis = this.cfg.xKey,
      yAxis = this.cfg.yKey,
      groupKey = this.cfg.groupKey,
    } = payload;

    if (!data || data.length === 0) {
      this.renderEmptyState();
      return;
    }

    const rowKey = groupKey && groupKey !== xAxis ? groupKey : Object.keys(data[0]).find((k) => k !== xAxis && k !== yAxis) || yAxis;
    const xDomain = Array.from(new Set(data.map((d) => String(d[xAxis] ?? ''))));
    const yDomain = Array.from(new Set(data.map((d) => String(d[rowKey] ?? ''))));

    const cellMap = new Map<string, { x: string; y: string; value: number }>();
    data.forEach((d) => {
      const xv = String(d[xAxis] ?? '');
      const yv = String(d[rowKey] ?? '');
      const val = rowKey === yAxis ? 1 : Number(d[yAxis]) || 0;
      const id = `${xv}::${yv}`;
      const existing = cellMap.get(id);
      if (existing) {
        existing.value += val;
      } else {
        cellMap.set(id, { x: xv, y: yv, value: val });
      }
    });

    const cells = Array.from(cellMap.values());
    const minVal = d3.min(cells, (c) => c.value) ?? 0;
    const maxVal = d3.max(cells, (c) => c.value) ?? 1;

    const x = d3.scaleBand<string>().domain(xDomain).range([0, this.innerWidth]).padding(0.06);
    const y = d3.scaleBand<string>().domain(yDomain).range([0, this.innerHeight]).padding(0.06);
    const color = this.getSequentialColorScale(minVal, maxVal);

    this.renderCategoricalXAxis(x);

    const yAxisG = this.g
      .append('g')
      .attr('class', 'viz-axis-y')
      .call(
        d3.axisLeft(y).tickFormat((d) => {
          const s = String(d);
          return s.length > 12 ? s.slice(0, 10) + '…' : s;
        })
      );
    yAxisG
      .selectAll('text')
      .style('fill', this.getAxisColor())
      .style('font-size', '9.5px')
      .style('font-family', '"JetBrains Mono", monospace');
    this.styleAxisLines(yAxisG);

    this.g
      .selectAll('.heatmap-cell')
      .data(cells)
      .enter()
      .append('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', (d) => x(d.x) ?? 0)
      .attr('y', (d) => y(d.y) ?? 0)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('rx', 3)
      .attr('fill', (d) => color(d.value))
      .attr('stroke', this.getBorderColor())
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget as Element).attr('stroke', '#ffffff').attr('stroke-width', 1.5);
        this.showTooltip(
          `<strong>${d.x} × ${d.y}</strong><br/>Value: ${formatNumericValue(d.value)}`,
          event
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget as Element).attr('stroke', this.getBorderColor()).attr('stroke-width', 0.5);
        this.hideTooltip();
      });
  }
}
