import * as d3 from 'd3';
import {
  IPanelContent,
  notifyGridStateChange,
  getActiveThemeColors,
} from './IPanelContent';
import {
  CHART_REGISTRY,
  CHART_CATALOG,
  VizChart,
  getAggregateFunction,
} from '../charts';
import type { DataRow } from '../charts/VizChart';
import { SAMPLE_DATASETS } from '../sampleDatasets';

export interface FilterCondition {
  col: string;
  op: string;
  val: string;
}

export interface DataVizDashboardState {
  data: DataRow[];
  columns: string[];
  selectedColumns: string[];
  xAxis: string;
  yAxis: string;
  groupKey: string;
  transform: string;
  dateGranularity: string;
  chartType: string;
  filters: FilterCondition[];
  sampleId?: string;
}

export class DataVizDashboardContent extends IPanelContent {
  private containerElement: HTMLElement | null = null;
  public chart: VizChart | null = null;
  public state: DataVizDashboardState;

  constructor(config: { state?: Partial<DataVizDashboardState> } = {}) {
    super(config);
    const defaultSample = SAMPLE_DATASETS[0];
    const hasCustomData = config.state && Array.isArray(config.state.data) && config.state.data.length > 0;

    this.state = Object.assign(
      {
        data: hasCustomData ? [] : [...defaultSample.data],
        columns: hasCustomData ? [] : [...defaultSample.columns],
        selectedColumns: hasCustomData ? [] : [...defaultSample.columns],
        xAxis: defaultSample.defaultX,
        yAxis: defaultSample.defaultY,
        groupKey: defaultSample.defaultGroup,
        transform: 'Sum',
        dateGranularity: 'Quarter',
        chartType: defaultSample.defaultChart,
        filters: [],
        sampleId: defaultSample.id,
      },
      config.state || {}
    );
  }

  public override serializeState(): Record<string, unknown> {
    return JSON.parse(JSON.stringify(this.state));
  }

  private buildChartOptionsHTML(): string {
    const categories = Array.from(new Set(CHART_CATALOG.map((c) => c.category)));
    return categories
      .map((cat) => {
        const opts = CHART_CATALOG.filter((c) => c.category === cat)
          .map(
            (entry) =>
              `<option value="${entry.type}">${entry.type}</option>`
          )
          .join('');
        return `<optgroup label="${cat}">${opts}</optgroup>`;
      })
      .join('');
  }

  private buildSampleOptionsHTML(): string {
    return (
      `<option value="">-- Load Sample --</option>` +
      SAMPLE_DATASETS.map(
        (ds) =>
          `<option value="${ds.id}" ${ds.id === this.state.sampleId ? 'selected' : ''}>${ds.name}</option>`
      ).join('')
    );
  }

  private getHTMLTemplate(): string {
    return `
<div class="vde-viz-dashboard h-100 d-flex flex-column p-2 gap-2" style="background-color: var(--global-panel, #1c1e24); color: var(--global-text, #e2e4e9); font-size: 11px;">
  <!-- Data Source & Chart Controls -->
  <div class="row g-2 align-items-end border-bottom border-secondary pb-2">
    <div class="col-6 col-md-2">
      <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Upload CSV</label>
      <input type="file" class="form-control form-control-sm file-input bg-dark border-secondary text-white" accept=".csv" style="font-size: 11px;" />
    </div>
    <div class="col-6 col-md-2">
      <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Sample Dataset</label>
      <select class="form-select form-select-sm sample-menu bg-dark text-white border-secondary" style="font-size: 11px;">
        ${this.buildSampleOptionsHTML()}
      </select>
    </div>
    <div class="col-12 col-md-8 d-none config-controls">
      <div class="row g-2">
        <div class="col-4 col-md-2">
          <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">X-Axis</label>
          <select class="form-select form-select-sm x-axis-menu bg-dark text-white border-secondary" style="font-size: 11px;"></select>
        </div>
        <div class="col-4 col-md-2">
          <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Y-Axis</label>
          <select class="form-select form-select-sm y-axis-menu bg-dark text-white border-secondary" style="font-size: 11px;"></select>
        </div>
        <div class="col-4 col-md-2">
          <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Series / Group</label>
          <select class="form-select form-select-sm group-axis-menu bg-dark text-white border-secondary" style="font-size: 11px;"></select>
        </div>
        <div class="col-4 col-md-2">
          <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Aggregate</label>
          <select class="form-select form-select-sm transform-menu bg-dark text-white border-secondary" style="font-size: 11px;">
            <option value="Raw">Raw Rows</option>
            <option value="Count">Count</option>
            <option value="Sum">Sum of Y</option>
            <option value="Avg">Avg of Y</option>
            <option value="Min">Min of Y</option>
            <option value="Max">Max of Y</option>
          </select>
        </div>
        <div class="col-4 col-md-2">
          <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Date Zoom</label>
          <select class="form-select form-select-sm date-granularity-menu bg-dark text-white border-secondary" style="font-size: 11px;">
            <option value="Raw">Raw</option>
            <option value="Year">Year</option>
            <option value="Quarter">Quarter</option>
            <option value="Month">Month</option>
            <option value="Day">Day</option>
            <option value="Hour">Hour</option>
          </select>
        </div>
        <div class="col-4 col-md-2">
          <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Chart Type</label>
          <select class="form-select form-select-sm chart-type-menu bg-dark text-white border-secondary" style="font-size: 11px;">
            ${this.buildChartOptionsHTML()}
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- Table Column Selection Bar -->
  <div class="d-none table-column-controls">
    <div class="d-flex align-items-center gap-2 bg-black bg-opacity-25 p-2 rounded border border-secondary flex-wrap">
      <span class="font-mono text-info" style="font-size: 10px;">Columns:</span>
      <div class="table-column-checkboxes d-flex gap-1 align-items-center flex-wrap"></div>
      <button type="button" class="btn btn-sm btn-outline-info select-all-cols-btn" style="padding: 1px 6px; font-size: 10px;">All</button>
      <button type="button" class="btn btn-sm btn-outline-secondary deselect-all-cols-btn" style="padding: 1px 6px; font-size: 10px;">None</button>
    </div>
  </div>

  <!-- Local Filter Bar -->
  <div class="d-none config-controls">
    <div class="d-flex align-items-center justify-content-between gap-2 bg-black bg-opacity-25 px-2 py-1 rounded border border-secondary flex-wrap">
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <span class="font-mono text-warning" style="font-size: 10px;"><i class="bi bi-funnel me-1"></i>Filter</span>
        <select class="form-select form-select-sm filter-column bg-dark text-white border-secondary" style="width: auto; font-size: 10px;"></select>
        <select class="form-select form-select-sm filter-operator bg-dark text-white border-secondary" style="width: auto; font-size: 10px;">
          <option value="eq">=</option>
          <option value="neq">≠</option>
          <option value="gt">&gt;</option>
          <option value="gte">&ge;</option>
          <option value="lt">&lt;</option>
          <option value="lte">&le;</option>
          <option value="contains">contains</option>
          <option value="starts">starts with</option>
          <option value="ends">ends with</option>
          <option value="null">is null</option>
          <option value="notnull">is not null</option>
        </select>
        <input type="text" class="form-control form-control-sm filter-value bg-dark text-white border-secondary" placeholder="Value..." style="width: 96px; font-size: 10px;" />
        <button type="button" class="btn btn-sm btn-outline-warning add-filter-btn" style="padding: 2px 8px; font-size: 10px;">Apply</button>
        <div class="active-filters-container d-flex gap-1 align-items-center flex-wrap"></div>
      </div>
      <button type="button" class="btn btn-sm btn-outline-secondary reset-zoom-btn font-mono" style="padding: 2px 8px; font-size: 10px;">
        <i class="bi bi-arrows-angle-contract me-1"></i>Reset Zoom
      </button>
    </div>
  </div>

  <!-- Visualization Canvas -->
  <div class="viz-container flex-grow-1 border border-secondary rounded p-2 overflow-hidden position-relative" style="min-height: 170px; background-color: var(--global-bg, #121316);">
    <div class="text-center text-secondary py-5 initial-message">
      <i class="bi bi-bar-chart-line fs-2 d-block text-warning mb-2"></i>
      Upload a CSV file or select a sample dataset to render D3.js charts.
    </div>
  </div>
</div>`;
  }

  public render(containerElement: HTMLElement): void {
    this.containerElement = containerElement;
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    containerElement.innerHTML = this.getHTMLTemplate();
    this.attachEvents();
    if (this.state.data && this.state.data.length > 0) {
      this.restoreUIState();
      requestAnimationFrame(() => this.renderChart());
    }
  }

  private attachEvents(): void {
    const el = this.containerElement;
    if (!el) return;

    const fileInput = el.querySelector<HTMLInputElement>('.file-input');
    if (fileInput) fileInput.addEventListener('change', (e) => this.loadCSV(e));

    const sampleMenu = el.querySelector<HTMLSelectElement>('.sample-menu');
    if (sampleMenu) {
      sampleMenu.addEventListener('change', (e) => {
        const id = (e.target as HTMLSelectElement).value;
        const ds = SAMPLE_DATASETS.find((d) => d.id === id);
        if (!ds) return;
        this.state.sampleId = ds.id;
        this.state.data = [...ds.data];
        this.state.columns = [...ds.columns];
        this.state.selectedColumns = [...ds.columns];
        this.state.xAxis = ds.defaultX;
        this.state.yAxis = ds.defaultY;
        this.state.groupKey = ds.defaultGroup;
        this.state.filters = [];
        this.state.transform = ds.defaultChart === 'Box Plot' || ds.defaultChart === 'Radar Chart' ? 'Raw' : 'Sum';
        this.state.dateGranularity = ds.id === 'regional-revenue' ? 'Quarter' : 'Raw';
        this.state.chartType = ds.defaultChart;
        this.restoreUIState();
        this.renderChart();
        notifyGridStateChange();
      });
    }

    const bindSelect = (selector: string, key: keyof DataVizDashboardState, after?: () => void) => {
      const select = el.querySelector<HTMLSelectElement>(selector);
      if (!select) return;
      select.addEventListener('change', (e) => {
        (this.state[key] as string) = (e.target as HTMLSelectElement).value;
        if (after) after();
        this.renderChart();
        notifyGridStateChange();
      });
    };

    bindSelect('.x-axis-menu', 'xAxis');
    bindSelect('.y-axis-menu', 'yAxis');
    bindSelect('.group-axis-menu', 'groupKey');
    bindSelect('.transform-menu', 'transform');
    bindSelect('.date-granularity-menu', 'dateGranularity');
    bindSelect('.chart-type-menu', 'chartType', () => this.renderTableColumnControls());

    const selectAllColsBtn = el.querySelector<HTMLButtonElement>('.select-all-cols-btn');
    if (selectAllColsBtn) {
      selectAllColsBtn.onclick = () => {
        this.state.selectedColumns = [...(this.state.columns || [])];
        this.renderTableColumnControls();
        this.renderChart();
        notifyGridStateChange();
      };
    }

    const deselectAllColsBtn = el.querySelector<HTMLButtonElement>('.deselect-all-cols-btn');
    if (deselectAllColsBtn) {
      deselectAllColsBtn.onclick = () => {
        this.state.selectedColumns = [];
        this.renderTableColumnControls();
        this.renderChart();
        notifyGridStateChange();
      };
    }

    const addFilterBtn = el.querySelector<HTMLButtonElement>('.add-filter-btn');
    if (addFilterBtn) {
      addFilterBtn.onclick = () => {
        const col = el.querySelector<HTMLSelectElement>('.filter-column')?.value;
        const op = el.querySelector<HTMLSelectElement>('.filter-operator')?.value || 'eq';
        const valInput = el.querySelector<HTMLInputElement>('.filter-value');
        const val = valInput?.value ?? '';
        if (!col) return;
        this.state.filters.push({ col, op, val });
        if (valInput) valInput.value = '';
        this.renderFilters();
        this.renderChart();
        notifyGridStateChange();
      };
    }

    const resetZoomBtn = el.querySelector<HTMLButtonElement>('.reset-zoom-btn');
    if (resetZoomBtn) {
      resetZoomBtn.onclick = () => {
        if (this.chart) this.chart.resetZoom();
      };
    }
  }

  private loadCSV(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || '');
      const parsed = d3.csvParse(text);
      if (parsed && parsed.length > 0) {
        const cols = parsed.columns || Object.keys(parsed[0] || {});
        this.state.sampleId = '';
        this.state.data = parsed as unknown as DataRow[];
        this.state.columns = cols;
        this.state.selectedColumns = [...cols];
        this.state.xAxis = cols[0] || '';
        this.state.yAxis = cols[1] || cols[0] || '';
        this.state.groupKey = cols[2] || '';
        this.state.filters = [];
        this.state.transform = 'Raw';
        this.state.dateGranularity = 'Raw';
        this.restoreUIState();
        this.renderChart();
        notifyGridStateChange();
      }
    };
    reader.readAsText(files[0]);
    input.value = '';
  }

  private restoreUIState(): void {
    const el = this.containerElement;
    if (!el) return;
    el.querySelectorAll('.config-controls').forEach((c) => c.classList.remove('d-none'));
    const initMsg = el.querySelector('.initial-message');
    if (initMsg) initMsg.classList.add('d-none');

    if (!Array.isArray(this.state.selectedColumns)) {
      this.state.selectedColumns = [...(this.state.columns || [])];
    }

    this.populateDropdowns();
    this.renderFilters();
    this.renderTableColumnControls();
  }

  private renderTableColumnControls(): void {
    const el = this.containerElement;
    if (!el) return;
    const tableControls = el.querySelector('.table-column-controls');
    if (!tableControls) return;

    if (this.state.chartType === 'Table Chart' && this.state.columns.length > 0) {
      tableControls.classList.remove('d-none');
      const container = el.querySelector('.table-column-checkboxes');
      if (!container) return;
      container.innerHTML = '';

      this.state.columns.forEach((col) => {
        const isSelected = this.state.selectedColumns.includes(col);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `btn btn-sm font-mono ${isSelected ? 'btn-info text-dark' : 'btn-outline-secondary'}`;
        btn.style.fontSize = '10px';
        btn.style.padding = '1px 7px';
        btn.textContent = col;
        btn.onclick = (e) => {
          e.stopPropagation();
          if (isSelected) {
            this.state.selectedColumns = this.state.selectedColumns.filter((c) => c !== col);
          } else {
            this.state.selectedColumns.push(col);
          }
          this.renderTableColumnControls();
          this.renderChart();
          notifyGridStateChange();
        };
        container.appendChild(btn);
      });
    } else {
      tableControls.classList.add('d-none');
    }
  }

  private populateDropdowns(): void {
    const el = this.containerElement;
    if (!el) return;

    const xMenu = el.querySelector<HTMLSelectElement>('.x-axis-menu');
    const yMenu = el.querySelector<HTMLSelectElement>('.y-axis-menu');
    const groupMenu = el.querySelector<HTMLSelectElement>('.group-axis-menu');
    const filterCol = el.querySelector<HTMLSelectElement>('.filter-column');
    if (!xMenu || !yMenu || !groupMenu || !filterCol) return;

    xMenu.innerHTML = '';
    yMenu.innerHTML = '';
    groupMenu.innerHTML = '<option value="">None</option>';
    filterCol.innerHTML = '';

    this.state.columns.forEach((col) => {
      xMenu.insertAdjacentHTML(
        'beforeend',
        `<option value="${col}" ${col === this.state.xAxis ? 'selected' : ''}>${col}</option>`
      );
      yMenu.insertAdjacentHTML(
        'beforeend',
        `<option value="${col}" ${col === this.state.yAxis ? 'selected' : ''}>${col}</option>`
      );
      groupMenu.insertAdjacentHTML(
        'beforeend',
        `<option value="${col}" ${col === this.state.groupKey ? 'selected' : ''}>${col}</option>`
      );
      filterCol.insertAdjacentHTML('beforeend', `<option value="${col}">${col}</option>`);
    });

    const setVal = (sel: string, val: string) => {
      const node = el.querySelector<HTMLSelectElement>(sel);
      if (node) node.value = val;
    };
    setVal('.transform-menu', this.state.transform || 'Raw');
    setVal('.date-granularity-menu', this.state.dateGranularity || 'Raw');
    setVal('.chart-type-menu', this.state.chartType || 'Bar Chart');
    setVal('.sample-menu', this.state.sampleId || '');
  }

  private renderFilters(): void {
    const el = this.containerElement;
    if (!el) return;
    const container = el.querySelector('.active-filters-container');
    if (!container) return;
    container.innerHTML = '';

    if (!this.state.filters || this.state.filters.length === 0) {
      container.innerHTML = `<span class="text-secondary font-mono" style="font-size: 10px;">No active filters</span>`;
      return;
    }

    this.state.filters.forEach((f, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-sm btn-outline-warning font-mono d-inline-flex align-items-center gap-1';
      btn.style.fontSize = '10px';
      btn.style.padding = '1px 6px';
      btn.textContent = `${f.col} ${this.describeOperator(f.op)} ${f.val ? `"${f.val}"` : ''} ×`;
      btn.title = 'Remove filter';
      btn.onclick = (e) => {
        e.stopPropagation();
        this.state.filters.splice(idx, 1);
        this.renderFilters();
        this.renderChart();
        notifyGridStateChange();
      };
      container.appendChild(btn);
    });
  }

  private describeOperator(op: string): string {
    const map: Record<string, string> = {
      eq: '=',
      neq: '≠',
      gt: '>',
      gte: '≥',
      lt: '<',
      lte: '≤',
      contains: 'contains',
      starts: 'starts with',
      ends: 'ends with',
      null: 'is null',
      notnull: 'is not null',
    };
    return map[op] || op;
  }

  private applyFilters(data: DataRow[], filters: FilterCondition[]): DataRow[] {
    if (!filters || filters.length === 0) return data;
    return data.filter((row) =>
      filters.every((f) => {
        const val = row[f.col];
        const filterVal = f.val;
        if (f.op === 'null') return val === undefined || val === null || val === '';
        if (f.op === 'notnull') return val !== undefined && val !== null && val !== '';
        if (val === undefined || val === null) return false;

        const numVal = Number(val);
        const numFilter = Number(filterVal);
        const isNum = !isNaN(numVal) && !isNaN(numFilter) && val !== '' && filterVal !== '';

        switch (f.op) {
          case 'eq':
            return isNum ? numVal === numFilter : String(val).toLowerCase() === filterVal.toLowerCase();
          case 'neq':
            return isNum ? numVal !== numFilter : String(val).toLowerCase() !== filterVal.toLowerCase();
          case 'gt':
            return isNum ? numVal > numFilter : String(val).toLowerCase() > filterVal.toLowerCase();
          case 'gte':
            return isNum ? numVal >= numFilter : String(val).toLowerCase() >= filterVal.toLowerCase();
          case 'lt':
            return isNum ? numVal < numFilter : String(val).toLowerCase() < filterVal.toLowerCase();
          case 'lte':
            return isNum ? numVal <= numFilter : String(val).toLowerCase() <= filterVal.toLowerCase();
          case 'contains':
            return String(val).toLowerCase().includes(filterVal.toLowerCase());
          case 'starts':
            return String(val).toLowerCase().startsWith(filterVal.toLowerCase());
          case 'ends':
            return String(val).toLowerCase().endsWith(filterVal.toLowerCase());
          default:
            return true;
        }
      })
    );
  }

  public renderChart(): void {
    const s = this.state;
    const canvas = this.containerElement?.querySelector<HTMLElement>('.viz-container');
    if (!canvas) return;
    if (!s.data || s.data.length === 0) return;

    const filteredData = this.applyFilters(s.data, s.filters);
    const seriesCharts = new Set([
      'Grouped Bar Chart',
      'Stacked Bar Chart',
      'Stacked Area Chart',
      'Scatter Plot',
      'Heatmap',
      'Radar Chart',
      'Treemap',
      'Bubble Chart',
    ]);

    let processedData = filteredData;

    // Preserve series column when aggregating for multi-series charts
    if (
      seriesCharts.has(s.chartType) &&
      s.groupKey &&
      s.groupKey !== s.xAxis &&
      ((s.transform && s.transform !== 'Raw') || (s.dateGranularity && s.dateGranularity !== 'Raw'))
    ) {
      const dateProcessed = filteredData.map((r) =>
        Object.assign({}, r, {
          [s.xAxis]:
            s.dateGranularity && s.dateGranularity !== 'Raw'
              ? getAggregateFunction('Raw', [r], s.xAxis, s.yAxis, s.dateGranularity)[0][s.xAxis]
              : r[s.xAxis],
        })
      );
      if (s.transform && s.transform !== 'Raw') {
        const compositeGroup = d3.group(
          dateProcessed,
          (d) => `${String(d[s.xAxis] ?? '')}|||${String(d[s.groupKey] ?? '')}`
        );
        processedData = Array.from(compositeGroup, ([compKey, rows]) => {
          const [xv, gv] = compKey.split('|||');
          const nums = rows.map((r) => Number(r[s.yAxis]) || 0);
          let val = 0;
          if (s.transform === 'Count') val = rows.length;
          else if (s.transform === 'Sum') val = d3.sum(nums);
          else if (s.transform === 'Avg') val = d3.mean(nums) ?? 0;
          else if (s.transform === 'Min') val = d3.min(nums) ?? 0;
          else if (s.transform === 'Max') val = d3.max(nums) ?? 0;
          return { [s.xAxis]: xv, [s.groupKey]: gv, [s.yAxis]: val };
        });
      } else {
        processedData = dateProcessed;
      }
    } else if (
      (s.transform && s.transform !== 'Raw') ||
      (s.dateGranularity && s.dateGranularity !== 'Raw')
    ) {
      processedData = getAggregateFunction(
        s.transform,
        filteredData,
        s.xAxis,
        s.yAxis,
        s.dateGranularity
      );
    }

    const ChartConstructor = CHART_REGISTRY[s.chartType];
    if (!ChartConstructor) return;

    const width = canvas.clientWidth || 420;
    const height = canvas.clientHeight || 220;
    const themeColors = getActiveThemeColors();

    if (this.chart && !(this.chart instanceof ChartConstructor)) {
      (this.chart as VizChart).destroy();
      this.chart = null;
    }

    if (!this.chart) {
      this.chart = new ChartConstructor(canvas, Object.assign({ width, height }, themeColors));
    } else {
      // Refresh theme tokens on existing chart instance
      Object.assign(this.chart.cfg, themeColors);
    }

    this.chart.update({
      data: processedData,
      xAxis: s.xAxis,
      yAxis: s.yAxis,
      groupKey: s.groupKey,
      selectedColumns: s.selectedColumns,
      width,
      height,
    });
  }

  public override update(data?: { data?: DataRow[]; columns?: string[] }): void {
    if (data && data.data) {
      this.state.data = data.data;
      this.state.columns = data.columns || Object.keys(data.data[0] || {});
      this.restoreUIState();
      this.renderChart();
      notifyGridStateChange();
    }
  }

  public override resize(): void {
    if (this.containerElement && this.state.data.length > 0) {
      this.renderChart();
    }
  }

  public override destroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  public clone(): DataVizDashboardContent {
    return new DataVizDashboardContent({
      state: JSON.parse(JSON.stringify(this.state)),
    });
  }
}
