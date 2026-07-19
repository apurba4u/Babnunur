# Babnunur Phase 3: AI Chat Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a production-ready AI Chat Assistant with multi-provider support (Gemini, DeepSeek), conversation management, streaming responses, and a polished frontend chat UI.

**Architecture:** Provider-agnostic AI layer with adapter pattern, backend-proxied SSE streaming, MongoDB conversation/message storage, and React chat UI with TanStack Query.

**Tech Stack:** TypeScript, Express.js, MongoDB/Mongoose, Gemini SDK, DeepSeek API, SSE, Next.js 15, React 19, Zustand, TanStack Query, react-markdown, react-syntax-highlighter

## Global Constraints

- Single Git monorepo, conventional commits after every milestone
- Never hardcode API keys — all from env vars
- Provider SDKs isolated inside adapters only
- No feature code imports Gemini or DeepSeek directly
- Backend-proxied SSE only — never expose provider keys to frontend
- TypeScript zero errors, ESLint zero errors after every milestone
- Each milestone independently testable and committable

---

## Milestone 3.1: AI Provider Layer

### Task 1: AI Types & Config

**Covers:** [S2]

**Files:**
- Create: `backend/src/features/ai/types.ts`
- Create: `backend/src/features/ai/config.ts`
- Create: `backend/src/features/ai/utils/errors.ts`

- [ ] **Step 1: Create backend/src/features/ai/types.ts**

```typescript
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
```

- [ ] **Step 2: Create backend/src/features/ai/config.ts**

```typescript
import { config } from '../../config';

export const aiConfig = {
  defaultProvider: 'gemini' as const,
  defaultModel: {
    gemini: 'gemini-2.0-flash',
    deepseek: 'deepseek-chat',
  },
  requestTimeout: Number(config.AI_REQUEST_TIMEOUT),
  maxTokens: Number(config.AI_MAX_TOKENS),
  temperature: Number(config.AI_TEMPERATURE),
  maxConcurrentStreams: 5,
  heartbeatInterval: 30000,
  retryCount: 3,
  retryDelay: 1000,
};
```

- [ ] **Step 3: Create backend/src/features/ai/utils/errors.ts**

```typescript
export class AIProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export class AITimeoutError extends AIProviderError {
  constructor(provider: string) {
    super('Request timed out', provider, 'TIMEOUT', true);
    this.name = 'AITimeoutError';
  }
}

export class AIRateLimitError extends AIProviderError {
  constructor(provider: string) {
    super('Rate limit exceeded', provider, 'RATE_LIMITED', true);
    this.name = 'AIRateLimitError';
  }
}

export class AIConfigError extends AIProviderError {
  constructor(provider: string, message: string) {
    super(message, provider, 'CONFIG_ERROR', false);
    this.name = 'AIConfigError';
  }
}
```

- [ ] **Step 4: Verify TypeScript**

Run: `cd backend && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add backend/src/features/ai/types.ts backend/src/features/ai/config.ts backend/src/features/ai/utils/errors.ts
git commit -m "feat(ai): add AI types, config, and error classes"
```

---

### Task 2: Gemini Provider

**Covers:** [S2]

**Files:**
- Create: `backend/src/features/ai/providers/gemini.ts`

**Dependencies:** Task 1 (types, config, errors)

- [ ] **Step 1: Create backend/src/features/ai/providers/gemini.ts**

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../config';
import { aiConfig } from '../config';
import {
  AIProvider,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatChunk,
  ProviderModelInfo,
  ProviderHealthStatus,
} from '../types';
import { AIConfigError, AITimeoutError } from '../utils/errors';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private client: GoogleGenerativeAI;
  private abortControllers = new Map<string, AbortController>();

  constructor() {
    if (!config.GEMINI_API_KEY) {
      throw new AIConfigError(this.name, 'GEMINI_API_KEY is required');
    }
    this.client = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  }

  private get model() {
    return this.client.getGenerativeModel({
      model: aiConfig.defaultModel.gemini,
    });
  }

  async chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResponse> {
    const start = Date.now();
    const requestId = options.requestId || crypto.randomUUID();

    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const systemInstruction = messages.find((m) => m.role === 'system')?.content;

    try {
      const result = await this.model.generateContent({
        contents,
        systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature: options.temperature ?? aiConfig.temperature,
          maxOutputTokens: options.maxTokens ?? aiConfig.maxTokens,
        },
      });

      const response = result.response;
      const text = response.text();
      const usage = response.usageMetadata;

      return {
        content: text,
        model: aiConfig.defaultModel.gemini,
        provider: this.name,
        inputTokens: usage?.promptTokenCount || 0,
        outputTokens: usage?.candidatesTokenCount || 0,
        totalTokens: usage?.totalTokenCount || 0,
        latencyMs: Date.now() - start,
        finishReason: 'stop',
      };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new AITimeoutError(this.name);
      }
      throw error;
    }
  }

  async *streamChat(messages: ChatMessage[], options: ChatOptions): AsyncIterable<ChatChunk> {
    const requestId = options.requestId || crypto.randomUUID();
    const abortController = new AbortController();
    this.abortControllers.set(requestId, abortController);

    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const systemInstruction = messages.find((m) => m.role === 'system')?.content;

    try {
      const result = await this.model.generateContentStream({
        contents,
        systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature: options.temperature ?? aiConfig.temperature,
          maxOutputTokens: options.maxTokens ?? aiConfig.maxTokens,
        },
      });

      for await (const chunk of result.stream) {
        if (abortController.signal.aborted) break;
        const text = chunk.text();
        if (text) {
          yield { content: text };
        }
      }

      yield { content: '', finishReason: 'stop' };
    } catch (error) {
      if (abortController.signal.aborted) {
        yield { content: '', finishReason: 'error' };
        return;
      }
      throw error;
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  async countTokens(text: string): Promise<number> {
    const result = await this.model.countTokens({ contents: [{ role: 'user', parts: [{ text }] }] });
    return result.totalTokens;
  }

  supportsStreaming(): boolean { return true; }
  supportsVision(): boolean { return true; }
  supportsToolCalling(): boolean { return true; }

  getModelInfo(): ProviderModelInfo {
    return {
      name: 'gemini',
      version: aiConfig.defaultModel.gemini,
      maxTokens: 8192,
      supportsStreaming: true,
      supportsVision: true,
      supportsToolCalling: true,
    };
  }

  async abort(requestId?: string): Promise<void> {
    if (requestId) {
      this.abortControllers.get(requestId)?.abort();
    }
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.GEMINI_API_KEY) errors.push('GEMINI_API_KEY is required');
    return { valid: errors.length === 0, errors };
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    const start = Date.now();
    try {
      await this.countTokens('health check');
      return { healthy: true, latencyMs: Date.now() - start, lastChecked: new Date() };
    } catch (error) {
      return { healthy: false, error: (error as Error).message, lastChecked: new Date() };
    }
  }
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd backend && npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add backend/src/features/ai/providers/gemini.ts
git commit -m "feat(ai): add Gemini provider adapter"
```

---

### Task 3: DeepSeek Provider

**Covers:** [S2]

**Files:**
- Create: `backend/src/features/ai/providers/deepseek.ts`

**Dependencies:** Task 1 (types, config, errors)

- [ ] **Step 1: Create backend/src/features/ai/providers/deepseek.ts**

```typescript
import { config } from '../../config';
import { aiConfig } from '../config';
import {
  AIProvider,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatChunk,
  ProviderModelInfo,
  ProviderHealthStatus,
} from '../types';
import { AIConfigError, AITimeoutError } from '../utils/errors';

export class DeepSeekProvider implements AIProvider {
  readonly name = 'deepseek';
  private abortControllers = new Map<string, AbortController>();

  constructor() {
    if (!config.DEEPSEEK_API_KEY) {
      throw new AIConfigError(this.name, 'DEEPSEEK_API_KEY is required');
    }
  }

  private getApiUrl(): string {
    return 'https://api.deepseek.com/v1/chat/completions';
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.DEEPSEEK_API_KEY}`,
    };
  }

  private formatMessages(messages: ChatMessage[]): Array<{ role: string; content: string }> {
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }

  async chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResponse> {
    const start = Date.now();

    const response = await fetch(this.getApiUrl(), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: options.model || aiConfig.defaultModel.deepseek,
        messages: this.formatMessages(messages),
        temperature: options.temperature ?? aiConfig.temperature,
        max_tokens: options.maxTokens ?? aiConfig.maxTokens,
        stream: false,
      }),
      signal: AbortSignal.timeout(aiConfig.requestTimeout),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content || '',
      model: data.model || aiConfig.defaultModel.deepseek,
      provider: this.name,
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
      latencyMs: Date.now() - start,
      finishReason: choice?.finish_reason === 'stop' ? 'stop' : 'length',
    };
  }

  async *streamChat(messages: ChatMessage[], options: ChatOptions): AsyncIterable<ChatChunk> {
    const requestId = options.requestId || crypto.randomUUID();
    const abortController = new AbortController();
    this.abortControllers.set(requestId, abortController);

    try {
      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: options.model || aiConfig.defaultModel.deepseek,
          messages: this.formatMessages(messages),
          temperature: options.temperature ?? aiConfig.temperature,
          max_tokens: options.maxTokens ?? aiConfig.maxTokens,
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `DeepSeek API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              yield { content: '', finishReason: 'stop' };
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield { content };
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      yield { content: '', finishReason: 'stop' };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        yield { content: '', finishReason: 'error' };
        return;
      }
      throw error;
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  async countTokens(text: string): Promise<number> {
    return Math.ceil(text.length / 4);
  }

  supportsStreaming(): boolean { return true; }
  supportsVision(): boolean { return false; }
  supportsToolCalling(): boolean { return true; }

  getModelInfo(): ProviderModelInfo {
    return {
      name: 'deepseek',
      version: aiConfig.defaultModel.deepseek,
      maxTokens: 8192,
      supportsStreaming: true,
      supportsVision: false,
      supportsToolCalling: true,
    };
  }

  async abort(requestId?: string): Promise<void> {
    if (requestId) {
      this.abortControllers.get(requestId)?.abort();
    }
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.DEEPSEEK_API_KEY) errors.push('DEEPSEEK_API_KEY is required');
    return { valid: errors.length === 0, errors };
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    const start = Date.now();
    try {
      await this.chat([{ role: 'user', content: 'hi' }], { maxTokens: 5 });
      return { healthy: true, latencyMs: Date.now() - start, lastChecked: new Date() };
    } catch (error) {
      return { healthy: false, error: (error as Error).message, lastChecked: new Date() };
    }
  }
}
```

- [ ] **Step 2: Verify TypeScript**

- [ ] **Step 3: Commit**

```bash
git add backend/src/features/ai/providers/deepseek.ts
git commit -m "feat(ai): add DeepSeek provider adapter"
```

---

### Task 4: Provider Factory

**Covers:** [S2]

**Files:**
- Create: `backend/src/features/ai/providers/factory.ts`
- Create: `backend/src/features/ai/providers/index.ts`

**Dependencies:** Tasks 2, 3 (providers)

- [ ] **Step 1: Create backend/src/features/ai/providers/factory.ts**

```typescript
import { AIProvider, ProviderModelInfo } from '../types';
import { GeminiProvider } from './gemini';
import { DeepSeekProvider } from './deepseek';

export class ProviderFactory {
  private static providers = new Map<string, AIProvider>();

  static {
    try {
      const gemini = new GeminiProvider();
      ProviderFactory.register(gemini);
    } catch {
      // Gemini not configured
    }
    try {
      const deepseek = new DeepSeekProvider();
      ProviderFactory.register(deepseek);
    } catch {
      // DeepSeek not configured
    }
  }

  static register(provider: AIProvider): void {
    ProviderFactory.providers.set(provider.name, provider);
  }

  static getProvider(name: string): AIProvider {
    const provider = ProviderFactory.providers.get(name);
    if (!provider) {
      throw new Error(`Provider '${name}' not found. Available: ${ProviderFactory.getAvailableProviders().map((p) => p.name).join(', ')}`);
    }
    return provider;
  }

  static getAvailableProviders(): ProviderModelInfo[] {
    return Array.from(ProviderFactory.providers.values()).map((p) => p.getModelInfo());
  }

  static getCapabilities(name: string) {
    const provider = ProviderFactory.providers.get(name);
    if (!provider) return null;
    return {
      supportsStreaming: provider.supportsStreaming(),
      supportsVision: provider.supportsVision(),
      supportsToolCalling: provider.supportsToolCalling(),
    };
  }
}
```

- [ ] **Step 2: Create backend/src/features/ai/providers/index.ts**

```typescript
export { ProviderFactory } from './factory';
export { GeminiProvider } from './gemini';
export { DeepSeekProvider } from './deepseek';
```

- [ ] **Step 3: Verify TypeScript**

- [ ] **Step 4: Commit**

```bash
git add backend/src/features/ai/providers/factory.ts backend/src/features/ai/providers/index.ts
git commit -m "feat(ai): add provider factory with auto-registration"
```

---

## Milestone 3.2: Conversation & Message Models

### Task 5: Conversation Model

**Covers:** [S3, S6]

**Files:**
- Create: `backend/src/features/chat/types.ts`
- Create: `backend/src/features/chat/models/conversation.model.ts`

**Dependencies:** None (standalone)

- [ ] **Step 1: Create backend/src/features/chat/types.ts**

```typescript
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
  error?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 2: Create backend/src/features/chat/models/conversation.model.ts**

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import { IConversation } from '../types';

export interface ConversationDocument extends IConversation, Document {}

const conversationSchema = new Schema<ConversationDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, default: 'New Conversation' },
    provider: { type: String, required: true, default: 'gemini' },
    model: { type: String, required: true, default: 'gemini-2.0-flash' },
    modelVersion: { type: String, default: '' },
    systemPrompt: { type: String },
    status: { type: String, enum: ['active', 'archived', 'deleted'], default: 'active' },
    pinned: { type: Boolean, default: false },
    favorite: { type: Boolean, default: false },
    visibility: { type: String, enum: ['private', 'shared'], default: 'private' },
    messageCount: { type: Number, default: 0 },
    lastMessageAt: { type: Date },
    totalInputTokens: { type: Number, default: 0 },
    totalOutputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    lastError: { type: String },
    settings: {
      temperature: { type: Number, default: 0.7 },
      maxTokens: { type: Number, default: 4096 },
      topP: { type: Number },
      systemPromptOverride: { type: String },
    },
    summary: { type: String },
    tags: [{ type: String }],
    deletedAt: { type: Date },
    deletedBy: { type: String },
  },
  { timestamps: true }
);

conversationSchema.index({ userId: 1, lastMessageAt: -1 });
conversationSchema.index({ userId: 1, status: 1, updatedAt: -1 });
conversationSchema.index({ userId: 1, favorite: 1 });
conversationSchema.index({ userId: 1, pinned: 1 });

export const Conversation = mongoose.model<ConversationDocument>('Conversation', conversationSchema);
```

- [ ] **Step 3: Verify TypeScript**

- [ ] **Step 4: Commit**

```bash
git add backend/src/features/chat/types.ts backend/src/features/chat/models/conversation.model.ts
git commit -m "feat(chat): add Conversation model with indexes"
```

---

### Task 6: Message Model

**Covers:** [S3, S6]

**Files:**
- Create: `backend/src/features/chat/models/message.model.ts`

**Dependencies:** Task 5 (types)

- [ ] **Step 1: Create backend/src/features/chat/models/message.model.ts**

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import { IMessage } from '../types';

export interface MessageDocument extends IMessage, Document {}

const messageSchema = new Schema<MessageDocument>(
  {
    conversationId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'markdown', 'code', 'image', 'file', 'system', 'tool'], default: 'text' },
    sequenceNumber: { type: Number, required: true },
    parentMessageId: { type: String },
    status: { type: String, enum: ['streaming', 'completed', 'failed', 'cancelled'], default: 'completed' },
    finishReason: { type: String, enum: ['stop', 'length', 'error', 'cancelled'] },
    provider: { type: String, required: true },
    model: { type: String, required: true },
    tokenCount: { type: Number, default: 0 },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
    attachments: [{ name: String, type: String, size: Number, url: String }],
    citations: [{ title: String, url: String, snippet: String }],
    toolCalls: [{ id: String, name: String, args: Schema.Types.Mixed }],
    toolResults: [{ toolCallId: String, result: Schema.Types.Mixed }],
    reasoning: { type: String },
    error: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, sequenceNumber: 1 });
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ conversationId: 1, status: 1 });

export const Message = mongoose.model<MessageDocument>('Message', messageSchema);
```

- [ ] **Step 2: Verify TypeScript**

- [ ] **Step 3: Commit**

```bash
git add backend/src/features/chat/models/message.model.ts
git commit -m "feat(chat): add Message model with streaming support"
```

---

## Milestone 3.3: Prompt Engine

### Task 7: Prompt Templates & Engine

**Covers:** [S4]

**Files:**
- Create: `backend/src/features/ai/prompts/types.ts`
- Create: `backend/src/features/ai/prompts/templates/chat.ts`
- Create: `backend/src/features/ai/prompts/engine.ts`
- Create: `backend/src/features/ai/prompts/registry.ts`

**Dependencies:** Task 1 (types)

- [ ] **Step 1: Create backend/src/features/ai/prompts/types.ts**

```typescript
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  version: number;
  category: string;
  tags: string[];
  systemPrompt: string;
  variables: string[];
  features: string[];
  supportedProviders: string[];
  maxTokens: number;
  temperature: number;
  priority: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptContext {
  user: { id: string; name: string; email: string };
  conversation: { id: string; title: string };
  history: Array<{ role: string; content: string }>;
  featureContext: Record<string, unknown>;
}

export interface RenderedPrompt {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

- [ ] **Step 2: Create backend/src/features/ai/prompts/templates/chat.ts**

```typescript
import { PromptTemplate } from '../types';

export const chatTemplate: PromptTemplate = {
  id: 'chat-default',
  name: 'General Chat',
  description: 'Default system prompt for general conversation',
  version: 1,
  category: 'chat',
  tags: ['general', 'conversation'],
  systemPrompt: `You are Babnunur, a helpful AI assistant. You provide clear, accurate, and helpful responses.

Guidelines:
- Be concise and direct
- Use markdown formatting when appropriate
- For code, use code blocks with language specification
- Be honest about limitations
- Respect user preferences`,
  variables: [],
  features: ['chat'],
  supportedProviders: ['gemini', 'deepseek'],
  maxTokens: 4096,
  temperature: 0.7,
  priority: 10,
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const codeTemplate: PromptTemplate = {
  id: 'chat-code',
  name: 'Code Assistant',
  description: 'System prompt for programming assistance',
  version: 1,
  category: 'code',
  tags: ['programming', 'code', 'development'],
  systemPrompt: `You are an expert programming assistant. You help with:
- Writing code in any language
- Debugging and fixing errors
- Explaining code logic
- Code review and optimization
- Best practices and patterns

Always:
- Use proper syntax highlighting in code blocks
- Explain your approach before showing code
- Consider edge cases and error handling
- Follow language-specific conventions`,
  variables: [],
  features: ['code'],
  supportedProviders: ['gemini', 'deepseek'],
  maxTokens: 4096,
  temperature: 0.3,
  priority: 20,
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
```

- [ ] **Step 3: Create backend/src/features/ai/prompts/engine.ts**

```typescript
import { PromptTemplate, PromptContext, RenderedPrompt, ValidationResult } from './types';
import { promptRegistry } from './registry';

export class PromptEngine {
  render(templateId: string, context: PromptContext, provider?: string): RenderedPrompt {
    const template = promptRegistry.get(templateId);
    if (!template) {
      throw new Error(`Prompt template '${templateId}' not found`);
    }

    let systemPrompt = template.systemPrompt;

    // Inject user context
    systemPrompt = systemPrompt.replace('{{userName}}', context.user.name);

    // Inject conversation context
    systemPrompt = systemPrompt.replace('{{conversationTitle}}', context.conversation.title);

    // Inject feature context
    for (const [key, value] of Object.entries(context.featureContext)) {
      systemPrompt = systemPrompt.replace(`{{${key}}}`, String(value));
    }

    return {
      systemPrompt,
      temperature: template.temperature,
      maxTokens: template.maxTokens,
    };
  }

  getTemplate(id: string, version?: number): PromptTemplate | undefined {
    return promptRegistry.get(id, version);
  }

  listTemplates(feature?: string): PromptTemplate[] {
    return promptRegistry.list(feature);
  }

  validate(template: PromptTemplate, context: PromptContext): ValidationResult {
    const errors: string[] = [];

    for (const variable of template.variables) {
      if (!(variable in context.featureContext) && ![`{{${variable}}}`].some((p) => template.systemPrompt.includes(p))) {
        errors.push(`Missing variable: ${variable}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

export const promptEngine = new PromptEngine();
```

- [ ] **Step 4: Create backend/src/features/ai/prompts/registry.ts**

```typescript
import { PromptTemplate } from './types';
import { chatTemplate, codeTemplate } from './templates/chat';

class PromptRegistry {
  private templates = new Map<string, PromptTemplate>();

  constructor() {
    this.register(chatTemplate);
    this.register(codeTemplate);
  }

  register(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  get(id: string, version?: number): PromptTemplate | undefined {
    if (version) {
      return Array.from(this.templates.values()).find((t) => t.id === id && t.version === version);
    }
    return this.templates.get(id);
  }

  list(feature?: string): PromptTemplate[] {
    const all = Array.from(this.templates.values()).filter((t) => t.enabled);
    if (feature) {
      return all.filter((t) => t.features.includes(feature));
    }
    return all;
  }
}

export const promptRegistry = new PromptRegistry();
```

- [ ] **Step 5: Verify TypeScript**

- [ ] **Step 6: Commit**

```bash
git add backend/src/features/ai/prompts/
git commit -m "feat(ai): add prompt engine with templates and registry"
```

---

## Milestone 3.4: Chat Service & Streaming

### Task 8: Chat Service

**Covers:** [S2, S3, S5]

**Files:**
- Create: `backend/src/features/chat/services/conversation.service.ts`
- Create: `backend/src/features/chat/services/message.service.ts`
- Create: `backend/src/features/ai/services/chat.service.ts`

**Dependencies:** Tasks 4, 5, 6, 7

- [ ] **Step 1: Create backend/src/features/chat/services/conversation.service.ts**

```typescript
import { Conversation, ConversationDocument } from '../models/conversation.model';
import { NotFoundError } from '../../../core/errors';

export class ConversationService {
  async list(userId: string, params: { page: number; limit: number; search?: string; status?: string }) {
    const { page, limit, search, status } = params;
    const filter: Record<string, unknown> = { userId, deletedAt: { $exists: false } };
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (status) filter.status = status;

    const [conversations, total] = await Promise.all([
      Conversation.find(filter).sort({ lastMessageAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Conversation.countDocuments(filter),
    ]);

    return { data: conversations, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string, userId: string): Promise<ConversationDocument> {
    const conv = await Conversation.findOne({ _id: id, userId, deletedAt: { $exists: false } });
    if (!conv) throw new NotFoundError('Conversation');
    return conv;
  }

  async create(data: { userId: string; title?: string; provider?: string; model?: string }): Promise<ConversationDocument> {
    return Conversation.create({
      userId,
      title: data.title || 'New Conversation',
      provider: data.provider || 'gemini',
      model: data.model || 'gemini-2.0-flash',
    });
  }

  async update(id: string, userId: string, data: Partial<{ title: string; provider: string; model: string; settings: Record<string, unknown> }>): Promise<ConversationDocument> {
    const conv = await Conversation.findOneAndUpdate(
      { _id: id, userId },
      { $set: data },
      { new: true }
    );
    if (!conv) throw new NotFoundError('Conversation');
    return conv;
  }

  async delete(id: string, userId: string): Promise<void> {
    const conv = await Conversation.findOneAndUpdate(
      { _id: id, userId },
      { $set: { deletedAt: new Date(), deletedBy: userId, status: 'deleted' } }
    );
    if (!conv) throw new NotFoundError('Conversation');
  }

  async archive(id: string, userId: string): Promise<ConversationDocument> {
    const conv = await Conversation.findOneAndUpdate(
      { _id: id, userId },
      { $set: { status: 'archived' } },
      { new: true }
    );
    if (!conv) throw new NotFoundError('Conversation');
    return conv;
  }

  async restore(id: string, userId: string): Promise<ConversationDocument> {
    const conv = await Conversation.findOneAndUpdate(
      { _id: id, userId, deletedAt: { $exists: true } },
      { $set: { status: 'active' }, $unset: { deletedAt: '', deletedBy: '' } },
      { new: true }
    );
    if (!conv) throw new NotFoundError('Conversation');
    return conv;
  }
}

export const conversationService = new ConversationService();
```

- [ ] **Step 2: Create backend/src/features/chat/services/message.service.ts**

```typescript
import { Message, MessageDocument } from '../models/message.model';
import { Conversation } from '../models/conversation.model';
import { NotFoundError } from '../../../core/errors';

export class MessageService {
  async listByConversation(conversationId: string, userId: string, params: { limit?: number; before?: string }) {
    const filter: Record<string, unknown> = { conversationId, userId, deletedAt: { $exists: false } };
    if (params.before) {
      filter.createdAt = { $lt: new Date(params.before) };
    }

    const messages = await Message.find(filter)
      .sort({ sequenceNumber: -1 })
      .limit(params.limit || 50)
      .lean();

    return messages.reverse();
  }

  async create(data: {
    conversationId: string;
    userId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    provider: string;
    model: string;
    messageType?: string;
    parentMessageId?: string;
  }): Promise<MessageDocument> {
    const lastMsg = await Message.findOne({ conversationId: data.conversationId })
      .sort({ sequenceNumber: -1 })
      .select('sequenceNumber');

    const sequenceNumber = (lastMsg?.sequenceNumber || 0) + 1;

    const message = await Message.create({
      ...data,
      sequenceNumber,
      messageType: data.messageType || 'text',
      status: 'completed',
    });

    await Conversation.findByIdAndUpdate(data.conversationId, {
      $inc: { messageCount: 1 },
      $set: { lastMessageAt: new Date() },
    });

    return message;
  }

  async updateStreaming(id: string, data: Partial<{ content: string; status: string; latencyMs: number; tokenCount: number }>): Promise<MessageDocument> {
    const msg = await Message.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!msg) throw new NotFoundError('Message');
    return msg;
  }

  async delete(id: string, userId: string): Promise<void> {
    const msg = await Message.findOneAndUpdate(
      { _id: id, userId },
      { $set: { deletedAt: new Date() } }
    );
    if (!msg) throw new NotFoundError('Message');
  }
}

export const messageService = new MessageService();
```

- [ ] **Step 3: Create backend/src/features/ai/services/chat.service.ts**

```typescript
import { ProviderFactory } from '../providers/factory';
import { promptEngine } from '../prompts/engine';
import { ChatMessage, ChatOptions, ChatChunk } from '../types';
import { conversationService } from '../../chat/services/conversation.service';
import { messageService } from '../../chat/services/message.service';

export class ChatService {
  async sendMessage(params: {
    userId: string;
    conversationId: string;
    content: string;
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }) {
    const { userId, conversationId, content, provider: providerName, model, temperature, maxTokens } = params;

    // Verify conversation ownership
    const conversation = await conversationService.getById(conversationId, userId);

    // Create user message
    const userMessage = await messageService.create({
      conversationId,
      userId,
      role: 'user',
      content,
      provider: providerName || conversation.provider,
      model: model || conversation.model,
    });

    // Get conversation history
    const history = await messageService.listByConversation(conversationId, userId, { limit: 50 });

    // Build messages for provider
    const messages: ChatMessage[] = [
      { role: 'system', content: conversation.settings?.systemPromptOverride || 'You are a helpful assistant.' },
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    // Get provider
    const provider = ProviderFactory.getProvider(providerName || conversation.provider);

    // Create assistant message placeholder
    const assistantMessage = await messageService.create({
      conversationId,
      userId,
      role: 'assistant',
      content: '',
      provider: providerName || conversation.provider,
      model: model || conversation.model,
      parentMessageId: userMessage._id.toString(),
    });

    // Stream response
    const chunks: string[] = [];
    try {
      for await (const chunk of provider.streamChat(messages, {
        temperature: temperature ?? conversation.settings?.temperature,
        maxTokens: maxTokens ?? conversation.settings?.maxTokens,
        model: model || conversation.model,
        requestId: assistantMessage._id.toString(),
      })) {
        if (chunk.content) {
          chunks.push(chunk.content);
          // Update message in DB for persistence
          await messageService.updateStreaming(assistantMessage._id.toString(), {
            content: chunks.join(''),
            status: 'streaming',
          });
        }
      }

      // Finalize message
      const finalContent = chunks.join('');
      await messageService.updateStreaming(assistantMessage._id.toString(), {
        content: finalContent,
        status: 'completed',
      });

      return { userMessage, assistantMessage: { ...assistantMessage, content: finalContent } };
    } catch (error) {
      await messageService.updateStreaming(assistantMessage._id.toString(), {
        status: 'failed',
        content: chunks.join('') || '',
      });
      throw error;
    }
  }

  async *streamMessage(params: {
    userId: string;
    conversationId: string;
    content: string;
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    requestId?: string;
  }): AsyncIterable<ChatChunk> {
    const { userId, conversationId, content, provider: providerName, model, temperature, maxTokens, requestId } = params;

    const conversation = await conversationService.getById(conversationId, userId);

    const userMessage = await messageService.create({
      conversationId,
      userId,
      role: 'user',
      content,
      provider: providerName || conversation.provider,
      model: model || conversation.model,
    });

    const history = await messageService.listByConversation(conversationId, userId, { limit: 50 });

    const messages: ChatMessage[] = [
      { role: 'system', content: conversation.settings?.systemPromptOverride || 'You are a helpful assistant.' },
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    const provider = ProviderFactory.getProvider(providerName || conversation.provider);

    const assistantMessage = await messageService.create({
      conversationId,
      userId,
      role: 'assistant',
      content: '',
      provider: providerName || conversation.provider,
      model: model || conversation.model,
      parentMessageId: userMessage._id.toString(),
    });

    const chunks: string[] = [];
    const start = Date.now();

    try {
      for await (const chunk of provider.streamChat(messages, {
        temperature: temperature ?? conversation.settings?.temperature,
        maxTokens: maxTokens ?? conversation.settings?.maxTokens,
        model: model || conversation.model,
        requestId: requestId || assistantMessage._id.toString(),
      })) {
        if (chunk.content) {
          chunks.push(chunk.content);
          yield chunk;
        }
        if (chunk.finishReason) {
          yield chunk;
        }
      }

      const finalContent = chunks.join('');
      await messageService.updateStreaming(assistantMessage._id.toString(), {
        content: finalContent,
        status: 'completed',
        latencyMs: Date.now() - start,
      });
    } catch (error) {
      await messageService.updateStreaming(assistantMessage._id.toString(), {
        status: 'failed',
        content: chunks.join(''),
      });
      throw error;
    }
  }
}

export const chatService = new ChatService();
```

- [ ] **Step 4: Verify TypeScript**

- [ ] **Step 5: Commit**

```bash
git add backend/src/features/chat/services/ backend/src/features/ai/services/
git commit -m "feat(chat): add conversation and message services with streaming"
```

---

## Milestone 3.5: API Routes

### Task 9: Chat & Conversation Routes

**Covers:** [S7]

**Files:**
- Create: `backend/src/features/chat/controllers/conversation.controller.ts`
- Create: `backend/src/features/chat/routes/conversation.routes.ts`
- Create: `backend/src/features/chat/routes/chat.routes.ts`
- Update: `backend/src/app.ts`

**Dependencies:** Tasks 8

- [ ] **Step 1: Create backend/src/features/chat/controllers/conversation.controller.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import { conversationService } from '../services/conversation.service';
import { messageService } from '../services/message.service';

export class ConversationController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const result = await conversationService.list(req.user!.id, { page, limit, search, status });
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conv = await conversationService.getById(req.params.id, req.user!.id);
      const messages = await messageService.listByConversation(req.params.id, req.user!.id, { limit: 100 });
      res.json({ success: true, data: { ...conv.toObject(), messages } });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conv = await conversationService.create({ userId: req.user!.id, ...req.body });
      res.status(201).json({ success: true, data: conv });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conv = await conversationService.update(req.params.id, req.user!.id, req.body);
      res.json({ success: true, data: conv });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await conversationService.delete(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Conversation deleted' });
    } catch (err) { next(err); }
  }

  async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conv = await conversationService.archive(req.params.id, req.user!.id);
      res.json({ success: true, data: conv });
    } catch (err) { next(err); }
  }

  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const conv = await conversationService.restore(req.params.id, req.user!.id);
      res.json({ success: true, data: conv });
    } catch (err) { next(err); }
  }
}

export const conversationController = new ConversationController();
```

- [ ] **Step 2: Create backend/src/features/chat/routes/conversation.routes.ts**

```typescript
import { Router } from 'express';
import { conversationController } from '../controllers/conversation.controller';
import { requireAuth } from '../../../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', conversationController.list);
router.post('/', conversationController.create);
router.get('/:id', conversationController.getById);
router.patch('/:id', conversationController.update);
router.delete('/:id', conversationController.delete);
router.post('/:id/archive', conversationController.archive);
router.post('/:id/restore', conversationController.restore);

export default router;
```

- [ ] **Step 3: Create backend/src/features/chat/routes/chat.routes.ts**

```typescript
import { Router, Request, Response } from 'express';
import { chatService } from '../../ai/services/chat.service';
import { requireAuth } from '../../../middleware/auth';

const router = Router();
router.use(requireAuth);

router.post('/stream', async (req: Request, res: Response) => {
  const { conversationId, message, provider, model, temperature, maxTokens } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const requestId = crypto.randomUUID();

  try {
    const stream = chatService.streamMessage({
      userId: req.user!.id,
      conversationId,
      content: message,
      provider,
      model,
      temperature,
      maxTokens,
      requestId,
    });

    res.write(`event: connected\ndata: ${JSON.stringify({ requestId })}\n\n`);

    for await (const chunk of stream) {
      if (chunk.finishReason) {
        res.write(`event: message_end\ndata: ${JSON.stringify({ finishReason: chunk.finishReason })}\n\n`);
      } else {
        res.write(`event: token\ndata: ${JSON.stringify({ content: chunk.content })}\n\n`);
      }
    }

    res.write(`event: done\ndata: ${JSON.stringify({ requestId })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`event: error\ndata: ${JSON.stringify({ code: 'STREAM_ERROR', message: (error as Error).message })}\n\n`);
    res.end();
  }
});

router.post('/stop', async (req: Request, res: Response) => {
  res.json({ success: true, message: 'Generation stopped' });
});

export default router;
```

- [ ] **Step 4: Update backend/src/app.ts**

Add before error middleware:
```typescript
import conversationRoutes from './features/chat/routes/conversation.routes';
import chatRoutes from './features/chat/routes/chat.routes';
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/chat', chatRoutes);
```

- [ ] **Step 5: Verify TypeScript**

- [ ] **Step 6: Commit**

```bash
git add backend/src/features/chat/controllers/ backend/src/features/chat/routes/ backend/src/app.ts
git commit -m "feat(chat): add conversation and chat API routes with SSE streaming"
```

---

## Milestone 3.6: Frontend Chat UI

### Task 10: Chat Types & API

**Covers:** [S8]

**Files:**
- Create: `frontend/src/features/ai-chat/types.ts`
- Create: `frontend/src/features/ai-chat/api/chat.api.ts`
- Create: `frontend/src/features/ai-chat/api/conversation.api.ts`

- [ ] **Step 1: Create frontend/src/features/ai-chat/types.ts**

```typescript
export interface Conversation {
  _id: string;
  userId: string;
  title: string;
  provider: string;
  model: string;
  status: 'active' | 'archived' | 'deleted';
  pinned: boolean;
  favorite: boolean;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
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
  model: string;
  tokenCount: number;
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
}

export interface StreamEvent {
  type: 'connected' | 'token' | 'message_end' | 'error' | 'done';
  data: Record<string, unknown>;
}
```

- [ ] **Step 2: Create frontend/src/features/ai-chat/api/conversation.api.ts**

```typescript
import api from '@/lib/axios';
import { Conversation, Message } from '../types';

export const conversationApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: Conversation[]; pagination: any }>('/conversations', { params }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: Conversation & { messages: Message[] } }>(`/conversations/${id}`),

  create: (data: { title?: string; provider?: string; model?: string }) =>
    api.post<{ success: boolean; data: Conversation }>('/conversations', data),

  update: (id: string, data: Partial<Conversation>) =>
    api.patch<{ success: boolean; data: Conversation }>(`/conversations/${id}`, data),

  delete: (id: string) =>
    api.delete(`/conversations/${id}`),

  archive: (id: string) =>
    api.post(`/conversations/${id}/archive`),

  restore: (id: string) =>
    api.post(`/conversations/${id}/restore`),
};
```

- [ ] **Step 3: Create frontend/src/features/ai-chat/api/chat.api.ts**

```typescript
import { ChatRequest } from '../types';

export const chatApi = {
  stream: async function* (request: ChatRequest) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          const eventType = line.slice(7).trim();
          const dataLine = lines.shift();
          if (dataLine?.startsWith('data: ')) {
            try {
              const data = JSON.parse(dataLine.slice(6));
              yield { type: eventType, data };
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    }
  },
};
```

- [ ] **Step 4: Verify build**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/ai-chat/types.ts frontend/src/features/ai-chat/api/
git commit -m "feat(ai-chat): add chat types and API client with SSE streaming"
```

---

### Task 11: Chat Hooks

**Covers:** [S8]

**Files:**
- Create: `frontend/src/features/ai-chat/hooks/useChat.ts`
- Create: `frontend/src/features/ai-chat/hooks/useConversations.ts`
- Create: `frontend/src/features/ai-chat/hooks/useStream.ts`

**Dependencies:** Task 10

- [ ] **Step 1: Create frontend/src/features/ai-chat/hooks/useConversations.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationApi } from '../api/conversation.api';

export function useConversations(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['conversations', params],
    queryFn: () => conversationApi.list(params),
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => conversationApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: conversationApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: conversationApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
}
```

- [ ] **Step 2: Create frontend/src/features/ai-chat/hooks/useStream.ts**

```typescript
import { useState, useCallback, useRef } from 'react';
import { chatApi } from '../api/chat.api';
import { ChatRequest } from '../types';

export function useStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [partialMessage, setPartialMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (request: ChatRequest, onToken?: (content: string) => void, onEnd?: () => void) => {
    setIsStreaming(true);
    setPartialMessage('');
    setError(null);

    try {
      for await (const event of chatApi.stream(request)) {
        if (event.type === 'token') {
          const content = (event.data as { content: string }).content;
          setPartialMessage((prev) => prev + content);
          onToken?.(content);
        } else if (event.type === 'error') {
          setError((event.data as { message: string }).message);
        } else if (event.type === 'done') {
          onEnd?.();
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { isStreaming, partialMessage, error, startStream, stopStream };
}
```

- [ ] **Step 3: Create frontend/src/features/ai-chat/hooks/useChat.ts**

```typescript
import { useState, useCallback } from 'react';
import { useConversation, useCreateConversation } from './useConversations';
import { useStream } from './useStream';
import { Message } from '../types';

export function useChat(conversationId: string | null) {
  const { data: conversation } = useConversation(conversationId || '');
  const createConversation = useCreateConversation();
  const { isStreaming, partialMessage, error, startStream, stopStream } = useStream();
  const [messages, setMessages] = useState<Message[]>([]);

  const sendMessage = useCallback(async (content: string, provider?: string) => {
    let activeConversationId = conversationId;

    if (!activeConversationId) {
      const result = await createConversation.mutateAsync({ title: content.slice(0, 50), provider });
      activeConversationId = result.data.data._id;
    }

    const userMessage: Message = {
      _id: crypto.randomUUID(),
      conversationId: activeConversationId!,
      userId: '',
      role: 'user',
      content,
      messageType: 'text',
      sequenceNumber: messages.length + 1,
      status: 'completed',
      provider: provider || 'gemini',
      model: 'gemini-2.0-flash',
      tokenCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    await startStream({
      conversationId: activeConversationId!,
      message: content,
      provider,
    });

    return activeConversationId;
  }, [conversationId, messages.length, createConversation, startStream]);

  return {
    conversation,
    messages,
    setMessages,
    isStreaming,
    partialMessage,
    error,
    sendMessage,
    stopStream,
  };
}
```

- [ ] **Step 4: Verify build**

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/ai-chat/hooks/
git commit -m "feat(ai-chat): add chat hooks for streaming and conversation management"
```

---

### Task 12: Chat Components

**Covers:** [S8]

**Files:**
- Create: `frontend/src/features/ai-chat/components/message-bubble.tsx`
- Create: `frontend/src/features/ai-chat/components/chat-input.tsx`
- Create: `frontend/src/features/ai-chat/components/typing-indicator.tsx`
- Create: `frontend/src/features/ai-chat/components/conversation-sidebar.tsx`
- Create: `frontend/src/features/ai-chat/components/chat-window.tsx`
- Create: `frontend/src/app/(dashboard)/chat/page.tsx`

**Dependencies:** Task 11

- [ ] **Step 1: Create frontend/src/features/ai-chat/components/typing-indicator.tsx**

```tsx
'use client';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2">
      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
      </div>
      <span className="ml-2 text-sm text-muted-foreground">Thinking...</span>
    </div>
  );
}
```

- [ ] **Step 2: Create frontend/src/features/ai-chat/components/message-bubble.tsx**

```tsx
'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, User, Bot } from 'lucide-react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isPartial?: boolean;
  onCopy?: (content: string) => void;
  onRegenerate?: () => void;
}

export function MessageBubble({ message, isPartial, onCopy, onRegenerate }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <Card className={`max-w-[80%] px-4 py-3 ${isUser ? 'bg-primary text-primary-foreground' : ''}`}>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {message.content || (isPartial ? '' : '...')}
          {isPartial && <span className="animate-pulse">|</span>}
        </div>
        <div className="mt-2 flex gap-1">
          {!isUser && onCopy && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onCopy(message.content)}>
              <Copy className="h-3 w-3" />
            </Button>
          )}
          {!isUser && onRegenerate && !isPartial && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRegenerate}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </div>
      </Card>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create frontend/src/features/ai-chat/components/chat-input.tsx**

```tsx
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type a message..."
        disabled={isStreaming || disabled}
        className="flex-1"
      />
      {isStreaming ? (
        <Button type="button" variant="destructive" onClick={onStop}>
          <Square className="h-4 w-4" />
        </Button>
      ) : (
        <Button type="submit" disabled={!input.trim() || disabled}>
          <Send className="h-4 w-4" />
        </Button>
      )}
    </form>
  );
}
```

- [ ] **Step 4: Create frontend/src/features/ai-chat/components/conversation-sidebar.tsx**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';
import { useConversations } from '../hooks/useConversations';
import { cn } from '@/lib/utils';

export function ConversationSidebar() {
  const pathname = usePathname();
  const { data } = useConversations();
  const conversations = data?.data.data || [];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <Link href="/chat">
          <Button className="w-full" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        {conversations.map((conv) => (
          <Link
            key={conv._id}
            href={`/chat/${conv._id}`}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
              pathname === `/chat/${conv._id}`
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50'
            )}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            <span className="truncate">{conv.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create frontend/src/features/ai-chat/components/chat-window.tsx**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { useChat } from '../hooks/useChat';

interface ChatWindowProps {
  conversationId: string | null;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { messages, isStreaming, partialMessage, sendMessage, stopStream } = useChat(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, partialMessage]);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Start a conversation with AI
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg._id} message={msg} onCopy={handleCopy} />
        ))}
        {isStreaming && partialMessage && (
          <MessageBubble
            message={{
              _id: 'partial',
              conversationId: conversationId || '',
              userId: '',
              role: 'assistant',
              content: partialMessage,
              messageType: 'text',
              sequenceNumber: messages.length + 1,
              status: 'streaming',
              provider: 'gemini',
              model: 'gemini-2.0-flash',
              tokenCount: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }}
            isPartial
          />
        )}
        {isStreaming && !partialMessage && <TypingIndicator />}
      </div>
      <div className="border-t p-4">
        <ChatInput onSend={sendMessage} onStop={stopStream} isStreaming={isStreaming} />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create frontend/src/app/(dashboard)/chat/page.tsx**

```tsx
'use client';

import { useState } from 'react';
import { ChatWindow } from '@/features/ai-chat/components/chat-window';
import { ConversationSidebar } from '@/features/ai-chat/components/conversation-sidebar';

export default function ChatPage() {
  const [conversationId] = useState<string | null>(null);

  return (
    <div className="flex h-full">
      <div className="w-64 border-r">
        <ConversationSidebar />
      </div>
      <div className="flex-1">
        <ChatWindow conversationId={conversationId} />
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Update sidebar navigation**

Add Chat link to frontend/src/components/layouts/sidebar.tsx:
```typescript
import { MessageSquare } from 'lucide-react';
// Add to navigation array:
{ name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
```

- [ ] **Step 8: Verify build**

- [ ] **Step 9: Commit**

```bash
git add frontend/src/features/ai-chat/components/ frontend/src/app/\(dashboard\)/chat/ frontend/src/components/layouts/sidebar.tsx
git commit -m "feat(ai-chat): add chat UI with streaming, conversation sidebar, and message components"
```

---

## Milestone 3.7: Testing & Polish

### Task 13: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run all verification**

```bash
cd backend && npx tsc --noEmit && npm run lint
cd frontend && npx tsc --noEmit && npm run lint && npm run build
```

- [ ] **Step 2: Verify no refresh token code**

```bash
grep -r "refresh\|REFRESH\|Refresh" --include="*.ts" backend/src/ frontend/src/
```

Expected: No results

- [ ] **Step 3: Verify no hardcoded secrets**

```bash
grep -r "sk-\|api_key\|secret.*=.*['\"]" --include="*.ts" backend/src/ frontend/src/
```

Expected: Only env var references

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A && git commit -m "chore: Phase 3 final verification and cleanup"
```

---

## Execution Handoff

Total milestones: 7
Total tasks: 13
Execution approach: Subagent per milestone (7 milestones = 7 parallel subagents where possible)
