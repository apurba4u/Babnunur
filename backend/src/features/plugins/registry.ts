import { PluginDefinition } from './types';

class PluginRegistry {
  private plugins = new Map<string, PluginDefinition>();
  private hooks = new Map<string, Array<(data: unknown) => Promise<unknown>>>();

  register(plugin: PluginDefinition): void {
    this.plugins.set(plugin.id, plugin);
  }

  unregister(id: string): boolean {
    return this.plugins.delete(id);
  }

  get(id: string): PluginDefinition | undefined {
    return this.plugins.get(id);
  }

  getAll(): PluginDefinition[] {
    return Array.from(this.plugins.values());
  }

  getEnabled(): PluginDefinition[] {
    return this.getAll().filter(p => p.enabled);
  }

  registerHook(hookName: string, handler: (data: unknown) => Promise<unknown>): void {
    if (!this.hooks.has(hookName)) this.hooks.set(hookName, []);
    this.hooks.get(hookName)!.push(handler);
  }

  async executeHook(hookName: string, data: unknown): Promise<unknown> {
    const handlers = this.hooks.get(hookName) || [];
    let result = data;
    for (const handler of handlers) {
      result = await handler(result);
    }
    return result;
  }
}

export const pluginRegistry = new PluginRegistry();
