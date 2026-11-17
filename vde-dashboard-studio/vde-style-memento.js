/**
 * vde-style-memento.js
 * Captures, serializes, and applies visual customization states across the UI.
 */

const DEFAULT_THEME_STATE = {
    background: '#121316',
    textColor: '#e2e4e9',
    borderColor: '#2a2d35',
    accentColor: '#ff7b00',
    chartPalette: ['#89b4fa', '#f5c2e7', '#a6e3a1', '#f9e2af', '#cba6f7']
};

class VisualStyleMemento {
    constructor({
        background,
        backgroundColor,
        borderColor = DEFAULT_THEME_STATE.borderColor,
        textColor = DEFAULT_THEME_STATE.textColor,
        accentColor = DEFAULT_THEME_STATE.accentColor,
        chartPalette = DEFAULT_THEME_STATE.chartPalette
    } = {}) {
        this._background = background || backgroundColor || DEFAULT_THEME_STATE.background;
        this._borderColor = borderColor;
        this._textColor = textColor;
        this._accentColor = accentColor;
        this._chartPalette = Array.isArray(chartPalette)
            ? [...chartPalette]
            : [...DEFAULT_THEME_STATE.chartPalette];
    }

    get background() { return this._background; }
    get borderColor() { return this._borderColor; }
    get textColor() { return this._textColor; }
    get accentColor() { return this._accentColor; }
    get chartPalette() { return [...this._chartPalette]; }

    serialize() {
        return {
            background: this._background,
            borderColor: this._borderColor,
            textColor: this._textColor,
            accentColor: this._accentColor,
            chartPalette: [...this._chartPalette]
        };
    }

    adjustColor(color, percent) {
        const clean = String(color || '').replace('#', '');
        if (clean.length !== 6) return color;
        const num = parseInt(clean, 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, Math.max(0, (num >> 16) + amt));
        const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
        const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    static deserialize(jsonState) {
        if (!jsonState) return new VisualStyleMemento();
        return new VisualStyleMemento({
            background: typeof jsonState.background === 'string' ? jsonState.background : undefined,
            borderColor: typeof jsonState.borderColor === 'string' ? jsonState.borderColor : undefined,
            textColor: typeof jsonState.textColor === 'string' ? jsonState.textColor : undefined,
            accentColor: typeof jsonState.accentColor === 'string' ? jsonState.accentColor : undefined,
            chartPalette: Array.isArray(jsonState.chartPalette) ? jsonState.chartPalette : undefined
        });
    }

    applyToDOMElement(element) {
        if (!element || !(element instanceof HTMLElement)) return;
        const customBg = element.dataset && element.dataset.customBg ? element.dataset.customBg : null;
        const panelBg = customBg || this.adjustColor(this._background, 4);
        element.style.setProperty('--panel-bg', panelBg);
        element.style.setProperty('--panel-border', this._borderColor);
        element.style.setProperty('--panel-text', this._textColor);
        element.style.backgroundColor = panelBg;
        element.style.borderColor = this._borderColor;
        element.style.color = this._textColor;
    }

    applyToGlobalUI(doc = document) {
        const root = doc.documentElement;
        const surfaceBg = this.adjustColor(this._background, 3);
        const panelBg = this.adjustColor(this._background, 5);

        root.style.setProperty('--global-bg', this._background);
        root.style.setProperty('--global-surface', surfaceBg);
        root.style.setProperty('--global-panel', panelBg);
        root.style.setProperty('--global-border', this._borderColor);
        root.style.setProperty('--global-text', this._textColor);
        root.style.setProperty('--global-accent', this._accentColor);
        root.style.setProperty('--global-accent-dark', this.adjustColor(this._accentColor, -14));

        doc.querySelectorAll('.grid-stack-item-content').forEach(el => {
            this.applyToDOMElement(el);
        });
    }
}

class VisualCustomizationModule {
    constructor(workspaceSubject) {
        if (!workspaceSubject) {
            throw new Error("VisualCustomizationModule requires a valid WorkspaceSubject instance.");
        }
        this.workspaceSubject = workspaceSubject;
    }

    updatePanelStyle(panel, rawStyleState) {
        if (!panel) return;
        const memento = new VisualStyleMemento(rawStyleState);
        panel.visualState = memento;
        if (panel.el) {
            memento.applyToDOMElement(panel.el.querySelector('.grid-stack-item-content') || panel.el);
        }
        this.workspaceSubject.notify('style-change', memento.serialize());
    }
}

window.DEFAULT_THEME_STATE = DEFAULT_THEME_STATE;
window.VisualStyleMemento = VisualStyleMemento;
window.VisualCustomizationModule = VisualCustomizationModule;
