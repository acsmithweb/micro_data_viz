import { useEffect, useRef, useState } from 'react';
import { CHART_CATALOG, registerChartsGlobally } from './vde/charts';
import type { ChartCategory } from './vde/charts/VizChart';
import {
  IntegratedGridManager,
  registerVDEGlobals,
} from './vde/core/IntegratedGridManager';
import {
  VisualStyleMemento,
  DEFAULT_THEME_STATE,
  VisualStyleState,
} from './vde/memento/VisualStyleMemento';

interface BucketOption {
  id: number;
  name: string;
}

const CHART_CATEGORIES: Array<'All' | ChartCategory> = [
  'All',
  'Comparison',
  'Trend',
  'Distribution',
  'Composition',
  'Correlation',
  'Tabular',
];

export default function App() {
  const initializedRef = useRef(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [buckets, setBuckets] = useState<BucketOption[]>([]);
  const [targetBucketId, setTargetBucketId] = useState<string>('');
  const [panelCount, setPanelCount] = useState<number>(0);
  const [jsonState, setJsonState] = useState<string>('');
  const [statusNotice, setStatusNotice] = useState<{ text: string; tone: 'info' | 'error' } | null>(
    null
  );
  const [confirmClear, setConfirmClear] = useState(false);

  // Modals
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [bucketName, setBucketName] = useState('Analytics Workspace');
  const [bucketCols, setBucketCols] = useState(12);
  const [bucketCellHeight, setBucketCellHeight] = useState(30);
  const [bucketMargin, setBucketMargin] = useState(6);

  const [showChartGallery, setShowChartGallery] = useState(false);
  const [chartCategory, setChartCategory] = useState<'All' | ChartCategory>('All');

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [theme, setTheme] = useState<Required<Omit<VisualStyleState, 'backgroundColor'>>>({
    ...DEFAULT_THEME_STATE,
    chartPalette: [...DEFAULT_THEME_STATE.chartPalette],
  });

  const showNotice = (text: string, tone: 'info' | 'error' = 'info') => {
    setStatusNotice({ text, tone });
    window.setTimeout(() => {
      setStatusNotice((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  };

  const syncWorkspaceSnapshot = (stateStr?: string) => {
    const list: BucketOption[] = [];
    IntegratedGridManager.buckets.forEach((b, id) => {
      list.push({ id, name: b.name });
    });
    setBuckets(list);
    setPanelCount(IntegratedGridManager.panels.size);
    if (list.length > 0) {
      setTargetBucketId((prev) =>
        prev && list.some((b) => String(b.id) === prev) ? prev : String(list[0].id)
      );
    } else {
      setTargetBucketId('');
    }
    if (stateStr !== undefined) {
      setJsonState(stateStr);
    }
  };

  const applyTheme = (nextTheme: Required<Omit<VisualStyleState, 'backgroundColor'>>) => {
    setTheme(nextTheme);
    const memento = new VisualStyleMemento(nextTheme);
    memento.applyToGlobalUI(document);
    IntegratedGridManager.currentTheme = nextTheme;
    IntegratedGridManager.refreshAllCharts();
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    registerChartsGlobally();
    registerVDEGlobals();

    IntegratedGridManager.setContainer('#vde-workspace-canvas');
    IntegratedGridManager.stateChangeListener = (nextJson) => {
      syncWorkspaceSnapshot(nextJson);
    };

    const primary = IntegratedGridManager.createBucket('Primary Workspace', {
      column: 12,
      cellHeight: 30,
      margin: 6,
    });

    if (primary) {
      // Top full-width interactive CSV / sample Data Explorer
      const explorer = IntegratedGridManager.addDashboardWidget(primary.id);
      if (explorer) {
        explorer.w = 12;
        explorer.h = 13;
      }

      // Showcase newly implemented OOP D3.js charts right below
      const chartA = IntegratedGridManager.addChartWidget('Box Plot', primary.id, 'service-latency');
      if (chartA && primary.grid && chartA.el) {
        primary.grid.update(chartA.el, { x: 0, y: 13, w: 6, h: 10 });
      }
      const chartB = IntegratedGridManager.addChartWidget(
        'Radar Chart',
        primary.id,
        'capability-radar'
      );
      if (chartB && primary.grid && chartB.el) {
        primary.grid.update(chartB.el, { x: 6, y: 13, w: 6, h: 10 });
      }
    }

    applyTheme({
      ...DEFAULT_THEME_STATE,
      chartPalette: [...DEFAULT_THEME_STATE.chartPalette],
    });
    syncWorkspaceSnapshot(IntegratedGridManager.exportVDE());
  }, []);

  const selectedBucketIdNum = targetBucketId ? parseInt(targetBucketId, 10) : null;

  const handleCreateBucket = () => {
    IntegratedGridManager.createBucket(bucketName.trim() || 'New Workspace', {
      column: bucketCols,
      cellHeight: bucketCellHeight,
      margin: bucketMargin,
    });
    setShowBucketModal(false);
    showNotice(`Created bucket "${bucketName.trim() || 'New Workspace'}"`);
  };

  const handleImportJson = () => {
    if (!jsonState.trim()) return;
    const ok = IntegratedGridManager.importVDE(jsonState);
    if (ok) {
      if (IntegratedGridManager.currentTheme) {
        const t = IntegratedGridManager.currentTheme;
        setTheme({
          background: t.background || DEFAULT_THEME_STATE.background,
          borderColor: t.borderColor || DEFAULT_THEME_STATE.borderColor,
          textColor: t.textColor || DEFAULT_THEME_STATE.textColor,
          accentColor: t.accentColor || DEFAULT_THEME_STATE.accentColor,
          chartPalette: t.chartPalette || [...DEFAULT_THEME_STATE.chartPalette],
        });
      }
      showNotice('Workspace layout restored from JSON');
    } else {
      showNotice('Invalid workspace JSON payload', 'error');
    }
  };

  const handleExportDownload = () => {
    const exported = IntegratedGridManager.exportVDE();
    setJsonState(exported);
    const blob = new Blob([exported], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vde-workspace-state.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotice('Workspace JSON exported');
  };

  const filteredCatalog =
    chartCategory === 'All'
      ? CHART_CATALOG
      : CHART_CATALOG.filter((c) => c.category === chartCategory);

  return (
    <div className="vde-app-shell">
      {/* LEFT CONTROL SIDEBAR */}
      <aside id="control-sidebar" className={sidebarOpen ? '' : 'collapsed'}>
        <div className="sidebar-header">
          <h1>VDE Studio</h1>
          <span className="font-mono text-secondary" style={{ fontSize: '11px' }}>
            D3 · GridStack
          </span>
        </div>

        <div className="sidebar-content">
          <div className="vde-action-group">
            <button
              type="button"
              className="btn-sacred"
              onClick={() => setShowBucketModal(true)}
            >
              <i className="bi bi-folder-plus"></i>
              <span>New Bucket</span>
            </button>

            <div className="input-group input-group-sm">
              <span
                className="input-group-text bg-dark border-secondary text-secondary font-mono"
                style={{ fontSize: '11px' }}
              >
                Target
              </span>
              <select
                className="form-select bg-dark text-white border-secondary"
                style={{ fontSize: '12px' }}
                value={targetBucketId}
                onChange={(e) => setTargetBucketId(e.target.value)}
              >
                {buckets.length === 0 ? (
                  <option value="">No active buckets</option>
                ) : (
                  buckets.map((b) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.name} (#{b.id})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <hr className="border-secondary my-1" />

          <div
            className="text-secondary fw-semibold"
            style={{ fontSize: '11px', letterSpacing: '0.03em' }}
          >
            Visualization &amp; Content Widgets
          </div>

          <div className="vde-action-group">
            <button
              type="button"
              className="btn-secondary-vde"
              onClick={() => {
                IntegratedGridManager.addDashboardWidget(selectedBucketIdNum);
                showNotice('Added Interactive Data Explorer');
              }}
            >
              <i className="bi bi-bar-chart-line text-warning"></i>
              <span>Add Data Explorer</span>
            </button>

            <button
              type="button"
              className="btn-secondary-vde"
              onClick={() => setShowChartGallery(true)}
            >
              <i className="bi bi-grid-fill text-warning"></i>
              <span>Browse D3 Chart Suite (20)</span>
            </button>

            <button
              type="button"
              className="btn-secondary-vde"
              onClick={() => {
                IntegratedGridManager.addMarkdownWidget('', selectedBucketIdNum);
                showNotice('Added Markdown Notes');
              }}
            >
              <i className="bi bi-file-earmark-text text-warning"></i>
              <span>Add Markdown Notes</span>
            </button>

            <button
              type="button"
              className="btn-secondary-vde"
              onClick={() => {
                IntegratedGridManager.addCodeWidget('', selectedBucketIdNum);
                showNotice('Added Code Snippet');
              }}
            >
              <i className="bi bi-code-slash text-warning"></i>
              <span>Add Code Snippet</span>
            </button>

            <button
              type="button"
              className="btn-secondary-vde"
              onClick={() => {
                IntegratedGridManager.addOllamaWidget(selectedBucketIdNum);
                showNotice('Added Ollama AI Console');
              }}
            >
              <i className="bi bi-cpu text-warning"></i>
              <span>Add Ollama AI</span>
            </button>

            <button
              type="button"
              className="btn-secondary-vde"
              onClick={() => {
                IntegratedGridManager.addObsidianCLIWidget(selectedBucketIdNum);
                showNotice('Added Obsidian CLI');
              }}
            >
              <i className="bi bi-journal-code text-warning"></i>
              <span>Add Obsidian CLI</span>
            </button>
          </div>

          <hr className="border-secondary my-1" />

          <button
            type="button"
            className="btn-secondary-vde"
            onClick={() => setShowThemeModal(true)}
          >
            <i className="bi bi-palette text-warning"></i>
            <span>Theme &amp; Palette</span>
          </button>

          <div
            className="text-secondary fw-semibold mt-1"
            style={{ fontSize: '11px', letterSpacing: '0.03em' }}
          >
            Workspace JSON State
          </div>

          <textarea
            className="vde-state-area"
            value={jsonState}
            onChange={(e) => setJsonState(e.target.value)}
            placeholder="Workspace layout JSON..."
          />

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn-secondary-vde flex-fill justify-content-center"
              onClick={handleExportDownload}
            >
              <i className="bi bi-download"></i>
              <span>Export</span>
            </button>
            <button
              type="button"
              className="btn-secondary-vde flex-fill justify-content-center"
              style={{ borderColor: '#3b7a57', color: '#a6e3a1' }}
              onClick={handleImportJson}
            >
              <i className="bi bi-upload"></i>
              <span>Import</span>
            </button>
          </div>

          {!confirmClear ? (
            <button
              type="button"
              className="btn-secondary-vde justify-content-center"
              style={{ borderColor: '#7f2f2f', color: '#f38ba8' }}
              onClick={() => setConfirmClear(true)}
            >
              <i className="bi bi-trash3"></i>
              <span>Clear Workspace</span>
            </button>
          ) : (
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-sm btn-danger flex-fill"
                onClick={() => {
                  IntegratedGridManager.clearAll();
                  setConfirmClear(false);
                  showNotice('Workspace cleared');
                }}
              >
                Confirm Clear
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary flex-fill"
                onClick={() => setConfirmClear(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN WORKSPACE REGION */}
      <main className="vde-main-region">
        <header className="vde-topbar">
          <div className="d-flex align-items-center gap-3 min-w-0">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setSidebarOpen((s) => !s)}
              title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              <i className={`bi ${sidebarOpen ? 'bi-layout-sidebar' : 'bi-layout-sidebar-inset'}`}></i>
            </button>
            <div className="d-flex align-items-center gap-2 text-truncate" style={{ fontSize: '13px' }}>
              <span className="fw-semibold text-white">Workspace</span>
              <span className="text-secondary">/</span>
              <span className="font-mono text-secondary tabular-nums" style={{ fontSize: '12px' }}>
                {buckets.length} {buckets.length === 1 ? 'Bucket' : 'Buckets'} · {panelCount}{' '}
                {panelCount === 1 ? 'Panel' : 'Panels'}
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 shrink-0">
            {statusNotice && (
              <span
                className={`font-mono px-2 py-1 rounded ${
                  statusNotice.tone === 'error' ? 'text-danger' : 'text-info'
                }`}
                style={{ fontSize: '11px' }}
              >
                {statusNotice.text}
              </span>
            )}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary whitespace-nowrap"
              onClick={() => setShowThemeModal(true)}
            >
              <i className="bi bi-palette me-1"></i>Theme
            </button>
            <button
              type="button"
              className="btn-sacred py-1 px-3 whitespace-nowrap"
              style={{ fontSize: '12px' }}
              onClick={() => setShowChartGallery(true)}
            >
              <i className="bi bi-plus-lg"></i>
              <span>Add Chart</span>
            </button>
          </div>
        </header>

        <div id="vde-workspace-canvas" />
      </main>

      {/* SUMMON BUCKET MODAL */}
      {showBucketModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark border-secondary text-white shadow-lg">
              <div className="modal-header border-secondary">
                <h5 className="modal-title text-warning fs-6">
                  <i className="bi bi-folder-plus me-2"></i>New Workspace Bucket
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  onClick={() => setShowBucketModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label font-mono text-secondary small">Bucket Name</label>
                  <input
                    type="text"
                    className="form-control bg-dark text-white border-secondary"
                    value={bucketName}
                    onChange={(e) => setBucketName(e.target.value)}
                  />
                </div>
                <div className="row g-2">
                  <div className="col-4">
                    <label className="form-label font-mono text-secondary small">Columns</label>
                    <input
                      type="number"
                      className="form-control bg-dark text-white border-secondary"
                      value={bucketCols}
                      min={1}
                      max={12}
                      onChange={(e) => setBucketCols(Number(e.target.value) || 12)}
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label font-mono text-secondary small">Row Height (px)</label>
                    <input
                      type="number"
                      className="form-control bg-dark text-white border-secondary"
                      value={bucketCellHeight}
                      min={15}
                      max={150}
                      onChange={(e) => setBucketCellHeight(Number(e.target.value) || 30)}
                    />
                  </div>
                  <div className="col-4">
                    <label className="form-label font-mono text-secondary small">Gap (px)</label>
                    <input
                      type="number"
                      className="form-control bg-dark text-white border-secondary"
                      value={bucketMargin}
                      min={0}
                      max={30}
                      onChange={(e) => setBucketMargin(Number(e.target.value) || 6)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowBucketModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-warning"
                  onClick={handleCreateBucket}
                >
                  Create Bucket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OOP D3 CHART SUITE GALLERY MODAL */}
      {showChartGallery && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content bg-dark border-secondary text-white shadow-lg">
              <div className="modal-header border-secondary">
                <h5 className="modal-title text-warning fs-6">
                  <i className="bi bi-grid-fill me-2"></i>D3.js Chart Component Suite (20 Classes)
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  onClick={() => setShowChartGallery(false)}
                />
              </div>
              <div className="modal-body">
                <div className="d-flex flex-wrap gap-1 mb-3">
                  {CHART_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`btn btn-sm ${
                        chartCategory === cat ? 'btn-warning text-dark fw-semibold' : 'btn-outline-secondary'
                      }`}
                      style={{ fontSize: '12px' }}
                      onClick={() => setChartCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="row g-2">
                  {filteredCatalog.map((entry) => (
                    <div key={entry.type} className="col-12 col-md-6">
                      <button
                        type="button"
                        className="w-100 text-start p-3 rounded border border-secondary bg-black bg-opacity-25 d-flex align-items-start gap-3"
                        style={{ cursor: 'pointer', color: '#e2e4e9' }}
                        onClick={() => {
                          IntegratedGridManager.addChartWidget(entry.type, selectedBucketIdNum);
                          setShowChartGallery(false);
                          showNotice(`Added ${entry.type}`);
                        }}
                      >
                        <i className={`bi ${entry.icon} text-warning fs-5 mt-1`}></i>
                        <div className="min-w-0">
                          <div className="fw-semibold" style={{ fontSize: '13px' }}>
                            {entry.type}
                          </div>
                          <div className="text-secondary" style={{ fontSize: '11px' }}>
                            {entry.category} · {entry.description}
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer border-secondary">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowChartGallery(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* THEME CUSTOMIZER MODAL */}
      {showThemeModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark border-secondary text-white shadow-lg">
              <div className="modal-header border-secondary">
                <h5 className="modal-title text-warning fs-6">
                  <i className="bi bi-palette me-2"></i>Visual Style Customizer
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  aria-label="Close"
                  onClick={() => setShowThemeModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="text-secondary small fw-semibold mb-2">UI Base Palette</div>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label small">Canvas Background</label>
                    <input
                      type="color"
                      className="form-control form-control-color w-100"
                      value={theme.background}
                      onChange={(e) => applyTheme({ ...theme, background: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">Global Text</label>
                    <input
                      type="color"
                      className="form-control form-control-color w-100"
                      value={theme.textColor}
                      onChange={(e) => applyTheme({ ...theme, textColor: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">Borders &amp; Dividers</label>
                    <input
                      type="color"
                      className="form-control form-control-color w-100"
                      value={theme.borderColor}
                      onChange={(e) => applyTheme({ ...theme, borderColor: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small">Accent Color</label>
                    <input
                      type="color"
                      className="form-control form-control-color w-100"
                      value={theme.accentColor}
                      onChange={(e) => applyTheme({ ...theme, accentColor: e.target.value })}
                    />
                  </div>
                </div>

                <hr className="border-secondary" />
                <div className="text-secondary small fw-semibold mb-2">Data Chart Palette</div>
                <div className="d-flex justify-content-between gap-2">
                  {theme.chartPalette.map((hex, idx) => (
                    <input
                      key={idx}
                      type="color"
                      className="form-control form-control-color flex-fill"
                      value={hex}
                      onChange={(e) => {
                        const nextPalette = [...theme.chartPalette];
                        nextPalette[idx] = e.target.value;
                        applyTheme({ ...theme, chartPalette: nextPalette });
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="modal-footer border-secondary d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() =>
                    applyTheme({
                      ...DEFAULT_THEME_STATE,
                      chartPalette: [...DEFAULT_THEME_STATE.chartPalette],
                    })
                  }
                >
                  Reset Default
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-warning"
                  onClick={() => setShowThemeModal(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
