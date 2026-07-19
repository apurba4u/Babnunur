import { vectorService } from '../../embeddings/services/vector.service';
import { bm25Service } from './bm25.service';
import { embeddingService } from '../../embeddings/services/embedding.service';
import { RankedChunk } from '../types';

export class HybridSearch {
  async search(params: { query: string; userId: string; topK?: number; alpha?: number; documentIds?: string[] }): Promise<RankedChunk[]> {
    const { query, userId, topK = 5, alpha = 0.7 } = params;

    const [denseResults, sparseResults] = await Promise.all([
      (async () => {
        try {
          const embedding = await embeddingService.embedQuery(query);
          return vectorService.search(embedding, userId, { topK: topK * 2, documentIds: params.documentIds });
        } catch { return []; }
      })(),
      bm25Service.search(query, userId, topK * 2),
    ]);

    const scoreMap = new Map<string, RankedChunk>();

    for (const r of denseResults) {
      scoreMap.set(r.chunkId, {
        chunkId: r.chunkId,
        documentId: r.documentId,
        content: r.content,
        denseScore: r.score,
        sparseScore: 0,
        combinedScore: r.score * alpha,
        pageNumber: r.pageNumber,
        citation: `[Doc]${r.pageNumber ? ` p.${r.pageNumber}` : ''}`,
      });
    }

    for (const r of sparseResults) {
      const existing = scoreMap.get(r.chunkId);
      if (existing) {
        existing.sparseScore = r.score;
        existing.combinedScore = existing.denseScore * alpha + r.score * (1 - alpha);
      } else {
        scoreMap.set(r.chunkId, {
          chunkId: r.chunkId,
          documentId: r.documentId,
          content: r.content,
          denseScore: 0,
          sparseScore: r.score,
          combinedScore: r.score * (1 - alpha),
          citation: '[Doc]',
        });
      }
    }

    const results = Array.from(scoreMap.values());
    results.sort((a, b) => b.combinedScore - a.combinedScore);
    return results.slice(0, topK);
  }
}

export const hybridSearch = new HybridSearch();