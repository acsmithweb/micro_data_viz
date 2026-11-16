export interface ObsidianCommandParams {
  command: string;
  vault?: string;
  file?: string;
  path?: string;
  query?: string;
  limit?: number | string;
  name?: string;
  content?: string;
  format?: string;
  folder?: string;
  ext?: string;
  status?: string;
  ref?: string;
  line?: number | string;
  value?: string;
  to?: string;
  view?: string;
  subpath?: string;
  search?: string;
  url?: string;
  title?: string;
  template?: string;
  type?: string;
  sort?: string;
  info?: string;
  flags?: Record<string, boolean>;
}

export class ObsidianAdapter {
  public serverUrl: string;
  public commandHistory: Array<{ command: string; timestamp: string }> = [];

  constructor(serverUrl = 'http://localhost:5000') {
    this.serverUrl = serverUrl;
  }

  public getName(): string {
    return 'Obsidian CLI';
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(`${this.serverUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  public buildCommand(params: ObsidianCommandParams): string {
    const {
      command,
      vault,
      file,
      path,
      query,
      limit,
      name,
      content,
      format,
      folder,
      ext,
      status,
      ref,
      line,
      value,
      to,
      view,
      subpath,
      search,
      url,
      title,
      template,
      type,
      sort,
      info,
      flags = {},
    } = params;

    if (!command) throw new Error('Command is required');

    const parts: string[] = [`obsidian ${command}`];
    if (file) parts.push(`file="${this.escapeParam(file)}"`);
    if (path) parts.push(`path="${this.escapeParam(path)}"`);
    if (query) parts.push(`query="${this.escapeParam(query)}"`);
    if (limit) parts.push(`limit="${limit}"`);
    if (name) parts.push(`name="${this.escapeParam(name)}"`);
    if (content) parts.push(`content="${this.escapeParam(content)}"`);
    if (format) parts.push(`format="${format}"`);
    if (folder) parts.push(`folder="${this.escapeParam(folder)}"`);
    if (ext) parts.push(`ext="${ext}"`);
    if (status) parts.push(`status="${this.escapeParam(status)}"`);
    if (ref) parts.push(`ref="${this.escapeParam(ref)}"`);
    if (line) parts.push(`line="${line}"`);
    if (value) parts.push(`value="${this.escapeParam(value)}"`);
    if (to) parts.push(`to="${this.escapeParam(to)}"`);
    if (view) parts.push(`view="${this.escapeParam(view)}"`);
    if (subpath) parts.push(`subpath="${this.escapeParam(subpath)}"`);
    if (search) parts.push(`search="${this.escapeParam(search)}"`);
    if (url) parts.push(`url="${this.escapeParam(url)}"`);
    if (title) parts.push(`title="${this.escapeParam(title)}"`);
    if (template) parts.push(`template="${this.escapeParam(template)}"`);
    if (type) parts.push(`type="${type}"`);
    if (sort) parts.push(`sort="${sort}"`);
    if (info) parts.push(`info="${info}"`);

    Object.keys(flags).forEach((flag) => {
      if (flags[flag] === true) parts.push(flag);
    });

    if (vault) parts.push(`vault="${this.escapeParam(vault)}"`);
    return parts.join(' ');
  }

  public escapeParam(value: string): string {
    return value.replace(/"/g, '\\"');
  }

  public async executeCommand(command: string): Promise<{
    success: boolean;
    output: string;
    command: string;
  }> {
    if (!command || !command.trim()) {
      throw new Error('Command cannot be empty');
    }

    this.commandHistory.push({
      command,
      timestamp: new Date().toISOString(),
    });

    const response = await fetch(`${this.serverUrl}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as { output?: string };
    return {
      success: true,
      output: data.output || '',
      command,
    };
  }

  public async executeBuiltCommand(params: ObsidianCommandParams) {
    const command = this.buildCommand(params);
    return this.executeCommand(command);
  }

  public buildURI(params: ObsidianCommandParams): string | null {
    const { command, vault, file, path, name, query, content } = params;
    let uri = '';

    if (command === 'open' || command === 'read') {
      const target = path || file;
      if (target) uri = `obsidian://open?file=${encodeURIComponent(target)}`;
    } else if (command === 'create') {
      const target = path || name;
      if (target) {
        uri = `obsidian://new?file=${encodeURIComponent(target)}`;
        if (content) uri += `&content=${encodeURIComponent(content)}`;
      }
    } else if (command === 'search' || command === 'search:open') {
      if (query) uri = `obsidian://search?query=${encodeURIComponent(query)}`;
    }

    if (uri && vault) {
      uri += `&vault=${encodeURIComponent(vault)}`;
    }
    return uri || null;
  }

  public getHistory() {
    return [...this.commandHistory];
  }

  public clearHistory(): void {
    this.commandHistory = [];
  }
}
