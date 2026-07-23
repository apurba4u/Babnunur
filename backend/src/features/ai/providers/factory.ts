import { AIProvider, ProviderModelInfo } from '../types';
import { OpenCodeZenProvider } from './opencode-zen';

export class ProviderFactory {
  private static providers = new Map<string, AIProvider>();
  private static initialized = false;

  static initialize(): void {
    if (ProviderFactory.initialized) return;
    ProviderFactory.initialized = true;
    try { const p = new OpenCodeZenProvider(); ProviderFactory.register(p); } catch { /* Not configured */ }
  }

  static register(provider: AIProvider): void { ProviderFactory.providers.set(provider.name, provider); }
  static getProvider(name: string): AIProvider {
    ProviderFactory.initialize();
    const provider = ProviderFactory.providers.get(name);
    if (!provider) throw new Error(`Provider '${name}' not found. Available: ${ProviderFactory.getAvailableProviders().map((p) => p.name).join(', ')}`);
    return provider;
  }
  static getAvailableProviders(): ProviderModelInfo[] {
    ProviderFactory.initialize();
    return Array.from(ProviderFactory.providers.values()).map((p) => p.getModelInfo());
  }
  static getFallbackProvider(_name: string): AIProvider | null {
    return null;
  }
  static getCapabilities(name: string): { supportsStreaming: boolean; supportsVision: boolean; supportsToolCalling: boolean } | null {
    ProviderFactory.initialize();
    const provider = ProviderFactory.providers.get(name);
    if (!provider) return null;
    return { supportsStreaming: provider.supportsStreaming(), supportsVision: provider.supportsVision(), supportsToolCalling: provider.supportsToolCalling() };
  }
}
