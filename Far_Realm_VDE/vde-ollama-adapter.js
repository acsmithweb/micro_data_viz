/**
 * vde-ollama-adapter.js
 * Far Realm VDE - Modular Ollama AI Interface Adapter
 *
 * Implements lifecycle control (enable/disable), observer pattern for UI synchronization,
 * health diagnostics, and compliance with the generic IServiceAdapter interface.
 */

class ModuleDisabledError extends Error {
    constructor(moduleName = "Ollama AI Interface") {
        super(`[VDE Module Control] The ${moduleName} module is currently disabled.`);
        this.name = "ModuleDisabledError";
    }
}

class OllamaAdapter {
    /**
     * @param {Object|string} [config] - Base URL string or configuration object
     */
    constructor(config = {}) {
        if (typeof config === 'string') {
            this.baseUrl = config;
            this.enabled = true;
        } else {
            this.baseUrl = config.baseUrl || 'http://localhost:11434';
            this.enabled = config.enabled !== undefined ? Boolean(config.enabled) : true;
        }

        this.conversationHistory = [];
        this.isOnline = false;
        this.statusListeners = new Set();
    }

    /**
     * Return display name for service registry contract
     * @returns {string}
     */
    getName() {
        return "Ollama AI";
    }

    /**
     * Enable the Ollama module
     * @returns {OllamaAdapter}
     */
    enable() {
        this.enabled = true;
        this.notifyStatusChange('enabled');
        return this;
    }

    /**
     * Disable the Ollama module
     * @returns {OllamaAdapter}
     */
    disable() {
        this.enabled = false;
        this.notifyStatusChange('disabled');
        return this;
    }

    /**
     * Toggle the module's enabled state
     * @returns {boolean} New enabled state
     */
    toggle() {
        this.enabled = !this.enabled;
        this.notifyStatusChange(this.enabled ? 'enabled' : 'disabled');
        return this.enabled;
    }

    /**
     * Query whether the module is active
     * @returns {boolean}
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Register an observer callback for module state changes
     * @param {Function} callback 
     */
    onStatusChange(callback) {
        if (typeof callback === 'function') {
            this.statusListeners.add(callback);
        }
    }

    /**
     * Unregister an observer callback
     * @param {Function} callback 
     */
    offStatusChange(callback) {
        this.statusListeners.delete(callback);
    }

    /**
     * Notify registered observers of state changes
     * @param {string} event 
     */
    notifyStatusChange(event) {
        const payload = {
            enabled: this.enabled,
            isOnline: this.isOnline,
            baseUrl: this.baseUrl,
            event: event
        };
        this.statusListeners.forEach(listener => {
            try {
                listener(payload);
            } catch (err) {
                console.error('[Ollama Adapter] Observer error:', err);
            }
        });
    }

    /**
     * Diagnostic health probe to verify service reachability
     * @returns {Promise<boolean>}
     */
    async checkHealth() {
        if (!this.enabled) {
            this.isOnline = false;
            this.notifyStatusChange('health_check');
            return false;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${this.baseUrl}/api/tags`, {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            this.isOnline = response.ok;
        } catch (error) {
            this.isOnline = false;
        }

        this.notifyStatusChange('health_check');
        return this.isOnline;
    }

    /**
     * Fetch available models from local Ollama instance
     * @returns {Promise<Array>} List of installed models
     */
    async fetchModels() {
        if (!this.enabled) {
            throw new ModuleDisabledError(this.getName());
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            this.isOnline = true;
            return data.models || [];
        } catch (error) {
            this.isOnline = false;
            console.error('[Ollama Adapter] Error fetching models:', error);
            throw error;
        }
    }

    /**
     * Send a chat message payload to Ollama
     * @param {Object} config - Execution config
     * @returns {Promise<Object>} Assistant response
     */
    async sendMessage(config) {
        if (!this.enabled) {
            throw new ModuleDisabledError(this.getName());
        }

        const {
            model,
            systemPrompt,
            userMessage,
            temperature = 0.2,
            topP = 0.9,
            numCtx = 4096,
            repeatPenalty = 1.1,
            responseFormat = 'text'
        } = config;

        if (!model) {
            throw new Error('Model selection is required');
        }

        if (!userMessage || !userMessage.trim()) {
            throw new Error('User message cannot be empty');
        }

        // Maintain conversation history
        this.conversationHistory.push({ role: 'user', content: userMessage });

        const payload = {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt || 'You are a precise data assistant.' },
                ...this.conversationHistory
            ],
            stream: false,
            options: {
                temperature: temperature,
                top_p: topP,
                num_ctx: numCtx,
                repeat_penalty: repeatPenalty
            }
        };

        if (responseFormat === 'json') {
            payload.format = 'json';
        }

        try {
            const response = await fetch(`${this.baseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const data = await response.json();
            const assistantMessage = data.message.content;

            this.conversationHistory.push({ role: 'assistant', content: assistantMessage });
            this.isOnline = true;

            return {
                success: true,
                message: assistantMessage,
                conversationLength: this.conversationHistory.length
            };
        } catch (error) {
            console.error('[Ollama Adapter] Execution Error:', error);
            throw error;
        }
    }

    /**
     * Clear active conversation context
     */
    clearHistory() {
        this.conversationHistory = [];
    }

    /**
     * Retrieve active conversation history
     * @returns {Array}
     */
    getHistory() {
        return [...this.conversationHistory];
    }

    /**
     * Restore conversation context from state
     * @param {Array} history
     */
    setHistory(history) {
        if (Array.isArray(history)) {
            this.conversationHistory = [...history];
        }
    }
}

// Global namespace binding
window.OllamaAdapter = OllamaAdapter;
window.ModuleDisabledError = ModuleDisabledError;

console.log("[Far Realm VDE] vde-ollama-adapter.js initialized.");