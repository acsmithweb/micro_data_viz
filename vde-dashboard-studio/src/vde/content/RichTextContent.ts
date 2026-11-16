import { IPanelContent, notifyGridStateChange } from './IPanelContent';
import { HTMLRendererAdapter } from '../adapters/HTMLRendererAdapter';
import { ContentDigester } from '../digester/ContentDigester';

export class RichTextContent extends IPanelContent {
  private isEditing = false;
  private containerElement: HTMLElement | null = null;

  constructor(config: { contentType?: string; sourceText?: string } = {}) {
    super(config);
  }

  public render(containerElement: HTMLElement): void {
    this.containerElement = containerElement;
    containerElement.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'rich-text-wrapper w-100 h-100 d-flex flex-column position-relative';

    const menu = document.createElement('div');
    menu.className = 'position-absolute d-flex gap-1';
    menu.style.top = '8px';
    menu.style.right = '10px';
    menu.style.zIndex = '5';

    const rawText = String(this.config.sourceText ?? '');

    if (!this.isEditing && rawText.trim().length > 0) {
      const digestBtn = document.createElement('button');
      digestBtn.className = 'btn btn-sm btn-outline-info';
      digestBtn.style.fontSize = '10px';
      digestBtn.style.padding = '2px 8px';
      digestBtn.textContent = 'Split Sections';
      digestBtn.title = 'Digest Markdown headings into separate panels';
      digestBtn.onclick = () => this.triggerDigestion();
      menu.appendChild(digestBtn);
    }

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-outline-warning';
    editBtn.style.fontSize = '10px';
    editBtn.style.padding = '2px 8px';
    editBtn.textContent = this.isEditing ? 'Save' : 'Edit';
    menu.appendChild(editBtn);

    const bodyArea = document.createElement('div');
    bodyArea.className = 'flex-grow-1 overflow-y-auto p-3 h-100';

    if (this.isEditing) {
      const textarea = document.createElement('textarea');
      textarea.className = 'form-control font-mono h-100';
      textarea.style.backgroundColor = '#0e1014';
      textarea.style.color = '#a6e3a1';
      textarea.style.fontSize = '12px';
      textarea.style.border = '1px solid var(--global-border)';
      textarea.style.resize = 'none';
      textarea.value = rawText;

      bodyArea.appendChild(textarea);

      editBtn.onclick = () => {
        this.config.sourceText = textarea.value;
        this.isEditing = false;
        this.render(containerElement);
        notifyGridStateChange();
      };
    } else {
      const preview = document.createElement('div');
      preview.className = 'vde-markdown-preview';
      preview.style.fontSize = '13px';
      preview.style.lineHeight = '1.6';
      const contentType = String(this.config.contentType || 'markdown');
      preview.innerHTML = HTMLRendererAdapter.render(rawText, contentType);
      preview.ondblclick = () => {
        this.isEditing = true;
        this.render(containerElement);
      };
      bodyArea.appendChild(preview);

      editBtn.onclick = () => {
        this.isEditing = true;
        this.render(containerElement);
      };
    }

    wrapper.appendChild(menu);
    wrapper.appendChild(bodyArea);
    containerElement.appendChild(wrapper);
  }

  private triggerDigestion(): void {
    const rawText = String(this.config.sourceText || '');
    const formatType = String(this.config.contentType || 'markdown');
    const fragments = ContentDigester.digest(rawText, formatType);
    if (fragments.length <= 1) return;

    const mgr = (
      window as unknown as {
        IntegratedGridManager?: {
          removePanel: (id: number) => void;
          addMarkdownWidget: (text: string, bucketId: number | null) => void;
        };
      }
    ).IntegratedGridManager;

    if (mgr && this.panel) {
      const bucketId = this.panel.bucketId;
      mgr.removePanel(this.panel.id);
      fragments.forEach((frag) => mgr.addMarkdownWidget(frag, bucketId));
    }
  }

  public override update(data?: { sourceText?: string }): void {
    if (data && data.sourceText !== undefined) {
      this.config.sourceText = data.sourceText;
      if (this.containerElement) this.render(this.containerElement);
      notifyGridStateChange();
    }
  }

  public clone(): RichTextContent {
    return new RichTextContent({
      contentType: String(this.config.contentType || 'markdown'),
      sourceText: String(this.config.sourceText || ''),
    });
  }
}
