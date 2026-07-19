import { EmbeddingProvider, EmbeddingConfig } from '../types';

export abstract class BaseEmbeddingProvider implements EmbeddingProvider {
  abstract readonly name: string;
  protected config: EmbeddingConfig;

  constructor(config: EmbeddingConfig) {
    this.config = config;
  }

  abstract embed(texts: string[]): Promise<number[][]>;
  abstract embedSingle(text: string): Promise<number[]>;
  abstract validateConfig(): { valid: boolean; errors: string[] };

  getDimensions(): number {
    return this.config.dimensions;
  }
}
