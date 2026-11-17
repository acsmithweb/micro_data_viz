/**
 * vde-service-registry.js
 * Generic Service Registry & UI Guard Framework for local services (Ollama, Obsidian CLI).
 */

class ServiceGuard {
    constructor({ adapter, button, labels = {} }) {
        this.adapter = adapter;
        this.button = typeof button === 'string' ? document.querySelector(button) : button;
        this.labels = Object.assign({
            active: (name) => `+ Add ${name}`,
            disabled: (name) => `+ Add ${name} (Disabled)`,
            offline: (name) => `+ Add ${name} (Offline)`
        }, labels);

        if (this.button && this.adapter) {
            this.init();
        }
    }

    init() {
        if (typeof this.adapter.onStatusChange === 'function') {
            this.adapter.onStatusChange((status) => this.render(status));
        }
        this.updateState();
    }

    async updateState() {
        const isOnline = await this.adapter.checkHealth();
        const enabled = typeof this.adapter.isEnabled === 'function' ? this.adapter.isEnabled() : true;
        this.render({ isOnline, enabled });
    }

    render(state) {
        if (!this.button) return;
        const { isOnline, enabled } = state;
        const serviceName = typeof this.adapter.getName === 'function'
            ? this.adapter.getName()
            : "Service";

        const isAvailable = isOnline && enabled !== false;
        const labelEl = this.button.querySelector('.service-btn-label') || this.button;

        if (isAvailable) {
            this.button.classList.remove('vde-btn-offline');
            this.button.classList.add('vde-btn-active');
            labelEl.textContent = typeof this.labels.active === 'function'
                ? this.labels.active(serviceName)
                : this.labels.active;
            this.button.title = `${serviceName} service is connected and available.`;
        } else if (enabled === false) {
            this.button.classList.add('vde-btn-offline');
            this.button.classList.remove('vde-btn-active');
            labelEl.textContent = typeof this.labels.disabled === 'function'
                ? this.labels.disabled(serviceName)
                : this.labels.disabled;
            this.button.title = `${serviceName} module is disabled.`;
        } else {
            this.button.classList.add('vde-btn-offline');
            this.button.classList.remove('vde-btn-active');
            labelEl.textContent = typeof this.labels.offline === 'function'
                ? this.labels.offline(serviceName)
                : this.labels.offline;
            this.button.title = `${serviceName} local endpoint is offline (widget can still be opened for URI/command building).`;
        }
    }
}

class ServicePanelRegistry {
    constructor(defaultPollIntervalMs = 15000) {
        this.services = new Map();
        this.pollIntervalMs = defaultPollIntervalMs;
        this.pollTimer = null;
    }

    registerService(serviceId, adapter) {
        if (!serviceId || !adapter) {
            throw new Error('[ServiceRegistry] Both serviceId and adapter instance are required.');
        }
        this.services.set(serviceId, { adapter, guards: [] });
        return this;
    }

    bindButton(serviceId, buttonElement, labelsConfig = {}) {
        const serviceEntry = this.services.get(serviceId);
        if (!serviceEntry) return null;

        const guard = new ServiceGuard({
            adapter: serviceEntry.adapter,
            button: buttonElement,
            labels: labelsConfig
        });
        serviceEntry.guards.push(guard);
        return guard;
    }

    async checkAllServices() {
        const checkPromises = Array.from(this.services.values()).map(async (entry) => {
            const isOnline = await entry.adapter.checkHealth();
            const enabled = typeof entry.adapter.isEnabled === 'function'
                ? entry.adapter.isEnabled()
                : true;
            entry.guards.forEach(guard => guard.render({ isOnline, enabled }));
        });
        await Promise.all(checkPromises);
    }

    startPolling(intervalMs) {
        if (intervalMs) this.pollIntervalMs = intervalMs;
        this.stopPolling();
        this.checkAllServices();
        if (this.pollIntervalMs > 0) {
            this.pollTimer = setInterval(() => this.checkAllServices(), this.pollIntervalMs);
        }
    }

    stopPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }
}

window.ServiceGuard = ServiceGuard;
window.ServicePanelRegistry = ServicePanelRegistry;
