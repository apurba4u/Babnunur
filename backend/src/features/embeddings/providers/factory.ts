import { EmbeddingProvider } from '../types';
import { OpenAIEmbeddingProvider } from './openai-embedding';
import { LocalEmbeddingProvider } from './local-embedding';

export class EmbeddingFactory {
  private static providers = new Map<string, EmbeddingProvider>();

  static {
    const dimensions = 384;
    const model = 'text-embedding-3-small';

    // Try OpenAI if key is available
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      EmbeddingFactory.register(new OpenAIEmbeddingProvider({ dimensions, maxBatchSize: 2048, model }, openaiKey));
    }

    // Always register local fallback
    EmbeddingFactory.register(new LocalEmbeddingProvider({ dimensions: 384, maxBatchSize: 1000, model: 'local-hash' }));
  }

  static register(provider: EmbeddingProvider): void {
    EmbeddingFactory.providers.set(provider.name, provider);
  }

  static getProvider(name?: string): EmbeddingProvider {
    const provider = name ? EmbeddingFactory.providers.get(name) : EmbeddingFactory.providers.get('local');
    if (!provider) throw new Error(`Embedding provider '${name}' not found`);
    return provider;
  }

  static getAvailableProviders(): string[] {
    return Array.from(EmbeddingFactory.providers.keys());
  }
}
