/**
 * vde-service-registry.js
 * Far Realm VDE - Generic Service Registry & UI Guard Framework
 *
 * Provides central health monitoring, module dynamic binding, and automated
 * button activation/deactivation for local services (Ollama, Obsidian CLI, etc.).
 */

class ServiceGuard {
    /**
     * @param {Object} config
     * @param {Object} config.adapter - Service adapter implementing IServiceAdapter interface
     * @param {HTMLElement|string} config.button - Target DOM element or CSS selector
     * @param {Object} [config.labels] - Dynamic label formatters
     */
    constructor({ adapter, button, labels = {} }) {
        this.adapter = adapter;
        this.button = typeof button === 'string' ? document.querySelector(button) : button;
        
        // Default text formatters for state transitions
        this.labels = Object.assign({
            active: (name) => `+ Add ${name}`,
            disabled: (name) => `+ Add ${name} (Disabled)`,
            offline: (name) => `+ Add ${name} (Offline)`
        }, labels);

        if (this.button && this.adapter) {
            this.init();
        }
    }

    /**
     * Bind state listeners and trigger initial state check
     */
    init() {
        if (typeof this.adapter.onStatusChange === 'function') {
            this.adapter.onStatusChange((status) => this.render(status));
        }
        this.updateState();
    }

    /**
     * Query service health and update element state
     */
    async updateState() {
        const isOnline = await this.adapter.checkHealth();
        const enabled = typeof this.adapter.isEnabled === 'function' ? this.adapter.isEnabled() : true;
        this.render({ isOnline, enabled });
    }

    /**
     * Synchronize DOM attributes with current service state
     * @param {Object} state 
     */
    render(state) {
        if (!this.button) return;

        const { isOnline, enabled } = state;
        const serviceName = typeof this.adapter.getName === 'function' 
            ? this.adapter.getName() 
            : "Service";

        const isAvailable = isOnline && enabled !== false;

        this.button.disabled = !isAvailable;

        if (isAvailable) {
            this.button.classList.remove('vde-btn-disabled');
            this.button.classList.add('vde-btn-active');
            this.button.innerText = typeof this.labels.active === 'function' 
                ? this.labels.active(serviceName) 
                : this.labels.active;
            this.button.title = `${serviceName} service is connected and available.`;
        } else if (!enabled) {
            this.button.classList.add('vde-btn-disabled');
            this.button.classList.remove('vde-btn-active');
            this.button.innerText = typeof this.labels.disabled === 'function' 
                ? this.labels.disabled(serviceName) 
                : this.labels.disabled;
            this.button.title = `${serviceName} module is explicitly disabled in settings.`;
        } else {
            this.button.classList.add('vde-btn-disabled');
            this.button.classList.remove('vde-btn-active');
            this.button.innerText = typeof this.labels.offline === 'function' 
                ? this.labels.offline(serviceName) 
                : this.labels.offline;
            this.button.title = `${serviceName} service endpoint is unreachable. Ensure the local service is running.`;
        }
    }
}

class ServicePanelRegistry {
    /**
     * @param {number} [defaultPollIntervalMs=10000] - Polling interval for health monitoring
     */
    constructor(defaultPollIntervalMs = 10000) {
        this.services = new Map(); // serviceId -> { adapter, guards: [] }
        this.pollIntervalMs = defaultPollIntervalMs;
        this.pollTimer = null;
    }

    /**
     * Register a service adapter instance
     * @param {string} serviceId - Unique service identifier ('ollama', 'obsidian', etc.)
     * @param {Object} adapter - Adapter instance implementing IServiceAdapter
     * @returns {ServicePanelRegistry}
     */
    registerService(serviceId, adapter) {
        if (!serviceId || !adapter) {
            throw new Error('[ServiceRegistry] Both serviceId and adapter instance are required.');
        }

        this.services.set(serviceId, {
            adapter: adapter,
            guards: []
        });

        return this;
    }

    /**
     * Bind a button element to a registered service
     * @param {string} serviceId - Target service identifier
     * @param {HTMLElement|string} buttonElement - Button DOM element or CSS selector
     * @param {Object} [labelsConfig] - Optional custom label formatters
     * @returns {ServiceGuard|null}
     */
    bindButton(serviceId, buttonElement, labelsConfig = {}) {
        const serviceEntry = this.services.get(serviceId);
        if (!serviceEntry) {
            console.warn(`[ServiceRegistry] Cannot bind UI button: service '${serviceId}' is not registered.`);
            return null;
        }

        const guard = new ServiceGuard({
            adapter: serviceEntry.adapter,
            button: buttonElement,
            labels: labelsConfig
        });

        serviceEntry.guards.push(guard);
        return guard;
    }

    /**
     * Execute health diagnostics across all registered services concurrently
     */
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

    /**
     * Start background health check polling
     * @param {number} [intervalMs] 
     */
    startPolling(intervalMs) {
        if (intervalMs) this.pollIntervalMs = intervalMs;
        this.stopPolling();

        // Run initial immediate health check
        this.checkAllServices();

        if (this.pollIntervalMs > 0) {
            this.pollTimer = setInterval(() => this.checkAllServices(), this.pollIntervalMs);
        }
    }

    /**
     * Stop background health check polling
     */
    stopPolling() {
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }
}

// Global namespace binding
window.ServiceGuard = ServiceGuard;
window.ServicePanelRegistry = ServicePanelRegistry;

console.log("[Far Realm VDE] vde-service-registry.js initialized.");