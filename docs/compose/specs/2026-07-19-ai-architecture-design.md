# Babnunur AI Architecture & Implementation Design

> Version: 1.0
> Date: 2026-07-19
> Status: Approved

---

## [S1] Problem

Build a production-ready, provider-agnostic AI layer for Babnunur that supports Gemini and DeepSeek initially, with easy extensibility to OpenAI, Claude, Groq, Together AI, and Ollama. The architecture must serve all AI features: chat assistant, content generation, document intelligence, recommendations, and future agentic workflows — through shared infrastructure rather than independent implementations.

---

## [S2] Provider Abstraction Layer

### File Structure

```
backend/src/features/ai/
├── providers/
│   ├── base.ts              # Abstract AIProvider interface
│   ├── gemini.ts            # Gemini adapter
│   ├── deepseek.ts          # DeepSeek adapter
│   ├── factory.ts           # Provider factory
│   └── index.ts             # Re-exports
├── services/
│   ├── chat.service.ts      # Chat orchestration
│   ├── stream.service.ts    # SSE streaming
│   ├── token.service.ts     # Token counting
│   └── prompt.service.ts    # Prompt template engine
├── types.ts                 # AI-specific types
├── config.ts                # AI config from env
└── utils/
    ├── sanitize.ts          # Input/output sanitization
    └── errors.ts            # AI-specific errors
```

### Provider Interface

```typescript
interface AIProvider {
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

### Types

```typescript
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  messageType?: 'text' | 'markdown' | 'code' | 'image' | 'file' | 'system' | 'tool';
}

interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  stream?: boolean;
  requestId?: string;
}

interface ChatResponse {
  content: string;
  model: string;
  provider: string;
  tokenCount: number;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  finishReason: 'stop' | 'length' | 'error';
  providerResponseId?: string;
}

interface ChatChunk {
  content: string;
  finishReason?: 'stop' | 'length' | 'error';
  tokenCount?: number;
}

interface ProviderModelInfo {
  name: string;
  version: string;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsToolCalling: boolean;
}

interface ProviderHealthStatus {
  healthy: boolean;
  latencyMs?: number;
  error?: string;
  lastChecked: Date;
}

interface ProviderCapabilities {
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsToolCalling: boolean;
  maxTokens: number;
}
```

### Factory

```typescript
class ProviderFactory {
  private static providers = new Map<string, AIProvider>();

  static register(provider: AIProvider): void;
  static getProvider(name: string): AIProvider;
  static getAvailableProviders(): ProviderModelInfo[];
  static getCapabilities(name: string): ProviderCapabilities;
}
```

### Requirements

- Provider SDKs isolated inside adapters only
- No feature, controller, or service imports Gemini or DeepSeek SDKs directly
- Retry and timeout inside provider layer
- Token counting with fallback estimator
- Structured validation results
- Health check for monitoring

---

## [S3] Conversation System

### File Structure

```
backend/src/features/chat/
├── models/
│   ├── conversation.model.ts
│   └── message.model.ts
├── services/
│   ├── conversation.service.ts
│   └── message.service.ts
├── controllers/
│   ├── conversation.controller.ts
│   └── message.controller.ts
├── routes/
│   ├── conversation.routes.ts
│   └── message.routes.ts
├── types.ts
└── validations/
    ├── conversation.validation.ts
    └── message.validation.ts
```

### Conversation Schema

```typescript
interface IConversation {
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
```

### Message Schema

```typescript
interface IMessage {
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
  attachments: Attachment[];
  citations: Citation[];
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  reasoning?: string;
  error?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Indexes

Conversations:
- `{ userId: 1, lastMessageAt: -1 }`
- `{ userId: 1, status: 1, updatedAt: -1 }`
- `{ userId: 1, favorite: 1 }`
- `{ userId: 1, pinned: 1 }`

Messages:
- `{ conversationId: 1, sequenceNumber: 1 }`
- `{ conversationId: 1, createdAt: 1 }`
- `{ conversationId: 1, status: 1 }`

### Operations

- Create, rename, archive, restore, soft delete, duplicate, clear messages, export
- Search by title, message content, date, provider, model
- Cursor-based pagination for messages
- Configurable limits via env vars

### Soft Delete

Never permanently delete. Use `deletedAt` and `deletedBy`. Support restore.

---

## [S4] Prompt System

### File Structure

```
backend/src/features/ai/prompts/
├── templates/
│   ├── chat.ts
│   ├── code.ts
│   ├── content.ts
│   └── document.ts
├── engine.ts
├── versioning.ts
├── registry.ts
└── types.ts
```

### Prompt Template

```typescript
interface PromptTemplate {
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
  supportedModels: string[];
  maxTokens: number;
  temperature: number;
  priority: number;
  enabled: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Prompt Context

```typescript
interface PromptContext {
  user: { id: string; name: string; email: string };
  conversation: { id: string; title: string; settings: ConversationSettings };
  history: ChatMessage[];
  documents: DocumentContext[];
  files: FileContext[];
  settings: UserSettings;
  featureContext: Record<string, unknown>;
  requestMetadata: { provider: string; model: string; requestId: string };
}
```

### Engine

```typescript
class PromptEngine {
  render(templateId: string, context: PromptContext, provider?: string): RenderedPrompt;
  getTemplate(id: string, version?: number): PromptTemplate;
  listTemplates(feature?: string): PromptTemplate[];
  validate(template: PromptTemplate, context: PromptContext): ValidationResult;
}
```

### Requirements

- Prompt categories: chat, code, content, document, vision, tool-calling, web-search, recommendation, summarization, translation, reasoning
- Prompt injection detection
- Secret filtering
- System prompt protection
- Provider-specific rendering
- Version rollback support
- Analytics tracking

---

## [S5] Streaming Architecture

### Flow

```
Frontend ← SSE ← Backend Stream Service ← Provider Adapter ← AI Provider
```

### Endpoint

`POST /api/v1/chat/stream`

### Request

```typescript
{
  conversationId: string;
  message: string;
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  parentMessageId?: string;
  stream?: boolean;
  metadata?: { clientVersion: string; platform: string };
}
```

### SSE Events

```
event: connected
data: { "requestId": "..." }

event: message_start
data: { "messageId": "...", "conversationId": "...", "provider": "gemini", "model": "..." }

event: token
data: { "content": "Hello" }

event: reasoning
data: { "content": "Let me think..." }

event: tool_call
data: { "tool": "...", "args": {...} }

event: usage
data: { "inputTokens": 100, "outputTokens": 50, "totalTokens": 150, "estimatedCost": 0.001, "latencyMs": 1200 }

event: message_end
data: { "messageId": "...", "finishReason": "stop" }

event: heartbeat
data: { "timestamp": "..." }

event: warning
data: { "code": "...", "message": "..." }

event: error
data: { "code": "RATE_LIMITED", "message": "...", "retryable": true }

event: cancelled
data: { "messageId": "..." }
```

### Cancellation

`DELETE /api/v1/chat/stream/:messageId` — AbortController aborts provider request, marks message cancelled.

### Retry

`POST /api/v1/chat/retry` — Deletes failed assistant message, re-sends last user message.

### Connection Management

- Heartbeat/ping events every 30s
- Automatic timeout detection
- Client disconnect detection via request close
- Graceful cleanup on disconnect
- AbortController for provider cancellation

### Streaming Persistence

1. Create assistant message with status = `streaming`
2. Update same message while streaming
3. Mark `completed` after success
4. Mark `failed` or `cancelled` on error

Never create duplicate messages during retries.

### Error Recovery

- Provider timeout → error event, conversation intact
- Provider error → error event with code
- Network disconnect → cleanup, persist partial response
- Rate limit → 429 with retry-after

---

## [S6] Database Design

### Collections

| Collection | Purpose |
|------------|---------|
| `conversations` | Chat threads with metadata |
| `messages` | Individual messages with status |
| `prompt_templates` | Prompt library with versioning |
| `ai_usage` | Usage tracking for analytics |

### AI Usage Schema

```typescript
interface IAIUsage {
  userId: string;
  conversationId: string;
  requestId: string;
  sessionId?: string;
  provider: string;
  model: string;
  endpoint: string;
  feature: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  latencyMs: number;
  durationMs: number;
  status: 'success' | 'error' | 'cancelled';
  retryCount: number;
  errorCode?: string;
  errorMessage?: string;
  createdAt: Date;
}
```

### AI Usage Indexes

- `{ userId: 1, createdAt: -1 }`
- `{ provider: 1, createdAt: -1 }`
- `{ conversationId: 1 }`

### Retention

- Configurable TTL for usage logs
- Soft delete for conversations
- Archival for old conversations

---

## [S7] API Design

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/chat/stream` | Stream chat response (SSE) |
| POST | `/api/v1/chat/retry` | Retry last message |
| DELETE | `/api/v1/chat/stream/:messageId` | Cancel generation |
| POST | `/api/v1/chat/stop` | Stop generation |
| POST | `/api/v1/chat/feedback` | Rate AI response |

### Conversation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/conversations` | List (paginated, searchable) |
| POST | `/api/v1/conversations` | Create |
| GET | `/api/v1/conversations/:id` | Get with messages |
| PATCH | `/api/v1/conversations/:id` | Update (rename, settings) |
| DELETE | `/api/v1/conversations/:id` | Soft delete |
| POST | `/api/v1/conversations/:id/archive` | Archive |
| POST | `/api/v1/conversations/:id/restore` | Restore |
| POST | `/api/v1/conversations/:id/duplicate` | Duplicate |
| POST | `/api/v1/conversations/:id/clear` | Clear messages |
| GET | `/api/v1/conversations/:id/export` | Export |
| POST | `/api/v1/conversations/:id/pin` | Pin |
| POST | `/api/v1/conversations/:id/unpin` | Unpin |
| POST | `/api/v1/conversations/:id/favorite` | Favorite |
| POST | `/api/v1/conversations/:id/unfavorite` | Unfavorite |

### Message Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/messages/:conversationId` | List (cursor-based) |
| PATCH | `/api/v1/messages/:id` | Edit |
| DELETE | `/api/v1/messages/:id` | Delete |
| POST | `/api/v1/messages/:id/regenerate` | Regenerate |
| POST | `/api/v1/messages/:id/continue` | Continue |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ai/providers` | List providers |
| GET | `/api/v1/ai/providers/:name` | Get provider info |
| GET | `/api/v1/ai/models` | List models |
| GET | `/api/v1/ai/usage` | Usage stats |
| POST | `/api/v1/ai/providers/:name/health` | Health check (admin) |

### Response Format

```typescript
{
  success: boolean;
  data?: T;
  error?: { code: string; message: string; retryable?: boolean; details?: unknown };
  meta?: Record<string, unknown>;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
  requestId: string;
  timestamp: string;
}
```

---

## [S8] Frontend Architecture

### File Structure

```
frontend/src/features/ai-chat/
├── components/
│   ├── chat-window.tsx
│   ├── message-bubble.tsx
│   ├── chat-input.tsx
│   ├── typing-indicator.tsx
│   ├── model-selector.tsx
│   ├── conversation-sidebar.tsx
│   ├── markdown-renderer.tsx
│   ├── code-block.tsx
│   ├── regenerate-button.tsx
│   ├── copy-button.tsx
│   └── stop-button.tsx
├── hooks/
│   ├── useChat.ts
│   ├── useConversations.ts
│   ├── useStream.ts
│   └── useModel.ts
├── api/
│   ├── chat.api.ts
│   ├── conversation.api.ts
│   └── ai.api.ts
├── store/
│   └── chat-store.ts
├── types.ts
└── utils/
    ├── markdown.ts
    └── stream.ts
```

### Component Hierarchy

```
ChatPage (Server Component)
└── ChatWindow (Client Component)
    ├── ConversationSidebar
    │   └── ConversationItem
    ├── MessageList
    │   ├── MessageBubble (user)
    │   │   ├── EditButton
    │   │   └── DeleteButton
    │   └── MessageBubble (assistant)
    │       ├── MarkdownRenderer
    │       │   └── CodeBlock
    │       ├── CopyButton
    │       ├── RegenerateButton
    │       └── UsageInfo
    ├── TypingIndicator
    └── ChatInput
        ├── ModelSelector
        └── StopButton
```

### State Management

- TanStack Query → Server State (conversations, messages, providers)
- React Context → Chat Session State (active conversation, streaming)
- Zustand → Lightweight Client State (UI preferences)
- Local State → Component-level UI state

### Streaming Hook

```typescript
interface UseStreamReturn {
  isStreaming: boolean;
  partialMessage: string;
  error: string | null;
  startStream: (conversationId: string, message: string, options?: StreamOptions) => void;
  stopStream: () => void;
  retryStream: () => void;
}
```

### Transport

Use `fetch()` with `ReadableStream` for POST-based streaming (not EventSource, which only supports GET).

### Performance

- React.memo on message components
- Lazy loading for markdown renderer
- Virtualized message lists for long conversations
- Auto-scroll only when user is at bottom
- Preserve scroll position for older messages

### Mobile

- Responsive sidebar (drawer on mobile)
- Touch-friendly controls
- Adaptive layouts

---

## [S9] Security

| Layer | Protection |
|-------|------------|
| Authentication | Better Auth session for all AI endpoints |
| Authorization | RBAC, conversation ownership verification |
| Rate Limiting | Per-user request limits, concurrent stream limits, daily usage limits |
| Input Validation | Zod schemas, max message length, request size limits |
| Prompt Injection | System prompt isolation, input sanitization, pattern detection |
| Output Sanitization | XSS prevention, HTML sanitization, safe markdown rendering |
| Token Limits | Max tokens per request, max tokens per conversation |
| API Key Security | Backend-only, env vars, never exposed |
| Audit Logging | userId, conversationId, provider, model, latency, tokens, cost |
| Security Headers | Helmet, CSP, HSTS, X-Content-Type-Options |

### Never Log

- API keys
- Session secrets
- Passwords
- Full prompts with sensitive user data

---

## [S10] Phase 3 Implementation Milestones

| Milestone | Description | Key Files |
|-----------|-------------|-----------|
| 3.1 | AI Provider Layer | `features/ai/providers/`, `features/ai/config.ts`, `features/ai/types.ts` |
| 3.2 | Conversation & Message Models | `features/chat/models/`, `features/chat/types.ts` |
| 3.3 | Prompt Engine | `features/ai/prompts/` |
| 3.4 | Chat Service + Streaming | `features/ai/services/`, `features/chat/services/` |
| 3.5 | API Routes | `features/chat/routes/`, `features/ai/routes/` |
| 3.6 | Frontend Chat UI | `features/ai-chat/` |
| 3.7 | Testing & Production Hardening | All features |

### Per-Milestone Verification

After each milestone:
1. TypeScript compilation (zero errors)
2. ESLint (zero errors)
3. Build verification
4. Conventional Commit
5. Push to GitHub
