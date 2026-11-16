export interface VisualStyleState {
  background?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  accentColor?: string;
  chartPalette?: string[];
}

export const DEFAULT_THEME_STATE: Required<Omit<VisualStyleState, 'backgroundColor'>> = {
  background: '#121316',
  borderColor: '#2a2d35',
  textColor: '#e2e4e9',
  accentColor: '#ff7b00',
  chartPalette: ['#89b4fa', '#f5c2e7', '#a6e3a1', '#f9e2af', '#cba6f7'],
};

export class VisualStyleMemento {
  private _background: string;
  private _borderColor: string;
  private _textColor: string;
  private _accentColor: string;
  private _chartPalette: string[];

  constructor({
    background,
    backgroundColor,
    borderColor = DEFAULT_THEME_STATE.borderColor,
    textColor = DEFAULT_THEME_STATE.textColor,
    accentColor = DEFAULT_THEME_STATE.accentColor,
    chartPalette = DEFAULT_THEME_STATE.chartPalette,
  }: VisualStyleState = {}) {
    this._background = background || backgroundColor || DEFAULT_THEME_STATE.background;
    this._borderColor = borderColor;
    this._textColor = textColor;
    this._accentColor = accentColor;
    this._chartPalette = Array.isArray(chartPalette)
      ? [...chartPalette]
      : [...DEFAULT_THEME_STATE.chartPalette];
  }

  get background(): string {
    return this._background;
  }
  get borderColor(): string {
    return this._borderColor;
  }
  get textColor(): string {
    return this._textColor;
  }
  get accentColor(): string {
    return this._accentColor;
  }
  get chartPalette(): string[] {
    return [...this._chartPalette];
  }

  public serialize() {
    return {
      background: this._background,
      borderColor: this._borderColor,
      textColor: this._textColor,
      accentColor: this._accentColor,
      chartPalette: [...this._chartPalette],
    };
  }

  public adjustColor(color: string, percent: number): string {
    const clean = color.replace('#', '');
    if (clean.length !== 6) return color;
    const num = parseInt(clean, 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  }

  public static deserialize(jsonState?: VisualStyleState | null): VisualStyleMemento {
    if (!jsonState) return new VisualStyleMemento();
    return new VisualStyleMemento({
      background: typeof jsonState.background === 'string' ? jsonState.background : undefined,
      borderColor: typeof jsonState.borderColor === 'string' ? jsonState.borderColor : undefined,
      textColor: typeof jsonState.textColor === 'string' ? jsonState.textColor : undefined,
      accentColor: typeof jsonState.accentColor === 'string' ? jsonState.accentColor : undefined,
      chartPalette: Array.isArray(jsonState.chartPalette) ? jsonState.chartPalette : undefined,
    });
  }

  public applyToDOMElement(element: HTMLElement | null): void {
    if (!element) return;
    element.style.setProperty('--panel-bg', this.adjustColor(this._background, 4));
    element.style.setProperty('--panel-border', this._borderColor);
    element.style.setProperty('--panel-text', this._textColor);
    element.style.backgroundColor = this.adjustColor(this._background, 4);
    element.style.borderColor = this._borderColor;
    element.style.color = this._textColor;
  }

  public applyToGlobalUI(doc: Document = document): void {
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

    doc.querySelectorAll<HTMLElement>('.grid-stack-item-content').forEach((el) => {
      this.applyToDOMElement(el);
    });
  }
}
