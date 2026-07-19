export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  messageType?: 'text' | 'markdown' | 'code' | 'image' | 'file' | 'system' | 'tool';
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stream?: boolean;
  requestId?: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  finishReason: 'stop' | 'length' | 'error';
  providerResponseId?: string;
}

export interface ChatChunk {
  content: string;
  finishReason?: 'stop' | 'length' | 'error';
  tokenCount?: number;
}

export interface ProviderModelInfo {
  name: string;
  version: string;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsToolCalling: boolean;
}

export interface ProviderHealthStatus {
  healthy: boolean;
  latencyMs?: number;
  error?: string;
  lastChecked: Date;
}

export interface ProviderCapabilities {
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsToolCalling: boolean;
  maxTokens: number;
}

export interface AIProvider {
  readonly name: string;
  chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResponse>;
  streamChat(messages: ChatMessage[], options: ChatOptions): AsyncIterable<ChatChunk>;
  countTokens(text: string): Promise<number>;
  supportsStreaming(): boolean;
  supportsVision(): boolean;
  supportsToolCalling(): boolean;
  getModelInfo(): ProviderModelInfo;
  abort(requestId?: string): Promise<void>;
  validateConfig(): { valid: boolean; errors: string[] };
  healthCheck(): Promise<ProviderHealthStatus>;
}
