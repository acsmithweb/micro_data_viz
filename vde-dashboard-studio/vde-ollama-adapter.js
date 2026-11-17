/**
 * vde-ollama-adapter.js
 * Modular Ollama AI Interface Adapter with lifecycle control, health probes, and history.
 */

class ModuleDisabledError extends Error {
    constructor(moduleName = "Ollama AI Interface") {
        super(`[VDE Module Control] The ${moduleName} module is currently disabled.`);
        this.name = "ModuleDisabledError";
    }
}

class OllamaAdapter {
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

    getName() {
        return "Ollama AI";
    }

    setBaseUrl(url) {
        if (url && typeof url === 'string') {
            this.baseUrl = url.replace(/\/+$/, '');
        }
    }

    enable() {
        this.enabled = true;
        this.notifyStatusChange('enabled');
        return this;
    }

    disable() {
        this.enabled = false;
        this.notifyStatusChange('disabled');
        return this;
    }

    toggle() {
        this.enabled = !this.enabled;
        this.notifyStatusChange(this.enabled ? 'enabled' : 'disabled');
        return this.enabled;
    }

    isEnabled() {
        return this.enabled;
    }

    onStatusChange(callback) {
        if (typeof callback === 'function') {
            this.statusListeners.add(callback);
        }
    }

    offStatusChange(callback) {
        this.statusListeners.delete(callback);
    }

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

    async fetchModels() {
        if (!this.enabled) {
            throw new ModuleDisabledError(this.getName());
        }

        const response = await fetch(`${this.baseUrl}/api/tags`);
        if (!response.ok) {
            this.isOnline = false;
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        this.isOnline = true;
        this.notifyStatusChange('models_loaded');
        return data.models || [];
    }

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

        if (!model) throw new Error('Model selection is required');
        if (!userMessage || !userMessage.trim()) throw new Error('User message cannot be empty');

        this.conversationHistory.push({ role: 'user', content: userMessage });

        const payload = {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt || 'You are a precise data assistant.' },
                ...this.conversationHistory
            ],
            stream: false,
            options: {
                temperature: Number(temperature),
                top_p: Number(topP),
                num_ctx: Number(numCtx),
                repeat_penalty: Number(repeatPenalty)
            }
        };

        if (responseFormat === 'json') {
            payload.format = 'json';
        }

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
    }

    clearHistory() {
        this.conversationHistory = [];
    }

    getHistory() {
        return [...this.conversationHistory];
    }

    setHistory(history) {
        if (Array.isArray(history)) {
            this.conversationHistory = [...history];
        }
    }
}

window.OllamaAdapter = OllamaAdapter;
window.ModuleDisabledError = ModuleDisabledError;
