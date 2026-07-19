export interface MemoryEntry {
  userId: string;
  conversationId?: string;
  type: 'session' | 'user' | 'topic' | 'fact';
  content: string;
  importance: number;
  accessCount: number;
  lastAccessedAt: Date;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

export interface MemoryQuery {
  userId: string;
  conversationId?: string;
  query?: string;
  type?: string;
  limit?: number;
  minImportance?: number;
}
