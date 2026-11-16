export interface IDigestionStrategy {
  digest(rawContent: string): string[];
}

export class CodeDigestionStrategy implements IDigestionStrategy {
  public digest(rawContent: string): string[] {
    const splitRegex =
      /(?=^(?:export\s+)?(?:function|async\s+function|class|def)\s+\w+|^(?:export\s+)?const\s+\w+\s*=\s*(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>)/m;
    return rawContent
      .split(splitRegex)
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
  }
}

export class MarkdownHeaderStrategy implements IDigestionStrategy {
  public digest(rawContent: string): string[] {
    const splitRegex = /(?=^#{1,6}\s+)/m;
    return rawContent
      .split(splitRegex)
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
  }
}

export class ParagraphTextStrategy implements IDigestionStrategy {
  public digest(rawContent: string): string[] {
    return rawContent
      .split(/\n\s*\n/)
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
  }
}

export class ContentDigesterEngine {
  private strategies: Record<string, IDigestionStrategy> = {
    code: new CodeDigestionStrategy(),
    markdown: new MarkdownHeaderStrategy(),
    html: new ParagraphTextStrategy(),
  };

  public digest(rawContent: string, formatType = 'html'): string[] {
    if (!rawContent || typeof rawContent !== 'string') return [];
    const strategy = this.strategies[formatType] || this.strategies.html;
    return strategy.digest(rawContent);
  }
}

export const ContentDigester = new ContentDigesterEngine();
