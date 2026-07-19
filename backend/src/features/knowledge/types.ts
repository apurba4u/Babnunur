export interface KnowledgeBase {
  userId: string;
  name: string;
  description: string;
  documentIds: string[];
  tags: string[];
  documentCount: number;
  totalChunks: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface KBQuery {
  userId: string;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}