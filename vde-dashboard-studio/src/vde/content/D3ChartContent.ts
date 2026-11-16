import {
  IPanelContent,
  notifyGridStateChange,
  getActiveThemeColors,
} from './IPanelContent';
import { CHART_REGISTRY, CHART_CATALOG, VizChart } from '../charts';
import type { ChartConfig, ChartUpdatePayload, DataRow } from '../charts/VizChart';
import { SAMPLE_DATASETS } from '../sampleDatasets';

export interface D3ChartContentConfig {
  chartType?: string;
  datasetId?: string;
  chartConfig?: ChartConfig;
  data?: {
    data: DataRow[];
    xAxis?: string;
    yAxis?: string;
    groupKey?: string;
  };
  [key: string]: unknown;
}

export class D3ChartContent extends IPanelContent {
  public chart: VizChart | null = null;
  private containerElement: HTMLElement | null = null;
  private canvasEl: HTMLElement | null = null;

  constructor(config: D3ChartContentConfig = {}) {
    super(config);
    if (!this.config.chartType) {
      this.config.chartType = 'Bar Chart';
    }
    if (!this.config.data) {
      const sample = SAMPLE_DATASETS[0];
      this.config.datasetId = sample.id;
      this.config.data = {
        data: sample.data,
        xAxis: sample.defaultX,
        yAxis: sample.defaultY,
        groupKey: sample.defaultGroup,
      };
    }
  }

  public render(containerElement: HTMLElement): void {
    this.containerElement = containerElement;
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    containerElement.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex flex-column h-100 w-100 p-2 gap-2';

    // Compact inline toolbar to switch chart types, datasets, or reset zoom
    const toolbar = document.createElement('div');
    toolbar.className = 'd-flex align-items-center justify-content-between gap-2 flex-wrap';

    const leftControls = document.createElement('div');
    leftControls.className = 'd-flex align-items-center gap-2 flex-grow-1';

    const chartSelect = document.createElement('select');
    chartSelect.className = 'form-select form-select-sm bg-dark text-white border-secondary font-mono';
    chartSelect.style.fontSize = '11px';
    chartSelect.style.maxWidth = '195px';

    const categories = Array.from(new Set(CHART_CATALOG.map((c) => c.category)));
    categories.forEach((cat) => {
      const optGroup = document.createElement('optgroup');
      optGroup.label = cat;
      CHART_CATALOG.filter((c) => c.category === cat).forEach((entry) => {
        const opt = document.createElement('option');
        opt.value = entry.type;
        opt.textContent = entry.type;
        if (entry.type === this.config.chartType) opt.selected = true;
        optGroup.appendChild(opt);
      });
      chartSelect.appendChild(optGroup);
    });

    chartSelect.onchange = (e) => {
      this.config.chartType = (e.target as HTMLSelectElement).value;
      this.mountChart();
      notifyGridStateChange();
    };

    const datasetSelect = document.createElement('select');
    datasetSelect.className = 'form-select form-select-sm bg-dark text-white border-secondary font-mono';
    datasetSelect.style.fontSize = '11px';
    datasetSelect.style.maxWidth = '185px';
    SAMPLE_DATASETS.forEach((ds) => {
      const opt = document.createElement('option');
      opt.value = ds.id;
      opt.textContent = ds.name;
      if (ds.id === this.config.datasetId) opt.selected = true;
      datasetSelect.appendChild(opt);
    });

    datasetSelect.onchange = (e) => {
      const id = (e.target as HTMLSelectElement).value;
      const ds = SAMPLE_DATASETS.find((d) => d.id === id);
      if (ds) {
        this.config.datasetId = ds.id;
        this.config.data = {
          data: ds.data,
          xAxis: ds.defaultX,
          yAxis: ds.defaultY,
          groupKey: ds.defaultGroup,
        };
        this.mountChart();
        notifyGridStateChange();
      }
    };

    leftControls.appendChild(chartSelect);
    leftControls.appendChild(datasetSelect);

    const resetZoomBtn = document.createElement('button');
    resetZoomBtn.className = 'btn btn-sm btn-outline-secondary font-mono';
    resetZoomBtn.style.fontSize = '10px';
    resetZoomBtn.style.padding = '2px 8px';
    resetZoomBtn.innerHTML = '<i class="bi bi-arrows-angle-contract me-1"></i>Reset Zoom';
    resetZoomBtn.onclick = () => {
      if (this.chart) this.chart.resetZoom();
    };

    toolbar.appendChild(leftControls);
    toolbar.appendChild(resetZoomBtn);

    const canvasEl = document.createElement('div');
    canvasEl.className = 'flex-grow-1 position-relative overflow-hidden rounded border border-secondary';
    canvasEl.style.backgroundColor = 'var(--global-bg, #121316)';
    canvasEl.style.minHeight = '140px';
    this.canvasEl = canvasEl;

    wrapper.appendChild(toolbar);
    wrapper.appendChild(canvasEl);
    containerElement.appendChild(wrapper);

    requestAnimationFrame(() => this.mountChart());
  }

  private mountChart(): void {
    if (!this.canvasEl) return;
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const chartType = String(this.config.chartType || 'Bar Chart');
    const ChartClass = CHART_REGISTRY[chartType];
    if (!ChartClass) {
      this.canvasEl.innerHTML = `<div class="text-danger p-3 small">Chart type "${chartType}" not registered.</div>`;
      return;
    }

    const width = this.canvasEl.clientWidth || 360;
    const height = this.canvasEl.clientHeight || 220;
    const themeColors = getActiveThemeColors();

    const chartConfig: ChartConfig = Object.assign(
      {},
      (this.config.chartConfig as ChartConfig) || {},
      { width, height },
      themeColors
    );

    this.chart = new ChartClass(this.canvasEl, chartConfig);

    const dataBlock = this.config.data as D3ChartContentConfig['data'];
    if (dataBlock) {
      const payload: ChartUpdatePayload = {
        data: dataBlock.data || [],
        xAxis: dataBlock.xAxis || 'label',
        yAxis: dataBlock.yAxis || 'value',
        groupKey: dataBlock.groupKey,
        width,
        height,
      };
      this.chart.update(payload);
    }
  }

  public override update(data?: D3ChartContentConfig['data']): void {
    if (data) this.config.data = data;
    if (this.chart && this.canvasEl && this.config.data) {
      const dataBlock = this.config.data as D3ChartContentConfig['data'];
      if (!dataBlock) return;
      this.chart.update({
        data: dataBlock.data || [],
        xAxis: dataBlock.xAxis || 'label',
        yAxis: dataBlock.yAxis || 'value',
        groupKey: dataBlock.groupKey,
        width: this.canvasEl.clientWidth || 360,
        height: this.canvasEl.clientHeight || 220,
      });
    }
    notifyGridStateChange();
  }

  public override resize(_width?: number, _height?: number): void {
    if (this.chart && this.canvasEl) {
      const w = this.canvasEl.clientWidth || 360;
      const h = this.canvasEl.clientHeight || 220;
      const dataBlock = this.config.data as D3ChartContentConfig['data'];
      if (dataBlock) {
        this.chart.update({
          data: dataBlock.data || [],
          xAxis: dataBlock.xAxis || 'label',
          yAxis: dataBlock.yAxis || 'value',
          groupKey: dataBlock.groupKey,
          width: w,
          height: h,
        });
      } else {
        this.chart.updateDimensions(w, h);
      }
    }
  }

  public override destroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  public clone(): D3ChartContent {
    return new D3ChartContent({
      chartType: String(this.config.chartType || 'Bar Chart'),
      datasetId: String(this.config.datasetId || ''),
      chartConfig: JSON.parse(JSON.stringify(this.config.chartConfig || {})),
      data: JSON.parse(JSON.stringify(this.config.data || {})),
    });
  }
}
