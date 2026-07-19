export interface EmbeddingProvider {
  readonly name: string;
  embed(texts: string[]): Promise<number[][]>;
  embedSingle(text: string): Promise<number[]>;
  getDimensions(): number;
  validateConfig(): { valid: boolean; errors: string[] };
}

export interface VectorSearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  pageNumber?: number;
  metadata: Record<string, unknown>;
}

export interface EmbeddingConfig {
  dimensions: number;
  maxBatchSize: number;
  model: string;
}
