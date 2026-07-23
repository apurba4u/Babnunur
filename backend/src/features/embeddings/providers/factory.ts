import { EmbeddingProvider } from '../types';
import { OpenAIEmbeddingProvider } from './openai-embedding';
import { LocalEmbeddingProvider } from './local-embedding';
import { config } from '../../../config';

export class EmbeddingFactory {
  private static providers = new Map<string, EmbeddingProvider>();
  private static initialized = false;

  static initialize(): void {
    if (EmbeddingFactory.initialized) return;
    EmbeddingFactory.initialized = true;
    const dimensions = 384;
    const model = 'text-embedding-3-small';

    const openaiKey = config.OPENAI_API_KEY;
    if (openaiKey) {
      EmbeddingFactory.register(new OpenAIEmbeddingProvider({ dimensions, maxBatchSize: 2048, model }, openaiKey));
    }

    EmbeddingFactory.register(new LocalEmbeddingProvider({ dimensions: 384, maxBatchSize: 1000, model: 'local-hash' }));
  }

  static register(provider: EmbeddingProvider): void {
    EmbeddingFactory.providers.set(provider.name, provider);
  }

  static getProvider(name?: string): EmbeddingProvider {
    EmbeddingFactory.initialize();
    const provider = name ? EmbeddingFactory.providers.get(name) : EmbeddingFactory.providers.get('local');
    if (!provider) throw new Error(`Embedding provider '${name}' not found`);
    return provider;
  }

  static getAvailableProviders(): string[] {
    EmbeddingFactory.initialize();
    return Array.from(EmbeddingFactory.providers.keys());
  }
}
