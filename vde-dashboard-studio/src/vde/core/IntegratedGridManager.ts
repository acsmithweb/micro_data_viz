import { GridStack } from 'gridstack';
import * as bootstrap from 'bootstrap';
import { IPanelContent } from '../content/IPanelContent';
import { RichTextContent } from '../content/RichTextContent';
import { CodeSnippetContent } from '../content/CodeSnippetContent';
import { D3ChartContent } from '../content/D3ChartContent';
import { DataVizDashboardContent } from '../content/DataVizDashboardContent';
import { OllamaInterfaceContent } from '../content/OllamaInterfaceContent';
import { ObsidianCLIContent } from '../content/ObsidianCLIContent';
import { VisualStyleMemento, VisualStyleState, DEFAULT_THEME_STATE } from '../memento/VisualStyleMemento';
import { SAMPLE_DATASETS } from '../sampleDatasets';

export interface LayoutObserver {
  updateLayout(event: string, payload: unknown): void;
}

export class WorkspaceSubject {
  private observers: LayoutObserver[] = [];

  public addObserver(observer: LayoutObserver): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  public removeObserver(observer: LayoutObserver): void {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  public notify(event: string, payload: unknown): void {
    this.observers.forEach((observer) => {
      if (typeof observer.updateLayout === 'function') {
        observer.updateLayout(event, payload);
      }
    });
  }
}

export class BaseGridPanel {
  public id: number;
  public x: number;
  public y: number;
  public w: number;
  public h: number;
  public title: string;
  public content: IPanelContent | null;
  public bucketId: number | null = null;
  public el: HTMLElement | null = null;
  public visualState: VisualStyleMemento | null = null;

  constructor(
    id: number | null,
    x = 0,
    y = 0,
    w = 4,
    h = 8,
    title?: string,
    contentInstance: IPanelContent | null = null
  ) {
    this.id = id ?? 0;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.title = title || `Panel ${this.id}`;
    this.content = contentInstance;
    if (this.content) {
      this.content.panel = this;
    }
  }

  public render(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'grid-stack-item';
    el.setAttribute('gs-id', String(this.id));

    const inner = document.createElement('div');
    inner.className = 'grid-stack-item-content card text-white';
    inner.style.backgroundColor = 'var(--global-panel, #1c1e24)';
    inner.style.border = '1px solid var(--global-border, #2a2d35)';
    inner.style.display = 'flex';
    inner.style.flexDirection = 'column';
    inner.style.height = '100%';

    const header = document.createElement('div');
    header.className =
      'vde-panel-header px-3 py-2 d-flex justify-content-between align-items-center';
    header.style.backgroundColor = 'var(--global-bg, #121316)';
    header.style.borderBottom = '1px solid var(--global-border, #2a2d35)';
    header.style.cursor = 'move';
    header.style.fontSize = '12px';
    header.style.fontWeight = '600';
    header.style.userSelect = 'none';
    header.style.color = 'var(--global-accent, #ff7b00)';

    const titleSpan = document.createElement('span');
    titleSpan.className = 'text-truncate pe-2';
    titleSpan.textContent = this.title;
    header.appendChild(titleSpan);

    const actionsSpan = document.createElement('div');
    actionsSpan.className = 'd-flex align-items-center gap-2 shrink-0';

    const cloneBtn = document.createElement('button');
    cloneBtn.type = 'button';
    cloneBtn.className = 'btn btn-link p-0 text-info border-0';
    cloneBtn.style.fontSize = '12px';
    cloneBtn.innerHTML = '<i class="bi bi-copy"></i>';
    cloneBtn.title = 'Clone Panel';
    cloneBtn.onclick = (e) => {
      e.stopPropagation();
      IntegratedGridManager.clonePanel(this.id);
    };
    actionsSpan.appendChild(cloneBtn);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn btn-link p-0 text-danger border-0';
    closeBtn.style.fontSize = '13px';
    closeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
    closeBtn.title = 'Remove Panel';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      this.destroy();
    };
    actionsSpan.appendChild(closeBtn);

    header.appendChild(actionsSpan);
    inner.appendChild(header);

    const body = document.createElement('div');
    body.className = 'vde-panel-body flex-grow-1 overflow-hidden position-relative';
    body.style.minHeight = '0';
    inner.appendChild(body);

    el.appendChild(inner);
    this.el = el;

    if (this.content) {
      this.content.render(body);
    }

    return el;
  }

  public destroy(): void {
    if (this.content) {
      this.content.destroy();
    }
    if (this.el) {
      const gridStackEl = this.el.closest('.grid-stack') as HTMLElement & {
        gridstack?: GridStack;
      };
      if (gridStackEl && gridStackEl.gridstack) {
        gridStackEl.gridstack.removeWidget(this.el);
      } else {
        this.el.remove();
      }
    }
    IntegratedGridManager.removePanel(this.id);
  }

  public clone(): BaseGridPanel {
    const clonedContent = this.content ? this.content.clone() : null;
    return new BaseGridPanel(
      null,
      this.x,
      this.y,
      this.w,
      this.h,
      `${this.title} (Copy)`,
      clonedContent
    );
  }
}

export interface GridBucketOptions {
  column?: number;
  cellHeight?: number;
  margin?: number;
  float?: boolean;
  staticGrid?: boolean;
  disableDrag?: boolean;
  disableResize?: boolean;
  animate?: boolean;
  acceptWidgets?: boolean | string;
}

export class GridBucket {
  public id: number;
  public name: string;
  public options: Required<GridBucketOptions>;
  public grid: GridStack | null = null;
  public el: HTMLElement | null = null;

  constructor(id: number, name: string, options: GridBucketOptions = {}) {
    this.id = id;
    this.name = name;
    this.options = Object.assign(
      {
        column: 12,
        cellHeight: 30,
        margin: 6,
        float: false,
        staticGrid: false,
        disableDrag: false,
        disableResize: false,
        animate: true,
        acceptWidgets: '.grid-stack-item',
      },
      options
    );
    this.render();
  }

  private render(): void {
    const selector = IntegratedGridManager.containerSelector;
    if (!selector) return;
    const workspace = document.querySelector(selector);
    if (!workspace) return;

    const bucketCard = document.createElement('div');
    bucketCard.className = 'vde-bucket-card';
    bucketCard.id = `vde-bucket-${this.id}`;

    const header = document.createElement('div');
    header.className = 'vde-bucket-header d-flex justify-content-between align-items-center';

    const titleDiv = document.createElement('div');
    titleDiv.className = 'd-flex align-items-center gap-2';

    const icon = document.createElement('i');
    icon.className = 'bi bi-folder2-open';
    icon.style.color = 'var(--global-accent, #ff7b00)';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'vde-bucket-title fw-semibold';
    nameSpan.style.fontSize = '13px';
    nameSpan.textContent = this.name;

    const metaSpan = document.createElement('span');
    metaSpan.className = 'vde-bucket-meta font-mono text-secondary ms-2';
    metaSpan.style.fontSize = '11px';
    metaSpan.textContent = `${this.options.column} cols · ${this.options.cellHeight}px row`;

    titleDiv.appendChild(icon);
    titleDiv.appendChild(nameSpan);
    titleDiv.appendChild(metaSpan);
    header.appendChild(titleDiv);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'd-flex align-items-center gap-2';

    const configBtn = document.createElement('button');
    configBtn.type = 'button';
    configBtn.className = 'btn btn-sm btn-outline-secondary';
    configBtn.style.fontSize = '11px';
    configBtn.style.padding = '3px 10px';
    configBtn.innerHTML = '<i class="bi bi-sliders me-1"></i>Layout Settings';
    configBtn.onclick = () => IntegratedGridManager.openBucketConfigModal(this.id);
    actionsDiv.appendChild(configBtn);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-sm btn-outline-danger';
    removeBtn.style.fontSize = '11px';
    removeBtn.style.padding = '3px 8px';
    removeBtn.innerHTML = '<i class="bi bi-trash3"></i>';
    removeBtn.title = 'Remove Bucket';
    removeBtn.onclick = () => IntegratedGridManager.removeBucket(this.id);
    actionsDiv.appendChild(removeBtn);

    header.appendChild(actionsDiv);
    bucketCard.appendChild(header);

    const gridContainer = document.createElement('div');
    gridContainer.className = 'p-2';

    const gridElement = document.createElement('div');
    gridElement.className = 'grid-stack';
    gridElement.id = `grid-stack-${this.id}`;
    gridContainer.appendChild(gridElement);
    bucketCard.appendChild(gridContainer);

    workspace.appendChild(bucketCard);
    this.el = bucketCard;

    const grid = GridStack.init(
      {
        column: Number(this.options.column) || 12,
        cellHeight: Number(this.options.cellHeight) || 30,
        margin: Number(this.options.margin) ?? 6,
        mode: this.options.float ? 'float' : 'top',
        staticGrid: Boolean(this.options.staticGrid),
        animate: this.options.animate !== false,
        acceptWidgets: '.grid-stack-item',
        draggable: { handle: '.vde-panel-header' },
        resizable: { handles: 'se' },
      },
      gridElement
    );
    if (!grid) return;
    this.grid = grid;

    if (this.options.disableDrag) grid.enableMove(false);
    if (this.options.disableResize) grid.enableResize(false);

    grid.on('resizestop', (_event, el) => {
      const targetEl = el as HTMLElement | undefined;
      if (!targetEl) return;
      const panelId = parseInt(targetEl.getAttribute('gs-id') || '0', 10);
      const panel = IntegratedGridManager.panels.get(panelId);
      if (panel && panel.content) {
        const bodyEl = targetEl.querySelector<HTMLElement>('.vde-panel-body');
        if (bodyEl) {
          panel.content.resize(bodyEl.clientWidth, bodyEl.clientHeight);
        }
      }
      IntegratedGridManager.triggerStateChange();
    });

    grid.on('change', (_event, items) => {
      if (Array.isArray(items)) {
        items.forEach((item) => {
          const itemEl = item.el as HTMLElement | undefined;
          if (!itemEl) return;
          const panelId = parseInt(itemEl.getAttribute('gs-id') || '0', 10);
          const panel = IntegratedGridManager.panels.get(panelId);
          if (panel) {
            panel.x = item.x ?? panel.x;
            panel.y = item.y ?? panel.y;
            panel.w = item.w ?? panel.w;
            panel.h = item.h ?? panel.h;
            if (panel.content) {
              const bodyEl = itemEl.querySelector<HTMLElement>('.vde-panel-body');
              if (bodyEl && bodyEl.clientWidth > 0 && bodyEl.clientHeight > 0) {
                panel.content.resize(bodyEl.clientWidth, bodyEl.clientHeight);
              }
            }
          }
        });
      }
      IntegratedGridManager.triggerStateChange();
    });
  }

  public notifyAllPanelsResize(): void {
    if (!this.el) return;
    requestAnimationFrame(() => {
      setTimeout(() => {
        const itemEls = this.el?.querySelectorAll<HTMLElement>('.grid-stack-item') || [];
        itemEls.forEach((itemEl) => {
          const panelId = parseInt(itemEl.getAttribute('gs-id') || '0', 10);
          const panel = IntegratedGridManager.panels.get(panelId);
          if (panel && panel.content) {
            const bodyEl = itemEl.querySelector<HTMLElement>('.vde-panel-body');
            if (bodyEl && bodyEl.clientWidth > 0 && bodyEl.clientHeight > 0) {
              panel.content.resize(bodyEl.clientWidth, bodyEl.clientHeight);
            }
          }
        });
      }, 60);
    });
  }

  public updateOptions(newOptions: GridBucketOptions & { name?: string } = {}): void {
    this.options = Object.assign({}, this.options, newOptions);
    if (newOptions.name) this.name = newOptions.name;

    if (this.el) {
      const titleEl = this.el.querySelector('.vde-bucket-title');
      if (titleEl) titleEl.textContent = this.name;
      const metaEl = this.el.querySelector('.vde-bucket-meta');
      if (metaEl) {
        metaEl.textContent = `${this.options.column} cols · ${this.options.cellHeight}px row`;
      }
    }

    if (this.grid) {
      if (newOptions.column !== undefined) this.grid.column(Number(newOptions.column) || 12);
      if (newOptions.cellHeight !== undefined) this.grid.cellHeight(Number(newOptions.cellHeight) || 30);
      if (newOptions.margin !== undefined) this.grid.margin(Number(newOptions.margin) ?? 6);
      if (newOptions.float !== undefined) this.grid.mode(newOptions.float ? 'float' : 'top');
      if (newOptions.staticGrid !== undefined) this.grid.setStatic(Boolean(newOptions.staticGrid));
      if (newOptions.disableDrag !== undefined) this.grid.enableMove(!newOptions.disableDrag);
      if (newOptions.disableResize !== undefined) this.grid.enableResize(!newOptions.disableResize);
    }

    this.notifyAllPanelsResize();
    IntegratedGridManager.triggerStateChange();
  }

  public addWidget(panel: BaseGridPanel): void {
    if (!this.grid) return;
    const panelEl = panel.render();
    this.grid.el.appendChild(panelEl);
    this.grid.makeWidget(panelEl, {
      x: panel.x,
      y: panel.y,
      w: panel.w,
      h: panel.h,
      id: String(panel.id),
    });
    setTimeout(() => {
      const bodyEl = panelEl.querySelector<HTMLElement>('.vde-panel-body');
      if (bodyEl && panel.content) {
        panel.content.resize(bodyEl.clientWidth, bodyEl.clientHeight);
      }
    }, 80);
  }

  public destroy(): void {
    if (this.grid) {
      this.grid.destroy(false);
    }
    if (this.el) {
      this.el.remove();
    }
  }
}

export class PanelBuilder {
  private config: {
    id: number | null;
    x: number;
    y: number;
    w: number;
    h: number;
    title: string;
    content: IPanelContent | null;
  } = { id: null, x: 0, y: 0, w: 4, h: 8, title: 'Panel', content: null };

  public reset(): this {
    this.config = { id: null, x: 0, y: 0, w: 4, h: 8, title: 'Panel', content: null };
    return this;
  }

  public setId(id: number): this {
    this.config.id = id;
    return this;
  }
  public setCoordinates(x: number, y: number): this {
    this.config.x = x;
    this.config.y = y;
    return this;
  }
  public setDimensions(w: number, h: number): this {
    this.config.w = w;
    this.config.h = h;
    return this;
  }
  public setTitle(title: string): this {
    this.config.title = title;
    return this;
  }
  public setContent(contentInstance: IPanelContent | null): this {
    this.config.content = contentInstance;
    return this;
  }

  public build(): BaseGridPanel {
    const panel = new BaseGridPanel(
      this.config.id,
      this.config.x,
      this.config.y,
      this.config.w,
      this.config.h,
      this.config.title,
      this.config.content
    );
    this.reset();
    return panel;
  }
}

export class PanelFactory {
  public static createMarkdownPanel(initialText = ''): BaseGridPanel {
    const text =
      initialText ||
      '### Workspace Notes\nDouble-click to edit Markdown, or use **Split Sections** to divide headings into separate panels.';
    return new PanelBuilder()
      .setTitle('Markdown Notes')
      .setDimensions(4, 9)
      .setContent(new RichTextContent({ contentType: 'markdown', sourceText: text }))
      .build();
  }

  public static createCodePanel(initialText = ''): BaseGridPanel {
    const text =
      initialText ||
      'function summarizeMetrics(rows) {\n  return rows.reduce((sum, r) => sum + r.value, 0);\n}\n\nclass ChartPipeline {\n  render(data) {\n    return data.length;\n  }\n}';
    return new PanelBuilder()
      .setTitle('Code Snippet')
      .setDimensions(4, 9)
      .setContent(new CodeSnippetContent({ contentType: 'code-snippet', sourceText: text }))
      .build();
  }

  public static createChartPanel(
    chartType = 'Bar Chart',
    datasetId?: string
  ): BaseGridPanel {
    const ds =
      SAMPLE_DATASETS.find((d) => d.id === datasetId) ||
      (chartType === 'Funnel Chart'
        ? SAMPLE_DATASETS[1]
        : chartType === 'Box Plot' || chartType === 'Histogram'
        ? SAMPLE_DATASETS[2]
        : chartType === 'Radar Chart'
        ? SAMPLE_DATASETS[3]
        : SAMPLE_DATASETS[0]);

    return new PanelBuilder()
      .setTitle(chartType)
      .setDimensions(6, 10)
      .setContent(
        new D3ChartContent({
          chartType,
          datasetId: ds.id,
          data: {
            data: ds.data,
            xAxis: ds.defaultX,
            yAxis: ds.defaultY,
            groupKey: ds.defaultGroup,
          },
        })
      )
      .build();
  }

  public static createDashboardPanel(): BaseGridPanel {
    return new PanelBuilder()
      .setTitle('Interactive Data Explorer')
      .setDimensions(12, 13)
      .setContent(new DataVizDashboardContent())
      .build();
  }

  public static createOllamaPanel(): BaseGridPanel {
    return new PanelBuilder()
      .setTitle('Ollama AI Console')
      .setDimensions(6, 11)
      .setContent(new OllamaInterfaceContent())
      .build();
  }

  public static createObsidianCLIPanel(): BaseGridPanel {
    return new PanelBuilder()
      .setTitle('Obsidian CLI')
      .setDimensions(6, 11)
      .setContent(new ObsidianCLIContent())
      .build();
  }
}

export class IntegratedGridManagerClass extends WorkspaceSubject {
  public containerSelector: string | null = null;
  public buckets = new Map<number, GridBucket>();
  public panels = new Map<number, BaseGridPanel>();
  public nextBucketId = 1;
  public nextPanelId = 1;
  public stateChangeListener: ((jsonState: string) => void) | null = null;
  public currentTheme: VisualStyleState = { ...DEFAULT_THEME_STATE };
  private configModalEl: HTMLElement | null = null;

  public setContainer(selector: string): void {
    this.containerSelector = selector;
  }

  public createBucket(name: string, options: GridBucketOptions = {}): GridBucket | null {
    if (!this.containerSelector) return null;
    const id = this.nextBucketId++;
    const bucket = new GridBucket(id, name, options);
    this.buckets.set(id, bucket);
    this.triggerStateChange();
    return bucket;
  }

  public removeBucket(id: number): void {
    const bucket = this.buckets.get(id);
    if (!bucket) return;
    Array.from(this.panels.values())
      .filter((p) => p.bucketId === id)
      .forEach((p) => {
        if (p.content) p.content.destroy();
        this.panels.delete(p.id);
      });
    bucket.destroy();
    this.buckets.delete(id);
    this.triggerStateChange();
  }

  public registerAndPlacePanel(
    panel: BaseGridPanel,
    bucketId?: number | null
  ): BaseGridPanel | null {
    let targetBucket = bucketId ? this.buckets.get(bucketId) : undefined;
    if (!targetBucket && this.buckets.size > 0) {
      targetBucket = this.buckets.values().next().value;
    }
    if (!targetBucket) {
      targetBucket = this.createBucket('Primary Workspace') || undefined;
    }
    if (!targetBucket) return null;

    panel.id = panel.id || this.nextPanelId++;
    if (panel.id >= this.nextPanelId) this.nextPanelId = panel.id + 1;
    panel.bucketId = targetBucket.id;

    this.panels.set(panel.id, panel);
    targetBucket.addWidget(panel);
    this.triggerStateChange();
    return panel;
  }

  public addMarkdownWidget(initialText = '', bucketId: number | null = null) {
    return this.registerAndPlacePanel(PanelFactory.createMarkdownPanel(initialText), bucketId);
  }

  public addDashboardWidget(bucketId: number | null = null) {
    return this.registerAndPlacePanel(PanelFactory.createDashboardPanel(), bucketId);
  }

  public addChartWidget(
    chartType = 'Bar Chart',
    bucketId: number | null = null,
    datasetId?: string
  ) {
    return this.registerAndPlacePanel(
      PanelFactory.createChartPanel(chartType, datasetId),
      bucketId
    );
  }

  public addCodeWidget(initialText = '', bucketId: number | null = null) {
    return this.registerAndPlacePanel(PanelFactory.createCodePanel(initialText), bucketId);
  }

  public addOllamaWidget(bucketId: number | null = null) {
    return this.registerAndPlacePanel(PanelFactory.createOllamaPanel(), bucketId);
  }

  public addObsidianCLIWidget(bucketId: number | null = null) {
    return this.registerAndPlacePanel(PanelFactory.createObsidianCLIPanel(), bucketId);
  }

  public clonePanel(panelId: number): BaseGridPanel | null {
    const original = this.panels.get(panelId);
    if (!original) return null;
    const cloned = original.clone();
    cloned.x = (original.x + 1) % 12;
    cloned.y = original.y + 1;
    return this.registerAndPlacePanel(cloned, original.bucketId);
  }

  public removePanel(id: number): void {
    this.panels.delete(id);
    this.triggerStateChange();
  }

  public clearAll(): void {
    this.panels.forEach((p) => {
      if (p.content) p.content.destroy();
    });
    this.buckets.forEach((bucket) => bucket.destroy());
    this.buckets.clear();
    this.panels.clear();
    this.nextBucketId = 1;
    this.nextPanelId = 1;
    this.triggerStateChange();
  }

  public refreshAllCharts(): void {
    this.panels.forEach((panel) => {
      if (panel.content instanceof DataVizDashboardContent) {
        panel.content.renderChart();
      } else if (panel.content instanceof D3ChartContent) {
        const bodyEl = panel.el?.querySelector<HTMLElement>('.vde-panel-body');
        if (bodyEl) panel.content.render(bodyEl);
      }
    });
  }

  public openBucketConfigModal(targetBucketId: number | null = null): void {
    if (!this.configModalEl) {
      this.buildConfigModalDOM();
    }
    const bucketSelect = document.getElementById(
      'vde-config-bucket-select'
    ) as HTMLSelectElement | null;
    if (!bucketSelect || this.buckets.size === 0) return;

    bucketSelect.innerHTML = '';
    this.buckets.forEach((bucket, id) => {
      const opt = document.createElement('option');
      opt.value = String(id);
      opt.textContent = `${bucket.name} (#${id})`;
      bucketSelect.appendChild(opt);
    });

    const activeId =
      targetBucketId && this.buckets.has(targetBucketId)
        ? targetBucketId
        : this.buckets.keys().next().value;
    if (activeId === undefined) return;

    bucketSelect.value = String(activeId);
    this.loadBucketFormValues(activeId);

    bucketSelect.onchange = (e) => {
      const selectedId = parseInt((e.target as HTMLSelectElement).value, 10);
      this.loadBucketFormValues(selectedId);
    };

    if (this.configModalEl) {
      const modalInstance = bootstrap.Modal.getOrCreateInstance(this.configModalEl);
      modalInstance.show();
    }
  }

  private loadBucketFormValues(bucketId: number): void {
    const bucket = this.buckets.get(bucketId);
    if (!bucket) return;
    const opts = bucket.options;
    (document.getElementById('vde-config-name') as HTMLInputElement).value = bucket.name || '';
    (document.getElementById('vde-config-column') as HTMLSelectElement).value = String(
      opts.column || 12
    );
    (document.getElementById('vde-config-cellheight') as HTMLInputElement).value = String(
      opts.cellHeight || 30
    );
    (document.getElementById('vde-config-margin') as HTMLInputElement).value = String(
      opts.margin ?? 6
    );
    (document.getElementById('vde-config-float') as HTMLInputElement).checked = Boolean(opts.float);
    (document.getElementById('vde-config-static') as HTMLInputElement).checked = Boolean(
      opts.staticGrid
    );
    (document.getElementById('vde-config-disable-drag') as HTMLInputElement).checked = Boolean(
      opts.disableDrag
    );
    (document.getElementById('vde-config-disable-resize') as HTMLInputElement).checked = Boolean(
      opts.disableResize
    );
    (document.getElementById('vde-config-animate') as HTMLInputElement).checked =
      opts.animate !== false;
  }

  private buildConfigModalDOM(): void {
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal fade';
    modalDiv.id = 'vde-gridstack-config-modal';
    modalDiv.tabIndex = -1;
    modalDiv.setAttribute('aria-hidden', 'true');

    modalDiv.innerHTML = `
<div class="modal-dialog modal-dialog-centered">
  <div class="modal-content bg-dark text-white border-secondary shadow-lg">
    <div class="modal-header border-secondary">
      <h5 class="modal-title font-mono text-warning fs-6">
        <i class="bi bi-sliders me-2"></i>Bucket Layout Settings
      </h5>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body font-mono" style="font-size: 12px;">
      <div class="mb-3">
        <label class="form-label text-secondary small mb-1">Target Bucket</label>
        <select id="vde-config-bucket-select" class="form-select form-select-sm bg-black text-warning border-secondary fw-bold"></select>
      </div>
      <div class="row g-2">
        <div class="col-12">
          <label class="form-label text-secondary small mb-1">Bucket Name</label>
          <input type="text" id="vde-config-name" class="form-control form-control-sm bg-dark text-white border-secondary">
        </div>
        <div class="col-4">
          <label class="form-label text-secondary small mb-1">Columns</label>
          <select id="vde-config-column" class="form-select form-select-sm bg-dark text-white border-secondary">
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="6">6</option>
            <option value="8">8</option>
            <option value="12">12</option>
          </select>
        </div>
        <div class="col-4">
          <label class="form-label text-secondary small mb-1">Row Height (px)</label>
          <input type="number" id="vde-config-cellheight" class="form-control form-control-sm bg-dark text-white border-secondary" min="15" max="150" step="5">
        </div>
        <div class="col-4">
          <label class="form-label text-secondary small mb-1">Gap (px)</label>
          <input type="number" id="vde-config-margin" class="form-control form-control-sm bg-dark text-white border-secondary" min="0" max="30">
        </div>
      </div>
      <hr class="border-secondary my-3">
      <div class="row g-2">
        <div class="col-6">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="vde-config-float">
            <label class="form-check-label" for="vde-config-float">Float Mode</label>
          </div>
        </div>
        <div class="col-6">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="vde-config-static">
            <label class="form-check-label" for="vde-config-static">Lock Grid</label>
          </div>
        </div>
        <div class="col-6">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="vde-config-disable-drag">
            <label class="form-check-label" for="vde-config-disable-drag">Disable Drag</label>
          </div>
        </div>
        <div class="col-6">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="vde-config-disable-resize">
            <label class="form-check-label" for="vde-config-disable-resize">Disable Resize</label>
          </div>
        </div>
        <div class="col-6">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="vde-config-animate">
            <label class="form-check-label" for="vde-config-animate">Animate Changes</label>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer border-secondary">
      <button type="button" class="btn btn-sm btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
      <button type="button" class="btn btn-sm btn-warning" id="vde-config-apply-btn">Apply</button>
    </div>
  </div>
</div>`;

    document.body.appendChild(modalDiv);
    this.configModalEl = modalDiv;

    document.getElementById('vde-config-apply-btn')?.addEventListener('click', () => {
      const bucketSelect = document.getElementById('vde-config-bucket-select') as HTMLSelectElement;
      const bucketId = parseInt(bucketSelect.value, 10);
      const bucket = this.buckets.get(bucketId);
      if (bucket) {
        bucket.updateOptions({
          name: (document.getElementById('vde-config-name') as HTMLInputElement).value.trim(),
          column: parseInt((document.getElementById('vde-config-column') as HTMLSelectElement).value, 10),
          cellHeight: parseInt((document.getElementById('vde-config-cellheight') as HTMLInputElement).value, 10),
          margin: parseInt((document.getElementById('vde-config-margin') as HTMLInputElement).value, 10),
          float: (document.getElementById('vde-config-float') as HTMLInputElement).checked,
          staticGrid: (document.getElementById('vde-config-static') as HTMLInputElement).checked,
          disableDrag: (document.getElementById('vde-config-disable-drag') as HTMLInputElement).checked,
          disableResize: (document.getElementById('vde-config-disable-resize') as HTMLInputElement).checked,
          animate: (document.getElementById('vde-config-animate') as HTMLInputElement).checked,
        });
        const bsModal = bootstrap.Modal.getInstance(modalDiv);
        if (bsModal) bsModal.hide();
      }
    });
  }

  public exportVDEState() {
    return {
      vde_version: '0.2.0-OOP-D3Suite',
      timestamp: new Date().toISOString(),
      theme: this.currentTheme,
      buckets: Array.from(this.buckets.values()).map((b) => ({
        id: b.id,
        name: b.name,
        options: b.options,
        panels: Array.from(this.panels.values())
          .filter((p) => p.bucketId === b.id)
          .map((p) => ({
            id: p.id,
            x: p.x,
            y: p.y,
            w: p.w,
            h: p.h,
            title: p.title,
            contentType: p.content ? p.content.constructor.name : null,
            config: p.content ? p.content.serializeState() : {},
          })),
      })),
    };
  }

  public exportVDE(): string {
    return JSON.stringify(this.exportVDEState(), null, 2);
  }

  public importVDE(jsonPayload: string | Record<string, unknown>): boolean {
    try {
      const payload = (
        typeof jsonPayload === 'string' ? JSON.parse(jsonPayload) : jsonPayload
      ) as {
        theme?: VisualStyleState;
        buckets?: Array<{
          id: number;
          name: string;
          options?: GridBucketOptions;
          panels?: Array<{
            id: number;
            x: number;
            y: number;
            w: number;
            h: number;
            title: string;
            contentType: string;
            config?: Record<string, unknown>;
          }>;
        }>;
      };

      if (!payload || !Array.isArray(payload.buckets)) {
        return false;
      }

      this.clearAll();

      if (payload.theme) {
        this.currentTheme = payload.theme;
        new VisualStyleMemento(payload.theme).applyToGlobalUI(document);
      }

      let maxBucketId = 0;
      let maxPanelId = 0;

      payload.buckets.forEach((bData) => {
        const bucket = this.createBucket(bData.name, bData.options);
        if (bData.id > maxBucketId) maxBucketId = bData.id;

        if (bucket && Array.isArray(bData.panels)) {
          bData.panels.forEach((pData) => {
            if (pData.id > maxPanelId) maxPanelId = pData.id;
            const cConfig = pData.config || {};
            let contentInst: IPanelContent | null = null;

            switch (pData.contentType) {
              case 'RichTextContent':
                contentInst = new RichTextContent(cConfig);
                break;
              case 'CodeSnippetContent':
                contentInst = new CodeSnippetContent(cConfig);
                break;
              case 'D3ChartContent':
                contentInst = new D3ChartContent(cConfig);
                break;
              case 'DataVizDashboardContent':
                contentInst = new DataVizDashboardContent({
                  state: (cConfig.state as Record<string, unknown>) || cConfig,
                });
                break;
              case 'OllamaInterfaceContent':
                contentInst = new OllamaInterfaceContent({
                  state: (cConfig.state as Record<string, unknown>) || cConfig,
                });
                break;
              case 'ObsidianCLIContent':
                contentInst = new ObsidianCLIContent({
                  state: (cConfig.state as Record<string, unknown>) || cConfig,
                });
                break;
              default:
                break;
            }

            const panel = new BaseGridPanel(
              pData.id,
              pData.x,
              pData.y,
              pData.w,
              pData.h,
              pData.title,
              contentInst
            );
            this.registerAndPlacePanel(panel, bucket.id);
          });
        }
      });

      if (maxBucketId >= this.nextBucketId) this.nextBucketId = maxBucketId + 1;
      if (maxPanelId >= this.nextPanelId) this.nextPanelId = maxPanelId + 1;

      this.triggerStateChange();
      return true;
    } catch (err) {
      console.error('[VDE Import Exception]', err);
      return false;
    }
  }

  public triggerStateChange(): void {
    const state = this.exportVDE();
    this.notify('stateChange', { state });
    if (typeof this.stateChangeListener === 'function') {
      this.stateChangeListener(state);
    }
  }
}

export const IntegratedGridManager = new IntegratedGridManagerClass();

export function registerVDEGlobals(): void {
  const w = window as unknown as Record<string, unknown>;
  w.IntegratedGridManager = IntegratedGridManager;
  w.IntegratedGridManagerClass = IntegratedGridManagerClass;
  w.PanelBuilder = PanelBuilder;
  w.PanelFactory = PanelFactory;
  w.BaseGridPanel = BaseGridPanel;
  w.GridBucket = GridBucket;
  w.WorkspaceSubject = WorkspaceSubject;
  w.VisualStyleMemento = VisualStyleMemento;
}
