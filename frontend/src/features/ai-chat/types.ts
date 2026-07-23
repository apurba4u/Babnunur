export interface Conversation {
  _id: string;
  userId: string;
  title: string;
  provider: string;
  modelName: string;
  status: 'active' | 'archived' | 'deleted';
  pinned: boolean;
  favorite: boolean;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface Message {
  _id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  messageType: string;
  sequenceNumber: number;
  status: 'streaming' | 'completed' | 'failed' | 'cancelled';
  provider: string;
  modelName: string;
  tokenCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatRequest {
  conversationId: string;
  message: string;
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  attachments?: Attachment[];
}

export interface StreamEvent {
  type: string;
  data: Record<string, unknown>;
}
