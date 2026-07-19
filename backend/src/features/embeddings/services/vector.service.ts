import { Chunk } from '../../documents/models/chunk.model';
import { VectorSearchResult } from '../types';

export class VectorService {
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async search(queryEmbedding: number[], userId: string, options: { topK?: number; documentIds?: string[] } = {}): Promise<VectorSearchResult[]> {
    const { topK = 5, documentIds } = options;

    const filter: Record<string, unknown> = { userId, embedding: { $exists: true, $ne: [] } };
    if (documentIds?.length) filter.documentId = { $in: documentIds };

    const chunks = await Chunk.find(filter).lean();

    const scored = chunks.map((chunk) => ({
      chunkId: chunk._id.toString(),
      documentId: chunk.documentId,
      content: chunk.content,
      score: this.cosineSimilarity(queryEmbedding, chunk.embedding as number[]),
      pageNumber: chunk.pageNumber,
      metadata: chunk.metadata as Record<string, unknown>,
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}

export const vectorService = new VectorService();
