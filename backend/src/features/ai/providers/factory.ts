import { AIProvider, ProviderModelInfo } from '../types';
import { GeminiProvider } from './gemini';
import { DeepSeekProvider } from './deepseek';

export class ProviderFactory {
  private static providers = new Map<string, AIProvider>();

  static {
    try { const gemini = new GeminiProvider(); ProviderFactory.register(gemini); } catch { /* Not configured */ }
    try { const deepseek = new DeepSeekProvider(); ProviderFactory.register(deepseek); } catch { /* Not configured */ }
  }

  static register(provider: AIProvider): void { ProviderFactory.providers.set(provider.name, provider); }
  static getProvider(name: string): AIProvider {
    const provider = ProviderFactory.providers.get(name);
    if (!provider) throw new Error(`Provider '${name}' not found. Available: ${ProviderFactory.getAvailableProviders().map((p) => p.name).join(', ')}`);
    return provider;
  }
  static getAvailableProviders(): ProviderModelInfo[] { return Array.from(ProviderFactory.providers.values()).map((p) => p.getModelInfo()); }
  static getCapabilities(name: string) {
    const provider = ProviderFactory.providers.get(name);
    if (!provider) return null;
    return { supportsStreaming: provider.supportsStreaming(), supportsVision: provider.supportsVision(), supportsToolCalling: provider.supportsToolCalling() };
  }
}
