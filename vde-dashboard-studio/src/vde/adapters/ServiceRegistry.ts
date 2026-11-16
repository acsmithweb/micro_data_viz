export interface IServiceAdapter {
  getName(): string;
  checkHealth(): Promise<boolean>;
  isEnabled?: () => boolean;
  onStatusChange?: (cb: (status: { isOnline: boolean; enabled?: boolean }) => void) => void;
}

export class ServiceGuard {
  public adapter: IServiceAdapter;
  public button: HTMLButtonElement | null;
  public labels: {
    active: (name: string) => string;
    disabled: (name: string) => string;
    offline: (name: string) => string;
  };

  constructor({
    adapter,
    button,
    labels = {},
  }: {
    adapter: IServiceAdapter;
    button: HTMLButtonElement | string | null;
    labels?: Partial<{
      active: (name: string) => string;
      disabled: (name: string) => string;
      offline: (name: string) => string;
    }>;
  }) {
    this.adapter = adapter;
    this.button =
      typeof button === 'string'
        ? document.querySelector<HTMLButtonElement>(button)
        : button;

    this.labels = Object.assign(
      {
        active: (name: string) => `+ Add ${name}`,
        disabled: (name: string) => `+ Add ${name} (Disabled)`,
        offline: (name: string) => `+ Add ${name} (Offline)`,
      },
      labels
    );

    if (this.button && this.adapter) {
      this.init();
    }
  }

  public init(): void {
    if (typeof this.adapter.onStatusChange === 'function') {
      this.adapter.onStatusChange((status) => this.render(status));
    }
    void this.updateState();
  }

  public async updateState(): Promise<void> {
    const isOnline = await this.adapter.checkHealth();
    const enabled =
      typeof this.adapter.isEnabled === 'function' ? this.adapter.isEnabled() : true;
    this.render({ isOnline, enabled });
  }

  public render(state: { isOnline: boolean; enabled?: boolean }): void {
    if (!this.button) return;
    const { isOnline, enabled = true } = state;
    const serviceName = this.adapter.getName ? this.adapter.getName() : 'Service';
    const isAvailable = isOnline && enabled;

    this.button.disabled = !isAvailable;
    if (isAvailable) {
      this.button.classList.remove('vde-btn-disabled');
      this.button.classList.add('vde-btn-active');
      this.button.textContent = this.labels.active(serviceName);
    } else if (!enabled) {
      this.button.classList.add('vde-btn-disabled');
      this.button.classList.remove('vde-btn-active');
      this.button.textContent = this.labels.disabled(serviceName);
    } else {
      this.button.classList.add('vde-btn-disabled');
      this.button.classList.remove('vde-btn-active');
      this.button.textContent = this.labels.offline(serviceName);
    }
  }
}

export class ServicePanelRegistry {
  private services = new Map<string, { adapter: IServiceAdapter; guards: ServiceGuard[] }>();
  private pollIntervalMs: number;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(defaultPollIntervalMs = 15000) {
    this.pollIntervalMs = defaultPollIntervalMs;
  }

  public registerService(serviceId: string, adapter: IServiceAdapter): this {
    this.services.set(serviceId, { adapter, guards: [] });
    return this;
  }

  public bindButton(
    serviceId: string,
    buttonElement: HTMLButtonElement | string | null,
    labelsConfig = {}
  ): ServiceGuard | null {
    const entry = this.services.get(serviceId);
    if (!entry) return null;
    const guard = new ServiceGuard({
      adapter: entry.adapter,
      button: buttonElement,
      labels: labelsConfig,
    });
    entry.guards.push(guard);
    return guard;
  }

  public async checkAllServices(): Promise<void> {
    await Promise.all(
      Array.from(this.services.values()).map(async (entry) => {
        const isOnline = await entry.adapter.checkHealth();
        const enabled =
          typeof entry.adapter.isEnabled === 'function' ? entry.adapter.isEnabled() : true;
        entry.guards.forEach((guard) => guard.render({ isOnline, enabled }));
      })
    );
  }

  public startPolling(intervalMs?: number): void {
    if (intervalMs) this.pollIntervalMs = intervalMs;
    this.stopPolling();
    void this.checkAllServices();
    if (this.pollIntervalMs > 0) {
      this.pollTimer = setInterval(() => void this.checkAllServices(), this.pollIntervalMs);
    }
  }

  public stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
