export interface RAGContext {
  query: string;
  documentIds?: string[];
  topK?: number;
  provider?: string;
  embeddingProvider?: string;
}

export interface RAGResult {
  chunks: Array<{
    chunkId: string;
    documentId: string;
    content: string;
    score: number;
    pageNumber?: number;
    citation: string;
  }>;
  enrichedPrompt: string;
  totalTokens: number;
}

export interface Citation {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  pageNumber?: number;
  content: string;
  score: number;
}
