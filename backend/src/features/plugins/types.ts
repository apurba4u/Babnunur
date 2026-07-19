export interface PluginDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: string[];
  hooks: string[];
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface PluginHook {
  name: string;
  handler: (data: unknown) => Promise<unknown>;
}
