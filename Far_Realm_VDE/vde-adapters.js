/**
 * vde-adapters.js
 * 
 * Target Domain: 02_World_Sentinel
 * Structural Role: Structural Adapter Pattern
 * 
 * Translates and purifies raw content (markdown, HTML, code) into sanitized DOM elements.
 * Prevents "Feature Leaks" by isolating dependency on external libraries like marked and DOMPurify.
 */

class HTMLRendererAdapter {
    static escapeHtml(unsafe) {
        if (!unsafe) return "";
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    static render(rawContent, formatType) {
        const purificationConfig = {
            ADD_TAGS: ['iframe'],
            ADD_ATTR: ['src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'sandbox']
        };

        switch (formatType) {
            case 'code':
                return `<pre class="h-100"><code>${this.escapeHtml(rawContent)}</code></pre>`;
            case 'markdown':
                if (typeof marked !== 'undefined') {
                    const parsed = marked.parse(rawContent);
                    return typeof DOMPurify !== 'undefined'
                        ? DOMPurify.sanitize(parsed, purificationConfig)
                        : parsed;
                } else {
                    return this.fallbackParseMarkdown(rawContent);
                }
            case 'html':
            default:
                return typeof DOMPurify !== 'undefined'
                    ? DOMPurify.sanitize(rawContent, purificationConfig)
                    : this.escapeHtml(rawContent);
        }
    }

    static fallbackParseMarkdown(text) {
        if (!text) return "";
        let html = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/^> (.*)$/gim, "<blockquote>$1</blockquote>")
            .replace(/^### (.*)$/gim, "<h3>$1</h3>")
            .replace(/^## (.*)$/gim, "<h2>$1</h2>")
            .replace(/^# (.*)$/gim, "<h1>$1</h1>")
            .replace(/`([^`]+)`/g, "<code>$1</code>")
            .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
            .replace(/\*([^*]+)\*/g, "<em>$1</em>")
            .replace(/^\* (.*)$/gim, "<li>$1</li>")
            .replace(/^- (.*)$/gim, "<li>$1</li>");
            
        html = html.replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>");
        html = html.replace(/<\/ul>\s*<ul>/g, "");

        return html.trim();
    }
}

const Formatter = HTMLRendererAdapter;
window.Formatter = Formatter;
window.HTMLRendererAdapter = HTMLRendererAdapter;

// JSON Shadow State for Governance and VDE Compliance Tracking
console.log("[Narayah VDE] vde-adapters.js successfully loaded. Formatters registered.");
