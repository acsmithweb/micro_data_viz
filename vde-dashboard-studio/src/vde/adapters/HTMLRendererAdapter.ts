import { marked } from 'marked';
import DOMPurify from 'dompurify';

export class HTMLRendererAdapter {
  public static escapeHtml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  public static render(
    rawContent: string,
    formatType: 'code' | 'markdown' | 'html' | string = 'markdown'
  ): string {
    const purificationConfig = {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'sandbox'],
    };

    switch (formatType) {
      case 'code':
        return `<pre class="h-100"><code>${this.escapeHtml(rawContent)}</code></pre>`;
      case 'markdown': {
        const parsed = marked.parse(rawContent || '', { async: false }) as string;
        return DOMPurify.sanitize(parsed, purificationConfig);
      }
      case 'html':
      default:
        return DOMPurify.sanitize(rawContent || '', purificationConfig);
    }
  }
}

export const Formatter = HTMLRendererAdapter;
