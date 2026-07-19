import { embeddingService } from '../../embeddings/services/embedding.service';
import { vectorService } from '../../embeddings/services/vector.service';
import { Document } from '../../documents/models/document.model';
import { RAGContext, RAGResult } from '../types';

export class ContextRetriever {
  async retrieve(context: RAGContext, userId: string): Promise<RAGResult> {
    const queryEmbedding = await embeddingService.embedQuery(context.query, context.embeddingProvider);

    const searchResults = await vectorService.search(queryEmbedding, userId, {
      topK: context.topK || 5,
      documentIds: context.documentIds,
    });

    const docIds = [...new Set(searchResults.map((r) => r.documentId))];
    const documents = await Document.find({ _id: { $in: docIds } }).lean();
    const docMap = new Map(documents.map((d) => [d._id.toString(), d]));

    const chunks = searchResults.map((result) => {
      const doc = docMap.get(result.documentId);
      return {
        chunkId: result.chunkId,
        documentId: result.documentId,
        content: result.content,
        score: result.score,
        pageNumber: result.pageNumber,
        citation: `[${doc?.title || 'Unknown'}]${result.pageNumber ? ` p.${result.pageNumber}` : ''}`,
      };
    });

    const contextText = chunks
      .map((c, i) => `[Source ${i + 1}] ${c.citation}\n${c.content}`)
      .join('\n\n---\n\n');

    const enrichedPrompt = `Based on the following context, answer the user's question.\n\nContext:\n${contextText}\n\nQuestion: ${context.query}\n\nAnswer based on the context above. If the context doesn't contain enough information, say so.`;

    return {
      chunks,
      enrichedPrompt,
      totalTokens: Math.ceil(enrichedPrompt.length / 4),
    };
  }
}

export const contextRetriever = new ContextRetriever();
