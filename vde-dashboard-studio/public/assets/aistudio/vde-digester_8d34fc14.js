/**
 * vde-digester.js
 * Virtue Execution Matrix - Content Digestion Strategy Layer
 * Formulated with Utilitarian Spite under the Clerical Mandate of Project Narayah
 * Employs the Strategy Pattern to dynamically partition monolithic documents 
 * into discrete functional and semantic widgets.
 */

// =========================================================
// 1. ABSTRACT BASE: STRATEGY INTERFACE
// =========================================================
class IDigestionStrategy {
    digest(rawContent) {
        throw new Error("Strategy.digest ritual must be implemented.");
    }
}

// =========================================================
// 2. CONCRETE STRATEGY: CODE RECOGNITION
// =========================================================
class CodeDigestionStrategy extends IDigestionStrategy {
    digest(rawContent) {
        // Splits code neatly along function, async function, class, def, and arrow function declarations
        const splitRegex = /(?=^function\s+\w+|^async\s+function\s+\w+|^class\s+\w+|^def\s+\w+|^const\s+\w+\s*=\s*(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>)/m;
        return rawContent.split(splitRegex).map(f => f.trim()).filter(f => f.length > 0);
    }
}

// =========================================================
// 3. CONCRETE STRATEGY: MARKDOWN HEADERS
// =========================================================
class MarkdownHeaderStrategy extends IDigestionStrategy {
    digest(rawContent) {
        // Splits along any standard markdown headers (# through ######)
        const splitRegex = /(?=^#{1,6}\s+)/m;
        return rawContent.split(splitRegex).map(f => f.trim()).filter(f => f.length > 0);
    }
}

// =========================================================
// 4. CONCRETE STRATEGY: PARAGRAPH BOUNDARIES
// =========================================================
class ParagraphTextStrategy extends IDigestionStrategy {
    digest(rawContent) {
        // Splits content along standard blank line paragraph boundaries
        return rawContent.split(/\n\s*\n/).map(f => f.trim()).filter(f => f.length > 0);
    }
}

// =========================================================
// 5. BEHAVIORAL PATTERN: CONTENT ORCHESTRATOR
// =========================================================
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

// Instantiate and expose globally on window to form the unified digestion pipeline
const Digester = new ContentDigester();
window.Digester = Digester;
window.ContentDigester = Digester;

// Bind classes to window registry for modular access
window.IDigestionStrategy = IDigestionStrategy;
window.CodeDigestionStrategy = CodeDigestionStrategy;
window.MarkdownHeaderStrategy = MarkdownHeaderStrategy;
window.ParagraphTextStrategy = ParagraphTextStrategy;
