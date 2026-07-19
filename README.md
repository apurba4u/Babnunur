# Babnunur

A production-ready, full-stack Agentic AI Productivity Platform.

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Backend:** Express.js, TypeScript, MongoDB/Mongoose
- **Auth:** Better Auth (Google OAuth + Email/Password)
- **AI:** Gemini, DeepSeek
- **UI:** shadcn/ui, Framer Motion

## Features

### AI Chat Assistant

The platform features a real-time AI chat assistant with streaming support:

- **Server-Sent Events (SSE)** for real-time token streaming
- **AbortController** for client disconnect handling and cancellation
- **Heartbeat mechanism** to maintain connection stability
- **Graceful error handling** with no provider SDK errors exposed to clients
- Conversation management (create, update, delete, archive)
- Message history with pagination
- Favorites and pinning
- System prompt customization
- Token usage tracking
- Request cancellation support

### Document Intelligence

Upload, parse, and chunk documents for AI-powered analysis:

- **File Upload** with validation (PDF, DOCX, TXT, Markdown)
- **Document Parsing** using pdf-parse and mammoth libraries
- **Smart Chunking** with configurable chunk sizes and overlap
- **Processing Jobs** with real-time status tracking
- Upload size limits (10MB) and file type validation

### Embeddings & Vector Search

Generate and search through document embeddings:

- **Embedding Providers:** OpenAI embeddings, local embedding service
- **Vector Service** for similarity search across document chunks
- **Per-user vector isolation** for data privacy
- **Configurable top-K** results for search queries

### RAG (Retrieval-Augmented Generation)

Combine document context with AI responses:

- **Context Retrieval** from embedded document chunks
- **Streaming RAG** with citation support
- **Document-scoped chat** with selected documents as context
- **Citation Viewer** showing source documents and chunks

### Web Search

Real-time web search integration:

- **DuckDuckGo** search provider
- **Multi-provider search** with result aggregation
- **Configurable result counts** per query
- **Provider discovery** endpoint for available search providers

### Tool Calling

Extensible tool system for AI agent capabilities:

- **Tool Registry** with schema-based tool definitions
- **Built-in Tools:** Calculator, DateTime, UUID generator, JSON formatter
- **Batch Execution** for multiple tool calls
- **Per-user tool isolation** for data privacy

### AI Agent Orchestrator

Multi-step AI agent with planning and execution:

- **Planner Service** for goal decomposition
- **Executor Service** for tool orchestration
- **Memory Service** for conversation context
- **Document-aware planning** with selected documents

### AI Workspace

Unified interface for document-driven AI conversations:

- **Document Panel** with selection and management
- **Search Panel** for web search integration
- **Citation Viewer** for source tracking
- **Context-aware chat** with selected documents

## Authentication

Better Auth is the single source of truth for all authentication:

- Email/password registration and login
- Google OAuth (Sign in / Sign up with Google)
- Session management (httpOnly cookies)
- Password reset
- Email verification
- Account management

### Google OAuth Setup

1. Create a Google Cloud project at https://console.cloud.google.com
2. Enable the Google+ API
3. Create OAuth 2.0 credentials
4. Set Authorized redirect URI to: `http://localhost:5001/api/v1/auth/google/callback`
5. Add credentials to `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env
# Add your credentials to .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## API Endpoints

### Chat API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/chat/stream` | Stream AI response (SSE) |
| POST | `/api/v1/chat/send` | Send message (non-streaming) |
| POST | `/api/v1/chat/cancel` | Cancel active stream |

### Conversation API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/conversations` | List conversations |
| POST | `/api/v1/conversations` | Create conversation |
| GET | `/api/v1/conversations/:id` | Get conversation with messages |
| PATCH | `/api/v1/conversations/:id` | Update conversation |
| DELETE | `/api/v1/conversations/:id` | Delete conversation |
| POST | `/api/v1/conversations/:id/archive` | Archive conversation |
| POST | `/api/v1/conversations/:id/restore` | Restore conversation |
| POST | `/api/v1/conversations/:id/favorite` | Toggle favorite |
| POST | `/api/v1/conversations/:id/pin` | Toggle pin |

### Document API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/documents` | List documents |
| POST | `/api/v1/documents/upload` | Upload document |
| GET | `/api/v1/documents/:id` | Get document details |
| GET | `/api/v1/documents/:id/chunks` | Get document chunks |
| GET | `/api/v1/documents/:id/status` | Get processing status |
| DELETE | `/api/v1/documents/:id` | Delete document |

### Embedding API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/embeddings/providers` | List embedding providers |
| POST | `/api/v1/embeddings/embed/:documentId` | Embed document chunks |
| POST | `/api/v1/embeddings/search` | Vector similarity search |

### RAG API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/rag/chat` | Chat with document context |
| POST | `/api/v1/rag/stream` | Stream RAG response (SSE) |

### Web Search API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/search/providers` | List search providers |
| POST | `/api/v1/search` | Search with single provider |
| POST | `/api/v1/search/multi` | Search with multiple providers |

### Tool API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tools` | List available tools |
| POST | `/api/v1/tools/execute` | Execute single tool |
| POST | `/api/v1/tools/execute-batch` | Execute multiple tools |

### Agent API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/agent/run` | Run agent with goal |
| POST | `/api/v1/agent/plan` | Generate execution plan |
| DELETE | `/api/v1/agent/memory/:conversationId` | Clear agent memory |

## Project Structure

```
Babnunur/
├── frontend/                    # Next.js 15 App Router
│   └── src/
│       ├── app/                 # App router pages
│       │   ├── (auth)/          # Auth pages (login, register)
│       │   └── (dashboard)/     # Dashboard pages (chat, documents, workspace, items)
│       ├── components/          # Shared UI components
│       │   ├── layouts/         # Layout components (sidebar, header)
│       │   └── ui/              # shadcn/ui components
│       ├── features/
│       │   ├── ai-chat/         # AI Chat feature (streaming, conversations)
│       │   ├── auth/            # Authentication (login, register forms)
│       │   ├── dashboard/       # Dashboard (stats, recent activity)
│       │   ├── documents/       # Document management (upload, list, parse)
│       │   ├── items/           # Items management
│       │   └── workspace/       # AI Workspace (search, documents, citations)
│       ├── lib/                 # Utilities (axios, cn)
│       └── providers/           # Context providers (query, theme)
├── backend/                     # Express.js Modular Monolith
│   └── src/
│       ├── config/              # Configuration (auth, database)
│       ├── core/                # Core types, errors
│       ├── features/
│       │   ├── agent/           # AI Agent orchestrator (planner, executor, memory)
│       │   ├── ai/              # AI services (providers, streaming, prompts)
│       │   ├── auth/            # Authentication (Better Auth)
│       │   ├── chat/            # Chat & conversations (streaming, messages)
│       │   ├── dashboard/       # Dashboard (stats, activity)
│       │   ├── documents/       # Document Intelligence (upload, parse, chunk)
│       │   ├── embeddings/      # Embeddings & Vector Search
│       │   ├── items/           # Items management
│       │   ├── rag/             # RAG (Retrieval-Augmented Generation)
│       │   ├── tools/           # Tool Calling system
│       │   ├── users/           # User management
│       │   └── websearch/       # Web Search integration
│       ├── middleware/          # Auth, error handling
│       └── app.ts               # Express app setup
├── docs/                        # Documentation
└── README.md
```

## Environment Variables

### Backend (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| NODE_ENV | No | development | development/production/test |
| PORT | No | 5000 | Server port |
| MONGODB_URI | Yes | — | MongoDB connection string |
| DATABASE_NAME | No | babnunur | Database name |
| BETTER_AUTH_URL | Yes | — | Auth base URL |
| BETTER_AUTH_SECRET | Yes | — | Auth secret (min 32 chars) |
| JWT_SECRET | Yes | — | JWT signing secret (min 32 chars) |
| GOOGLE_CLIENT_ID | No | — | Google OAuth client ID |
| GOOGLE_CLIENT_SECRET | No | — | Google OAuth client secret |
| GEMINI_API_KEY | No | — | Google Gemini API key |
| DEEPSEEK_API_KEY | No | — | DeepSeek API key |
| SMTP_HOST | No | — | SMTP server host |
| SMTP_PORT | No | — | SMTP server port |
| SMTP_USER | No | — | SMTP username |
| SMTP_PASS | No | — | SMTP password |
| CORS_ORIGIN | No | http://localhost:3000 | Allowed CORS origin |
| MAX_UPLOAD_SIZE | No | 10 | Max upload size in MB |
| ALLOWED_FILE_TYPES | No | image/*,application/pdf,.txt,.md,.csv | Allowed file types |
| AI_REQUEST_TIMEOUT | No | 60000 | AI request timeout in ms |
| AI_MAX_TOKENS | No | 4096 | Max tokens for AI responses |
| AI_TEMPERATURE | No | 0.7 | AI temperature (0-1) |
| LOG_LEVEL | No | info | error/warn/info/debug |
| RATE_LIMIT_WINDOW | No | 900000 | Rate limit window in ms (15 min) |
| RATE_LIMIT_MAX_REQUESTS | No | 100 | Max requests per window |

### Frontend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| NEXT_PUBLIC_APP_URL | Yes | Frontend URL |
| NEXT_PUBLIC_BACKEND_URL | Yes | Backend URL |
| NEXT_PUBLIC_API_URL | Yes | Backend API URL |

## License

MIT
