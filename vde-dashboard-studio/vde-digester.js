/**
 * vde-digester.js
 * Content Digestion Strategy Layer for splitting monolithic code/markdown/prose into panels.
 */

class IDigestionStrategy {
    digest(rawContent) {
        throw new Error("Strategy.digest must be implemented.");
    }
}

class CodeDigestionStrategy extends IDigestionStrategy {
    digest(rawContent) {
        const splitRegex = /(?=^(?:export\s+)?(?:function|async\s+function|class|def)\s+\w+|^(?:export\s+)?const\s+\w+\s*=\s*(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>)/m;
        return rawContent.split(splitRegex).map(f => f.trim()).filter(f => f.length > 0);
    }
}

class MarkdownHeaderStrategy extends IDigestionStrategy {
    digest(rawContent) {
        const splitRegex = /(?=^#{1,6}\s+)/m;
        return rawContent.split(splitRegex).map(f => f.trim()).filter(f => f.length > 0);
    }
}

class ParagraphTextStrategy extends IDigestionStrategy {
    digest(rawContent) {
        return rawContent.split(/\n\s*\n/).map(f => f.trim()).filter(f => f.length > 0);
    }
}

class ContentDigester {
    constructor() {
        this.strategies = {
            'code': new CodeDigestionStrategy(),
            'markdown': new MarkdownHeaderStrategy(),
            'html': new ParagraphTextStrategy()
        };
    }

    digest(rawContent, formatType) {
        if (!rawContent || typeof rawContent !== 'string') return [];
        const strategy = this.strategies[formatType] || this.strategies['html'];
        return strategy.digest(rawContent);
    }
}

const Digester = new ContentDigester();
window.Digester = Digester;
window.ContentDigester = Digester;
window.IDigestionStrategy = IDigestionStrategy;
window.CodeDigestionStrategy = CodeDigestionStrategy;
window.MarkdownHeaderStrategy = MarkdownHeaderStrategy;
window.ParagraphTextStrategy = ParagraphTextStrategy;
