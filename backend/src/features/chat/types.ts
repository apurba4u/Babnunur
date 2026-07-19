export interface IConversation {
  userId: string;
  title: string;
  provider: string;
  model: string;
  modelVersion: string;
  systemPrompt?: string;
  status: 'active' | 'archived' | 'deleted';
  pinned: boolean;
  favorite: boolean;
  visibility: 'private' | 'shared';
  messageCount: number;
  lastMessageAt: Date;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  lastError?: string;
  settings: {
    temperature: number;
    maxTokens: number;
    topP?: number;
    systemPromptOverride?: string;
  };
  summary?: string;
  tags: string[];
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  messageType: 'text' | 'markdown' | 'code' | 'image' | 'file' | 'system' | 'tool';
  sequenceNumber: number;
  parentMessageId?: string;
  status: 'streaming' | 'completed' | 'failed' | 'cancelled';
  finishReason?: 'stop' | 'length' | 'error' | 'cancelled';
  provider: string;
  model: string;
  tokenCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  latencyMs: number;
  attachments: Array<{ name: string; type: string; size: number; url: string }>;
  citations: Array<{ title: string; url: string; snippet: string }>;
  toolCalls: Array<{ id: string; name: string; args: Record<string, unknown> }>;
  toolResults: Array<{ toolCallId: string; result: unknown }>;
  reasoning?: string;
  metadata?: Record<string, unknown>;
  error?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
