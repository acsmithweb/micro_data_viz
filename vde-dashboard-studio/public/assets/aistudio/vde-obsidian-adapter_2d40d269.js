/**
 * vde-obsidian-adapter.js
 * 
 * Target Domain: Far Realm VDE Integration
 * Structural Role: Adapter Pattern for Obsidian CLI
 * 
 * Provides a clean, modular interface for Obsidian CLI command execution.
 * Encapsulates command construction and execution via local server.
 */

class ObsidianAdapter {
    constructor(serverUrl = 'http://localhost:5000') {
        this.serverUrl = serverUrl;
        this.commandHistory = [];
    }

    /**
     * Build an Obsidian CLI command from parameters
     * @param {Object} params - Command parameters
     * @returns {string} Constructed CLI command
     */
    buildCommand(params) {
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
            flags = {}
        } = params;

        if (!command) {
            throw new Error('Command is required');
        }

        let parts = [`obsidian ${command}`];

        // Add key-value parameters (order doesn't strictly matter but logical grouping helps)
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

        // Add boolean flags
        Object.keys(flags).forEach(flag => {
            if (flags[flag] === true) {
                parts.push(flag);
            }
        });

        // Add vault parameter if set
        if (vault) {
            parts.push(`vault="${this.escapeParam(vault)}"`);
        }

        return parts.join(' ');
    }

    /**
     * Escape special characters in parameters
     * @param {string} value - Parameter value
     * @returns {string} Escaped value
     */
    escapeParam(value) {
        if (typeof value !== 'string') return value;
        return value.replace(/"/g, '\\"');
    }

    /**
     * Execute Obsidian CLI command via server
     * @param {string} command - Command to execute
     * @returns {Promise<Object>} Execution result
     */
    async executeCommand(command) {
        if (!command || !command.trim()) {
            throw new Error('Command cannot be empty');
        }

        // Store in history
        this.commandHistory.push({
            command: command,
            timestamp: new Date().toISOString()
        });

        try {
            const response = await fetch(`${this.serverUrl}/api/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: command })
            });

            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            return {
                success: true,
                output: data.output || '',
                command: command
            };
        } catch (error) {
            console.error('[Obsidian Adapter] Execution Error:', error);
            throw error;
        }
    }

    /**
     * Build and execute command in one call
     * @param {Object} params - Command parameters
     * @returns {Promise<Object>} Execution result
     */
    async executeBuiltCommand(params) {
        const command = this.buildCommand(params);
        return await this.executeCommand(command);
    }

    /**
     * Generate Obsidian URI for direct protocol handling
     * @param {Object} params - URI parameters
     * @returns {string|null} Obsidian URI or null if not applicable
     */
    buildURI(params) {
        const { command, vault, file, path, query, content } = params;

        let uri = '';

        if (command === 'open' || command === 'read') {
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
        }

        if (uri && vault) {
            uri += `&vault=${encodeURIComponent(vault)}`;
        }

        return uri || null;
    }

    /**
     * Get command execution history
     * @returns {Array} Command history
     */
    getHistory() {
        return [...this.commandHistory];
    }

    /**
     * Clear command history
     */
    clearHistory() {
        this.commandHistory = [];
    }
}

// Global registration
window.ObsidianAdapter = ObsidianAdapter;

console.log("[Far Realm VDE] vde-obsidian-adapter.js successfully loaded.");
