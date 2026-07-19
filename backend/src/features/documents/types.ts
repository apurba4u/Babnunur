export interface IDocument {
  userId: string;
  title: string;
  filename: string;
  mimeType: string;
  size: number;
  storagePath: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  chunkCount: number;
  metadata: IDocumentMetadata;
  error?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocumentMetadata {
  pages?: number;
  wordCount?: number;
  charCount?: number;
  language?: string;
  author?: string;
  createdAt?: string;
}

export interface IDocumentChunk {
  documentId: string;
  userId: string;
  chunkIndex: number;
  content: string;
  pageNumber?: number;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
  metadata: Record<string, unknown>;
  embedding?: number[];
  createdAt: Date;
}

export interface IDocumentProcessingJob {
  documentId: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}
