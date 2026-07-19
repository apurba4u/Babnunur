import { contextRetriever } from './context-retriever';
import { ProviderFactory } from '../../ai/providers/factory';
import { ChatMessage, ChatChunk } from '../../ai/types';
import { RAGContext, Citation, RAGChatResponse } from '../types';
import { Document } from '../../documents/models/document.model';

export class RAGService {
  async chatWithDocuments(context: RAGContext, userId: string, history: ChatMessage[] = []): Promise<RAGChatResponse> {
    const ragResult = await contextRetriever.retrieve(context, userId);

    const docIds = [...new Set(context.documentIds || [])];
    const documents = docIds.length > 0
      ? await Document.find({ _id: { $in: docIds } }).lean()
      : [];

    const citations: Citation[] = ragResult.chunks.map((c) => ({
      chunkId: c.chunkId,
      documentId: c.documentId,
      documentTitle: documents.find((d) => d._id.toString() === c.documentId)?.title || 'Unknown',
      pageNumber: c.pageNumber,
      content: c.content,
      score: c.score,
    }));

    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are a helpful assistant that answers questions based on the provided documents. Always cite your sources when referencing document content.' },
      ...history,
      { role: 'user', content: ragResult.enrichedPrompt },
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
    const ragResult = await contextRetriever.retrieve(context, userId);

    const docIds = [...new Set(context.documentIds || [])];
    const documents = docIds.length > 0
      ? await Document.find({ _id: { $in: docIds } }).lean()
      : [];

    const citations: Citation[] = ragResult.chunks.map((c) => ({
      chunkId: c.chunkId,
      documentId: c.documentId,
      documentTitle: documents.find((d) => d._id.toString() === c.documentId)?.title || 'Unknown',
      pageNumber: c.pageNumber,
      content: c.content,
      score: c.score,
    }));

    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are a helpful assistant that answers questions based on the provided documents. Always cite your sources when referencing document content.' },
      ...history,
      { role: 'user', content: ragResult.enrichedPrompt },
    ];

    const provider = ProviderFactory.getProvider(context.provider || 'gemini');

    yield { type: 'citations', data: citations };

    for await (const chunk of provider.streamChat(messages, { temperature: 0.3, maxTokens: 4096 })) {
      yield { type: 'token', data: chunk };
    }
  }
}

export const ragService = new RAGService();
