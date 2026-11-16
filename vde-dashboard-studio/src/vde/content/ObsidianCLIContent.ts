import { IPanelContent, notifyGridStateChange } from './IPanelContent';
import { ObsidianAdapter } from '../adapters/ObsidianAdapter';

export interface ObsidianCLIState {
  selectedCommand: string;
  vault: string;
  query: string;
  file: string;
  lastOutput: string;
}

export class ObsidianCLIContent extends IPanelContent {
  private containerElement: HTMLElement | null = null;
  private adapter: ObsidianAdapter;
  public state: ObsidianCLIState;

  constructor(config: { state?: Partial<ObsidianCLIState> } = {}) {
    super(config);
    this.adapter = new ObsidianAdapter();
    this.state = Object.assign(
      {
        selectedCommand: 'files',
        vault: '',
        query: '',
        file: '',
        lastOutput: 'Ready for command execution...',
      },
      config.state || {}
    );
  }

  public override serializeState(): Record<string, unknown> {
    return JSON.parse(JSON.stringify(this.state));
  }

  public render(containerElement: HTMLElement): void {
    this.containerElement = containerElement;
    containerElement.innerHTML = `
<div class="vde-obsidian-cli h-100 d-flex flex-column p-2 gap-2" style="color: var(--global-text); font-size: 11px;">
  <div class="row g-2 pb-2 border-bottom border-secondary">
    <div class="col-5">
      <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Command</label>
      <select class="form-select form-select-sm command-select bg-dark text-white border-secondary" style="font-size: 11px;">
        <option value="file">file — Show File Info</option>
        <option value="files">files — List Vault Files</option>
        <option value="read">read — Read File Contents</option>
        <option value="search">search — Search Vault</option>
      </select>
    </div>
    <div class="col-4">
      <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Vault (Optional)</label>
      <input type="text" class="form-control form-control-sm vault-input bg-dark text-white border-secondary font-mono" placeholder="Vault name" style="font-size: 11px;" />
    </div>
    <div class="col-3 d-flex align-items-end">
      <button type="button" class="btn btn-sm btn-warning w-100 run-cmd-btn" style="font-size: 11px;">Run</button>
    </div>
  </div>
  <div class="row g-2">
    <div class="col-6">
      <input type="text" class="form-control form-control-sm file-input bg-dark text-white border-secondary font-mono" placeholder="Target file path..." style="font-size: 11px;" />
    </div>
    <div class="col-6">
      <input type="text" class="form-control form-control-sm query-input bg-dark text-white border-secondary font-mono" placeholder="Search query..." style="font-size: 11px;" />
    </div>
  </div>
  <div class="flex-grow-1 d-flex flex-column" style="min-height: 0;">
    <label class="form-label font-mono text-secondary mb-1" style="font-size: 10px;">Output</label>
    <div class="output-console flex-grow-1 bg-dark border border-secondary rounded p-2 overflow-y-auto font-mono" style="font-size: 10.5px; color: #a6e3a1; white-space: pre-wrap;"></div>
  </div>
</div>`;

    const cmdSelect = containerElement.querySelector<HTMLSelectElement>('.command-select');
    const vaultInput = containerElement.querySelector<HTMLInputElement>('.vault-input');
    const fileInput = containerElement.querySelector<HTMLInputElement>('.file-input');
    const queryInput = containerElement.querySelector<HTMLInputElement>('.query-input');
    const outputEl = containerElement.querySelector<HTMLElement>('.output-console');

    if (cmdSelect) {
      cmdSelect.value = this.state.selectedCommand;
      cmdSelect.onchange = () => {
        this.state.selectedCommand = cmdSelect.value;
        notifyGridStateChange();
      };
    }
    if (vaultInput) {
      vaultInput.value = this.state.vault;
      vaultInput.onchange = () => {
        this.state.vault = vaultInput.value;
        notifyGridStateChange();
      };
    }
    if (fileInput) {
      fileInput.value = this.state.file;
      fileInput.onchange = () => {
        this.state.file = fileInput.value;
        notifyGridStateChange();
      };
    }
    if (queryInput) {
      queryInput.value = this.state.query;
      queryInput.onchange = () => {
        this.state.query = queryInput.value;
        notifyGridStateChange();
      };
    }
    if (outputEl) {
      outputEl.textContent = this.state.lastOutput;
    }

    containerElement.querySelector('.run-cmd-btn')?.addEventListener('click', async () => {
      if (!outputEl) return;
      try {
        const res = await this.adapter.executeBuiltCommand({
          command: this.state.selectedCommand,
          vault: this.state.vault || undefined,
          file: this.state.file || undefined,
          query: this.state.query || undefined,
        });
        this.state.lastOutput = res.output || `Executed: ${res.command}`;
      } catch (err) {
        const built = this.adapter.buildCommand({
          command: this.state.selectedCommand,
          vault: this.state.vault || undefined,
          file: this.state.file || undefined,
          query: this.state.query || undefined,
        });
        this.state.lastOutput = `Bridge offline (${this.adapter.serverUrl}).\nBuilt CLI command:\n${built}\n\nError: ${err instanceof Error ? err.message : 'Connection failed'}`;
      }
      outputEl.textContent = this.state.lastOutput;
      notifyGridStateChange();
    });
  }

  public clone(): ObsidianCLIContent {
    return new ObsidianCLIContent({
      state: JSON.parse(JSON.stringify(this.state)),
    });
  }
}
