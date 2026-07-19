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

export interface RAGChatResponse {
  response: string;
  citations: Citation[];
  tokenUsage: { input: number; output: number; total: number };
}

export interface HybridSearchParams {
  query: string;
  userId: string;
  topK?: number;
  alpha?: number;
  documentIds?: string[];
}

export interface RankedChunk {
  chunkId: string;
  documentId: string;
  content: string;
  denseScore: number;
  sparseScore: number;
  combinedScore: number;
  pageNumber?: number;
  citation: string;
}
