/**
 * vde-app.js
 * Standalone Browser Application Controller for VDE Dashboard Studio.
 * Zero Node.js or build runtime required.
 */

(function () {
    'use strict';

    const THEME_PRESETS = {
        amber: {
            label: 'Amber Slate',
            background: '#121316',
            textColor: '#e2e4e9',
            borderColor: '#2a2d35',
            accentColor: '#ff7b00',
            chartPalette: ['#89b4fa', '#f5c2e7', '#a6e3a1', '#f9e2af', '#cba6f7']
        },
        nordic: {
            label: 'Nordic Cobalt',
            background: '#0f172a',
            textColor: '#e2e8f0',
            borderColor: '#1e293b',
            accentColor: '#38bdf8',
            chartPalette: ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f472b6']
        },
        emerald: {
            label: 'Emerald Terminal',
            background: '#0c1412',
            textColor: '#d1fae5',
            borderColor: '#1f352e',
            accentColor: '#10b981',
            chartPalette: ['#10b981', '#34d399', '#6ee7b7', '#fcd34d', '#60a5fa']
        },
        rose: {
            label: 'Rose Graphite',
            background: '#161318',
            textColor: '#ece4f0',
            borderColor: '#312936',
            accentColor: '#f43f5e',
            chartPalette: ['#fb7185', '#c084fc', '#60a5fa', '#fbbf24', '#2dd4bf']
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        const manager = window.IntegratedGridManager;
        if (!manager) {
            console.error('Fatal: IntegratedGridManager is missing.');
            return;
        }

        manager.setContainer('#vde-workspace-canvas');

        // DOM References
        const sidebarEl = document.getElementById('control-sidebar');
        const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
        const statusNoticeEl = document.getElementById('vde-status-notice');
        const metricsEl = document.getElementById('workspace-metrics');
        const targetBucketSelect = document.getElementById('target-bucket-select');
        const jsonArea = document.getElementById('vde-json-io');

        // Modals
        const summonModalEl = document.getElementById('summonBucketModal');
        const galleryModalEl = document.getElementById('chartGalleryModal');
        const themeModalEl = document.getElementById('themeConfigModal');

        let noticeTimer = null;
        function showNotice(message, tone = 'info') {
            if (!statusNoticeEl) return;
            statusNoticeEl.textContent = message;
            statusNoticeEl.className = `vde-notice font-mono ${tone === 'danger' ? 'text-danger border-danger' : tone === 'success' ? 'text-success border-success' : 'text-warning border-warning'}`;
            statusNoticeEl.classList.remove('d-none');
            clearTimeout(noticeTimer);
            noticeTimer = setTimeout(() => {
                statusNoticeEl.classList.add('d-none');
            }, 3200);
        }

        function getSelectedBucketId() {
            if (!targetBucketSelect || !targetBucketSelect.value) return null;
            const parsed = parseInt(targetBucketSelect.value, 10);
            return isNaN(parsed) ? null : parsed;
        }

        function syncWorkspaceHeaderAndSelect() {
            if (metricsEl) {
                const bCount = manager.buckets.size;
                const pCount = manager.panels.size;
                metricsEl.textContent = `${bCount} ${bCount === 1 ? 'Bucket' : 'Buckets'} · ${pCount} ${pCount === 1 ? 'Panel' : 'Panels'}`;
            }

            if (targetBucketSelect) {
                const prev = targetBucketSelect.value;
                targetBucketSelect.innerHTML = '';
                if (manager.buckets.size === 0) {
                    const opt = document.createElement('option');
                    opt.value = '';
                    opt.textContent = 'No buckets';
                    targetBucketSelect.appendChild(opt);
                } else {
                    manager.buckets.forEach((bucket, id) => {
                        const opt = document.createElement('option');
                        opt.value = String(id);
                        opt.textContent = `${bucket.name} (#${id})`;
                        targetBucketSelect.appendChild(opt);
                    });
                    if (prev && manager.buckets.has(parseInt(prev, 10))) {
                        targetBucketSelect.value = prev;
                    }
                }
            }
        }

        manager.stateChangeListener = (jsonState) => {
            if (jsonArea) jsonArea.value = jsonState;
            syncWorkspaceHeaderAndSelect();
        };

        // Sidebar Collapse Toggle
        if (sidebarToggleBtn && sidebarEl) {
            sidebarToggleBtn.addEventListener('click', () => {
                sidebarEl.classList.toggle('collapsed');
                const isCollapsed = sidebarEl.classList.contains('collapsed');
                sidebarToggleBtn.setAttribute('aria-expanded', String(!isCollapsed));
                setTimeout(() => {
                    manager.buckets.forEach(bucket => bucket.notifyAllPanelsResize());
                }, 220);
            });
        }

        // Service Registry for Ollama & Obsidian
        if (window.ServicePanelRegistry) {
            const registry = new window.ServicePanelRegistry(30000);
            if (window.OllamaAdapter) {
                registry.registerService('ollama', new window.OllamaAdapter());
                const ollamaBtn = document.getElementById('add-ollama-btn');
                if (ollamaBtn) {
                    registry.bindButton('ollama', ollamaBtn, {
                        active: () => 'Add Ollama AI',
                        offline: () => 'Add Ollama AI (Local Offline)',
                        disabled: () => 'Add Ollama AI (Disabled)'
                    });
                }
            }
            if (window.ObsidianAdapter) {
                registry.registerService('obsidian', new window.ObsidianAdapter());
                const obsidianBtn = document.getElementById('add-obsidian-btn');
                if (obsidianBtn) {
                    registry.bindButton('obsidian', obsidianBtn, {
                        active: () => 'Add Obsidian CLI',
                        offline: () => 'Add Obsidian CLI (URI Ready)',
                        disabled: () => 'Add Obsidian CLI (Disabled)'
                    });
                }
            }
            registry.checkAllServices();
            window.vdeServiceRegistry = registry;
        }

        // Summon Bucket Modal Controls
        const openBucketModal = () => {
            if (summonModalEl) bootstrap.Modal.getOrCreateInstance(summonModalEl).show();
        };
        document.getElementById('summon-bucket-btn')?.addEventListener('click', openBucketModal);
        document.getElementById('topbar-add-bucket-btn')?.addEventListener('click', openBucketModal);

        document.getElementById('modal-create-bucket-btn')?.addEventListener('click', () => {
            const name = (document.getElementById('modal-bucket-name')?.value || '').trim() || 'Analytics Bucket';
            const cols = parseInt(document.getElementById('modal-bucket-cols')?.value || '12', 10) || 12;
            const cellHeight = parseInt(document.getElementById('modal-bucket-height')?.value || '30', 10) || 30;
            const margin = parseInt(document.getElementById('modal-bucket-margin')?.value || '6', 10);
            const floatMode = Boolean(document.getElementById('modal-bucket-float')?.checked);

            const bucket = manager.createBucket(name, {
                column: cols,
                cellHeight,
                margin: isNaN(margin) ? 6 : margin,
                float: floatMode
            });
            if (bucket && targetBucketSelect) {
                targetBucketSelect.value = String(bucket.id);
            }
            if (summonModalEl) bootstrap.Modal.getInstance(summonModalEl)?.hide();
            showNotice(`Created bucket "${name}"`, 'success');
        });

        // Sidebar Widget Action Buttons
        document.getElementById('add-dashboard-btn')?.addEventListener('click', () => {
            manager.addDashboardWidget(getSelectedBucketId());
            showNotice('Added Interactive Data Explorer panel');
        });

        document.getElementById('add-markdown-btn')?.addEventListener('click', () => {
            manager.addMarkdownWidget('', getSelectedBucketId());
            showNotice('Added Markdown Notes panel');
        });

        document.getElementById('add-code-btn')?.addEventListener('click', () => {
            manager.addCodeWidget('', getSelectedBucketId());
            showNotice('Added Code Snippet panel');
        });

        document.getElementById('add-html-btn')?.addEventListener('click', () => {
            manager.addHTMLWidget('', getSelectedBucketId());
            showNotice('Added HTML Renderer panel');
        });

        document.getElementById('add-ollama-btn')?.addEventListener('click', () => {
            manager.addOllamaWidget(getSelectedBucketId());
            showNotice('Added Ollama AI Console');
        });

        document.getElementById('add-obsidian-btn')?.addEventListener('click', () => {
            manager.addObsidianCLIWidget(getSelectedBucketId());
            showNotice('Added Obsidian CLI panel');
        });

        // Chart Gallery Modal (20 OOP D3.js Charts)
        let activeGalleryCategory = 'All';
        const galleryDatasetSelect = document.getElementById('gallery-dataset-select');
        const galleryTabsEl = document.getElementById('gallery-category-tabs');
        const galleryGridEl = document.getElementById('gallery-chart-grid');

        if (galleryDatasetSelect && window.VDE_SAMPLE_DATASETS) {
            galleryDatasetSelect.innerHTML = '<option value="">Auto-match dataset per chart</option>';
            window.VDE_SAMPLE_DATASETS.forEach(ds => {
                const opt = document.createElement('option');
                opt.value = ds.id;
                opt.textContent = ds.name;
                galleryDatasetSelect.appendChild(opt);
            });
        }

        function renderChartGallery() {
            const catalog = window.CHART_CATALOG || [];
            const categories = ['All', ...Array.from(new Set(catalog.map(c => c.category)))];

            if (galleryTabsEl) {
                galleryTabsEl.innerHTML = '';
                categories.forEach(cat => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = `btn btn-sm font-mono ${activeGalleryCategory === cat ? 'btn-warning text-dark fw-semibold' : 'btn-outline-secondary text-light'}`;
                    btn.style.fontSize = '11px';
                    btn.textContent = cat;
                    btn.onclick = () => {
                        activeGalleryCategory = cat;
                        renderChartGallery();
                    };
                    galleryTabsEl.appendChild(btn);
                });
            }

            if (galleryGridEl) {
                galleryGridEl.innerHTML = '';
                const items = activeGalleryCategory === 'All'
                    ? catalog
                    : catalog.filter(c => c.category === activeGalleryCategory);

                items.forEach(entry => {
                    const col = document.createElement('div');
                    col.className = 'col-12 col-sm-6 col-lg-4';

                    const card = document.createElement('button');
                    card.type = 'button';
                    card.className = 'vde-gallery-card w-100 h-100 text-start p-3 rounded border border-secondary d-flex flex-column justify-content-between gap-2';
                    card.innerHTML = `
                        <div class="d-flex align-items-center justify-content-between gap-2 w-100">
                            <span class="fw-semibold text-white d-flex align-items-center gap-2" style="font-size: 13px;">
                                <i class="bi ${entry.icon} text-warning"></i>
                                ${entry.type}
                            </span>
                            <span class="font-mono text-secondary" style="font-size: 10px;">${entry.category}</span>
                        </div>
                        <div class="text-secondary" style="font-size: 11.5px; line-height: 1.4;">${entry.description}</div>
                    `;
                    card.onclick = () => {
                        const selectedDsId = galleryDatasetSelect ? (galleryDatasetSelect.value || null) : null;
                        manager.addChartWidget(entry.type, getSelectedBucketId(), selectedDsId);
                        if (galleryModalEl) bootstrap.Modal.getInstance(galleryModalEl)?.hide();
                        showNotice(`Added ${entry.type} panel`, 'success');
                    };

                    col.appendChild(card);
                    galleryGridEl.appendChild(col);
                });
            }
        }

        const openGalleryModal = () => {
            renderChartGallery();
            if (galleryModalEl) bootstrap.Modal.getOrCreateInstance(galleryModalEl).show();
        };
        document.getElementById('open-chart-gallery-btn')?.addEventListener('click', openGalleryModal);

        // Theme & Palette Customizer Controller
        const bgPicker = document.getElementById('picker-bg');
        const textPicker = document.getElementById('picker-text');
        const borderPicker = document.getElementById('picker-border');
        const accentPicker = document.getElementById('picker-accent');
        const chartPickers = Array.from(document.querySelectorAll('.chart-picker'));
        const presetContainer = document.getElementById('theme-presets-container');

        function readThemeFromPickers() {
            const defaults = window.DEFAULT_THEME_STATE || THEME_PRESETS.amber;
            return {
                background: bgPicker ? bgPicker.value : defaults.background,
                textColor: textPicker ? textPicker.value : defaults.textColor,
                borderColor: borderPicker ? borderPicker.value : defaults.borderColor,
                accentColor: accentPicker ? accentPicker.value : defaults.accentColor,
                chartPalette: chartPickers.length ? chartPickers.map(p => p.value) : [...defaults.chartPalette]
            };
        }

        function setPickerValues(theme) {
            if (bgPicker) bgPicker.value = theme.background;
            if (textPicker) textPicker.value = theme.textColor;
            if (borderPicker) borderPicker.value = theme.borderColor;
            if (accentPicker) accentPicker.value = theme.accentColor;
            chartPickers.forEach((picker, idx) => {
                if (theme.chartPalette && theme.chartPalette[idx]) {
                    picker.value = theme.chartPalette[idx];
                }
            });
        }

        function applyThemeToWorkspace(themeData, refreshCharts = true) {
            if (!window.VisualStyleMemento) return;
            const memento = new window.VisualStyleMemento(themeData);
            memento.applyToGlobalUI(document);
            manager.currentTheme = memento.serialize();

            manager.panels.forEach(panel => {
                panel.visualState = memento;
                if (panel.el) {
                    const inner = panel.el.querySelector('.grid-stack-item-content');
                    if (inner) memento.applyToDOMElement(inner);
                }
                if (typeof panel.applyBackgroundStyle === 'function') {
                    panel.applyBackgroundStyle();
                }
            });

            if (refreshCharts) {
                manager.refreshAllCharts();
            }
            manager.notify('style-change', memento.serialize());
        }

        if (presetContainer) {
            presetContainer.innerHTML = '';
            Object.entries(THEME_PRESETS).forEach(([key, preset]) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-sm btn-outline-secondary d-flex align-items-center gap-2 font-mono';
                btn.style.fontSize = '11px';
                btn.innerHTML = `<span style="width:10px;height:10px;border-radius:2px;background:${preset.accentColor};display:inline-block;"></span>${preset.label}`;
                btn.onclick = () => {
                    setPickerValues(preset);
                    applyThemeToWorkspace(preset, true);
                    manager.triggerStateChange();
                };
                presetContainer.appendChild(btn);
            });
        }

        [bgPicker, textPicker, borderPicker, accentPicker, ...chartPickers].forEach(picker => {
            if (!picker) return;
            picker.addEventListener('input', () => applyThemeToWorkspace(readThemeFromPickers(), false));
            picker.addEventListener('change', () => {
                applyThemeToWorkspace(readThemeFromPickers(), true);
                manager.triggerStateChange();
            });
        });

        document.getElementById('btn-apply-theme')?.addEventListener('click', () => {
            applyThemeToWorkspace(readThemeFromPickers(), true);
            manager.triggerStateChange();
            showNotice('Theme applied across workspace', 'success');
        });

        document.getElementById('btn-reset-theme')?.addEventListener('click', () => {
            const def = window.DEFAULT_THEME_STATE || THEME_PRESETS.amber;
            setPickerValues(def);
            applyThemeToWorkspace(def, true);
            manager.triggerStateChange();
            showNotice('Theme reset to default');
        });

        document.getElementById('topbar-theme-btn')?.addEventListener('click', () => {
            if (themeModalEl) bootstrap.Modal.getOrCreateInstance(themeModalEl).show();
        });

        // Export / Download / Import / Two-step Clear Workspace
        document.getElementById('export-vde-btn')?.addEventListener('click', () => {
            const json = manager.exportVDE();
            if (jsonArea) jsonArea.value = json;
            try {
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `vde-workspace-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showNotice('Workspace JSON exported & downloaded', 'success');
            } catch (e) {
                showNotice('Workspace JSON updated in state box', 'success');
            }
        });

        document.getElementById('import-vde-btn')?.addEventListener('click', () => {
            const raw = jsonArea ? jsonArea.value.trim() : '';
            if (!raw) {
                showNotice('Paste a VDE JSON state payload first', 'danger');
                return;
            }
            try {
                const parsed = JSON.parse(raw);
                const ok = manager.importVDE(parsed);
                if (ok) {
                    if (parsed.theme) setPickerValues(parsed.theme);
                    showNotice('Workspace state imported cleanly', 'success');
                } else {
                    showNotice('Import failed: invalid buckets schema', 'danger');
                }
            } catch (err) {
                showNotice(`Invalid JSON: ${err.message}`, 'danger');
            }
        });

        const clearBtn = document.getElementById('clear-all-btn');
        let clearArmed = false;
        let clearResetTimer = null;
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (!clearArmed) {
                    clearArmed = true;
                    clearBtn.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>Confirm Clear?';
                    clearBtn.classList.add('btn-danger', 'text-white');
                    clearResetTimer = setTimeout(() => {
                        clearArmed = false;
                        clearBtn.innerHTML = '<i class="bi bi-trash3 me-1"></i>Clear Workspace';
                        clearBtn.classList.remove('btn-danger', 'text-white');
                    }, 4000);
                } else {
                    clearTimeout(clearResetTimer);
                    clearArmed = false;
                    clearBtn.innerHTML = '<i class="bi bi-trash3 me-1"></i>Clear Workspace';
                    clearBtn.classList.remove('btn-danger', 'text-white');
                    manager.clearAll();
                    showNotice('Workspace cleared');
                }
            });
        }

        // Boot Initial Standalone Workspace
        const primaryBucket = manager.createBucket('Primary Workspace', {
            column: 12,
            cellHeight: 30,
            margin: 6,
            float: false
        });

        if (primaryBucket) {
            // 1. Interactive Data Explorer
            const explorerPanel = window.PanelFactory.createDashboardPanel();
            explorerPanel.x = 0; explorerPanel.y = 0; explorerPanel.w = 12; explorerPanel.h = 12;
            manager.registerAndPlacePanel(explorerPanel, primaryBucket.id);

            // 2. OOP D3 Showcase: Box Plot (Distribution)
            const boxPanel = window.PanelFactory.createChartPanel('Box Plot', 'service-latency');
            boxPanel.x = 0; boxPanel.y = 12; boxPanel.w = 6; boxPanel.h = 10;
            manager.registerAndPlacePanel(boxPanel, primaryBucket.id);

            // 3. OOP D3 Showcase: Radar Chart (Polar Multi-Axis)
            const radarPanel = window.PanelFactory.createChartPanel('Radar Chart', 'capability-radar');
            radarPanel.x = 6; radarPanel.y = 12; radarPanel.w = 6; radarPanel.h = 10;
            manager.registerAndPlacePanel(radarPanel, primaryBucket.id);

            // 4. Restored Obsidian CLI Panel
            const obsidianPanel = window.PanelFactory.createObsidianCLIPanel();
            obsidianPanel.x = 0; obsidianPanel.y = 22; obsidianPanel.w = 6; obsidianPanel.h = 13;
            manager.registerAndPlacePanel(obsidianPanel, primaryBucket.id);

            // 5. Standalone Workspace Notes Panel
            const notesMarkdown = [
                '### Standalone Browser Workspace',
                'This VDE dashboard runs **100% browser-native** with zero Node.js or build dependencies. Open `index.html` directly or host on any static server.',
                '',
                '### Included Capabilities',
                '- **20 OOP D3.js Charts**: Bar, Horizontal Bar, Grouped Bar, Stacked Bar, Line, Area, Stacked Area, Scatter, Bubble, Histogram, Box Plot, Heatmap, Pie, Donut, Treemap, Funnel, Radar, Radial Bar, Word Cloud, and Table.',
                '- **Obsidian CLI & URI Builder**: Full command schema builder, dynamic parameter inputs, boolean flags, live CLI command & `obsidian://` URI preview, health probe, and execution history.',
                '- **GridStack Buckets**: Isolated drag-and-drop grid containers with live column, row-height, and lock controls.',
                '',
                '### Quick Tips',
                'Double-click this panel to edit Markdown, click **Split Sections** to digest headings into individual cards, or click **Browse 20 D3 Charts** in the sidebar to spawn any visualization.'
            ].join('\n');
            const mdPanel = window.PanelFactory.createMarkdownPanel(notesMarkdown);
            mdPanel.x = 6; mdPanel.y = 22; mdPanel.w = 6; mdPanel.h = 13;
            manager.registerAndPlacePanel(mdPanel, primaryBucket.id);
        }

        // Initial theme & UI sync
        setPickerValues(window.DEFAULT_THEME_STATE || THEME_PRESETS.amber);
        applyThemeToWorkspace(window.DEFAULT_THEME_STATE || THEME_PRESETS.amber, false);
        manager.triggerStateChange();
    });
})();
