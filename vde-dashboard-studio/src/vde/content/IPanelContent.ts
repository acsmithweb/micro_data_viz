export interface PanelRef {
  id: number;
  bucketId: number | null;
  title: string;
}

export abstract class IPanelContent {
  public config: Record<string, unknown>;
  public panel: PanelRef | null = null;

  constructor(config: Record<string, unknown> = {}) {
    this.config = config;
  }

  public abstract render(containerElement: HTMLElement): void;

  public update(_data?: unknown): void {}

  public resize(_width: number, _height: number): void {}

  public destroy(): void {}

  public abstract clone(): IPanelContent;

  public serializeState(): Record<string, unknown> {
    return JSON.parse(JSON.stringify(this.config));
  }
}

export function notifyGridStateChange(): void {
  const mgr = (window as unknown as { IntegratedGridManager?: { triggerStateChange: () => void } })
    .IntegratedGridManager;
  if (mgr && typeof mgr.triggerStateChange === 'function') {
    mgr.triggerStateChange();
  }
}

export function getActiveThemeColors() {
  const mgr = (
    window as unknown as {
      IntegratedGridManager?: {
        currentTheme?: {
          accentColor?: string;
          chartPalette?: string[];
          textColor?: string;
          background?: string;
          borderColor?: string;
        };
      };
    }
  ).IntegratedGridManager;

  if (mgr && mgr.currentTheme) {
    const t = mgr.currentTheme;
    return {
      color: t.accentColor ?? null,
      chartPalette: t.chartPalette ?? null,
      textColor: t.textColor ?? null,
      backgroundColor: t.background ?? null,
      borderColor: t.borderColor ?? null,
    };
  }
  return {};
}
