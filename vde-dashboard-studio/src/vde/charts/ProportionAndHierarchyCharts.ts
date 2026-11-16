import * as d3 from 'd3';
import {
  VizChart,
  ChartConfig,
  ChartUpdatePayload,
  DataRow,
  translate,
  formatNumericValue,
} from './VizChart';

export class PieChart extends VizChart {
  constructor(containerElement: HTMLElement, config: ChartConfig = {}) {
    super(containerElement, {
      ...config,
      margin: Object.assign({ top: 20, right: 20, bottom: 20, left: 20 }, config.margin || {}),
    });
  }

  public update(payload: ChartUpdatePayload): void {
    this.prepareCanvas(payload);
    const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;

    const validData = (data || []).filter((d) => (Number(d[yAxis]) || 0) > 0);
    if (validData.length === 0) {
      this.renderEmptyState('Positive values required for Pie Chart');
      return;
    }

    const radius = Math.max(16, Math.min(this.innerWidth, this.innerHeight) / 2);
    const mainG = this.g
      .append('g')
      .attr('transform', translate(this.innerWidth / 2, this.innerHeight / 2));

    const color = this.getColorScale(validData.map((d) => String(d[xAxis] ?? '')));
    const pie = d3.pie<DataRow>().value((d) => Number(d[yAxis]) || 0).sort(null);
    const arc = d3.arc<d3.PieArcDatum<DataRow>>().innerRadius(0).outerRadius(radius);
    const arcHover = d3.arc<d3.PieArcDatum<DataRow>>().innerRadius(0).outerRadius(radius + 5);

    const total = d3.sum(validData, (d) => Number(d[yAxis]) || 0);

    const arcs = mainG
      .selectAll('.arc')
      .data(pie(validData))
      .enter()
      .append('g')
      .attr('class', 'arc')
      .style('cursor', 'pointer');

    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => color(String(d.data[xAxis] ?? '')))
      .attr('stroke', this.getBackgroundColor())
      .attr('stroke-width', 2)
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget as Element).transition().duration(120).attr('d', arcHover(d) || '');
        const val = Number(d.data[yAxis]) || 0;
        const percent = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
        this.showTooltip(
          `<strong>${d.data[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(val)} (${percent}%)`,
          event
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseleave', (event, d) => {
        d3.select(event.currentTarget as Element).transition().duration(120).attr('d', arc(d) || '');
        this.hideTooltip();
      });

    arcs
      .filter((d) => d.endAngle - d.startAngle > 0.38)
      .append('text')
      .attr('transform', (d) => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .style('font-family', '"JetBrains Mono", monospace')
      .style('font-weight', '600')
      .style('fill', '#111216')
      .style('pointer-events', 'none')
      .text((d) => {
        const val = Number(d.data[yAxis]) || 0;
        return total > 0 ? `${Math.round((val / total) * 100)}%` : '';
      });
  }
}

export class DonutChart extends VizChart {
  constructor(containerElement: HTMLElement, config: ChartConfig = {}) {
    super(containerElement, {
      ...config,
      margin: Object.assign({ top: 20, right: 20, bottom: 20, left: 20 }, config.margin || {}),
    });
  }

  public update(payload: ChartUpdatePayload): void {
    this.prepareCanvas(payload);
    const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey } = payload;

    const validData = (data || []).filter((d) => (Number(d[yAxis]) || 0) > 0);
    if (validData.length === 0) {
      this.renderEmptyState('Positive values required for Donut Chart');
      return;
    }

    const radius = Math.max(20, Math.min(this.innerWidth, this.innerHeight) / 2);
    const innerRadius = radius * 0.54;
    const mainG = this.g
      .append('g')
      .attr('transform', translate(this.innerWidth / 2, this.innerHeight / 2));

    const color = this.getColorScale(validData.map((d) => String(d[xAxis] ?? '')));
    const pie = d3.pie<DataRow>().value((d) => Number(d[yAxis]) || 0).padAngle(0.02);
    const arc = d3.arc<d3.PieArcDatum<DataRow>>().innerRadius(innerRadius).outerRadius(radius);
    const arcHover = d3
      .arc<d3.PieArcDatum<DataRow>>()
      .innerRadius(innerRadius)
      .outerRadius(radius + 5);

    const total = d3.sum(validData, (d) => Number(d[yAxis]) || 0);

    // Center KPI readout
    const centerTitle = mainG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.25em')
      .style('font-size', '10px')
      .style('font-family', '"JetBrains Mono", monospace')
      .style('fill', this.getAxisColor())
      .text('TOTAL');

    const centerVal = mainG
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.95em')
      .style('font-size', `${Math.max(12, Math.min(18, radius * 0.22))}px`)
      .style('font-family', '"JetBrains Mono", monospace')
      .style('font-weight', '700')
      .style('fill', this.getPrimaryColor())
      .text(formatNumericValue(total));

    mainG
      .selectAll('.arc')
      .data(pie(validData))
      .enter()
      .append('path')
      .attr('class', 'arc')
      .attr('d', arc)
      .attr('fill', (d) => color(String(d.data[xAxis] ?? '')))
      .attr('stroke', this.getBackgroundColor())
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget as Element).transition().duration(120).attr('d', arcHover(d) || '');
        const val = Number(d.data[yAxis]) || 0;
        const percent = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
        centerTitle.text(String(d.data[xAxis] ?? '').slice(0, 12));
        centerVal.text(`${percent}%`);
        this.showTooltip(
          `<strong>${d.data[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(val)} (${percent}%)`,
          event
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseleave', (event, d) => {
        d3.select(event.currentTarget as Element).transition().duration(120).attr('d', arc(d) || '');
        centerTitle.text('TOTAL');
        centerVal.text(formatNumericValue(total));
        this.hideTooltip();
      });
  }
}

export class TreemapChart extends VizChart {
  constructor(containerElement: HTMLElement, config: ChartConfig = {}) {
    super(containerElement, {
      ...config,
      margin: Object.assign({ top: 14, right: 14, bottom: 14, left: 14 }, config.margin || {}),
    });
  }

  public update(payload: ChartUpdatePayload): void {
    this.prepareCanvas(payload);
    const { data, xAxis = this.cfg.xKey, yAxis = this.cfg.yKey, groupKey } = payload;

    const validData = (data || []).filter((d) => (Number(d[yAxis]) || 0) > 0);
    if (validData.length === 0) {
      this.renderEmptyState('Positive numeric metric required for Treemap');
      return;
    }

    const root = d3
      .hierarchy<{ children: DataRow[] } | DataRow>({ children: validData })
      .sum((d) => ('children' in d ? 0 : Math.max(0.01, Number(d[yAxis]) || 0)))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    d3
      .treemap<{ children: DataRow[] } | DataRow>()
      .size([this.innerWidth, this.innerHeight])
      .padding(3)
      .round(true)(root);

    const leaves = root.leaves() as d3.HierarchyRectangularNode<DataRow>[];
    const colorField = groupKey && groupKey !== yAxis ? groupKey : xAxis;
    const color = this.getColorScale(validData.map((d) => String(d[colorField] ?? '')));

    const cell = this.g
      .selectAll<SVGGElement, d3.HierarchyRectangularNode<DataRow>>('.treemap-cell')
      .data(leaves)
      .enter()
      .append('g')
      .attr('class', 'treemap-cell')
      .attr('transform', (d) => translate(d.x0, d.y0))
      .style('cursor', 'pointer');

    cell
      .append('rect')
      .attr('width', (d) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d) => Math.max(0, d.y1 - d.y0))
      .attr('rx', 3)
      .attr('fill', (d) => color(String(d.data[colorField] ?? '')))
      .attr('fill-opacity', 0.85)
      .attr('stroke', this.getBackgroundColor())
      .attr('stroke-width', 1);

    cell
      .filter((d) => d.x1 - d.x0 > 46 && d.y1 - d.y0 > 26)
      .append('text')
      .attr('x', 6)
      .attr('y', 15)
      .style('font-size', '10px')
      .style('font-family', '"JetBrains Mono", monospace')
      .style('font-weight', '600')
      .style('fill', '#111216')
      .style('pointer-events', 'none')
      .text((d) => {
        const w = d.x1 - d.x0;
        const maxChars = Math.max(3, Math.floor((w - 10) / 6.5));
        const label = String(d.data[xAxis] ?? '');
        return label.length > maxChars ? label.slice(0, maxChars - 1) + '…' : label;
      });

    cell
      .filter((d) => d.x1 - d.x0 > 46 && d.y1 - d.y0 > 40)
      .append('text')
      .attr('x', 6)
      .attr('y', 29)
      .style('font-size', '9.5px')
      .style('font-family', '"JetBrains Mono", monospace')
      .style('fill', 'rgba(17, 18, 22, 0.8)')
      .style('pointer-events', 'none')
      .text((d) => formatNumericValue(Number(d.data[yAxis]) || 0));

    cell
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget as Element).select('rect').attr('fill-opacity', 1);
        const val = Number(d.data[yAxis]) || 0;
        this.showTooltip(
          `<strong>${d.data[xAxis]}</strong><br/>${yAxis}: ${formatNumericValue(val)}`,
          event
        );
      })
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget as Element).select('rect').attr('fill-opacity', 0.85);
        this.hideTooltip();
      });
  }
}

export class FunnelChart extends VizChart {
  constructor(containerElement: HTMLElement, config: ChartConfig = {}) {
    super(containerElement, {
      ...config,
      margin: Object.assign({ top: 20, right: 24, bottom: 20, left: 24 }, config.margin || {}),
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

    const maxVal = Math.max(1, d3.max(validData, (d) => Number(d[yAxis]) || 0) ?? 1);
    const n = validData.length;
    const stepH = this.innerHeight / n;
    const gap = Math.min(4, stepH * 0.14);
    const centerX = this.innerWidth / 2;
    const maxW = this.innerWidth * 0.88;
    const color = this.getColorScale(validData.map((d) => String(d[xAxis] ?? '')));

    validData.forEach((d, idx) => {
      const val = Number(d[yAxis]) || 0;
      const nextVal = idx < n - 1 ? Number(validData[idx + 1][yAxis]) || 0 : val * 0.72;
      const topW = Math.max(24, (val / maxVal) * maxW);
      const botW = Math.max(18, (nextVal / maxVal) * maxW);

      const y0 = idx * stepH + gap / 2;
      const y1 = (idx + 1) * stepH - gap / 2;

      const points = [
        [centerX - topW / 2, y0],
        [centerX + topW / 2, y0],
        [centerX + botW / 2, y1],
        [centerX - botW / 2, y1],
      ]
        .map((p) => p.join(','))
        .join(' ');

      const label = String(d[xAxis] ?? '');
      const baseVal = Number(validData[0][yAxis]) || 1;
      const convPct = ((val / baseVal) * 100).toFixed(1);

      const stageG = this.g.append('g').style('cursor', 'pointer');

      stageG
        .append('polygon')
        .attr('points', points)
        .attr('fill', color(label))
        .attr('fill-opacity', 0.85)
        .attr('stroke', this.getBackgroundColor())
        .attr('stroke-width', 1.5);

      if (stepH > 18) {
        stageG
          .append('text')
          .attr('x', centerX)
          .attr('y', (y0 + y1) / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .style('font-size', '10.5px')
          .style('font-family', '"JetBrains Mono", monospace')
          .style('font-weight', '600')
          .style('fill', '#111216')
          .style('pointer-events', 'none')
          .text(`${label}: ${formatNumericValue(val)} (${convPct}%)`);
      }

      stageG
        .on('mouseover', (event) => {
          stageG.select('polygon').attr('fill-opacity', 1);
          this.showTooltip(
            `<strong>${label}</strong><br/>${yAxis}: ${formatNumericValue(val)}<br/>Retention from Top: ${convPct}%`,
            event
          );
        })
        .on('mousemove', (event) => this.moveTooltip(event))
        .on('mouseleave', () => {
          stageG.select('polygon').attr('fill-opacity', 0.85);
          this.hideTooltip();
        });
    });
  }
}
