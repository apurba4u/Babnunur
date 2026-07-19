export interface Document {
  _id: string;
  userId: string;
  title: string;
  filename: string;
  mimeType: string;
  size: number;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  chunkCount: number;
  metadata: {
    pages?: number;
    wordCount?: number;
    charCount?: number;
  };
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  _id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  pageNumber?: number;
  tokenCount: number;
  createdAt: string;
}

export interface ProcessingJob {
  _id: string;
  documentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}