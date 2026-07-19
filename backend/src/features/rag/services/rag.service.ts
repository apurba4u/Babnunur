import { hybridSearch } from './hybrid-search';
import { ProviderFactory } from '../../ai/providers/factory';
import { ChatMessage, ChatChunk } from '../../ai/types';
import { RAGContext, Citation, RAGChatResponse, RankedChunk } from '../types';
import { Document } from '../../documents/models/document.model';

export class RAGService {
  private buildEnrichedPrompt(chunks: RankedChunk[], query: string): string {
    const contextText = chunks
      .map((c, i) => `[Source ${i + 1}] ${c.citation}\n${c.content}`)
      .join('\n\n---\n\n');

    return `Based on the following context, answer the user's question.\n\nContext:\n${contextText}\n\nQuestion: ${query}\n\nAnswer based on the context above. If the context doesn't contain enough information, say so.`;
  }

  private async retrieveHybrid(context: RAGContext, userId: string): Promise<{ chunks: RankedChunk[]; enrichedPrompt: string }> {
    const rankedChunks = await hybridSearch.search({
      query: context.query,
      userId,
      topK: context.topK || 5,
      documentIds: context.documentIds,
    });

    const enrichedPrompt = this.buildEnrichedPrompt(rankedChunks, context.query);
    return { chunks: rankedChunks, enrichedPrompt };
  }

  async chatWithDocuments(context: RAGContext, userId: string, history: ChatMessage[] = []): Promise<RAGChatResponse> {
    const { chunks, enrichedPrompt } = await this.retrieveHybrid(context, userId);

    const docIds = [...new Set(context.documentIds || [])];
    const documents = docIds.length > 0
      ? await Document.find({ _id: { $in: docIds } }).lean()
      : [];

    const citations: Citation[] = chunks.map((c) => ({
      chunkId: c.chunkId,
      documentId: c.documentId,
      documentTitle: documents.find((d) => d._id.toString() === c.documentId)?.title || 'Unknown',
      pageNumber: c.pageNumber,
      content: c.content,
      score: c.combinedScore,
    }));

    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are a helpful assistant that answers questions based on the provided documents. Always cite your sources when referencing document content.' },
      ...history,
      { role: 'user', content: enrichedPrompt },
    ];

    const provider = ProviderFactory.getProvider(context.provider || 'gemini');
    const response = await provider.chat(messages, { temperature: 0.3, maxTokens: 4096 });

    return {
      response: response.content,
      citations,
      tokenUsage: {
        input: response.inputTokens,
        output: response.outputTokens,
        total: response.totalTokens,
      },
    };
  }

  async *streamWithDocuments(context: RAGContext, userId: string, history: ChatMessage[] = []): AsyncGenerator<{ type: string; data: Citation[] | ChatChunk }> {
    const { chunks, enrichedPrompt } = await this.retrieveHybrid(context, userId);

    const docIds = [...new Set(context.documentIds || [])];
    const documents = docIds.length > 0
      ? await Document.find({ _id: { $in: docIds } }).lean()
      : [];

    const citations: Citation[] = chunks.map((c) => ({
      chunkId: c.chunkId,
      documentId: c.documentId,
      documentTitle: documents.find((d) => d._id.toString() === c.documentId)?.title || 'Unknown',
      pageNumber: c.pageNumber,
      content: c.content,
      score: c.combinedScore,
    }));

    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are a helpful assistant that answers questions based on the provided documents. Always cite your sources when referencing document content.' },
      ...history,
      { role: 'user', content: enrichedPrompt },
    ];

    const provider = ProviderFactory.getProvider(context.provider || 'gemini');

    yield { type: 'citations', data: citations };

    for await (const chunk of provider.streamChat(messages, { temperature: 0.3, maxTokens: 4096 })) {
      yield { type: 'token', data: chunk };
    }
  }
}

export const ragService = new RAGService();
