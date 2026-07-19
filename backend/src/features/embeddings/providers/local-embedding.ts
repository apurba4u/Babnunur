import { BaseEmbeddingProvider } from './base-embedding';
import { EmbeddingConfig } from '../types';

export class LocalEmbeddingProvider extends BaseEmbeddingProvider {
  readonly name = 'local';

  constructor(config: EmbeddingConfig) {
    super(config);
  }

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((text) => this.generateHashEmbedding(text));
  }

  async embedSingle(text: string): Promise<number[]> {
    return this.generateHashEmbedding(text);
  }

  private generateHashEmbedding(text: string): number[] {
    const embedding: number[] = [];
    for (let i = 0; i < this.config.dimensions; i++) {
      let hash = 0;
      for (let j = 0; j < text.length; j++) {
        hash = ((hash << 5) - hash + text.charCodeAt(j) + i) | 0;
      }
      embedding.push(Math.sin(hash) * 0.1);
    }
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map((val) => val / norm);
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    return { valid: true, errors: [] };
  }
}
