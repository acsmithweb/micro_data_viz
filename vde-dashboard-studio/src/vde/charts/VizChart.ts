import * as d3 from 'd3';

export type DataRow = Record<string, unknown>;

export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartConfig {
  width?: number;
  height?: number;
  margin?: Partial<ChartMargin>;
  xKey?: string;
  yKey?: string;
  groupKey?: string;
  color?: string | null;
  chartPalette?: string[] | null;
  textColor?: string | null;
  backgroundColor?: string | null;
  borderColor?: string | null;
  showGrid?: boolean;
  showLegend?: boolean;
  enableZoom?: boolean;
}

export interface ChartUpdatePayload {
  data: DataRow[];
  xAxis?: string;
  yAxis?: string;
  groupKey?: string;
  stackKeys?: string[];
  selectedColumns?: string[];
  width?: number;
  height?: number;
}

export type ChartCategory =
  | 'Comparison'
  | 'Trend'
  | 'Distribution'
  | 'Composition'
  | 'Correlation'
  | 'Tabular';

export interface ChartCatalogEntry {
  type: string;
  category: ChartCategory;
  description: string;
  supportsSeries: boolean;
  icon: string;
}

export const DEFAULT_CHART_PALETTE = [
  '#89b4fa',
  '#f5c2e7',
  '#a6e3a1',
  '#f9e2af',
  '#cba6f7',
  '#fab387',
  '#f38ba8',
  '#94e2d5',
];

export function translate(x: number, y: number): string {
  return `translate(${x}, ${y})`;
}

export function formatDateByGranularity(dateVal: unknown, granularity: string): string {
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

export function getAggregateFunction(
  type: string,
  rows: DataRow[],
  xKey: string,
  yKey: string,
  dateGranularity = 'Raw'
): DataRow[] {
  if (!rows || rows.length === 0) return [];

  const processedRows = rows.map((r) => {
    if (!r || r[xKey] === undefined || r[xKey] === null) return r;
    const formattedX = formatDateByGranularity(r[xKey], dateGranularity);
    return Object.assign({}, r, { [xKey]: formattedX });
  });

  if (!type || type === 'Raw') return processedRows;

  const validRows = processedRows.filter(
    (r) => r && r[xKey] !== undefined && r[xKey] !== null
  );
  const grouped = d3.group(validRows, (d) => String(d[xKey]));

  return Array.from(grouped, ([key, groupRows]) => {
    const result: DataRow = { [xKey]: key };
    const nums = groupRows.map((d) => Number(d[yKey]) || 0);

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

export function formatNumericValue(val: number): string {
  if (!isFinite(val)) return '0';
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 10_000) return `${(val / 1_000).toFixed(1)}k`;
  if (Number.isInteger(val)) return val.toLocaleString();
  return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Abstract-style polymorphic base class for all D3.js charts in the VDE.
 * Encapsulates SVG lifecycle, zoom/pan, boundary-aware tooltips,
 * reusable axis/grid/legend renderers, and theme palette integration.
 */
export abstract class VizChart {
  public containerElement: HTMLElement;
  public container: d3.Selection<HTMLElement, unknown, null, undefined>;
  public cfg: Required<Omit<ChartConfig, 'margin'>> & { margin: ChartMargin };
  public innerWidth = 100;
  public innerHeight = 100;
  public svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  public g: d3.Selection<SVGGElement, unknown, null, undefined>;
  public defs: d3.Selection<SVGDefsElement, unknown, null, undefined>;
  public tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  public zoom: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
  protected lastPayload: ChartUpdatePayload | null = null;

  constructor(containerElement: HTMLElement, config: ChartConfig = {}) {
    this.containerElement = containerElement;
    this.container = d3.select(containerElement);

    const defaultMargin: ChartMargin = { top: 24, right: 24, bottom: 52, left: 56 };
    const mergedMargin: ChartMargin = Object.assign({}, defaultMargin, config.margin || {});

    this.cfg = {
      width: config.width ?? 420,
      height: config.height ?? 260,
      margin: mergedMargin,
      xKey: config.xKey ?? 'label',
      yKey: config.yKey ?? 'value',
      groupKey: config.groupKey ?? '',
      color: config.color ?? null,
      chartPalette: config.chartPalette ?? null,
      textColor: config.textColor ?? null,
      backgroundColor: config.backgroundColor ?? null,
      borderColor: config.borderColor ?? null,
      showGrid: config.showGrid ?? true,
      showLegend: config.showLegend ?? true,
      enableZoom: config.enableZoom ?? true,
    };

    this.updateDimensions(this.cfg.width, this.cfg.height);
    this.container.style('position', 'relative');

    // Persistent tooltip per container
    this.tooltip = this.container.select<HTMLDivElement>('.viz-tooltip');
    if (this.tooltip.empty()) {
      const tooltipBg = this.cfg.backgroundColor || 'rgba(16, 18, 22, 0.96)';
      const tooltipBorder = this.cfg.color || '#ff7b00';
      const tooltipText = this.cfg.textColor || '#e2e4e9';

      this.tooltip = this.container
        .append('div')
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

    // Clear stale table wrappers when switching back to SVG charts
    this.container.selectAll('.viz-table-wrapper').remove();

    this.svg = this.container.select<SVGSVGElement>('svg.viz-svg');
    if (this.svg.empty()) {
      this.svg = this.container
        .append('svg')
        .attr('class', 'viz-svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${this.cfg.width} ${this.cfg.height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    } else {
      this.svg
        .attr('viewBox', `0 0 ${this.cfg.width} ${this.cfg.height}`)
        .style('display', 'block');
      this.svg.selectAll('*').remove();
    }

    this.defs = this.svg.append('defs');
    this.g = this.svg
      .append('g')
      .attr('class', 'viz-root-group')
      .attr('transform', translate(this.cfg.margin.left, this.cfg.margin.top));

    if (this.cfg.enableZoom) {
      this.zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.6, 8])
        .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          this.g.attr(
            'transform',
            `translate(${this.cfg.margin.left + event.transform.x}, ${this.cfg.margin.top + event.transform.y}) scale(${event.transform.k})`
          );
        });
      this.svg.call(this.zoom);
    }
  }

  public abstract update(payload: ChartUpdatePayload): void;

  public resetZoom(): void {
    if (this.zoom && this.svg) {
      this.svg.transition().duration(200).call(this.zoom.transform, d3.zoomIdentity);
    }
  }

  public updateDimensions(width?: number, height?: number): void {
    this.cfg.width = Math.max(140, width || this.cfg.width || 420);
    this.cfg.height = Math.max(120, height || this.cfg.height || 260);
    this.innerWidth = Math.max(
      20,
      this.cfg.width - this.cfg.margin.left - this.cfg.margin.right
    );
    this.innerHeight = Math.max(
      20,
      this.cfg.height - this.cfg.margin.top - this.cfg.margin.bottom
    );

    if (this.svg) {
      this.svg.attr('viewBox', `0 0 ${this.cfg.width} ${this.cfg.height}`);
    }
  }

  protected prepareCanvas(payload: ChartUpdatePayload): void {
    if (payload.width || payload.height) {
      this.updateDimensions(payload.width, payload.height);
    }
    this.lastPayload = payload;
    this.container.selectAll('.viz-table-wrapper').remove();
    this.svg.style('display', 'block');
    this.g.selectAll('*').remove();
    this.defs.selectAll('*').remove();
  }

  protected renderHorizontalGridlines(yScale: d3.ScaleLinear<number, number>): void {
    if (!this.cfg.showGrid) return;
    this.g
      .append('g')
      .attr('class', 'viz-grid-y')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickSize(-this.innerWidth)
          .tickFormat(() => '')
      )
      .call((g) => g.select('.domain').remove())
      .selectAll('line')
      .style('stroke', this.getBorderColor())
      .style('stroke-opacity', '0.45')
      .style('stroke-dasharray', '2,3');
  }

  protected renderVerticalGridlines(xScale: d3.ScaleLinear<number, number>): void {
    if (!this.cfg.showGrid) return;
    this.g
      .append('g')
      .attr('class', 'viz-grid-x')
      .attr('transform', translate(0, this.innerHeight))
      .call(
        d3
          .axisBottom(xScale)
          .ticks(5)
          .tickSize(-this.innerHeight)
          .tickFormat(() => '')
      )
      .call((g) => g.select('.domain').remove())
      .selectAll('line')
      .style('stroke', this.getBorderColor())
      .style('stroke-opacity', '0.35')
      .style('stroke-dasharray', '2,3');
  }

  protected renderCategoricalXAxis(
    xScale: d3.ScaleBand<string> | d3.ScalePoint<string>,
    rotate = true
  ): void {
    const domain = xScale.domain();
    const maxLabels = Math.max(4, Math.floor(this.innerWidth / 44));
    const step = domain.length > maxLabels ? Math.ceil(domain.length / maxLabels) : 1;

    const axis = d3.axisBottom(xScale).tickFormat((d, i) => {
      if (i % step !== 0) return '';
      const label = String(d);
      return label.length > 14 ? label.slice(0, 12) + '…' : label;
    });

    const axisG = this.g
      .append('g')
      .attr('class', 'viz-axis-x')
      .attr('transform', translate(0, this.innerHeight))
      .call(axis);

    const texts = axisG
      .selectAll('text')
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

  protected renderLinearXAxis(xScale: d3.ScaleLinear<number, number>): void {
    const axisG = this.g
      .append('g')
      .attr('class', 'viz-axis-x')
      .attr('transform', translate(0, this.innerHeight))
      .call(
        d3
          .axisBottom(xScale)
          .ticks(Math.max(4, Math.floor(this.innerWidth / 70)))
          .tickFormat((d) => formatNumericValue(Number(d)))
      );

    axisG
      .selectAll('text')
      .style('fill', this.getAxisColor())
      .style('font-size', '9.5px')
      .style('font-family', '"JetBrains Mono", monospace');

    this.styleAxisLines(axisG);
  }

  protected renderLinearYAxis(yScale: d3.ScaleLinear<number, number>): void {
    const axisG = this.g
      .append('g')
      .attr('class', 'viz-axis-y')
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat((d) => formatNumericValue(Number(d)))
      );

    axisG
      .selectAll('text')
      .style('fill', this.getAxisColor())
      .style('font-size', '9.5px')
      .style('font-family', '"JetBrains Mono", monospace');

    this.styleAxisLines(axisG);
  }

  protected styleAxisLines(axisG: d3.Selection<SVGGElement, unknown, null, undefined>): void {
    axisG.selectAll('.domain').style('stroke', this.getBorderColor());
    axisG.selectAll('.tick line').style('stroke', this.getBorderColor());
  }

  protected renderLegend(
    items: string[],
    colorScale: d3.ScaleOrdinal<string, string>
  ): void {
    if (!this.cfg.showLegend || !items || items.length === 0) return;

    const visibleItems = items.slice(0, 8);
    const legendG = this.g
      .append('g')
      .attr('class', 'viz-legend')
      .attr('transform', translate(0, -14));

    let offsetX = 0;
    visibleItems.forEach((item) => {
      const label = item.length > 12 ? item.slice(0, 11) + '…' : item;
      const itemWidth = label.length * 6.2 + 20;
      if (offsetX + itemWidth > this.innerWidth) return;

      const entry = legendG.append('g').attr('transform', translate(offsetX, 0));
      entry
        .append('rect')
        .attr('width', 8)
        .attr('height', 8)
        .attr('rx', 2)
        .attr('y', -7)
        .attr('fill', colorScale(item));

      entry
        .append('text')
        .attr('x', 12)
        .attr('y', 0)
        .style('font-size', '9.5px')
        .style('fill', this.getAxisColor())
        .style('font-family', '"JetBrains Mono", monospace')
        .text(label);

      offsetX += itemWidth;
    });
  }

  public showTooltip(html: string, event: MouseEvent | PointerEvent): void {
    if (!this.tooltip) return;
    this.tooltip
      .style('visibility', 'visible')
      .style('opacity', '1')
      .html(html);
    this.moveTooltip(event);
  }

  public moveTooltip(event: MouseEvent | PointerEvent): void {
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
    } catch {
      // Guard against detached pointer events during DOM updates
    }
  }

  public hideTooltip(): void {
    if (!this.tooltip) return;
    this.tooltip.style('visibility', 'hidden').style('opacity', '0');
  }

  public renderEmptyState(message = 'No data matching active criteria'): void {
    this.g.selectAll('*').remove();
    this.g
      .append('text')
      .attr('x', this.innerWidth / 2)
      .attr('y', this.innerHeight / 2)
      .attr('text-anchor', 'middle')
      .style('fill', this.getAxisColor())
      .style('font-size', '12px')
      .style('font-family', '"JetBrains Mono", monospace')
      .text(message);
  }

  public getPalette(): string[] {
    if (this.cfg.chartPalette && this.cfg.chartPalette.length > 0) {
      return this.cfg.chartPalette;
    }
    return DEFAULT_CHART_PALETTE;
  }

  public getChartColor(index = 0): string {
    const palette = this.getPalette();
    return palette[index % palette.length];
  }

  public getAxisColor(): string {
    return this.cfg.textColor || '#9aa1b0';
  }

  public getBorderColor(): string {
    return this.cfg.borderColor || '#2f333d';
  }

  public getBackgroundColor(): string {
    return this.cfg.backgroundColor || '#181a1f';
  }

  public getPrimaryColor(): string {
    return this.cfg.color || '#ff7b00';
  }

  public getColorScale(domain: string[]): d3.ScaleOrdinal<string, string> {
    const validDomain = (domain || []).map(String);
    return d3.scaleOrdinal<string, string>().domain(validDomain).range(this.getPalette());
  }

  public getSequentialColorScale(minVal: number, maxVal: number): d3.ScaleLinear<string, string> {
    const palette = this.getPalette();
    const low = this.getBackgroundColor();
    const mid = palette[0] || '#89b4fa';
    const high = this.getPrimaryColor();
    const safeMax = maxVal <= minVal ? minVal + 1 : maxVal;

    return d3
      .scaleLinear<string>()
      .domain([minVal, (minVal + safeMax) / 2, safeMax])
      .range([low, mid, high]);
  }

  public destroy(): void {
    this.hideTooltip();
    if (this.container) {
      this.container.selectAll('.viz-tooltip').remove();
      this.container.selectAll('.viz-table-wrapper').remove();
      this.container.selectAll('svg.viz-svg').remove();
    }
  }
}
