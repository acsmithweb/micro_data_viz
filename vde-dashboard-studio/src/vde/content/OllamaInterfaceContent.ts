import { IPanelContent, notifyGridStateChange } from './IPanelContent';
import { OllamaAdapter, OllamaMessage } from '../adapters/OllamaAdapter';

export interface OllamaInterfaceState {
  selectedModel: string;
  systemPrompt: string;
  temperature: number;
  topP: number;
  numCtx: number;
  repeatPenalty: number;
  responseFormat: string;
  conversationHistory: OllamaMessage[];
}

export class OllamaInterfaceContent extends IPanelContent {
  private containerElement: HTMLElement | null = null;
  private adapter: OllamaAdapter;
  public state: OllamaInterfaceState;

  constructor(config: { state?: Partial<OllamaInterfaceState> } = {}) {
    super(config);
    this.adapter = new OllamaAdapter();
    this.state = Object.assign(
      {
        selectedModel: '',
        systemPrompt: 'You are a precise JSON-generating data assistant for local tool execution.',
        temperature: 0.2,
        topP: 0.9,
        numCtx: 4096,
        repeatPenalty: 1.1,
        responseFormat: 'text',
        conversationHistory: [],
      },
      config.state || {}
    );
    if (this.state.conversationHistory.length > 0) {
      this.adapter.setHistory(this.state.conversationHistory);
    }
  }

  public override serializeState(): Record<string, unknown> {
    return JSON.parse(JSON.stringify(this.state));
  }

  public render(containerElement: HTMLElement): void {
    this.containerElement = containerElement;
    containerElement.innerHTML = `
<div class="vde-ollama-interface h-100 d-flex flex-column p-2 gap-2" style="color: var(--global-text); font-size: 11px;">
  <div class="row g-2 pb-2 border-bottom border-secondary">
    <div class="col-8">
      <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Model (localhost:11434)</label>
      <div class="d-flex gap-1">
        <select class="form-select form-select-sm model-select bg-dark text-white border-secondary" style="font-size: 11px;">
          <option value="">Checking Ollama...</option>
        </select>
        <button type="button" class="btn btn-sm btn-outline-secondary refresh-models-btn" style="font-size: 11px;">
          <i class="bi bi-arrow-clockwise"></i>
        </button>
      </div>
    </div>
    <div class="col-4">
      <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Format</label>
      <select class="form-select form-select-sm response-format-select bg-dark text-white border-secondary" style="font-size: 11px;">
        <option value="text">Text</option>
        <option value="json">JSON</option>
      </select>
    </div>
  </div>
  <div>
    <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">System Prompt</label>
    <textarea class="form-control form-control-sm system-prompt-input bg-dark text-white border-secondary font-mono" rows="2" style="font-size: 10px;"></textarea>
  </div>
  <div class="flex-grow-1 d-flex flex-column" style="min-height: 0;">
    <div class="d-flex justify-content-between align-items-center mb-1">
      <span class="font-mono text-secondary" style="font-size: 10px;">Conversation</span>
      <button type="button" class="btn btn-sm btn-outline-danger clear-history-btn" style="font-size: 10px; padding: 1px 6px;">Clear</button>
    </div>
    <div class="chat-history flex-grow-1 border border-secondary rounded bg-dark p-2 overflow-y-auto" style="min-height: 100px;"></div>
    <div class="mt-2 d-flex gap-2">
      <input type="text" class="form-control form-control-sm user-input bg-dark text-white border-secondary font-mono" placeholder="Message local Ollama model..." style="font-size: 11px;" />
      <button type="button" class="btn btn-sm btn-warning send-btn" style="font-size: 11px; white-space: nowrap;">Send</button>
    </div>
  </div>
</div>`;

    const sysInput = containerElement.querySelector<HTMLTextAreaElement>('.system-prompt-input');
    if (sysInput) {
      sysInput.value = this.state.systemPrompt;
      sysInput.onchange = () => {
        this.state.systemPrompt = sysInput.value;
        notifyGridStateChange();
      };
    }

    const fmtSelect = containerElement.querySelector<HTMLSelectElement>('.response-format-select');
    if (fmtSelect) {
      fmtSelect.value = this.state.responseFormat;
      fmtSelect.onchange = () => {
        this.state.responseFormat = fmtSelect.value;
        notifyGridStateChange();
      };
    }

    containerElement
      .querySelector('.refresh-models-btn')
      ?.addEventListener('click', () => void this.loadModels());
    containerElement
      .querySelector('.send-btn')
      ?.addEventListener('click', () => void this.sendMessage());
    containerElement.querySelector('.clear-history-btn')?.addEventListener('click', () => {
      this.adapter.clearHistory();
      this.state.conversationHistory = [];
      this.renderChatHistory();
      notifyGridStateChange();
    });

    this.renderChatHistory();
    void this.loadModels();
  }

  private async loadModels(): Promise<void> {
    const select = this.containerElement?.querySelector<HTMLSelectElement>('.model-select');
    if (!select) return;
    try {
      const models = await this.adapter.fetchModels();
      select.innerHTML = '';
      if (models.length === 0) {
        select.innerHTML = '<option value="">No models installed</option>';
        return;
      }
      models.forEach((m) => {
        const opt = document.createElement('option');
        opt.value = m.name;
        opt.textContent = m.name;
        if (m.name === this.state.selectedModel) opt.selected = true;
        select.appendChild(opt);
      });
      if (!this.state.selectedModel) {
        this.state.selectedModel = models[0].name;
      }
      select.onchange = () => {
        this.state.selectedModel = select.value;
        notifyGridStateChange();
      };
    } catch {
      select.innerHTML = '<option value="">Local Ollama offline (11434)</option>';
    }
  }

  private async sendMessage(): Promise<void> {
    const input = this.containerElement?.querySelector<HTMLInputElement>('.user-input');
    const sendBtn = this.containerElement?.querySelector<HTMLButtonElement>('.send-btn');
    if (!input || !sendBtn) return;

    const text = input.value.trim();
    if (!text || !this.state.selectedModel) return;

    sendBtn.disabled = true;
    try {
      await this.adapter.sendMessage({
        model: this.state.selectedModel,
        systemPrompt: this.state.systemPrompt,
        userMessage: text,
        temperature: this.state.temperature,
        topP: this.state.topP,
        numCtx: this.state.numCtx,
        repeatPenalty: this.state.repeatPenalty,
        responseFormat: this.state.responseFormat,
      });
      input.value = '';
      this.state.conversationHistory = this.adapter.getHistory();
      this.renderChatHistory();
      notifyGridStateChange();
    } catch (err) {
      const historyEl = this.containerElement?.querySelector('.chat-history');
      if (historyEl) {
        const div = document.createElement('div');
        div.className = 'p-2 rounded bg-danger bg-opacity-10 text-danger font-mono mb-2';
        div.style.fontSize = '10px';
        div.textContent = err instanceof Error ? err.message : 'Request failed';
        historyEl.appendChild(div);
      }
    } finally {
      sendBtn.disabled = false;
    }
  }

  private renderChatHistory(): void {
    const chatContainer = this.containerElement?.querySelector('.chat-history');
    if (!chatContainer) return;
    chatContainer.innerHTML = '';

    if (this.state.conversationHistory.length === 0) {
      chatContainer.innerHTML = `<div class="text-secondary text-center py-4 font-mono" style="font-size: 10px;">Ready for local Ollama inference</div>`;
      return;
    }

    this.state.conversationHistory.forEach((msg) => {
      const div = document.createElement('div');
      div.className = `p-2 rounded mb-2 font-mono ${msg.role === 'user' ? 'bg-success bg-opacity-10 text-success' : 'bg-info bg-opacity-10 text-info'}`;
      div.style.fontSize = '11px';
      div.style.whiteSpace = 'pre-wrap';
      div.textContent = `${msg.role.toUpperCase()}: ${msg.content}`;
      chatContainer.appendChild(div);
    });
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  public clone(): OllamaInterfaceContent {
    return new OllamaInterfaceContent({
      state: JSON.parse(JSON.stringify(this.state)),
    });
  }
}
