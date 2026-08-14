/**
 * VisualStyleMemento Class
 * Captures, serializes, and applies visual customization states across the UI.
 */
class VisualStyleMemento {
    /**
     * @param {Object} state - The visual properties.
     */
    constructor({
        background,
        backgroundColor,
        borderColor = '#313244',
        textColor = '#cdd6f4',
        accentColor = '#ff7b00',
        chartPalette = ['#89b4fa', '#f5c2e7', '#a6e3a1', '#f9e2af', '#cba6f7']
    } = {}) {
        this._background = background || backgroundColor || '#1e1e2e';
        this._borderColor = borderColor;
        this._textColor = textColor;
        this._accentColor = accentColor;
        this._chartPalette = Array.isArray(chartPalette) ? [...chartPalette] : ['#89b4fa', '#f5c2e7', '#a6e3a1', '#f9e2af', '#cba6f7'];
    }

    // Getters
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
    
    applyToWidgetElement(element) {
        if (!element || !(element instanceof HTMLElement)) return;

        // Apply local scoped CSS variables
        element.style.setProperty('--widget-bg', this._background, 'important');
        element.style.setProperty('--widget-border', this._borderColor, 'important');
        element.style.setProperty('--widget-text', this._textColor, 'important');
        element.style.setProperty('--widget-accent', this._accentColor, 'important');

        // Apply direct element overrides
        element.style.backgroundColor = this._background;
        element.style.borderColor = this._borderColor;
        element.style.color = this._textColor;

        // Apply to child structural elements (header, body)
        const header = element.querySelector('.vde-panel-header');
        if (header) {
            header.style.color = this._accentColor;
            header.style.borderColor = this._borderColor;
        }
    }

    /**
     * Apply styles directly to a specific DOM element instance.
     */
    applyToDOMElement(element) {
        if (!element || !(element instanceof HTMLElement)) return;

        element.style.setProperty('--panel-bg', this._background, 'important');
        element.style.setProperty('--panel-border', this._borderColor, 'important');
        element.style.setProperty('--panel-text', this._textColor, 'important');

        element.style.backgroundColor = this._background;
        element.style.borderColor = this._borderColor;
        element.style.color = this._textColor;
    }

    /**
     * Globally overrides CSS across workspace, canvas, panels, and outer UI.
     */
    applyToGlobalUI(doc = document) {
        // Set CSS Root variables
        doc.documentElement.style.setProperty('--global-bg', this._background);
        doc.documentElement.style.setProperty('--global-border', this._borderColor);
        doc.documentElement.style.setProperty('--global-text', this._textColor);
        doc.documentElement.style.setProperty('--global-accent', this._accentColor);

        // Inject/Update dynamic CSS override tag in <head>
        let dynamicStyleTag = doc.getElementById('vde-dynamic-theme-override');
        if (!dynamicStyleTag) {
            dynamicStyleTag = doc.createElement('style');
            dynamicStyleTag.id = 'vde-dynamic-theme-override';
            doc.head.appendChild(dynamicStyleTag);
        }

        dynamicStyleTag.textContent = `
            /* 1. Global Background Targets (Canvas, Panels, Workspace) */
            body,
            #vde-workspace-canvas,
            .vde-workspace,
            .grid-stack,
            .grid-stack-item-content,
            .card,
            .vde-bucket-card,
            .vde-panel,
            #control-sidebar,
            .navbar,
            .modal-content,
            .dropdown-menu {
                background-color: ${this._background} !important;
            }

            /* 2. Global Text Targets */
            body, body *,
            .grid-stack-item-content *,
            .vde-bucket-card *,
            .card *,
            #control-sidebar *,
            .navbar *,
            .modal-content *,
            p, span, label, input, select, textarea, button, a {
                color: ${this._textColor} !important;
            }

            /* 3. Global Borders and Dividers */
            .navbar,
            #control-sidebar,
            .card,
            .vde-bucket-card,
            .grid-stack-item-content,
            .vde-panel,
            .modal-content,
            .modal-header,
            .modal-footer,
            hr,
            input,
            select,
            textarea {
                border-color: ${this._borderColor} !important;
            }

            /* 4. Accents & Section Headers */
            .vde-panel-header,
            .vde-bucket-header,
            .sidebar-header,
            .navbar-brand,
            .modal-title {
                color: ${this._accentColor} !important;
                border-bottom-color: ${this._borderColor} !important;
            }
        `;

        // Direct inline override on gridstack panels as extra layer
        doc.querySelectorAll(".grid-stack-item-content, .vde-bucket-card, .card").forEach(el => {
            this.applyToDOMElement(el);
        });
    }
}

class VisualCustomizationModule {
    constructor(workspaceSubject) {
        if (!workspaceSubject) {
            throw new Error("VisualCustomizationModule requires a valid WorkspaceSubject registry instance.");
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

        this.workspaceSubject.notify({
            type: 'PANEL_STYLE_MUTATED',
            panelId: panel.id,
            memento: memento.serialize()
        });
    }
}


// Ensure global scope binding
window.VisualStyleMemento = VisualStyleMemento;
window.VisualCustomizationModule = VisualCustomizationModule;