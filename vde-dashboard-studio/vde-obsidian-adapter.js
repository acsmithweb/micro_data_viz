/**
 * vde-obsidian-adapter.js
 * Structural Adapter Pattern for Obsidian CLI & Obsidian URI Protocol
 */

class ObsidianAdapter {
    constructor(serverUrl = 'http://localhost:5000') {
        this.serverUrl = serverUrl.replace(/\/+$/, '');
        this.commandHistory = [];
        this.isOnline = false;
        this.statusListeners = new Set();
    }

    getName() {
        return "Obsidian CLI";
    }

    setServerUrl(url) {
        if (url && typeof url === 'string') {
            this.serverUrl = url.replace(/\/+$/, '');
        }
    }

    onStatusChange(callback) {
        if (typeof callback === 'function') {
            this.statusListeners.add(callback);
        }
    }

    notifyStatusChange(event) {
        const payload = {
            isOnline: this.isOnline,
            enabled: true,
            serverUrl: this.serverUrl,
            event
        };
        this.statusListeners.forEach(fn => {
            try { fn(payload); } catch (e) { console.error('[Obsidian Adapter]', e); }
        });
    }

    async checkHealth() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const response = await fetch(`${this.serverUrl}/api/health`, {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            this.isOnline = response.ok;
        } catch (error) {
            this.isOnline = false;
        }
        this.notifyStatusChange('health_check');
        return this.isOnline;
    }

    buildCommand(params) {
        const {
            command,
            rawCommand,
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
            filter,
            flags = {}
        } = params;

        if (!command) {
            throw new Error('Command is required');
        }

        if (command === 'custom') {
            const trimmed = (rawCommand || '').trim();
            if (!trimmed) return 'obsidian';
            return trimmed.startsWith('obsidian') ? trimmed : `obsidian ${trimmed}`;
        }

        const parts = [`obsidian ${command}`];

        if (file) parts.push(`file="${this.escapeParam(file)}"`);
        if (path) parts.push(`path="${this.escapeParam(path)}"`);
        if (query) parts.push(`query="${this.escapeParam(query)}"`);
        if (limit !== undefined && limit !== '') parts.push(`limit="${limit}"`);
        if (name) parts.push(`name="${this.escapeParam(name)}"`);
        if (content) parts.push(`content="${this.escapeParam(content)}"`);
        if (format) parts.push(`format="${format}"`);
        if (folder) parts.push(`folder="${this.escapeParam(folder)}"`);
        if (ext) parts.push(`ext="${this.escapeParam(ext)}"`);
        if (status) parts.push(`status="${this.escapeParam(status)}"`);
        if (ref) parts.push(`ref="${this.escapeParam(ref)}"`);
        if (line !== undefined && line !== '') parts.push(`line="${line}"`);
        if (value !== undefined && value !== '') parts.push(`value="${this.escapeParam(value)}"`);
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
        if (filter) parts.push(`filter="${this.escapeParam(filter)}"`);

        Object.keys(flags).forEach(flag => {
            if (flags[flag] === true) {
                parts.push(flag);
            }
        });

        if (vault) {
            parts.push(`vault="${this.escapeParam(vault)}"`);
        }

        return parts.join(' ');
    }

    escapeParam(value) {
        if (typeof value !== 'string') return value;
        return value.replace(/"/g, '\\"');
    }

    async executeCommand(command) {
        if (!command || !command.trim()) {
            throw new Error('Command cannot be empty');
        }

        const entry = {
            command: command.trim(),
            timestamp: new Date().toISOString()
        };
        this.commandHistory.unshift(entry);
        if (this.commandHistory.length > 50) {
            this.commandHistory.length = 50;
        }

        const response = await fetch(`${this.serverUrl}/api/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: command.trim() })
        });

        if (!response.ok) {
            this.isOnline = false;
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        this.isOnline = true;
        this.notifyStatusChange('executed');

        return {
            success: data.success !== false,
            output: data.output || data.stdout || '',
            stderr: data.stderr || '',
            command: command.trim()
        };
    }

    async executeBuiltCommand(params) {
        const command = this.buildCommand(params);
        return await this.executeCommand(command);
    }

    buildURI(params) {
        const { command, vault, file, path, name, query, content } = params;
        let uri = '';

        if (command === 'open' || command === 'read' || command === 'file') {
            const target = path || file;
            if (target) {
                uri = `obsidian://open?file=${encodeURIComponent(target)}`;
            }
        } else if (command === 'create') {
            const target = path || name;
            if (target) {
                uri = `obsidian://new?file=${encodeURIComponent(target)}`;
                if (content) {
                    uri += `&content=${encodeURIComponent(content)}`;
                }
            }
        } else if (command === 'search' || command === 'search:open') {
            if (query) {
                uri = `obsidian://search?query=${encodeURIComponent(query)}`;
            }
        } else if (command === 'daily' || command === 'daily:read') {
            uri = `obsidian://daily`;
        }

        if (uri && vault) {
            uri += (uri.includes('?') ? '&' : '?') + `vault=${encodeURIComponent(vault)}`;
        }

        return uri || null;
    }

    getHistory() {
        return [...this.commandHistory];
    }

    setHistory(history) {
        if (Array.isArray(history)) {
            this.commandHistory = [...history];
        }
    }

    clearHistory() {
        this.commandHistory = [];
    }
}

window.ObsidianAdapter = ObsidianAdapter;
