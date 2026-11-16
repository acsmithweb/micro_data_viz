import * as d3 from 'd3';
import { CloudLayout, PlacedSprite } from 'd3-cloud';
import {
  VizChart,
  ChartConfig,
  ChartUpdatePayload,
  DataRow,
  translate,
  formatNumericValue,
} from './VizChart';

export class RadarChart extends VizChart {
  constructor(containerElement: HTMLElement, config: ChartConfig = {}) {
    super(containerElement, {
      ...config,
      margin: Object.assign({ top: 28, right: 36, bottom: 28, left: 36 }, config.margin || {}),
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

    if (!data || data.length < 3) {
      this.renderEmptyState('At least 3 axes/rows required for Radar Chart');
      return;
    }

    const radius = Math.max(30, Math.min(this.innerWidth, this.innerHeight) / 2 - 14);
    const centerG = this.g
      .append('g')
      .attr('transform', translate(this.innerWidth / 2, this.innerHeight / 2));

    const axes = Array.from(new Set(data.map((d) => String(d[xAxis] ?? '')))).slice(0, 12);
    const angleSlice = (Math.PI * 2) / axes.length;

    const maxVal = Math.max(1, d3.max(data, (d) => Number(d[yAxis]) || 0) ?? 1);
    const rScale = d3.scaleLinear().domain([0, maxVal]).range([0, radius]);

    const levels = 4;
    for (let lvl = 1; lvl <= levels; lvl++) {
      const r = (radius / levels) * lvl;
      centerG
        .append('circle')
        .attr('r', r)
        .attr('fill', 'none')
        .attr('stroke', this.getBorderColor())
        .attr('stroke-dasharray', '2,3')
        .attr('stroke-opacity', 0.7);
    }

    axes.forEach((axisLabel, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const x2 = Math.cos(angle) * radius;
      const y2 = Math.sin(angle) * radius;

      centerG
        .append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', this.getBorderColor())
        .attr('stroke-width', 1);

      const lx = Math.cos(angle) * (radius + 12);
      const ly = Math.sin(angle) * (radius + 12);
      centerG
        .append('text')
        .attr('x', lx)
        .attr('y', ly)
        .attr('text-anchor', Math.abs(lx) < 8 ? 'middle' : lx > 0 ? 'start' : 'end')
        .attr('dy', '0.35em')
        .style('font-size', '9px')
        .style('font-family', '"JetBrains Mono", monospace')
        .style('fill', this.getAxisColor())
        .text(axisLabel.length > 10 ? axisLabel.slice(0, 9) + '…' : axisLabel);
    });

    const activeGroup = groupKey && groupKey !== xAxis && groupKey !== yAxis ? groupKey : null;
    const seriesNames = activeGroup
      ? Array.from(new Set(data.map((d) => String(d[activeGroup] ?? 'Series')))).slice(0, 5)
      : [yAxis];
    const color = this.getColorScale(seriesNames);

    const radarLine = d3
      .lineRadial<{ angle: number; value: number }>()
      .radius((d) => rScale(d.value))
      .angle((d) => d.angle)
      .curve(d3.curveLinearClosed);

    seriesNames.forEach((series) => {
      const subset = activeGroup
        ? data.filter((d) => String(d[activeGroup] ?? 'Series') === series)
        : data;
      const valMap = new Map<string, number>();
      subset.forEach((d) => {
        valMap.set(String(d[xAxis] ?? ''), Number(d[yAxis]) || 0);
      });

      const points = axes.map((ax, idx) => ({
        axis: ax,
        angle: angleSlice * idx,
        value: valMap.get(ax) ?? 0,
      }));

      const seriesColor = seriesNames.length === 1 ? this.getPrimaryColor() : color(series);

      centerG
        .append('path')
        .datum(points)
        .attr('d', radarLine)
        .attr('fill', seriesColor)
        .attr('fill-opacity', 0.22)
        .attr('stroke', seriesColor)
        .attr('stroke-width', 2);

      centerG
        .selectAll(`.radar-dot-${series.replace(/\W+/g, '_')}`)
        .data(points)
        .enter()
        .append('circle')
        .attr('cx', (d) => rScale(d.value) * Math.cos(d.angle - Math.PI / 2))
        .attr('cy', (d) => rScale(d.value) * Math.sin(d.angle - Math.PI / 2))
        .attr('r', 4)
        .attr('fill', seriesColor)
        .attr('stroke', this.getBackgroundColor())
        .attr('stroke-width', 1.2)
        .style('cursor', 'pointer')
        .on('mouseover', (event, d) => {
          d3.select(event.currentTarget as Element).attr('r', 6);
          this.showTooltip(
            `<strong>${d.axis}</strong><br/>${series}: ${formatNumericValue(d.value)}`,
            event
          );
        })
        .on('mousemove', (event) => this.moveTooltip(event))
        .on('mouseleave', (event) => {
          d3.select(event.currentTarget as Element).attr('r', 4);
          this.hideTooltip();
        });
    });

    if (seriesNames.length > 1) {
      this.renderLegend(seriesNames, color);
    }
  }
}

export class RadialBarChart extends VizChart {
  constructor(containerElement: HTMLElement, config: ChartConfig = {}) {
    super(containerElement, {
      ...config,
      margin: Object.assign({ top: 20, right: 20, bottom: 20, left: 20 }, config.margin || {}),
    });
  }

  public update(payload: ChartUpdatePayload): void {
    this.prepareCanvas(payload);
    const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;

    const validData = (data || []).filter((d) => (Number(d[yAxis]) || 0) >= 0);
    if (validData.length === 0) {
      this.renderEmptyState();
      return;
    }

    const outerRadius = Math.max(30, Math.min(this.innerWidth, this.innerHeight) / 2 - 10);
    const innerRadius = outerRadius * 0.28;
    const centerG = this.g
      .append('g')
      .attr('transform', translate(this.innerWidth / 2, this.innerHeight / 2));

    const x = d3
      .scaleBand<string>()
      .domain(validData.map((d) => String(d[xAxis] ?? '')))
      .range([0, Math.PI * 2])
      .padding(0.14);

    const maxVal = Math.max(1, d3.max(validData, (d) => Number(d[yAxis]) || 0) ?? 1);
    const y = d3.scaleRadial().domain([0, maxVal]).range([innerRadius, outerRadius]);
    const color = this.getColorScale(validData.map((d) => String(d[xAxis] ?? '')));

    const arcGen = d3
      .arc<DataRow>()
      .innerRadius(innerRadius)
      .outerRadius((d) => y(Number(d[yAxis]) || 0))
      .startAngle((d) => x(String(d[xAxis] ?? '')) ?? 0)
      .endAngle((d) => (x(String(d[xAxis] ?? '')) ?? 0) + x.bandwidth())
      .padAngle(0.02)
      .padRadius(innerRadius);

    centerG
      .selectAll('.radial-bar')
      .data(validData)
      .enter()
      .append('path')
      .attr('class', 'radial-bar')
      .attr('d', (d) => arcGen(d) || '')
      .attr('fill', (d) => color(String(d[xAxis] ?? '')))
      .attr('fill-opacity', 0.88)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget as Element).attr('fill-opacity', 1);
        const val = Number(d[yAxis]) || 0;
        this.showTooltip(
          `<strong>${d[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(val)}`,
          event
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget as Element).attr('fill-opacity', 0.88);
        this.hideTooltip();
      });

    centerG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .style('font-family', '"JetBrains Mono", monospace')
      .style('fill', this.getAxisColor())
      .text(`${validData.length} items`);
  }
}

export class WordCloudChart extends VizChart {
  constructor(containerElement: HTMLElement, config: ChartConfig = {}) {
    super(containerElement, {
      ...config,
      margin: Object.assign({ top: 12, right: 12, bottom: 12, left: 12 }, config.margin || {}),
    });
  }

  public update(payload: ChartUpdatePayload): void {
    this.prepareCanvas(payload);
    const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;

    if (!data || data.length === 0) {
      this.renderEmptyState();
      return;
    }

    interface WordDatum {
      text: string;
      weight: number;
    }

    const words: WordDatum[] = data
      .map((d) => ({
        text: String(d[xAxis] ?? '').trim(),
        weight: Math.max(1, Number(d[yAxis]) || 10),
      }))
      .filter((w) => w.text.length > 0)
      .sort((a, b) => b.weight - a.weight);

    if (words.length === 0) {
      this.renderEmptyState();
      return;
    }

    const rawMin = d3.min(words, (d) => d.weight) ?? 1;
    const rawMax = d3.max(words, (d) => d.weight) ?? rawMin + 1;
    const minWeight = Math.max(1, isFinite(rawMin) ? rawMin : 1);
    const maxWeight = Math.max(minWeight + 1, isFinite(rawMax) ? rawMax : minWeight + 1);

    const sizeScale = d3.scaleLinear().domain([minWeight, maxWeight]).range([13, 34]);

    const layout = new CloudLayout().size([this.innerWidth, this.innerHeight]);
    const placedWords: PlacedSprite<WordDatum>[] = [];

    words.forEach((w, idx) => {
      const sprite = layout.getSprite(w.text, {
        font: '"JetBrains Mono", monospace',
        fontWeight: 600,
        fontSize: Math.round(sizeScale(w.weight)),
        rotate: idx % 4 === 0 ? -90 : 0,
        padding: 4,
        datum: w,
      });
      if (sprite) {
        const placed = layout.place(sprite, { strategy: 'archimedean' });
        if (placed) placedWords.push(placed);
      }
    });

    this.g
      .append('g')
      .attr('transform', translate(this.innerWidth / 2, this.innerHeight / 2))
      .selectAll<SVGTextElement, PlacedSprite<WordDatum>>('text')
      .data(placedWords)
      .enter()
      .append('text')
      .style('font-size', (d) => `${d.size}px`)
      .style('font-family', '"JetBrains Mono", monospace')
      .style('font-weight', '600')
      .style('fill', (_d, i) => this.getChartColor(i))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('transform', (d) => translate(d.x, d.y) + ` rotate(${d.rotate})`)
      .text((d) => d.text)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        this.showTooltip(
          `<strong>${d.text}</strong><br/>${yAxis}: ${formatNumericValue(d.datum.weight)}`,
          event
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseleave', () => this.hideTooltip());
  }
}

export class TableChart extends VizChart {
  public update(payload: ChartUpdatePayload): void {
    const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey, selectedColumns } = payload;
    this.container.selectAll('.viz-table-wrapper').remove();

    if (!data || data.length === 0) {
      this.svg.style('display', 'block');
      this.renderEmptyState();
      return;
    }

    this.svg.style('display', 'none');

    const wrapper = this.container
      .append('div')
      .attr('class', 'table-responsive viz-table-wrapper')
      .style('height', '100%')
      .style('overflow-y', 'auto');

    const table = wrapper
      .append('table')
      .attr(
        'class',
        'table table-dark table-striped table-hover table-sm table-bordered font-mono tabular-nums text-start small mb-0'
      )
      .style('font-size', '11px');

    let cols =
      selectedColumns && Array.isArray(selectedColumns) && selectedColumns.length > 0
        ? selectedColumns
        : [xAxis, yAxis].filter(Boolean);

    if (cols.length === 0 && data.length > 0) {
      cols = Object.keys(data[0]);
    }

    const thead = table.append('thead').append('tr');
    cols.forEach((col) => {
      thead
        .append('th')
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
      cols.forEach((col) => {
        const rawVal = d[col];
        const numVal = Number(rawVal);
        const isNum =
          !isNaN(numVal) &&
          rawVal !== '' &&
          rawVal !== null &&
          rawVal !== undefined &&
          typeof rawVal !== 'boolean';
        const displayVal = isNum
          ? formatNumericValue(numVal)
          : rawVal !== undefined && rawVal !== null
          ? String(rawVal)
          : '';
        tr.append('td')
          .style('text-align', isNum ? 'right' : 'left')
          .text(displayVal);
      });
    });
  }
}
