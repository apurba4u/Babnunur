import { BaseEmbeddingProvider } from './base-embedding';
import { EmbeddingConfig } from '../types';

export class OpenAIEmbeddingProvider extends BaseEmbeddingProvider {
  readonly name = 'openai';
  private apiKey: string;

  constructor(config: EmbeddingConfig, apiKey: string) {
    super(config);
    this.apiKey = apiKey;
  }

  async embed(texts: string[]): Promise<number[][]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        input: texts,
      }),
    });

    const data = await response.json();
    return data.data.map((item: { embedding: number[] }) => item.embedding);
  }

  async embedSingle(text: string): Promise<number[]> {
    const results = await this.embed([text]);
    return results[0];
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!this.apiKey) errors.push('OPENAI_API_KEY is required');
    return { valid: errors.length === 0, errors };
  }
}
