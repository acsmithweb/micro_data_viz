export class ModuleDisabledError extends Error {
  constructor(moduleName = 'Ollama AI Interface') {
    super(`The ${moduleName} module is currently disabled.`);
    this.name = 'ModuleDisabledError';
  }
}

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaStatusPayload {
  enabled: boolean;
  isOnline: boolean;
  baseUrl: string;
  event: string;
}

export interface OllamaSendConfig {
  model: string;
  systemPrompt?: string;
  userMessage: string;
  temperature?: number;
  topP?: number;
  numCtx?: number;
  repeatPenalty?: number;
  responseFormat?: 'text' | 'json' | string;
}

export class OllamaAdapter {
  public baseUrl: string;
  public enabled: boolean;
  public conversationHistory: OllamaMessage[] = [];
  public isOnline = false;
  private statusListeners: Set<(payload: OllamaStatusPayload) => void> = new Set();

  constructor(config: string | { baseUrl?: string; enabled?: boolean } = {}) {
    if (typeof config === 'string') {
      this.baseUrl = config;
      this.enabled = true;
    } else {
      this.baseUrl = config.baseUrl || 'http://localhost:11434';
      this.enabled = config.enabled !== undefined ? Boolean(config.enabled) : true;
    }
  }

  public getName(): string {
    return 'Ollama AI';
  }

  public enable(): this {
    this.enabled = true;
    this.notifyStatusChange('enabled');
    return this;
  }

  public disable(): this {
    this.enabled = false;
    this.notifyStatusChange('disabled');
    return this;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    this.notifyStatusChange(this.enabled ? 'enabled' : 'disabled');
    return this.enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public onStatusChange(callback: (payload: OllamaStatusPayload) => void): void {
    this.statusListeners.add(callback);
  }

  public offStatusChange(callback: (payload: OllamaStatusPayload) => void): void {
    this.statusListeners.delete(callback);
  }

  public notifyStatusChange(event: string): void {
    const payload: OllamaStatusPayload = {
      enabled: this.enabled,
      isOnline: this.isOnline,
      baseUrl: this.baseUrl,
      event,
    };
    this.statusListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error('[Ollama Adapter] Observer error:', err);
      }
    });
  }

  public async checkHealth(): Promise<boolean> {
    if (!this.enabled) {
      this.isOnline = false;
      this.notifyStatusChange('health_check');
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      this.isOnline = response.ok;
    } catch {
      this.isOnline = false;
    }

    this.notifyStatusChange('health_check');
    return this.isOnline;
  }

  public async fetchModels(): Promise<Array<{ name: string }>> {
    if (!this.enabled) {
      throw new ModuleDisabledError(this.getName());
    }

    const response = await fetch(`${this.baseUrl}/api/tags`);
    if (!response.ok) {
      this.isOnline = false;
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = (await response.json()) as { models?: Array<{ name: string }> };
    this.isOnline = true;
    return data.models || [];
  }

  public async sendMessage(config: OllamaSendConfig): Promise<{
    success: boolean;
    message: string;
    conversationLength: number;
  }> {
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
      responseFormat = 'text',
    } = config;

    if (!model) throw new Error('Model selection is required');
    if (!userMessage || !userMessage.trim()) throw new Error('User message cannot be empty');

    this.conversationHistory.push({ role: 'user', content: userMessage });

    const payload: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: systemPrompt || 'You are a precise data assistant.' },
        ...this.conversationHistory,
      ],
      stream: false,
      options: {
        temperature,
        top_p: topP,
        num_ctx: numCtx,
        repeat_penalty: repeatPenalty,
      },
    };

    if (responseFormat === 'json') {
      payload.format = 'json';
    }

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = (await response.json()) as { message: { content: string } };
    const assistantMessage = data.message.content;

    this.conversationHistory.push({ role: 'assistant', content: assistantMessage });
    this.isOnline = true;

    return {
      success: true,
      message: assistantMessage,
      conversationLength: this.conversationHistory.length,
    };
  }

  public clearHistory(): void {
    this.conversationHistory = [];
  }

  public getHistory(): OllamaMessage[] {
    return [...this.conversationHistory];
  }

  public setHistory(history: OllamaMessage[]): void {
    if (Array.isArray(history)) {
      this.conversationHistory = [...history];
    }
  }
}
