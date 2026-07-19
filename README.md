# Babnunur

A production-ready, full-stack Agentic AI Productivity Platform.

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Backend:** Express.js, TypeScript, MongoDB/Mongoose
- **Auth:** Better Auth (Google OAuth + Email/Password)
- **AI:** Gemini, DeepSeek
- **UI:** shadcn/ui, Framer Motion

## AI Chat Assistant

The platform features a real-time AI chat assistant with streaming support:

### Streaming Architecture

- **Server-Sent Events (SSE)** for real-time token streaming
- **AbortController** for client disconnect handling and cancellation
- **Heartbeat mechanism** to maintain connection stability
- **Graceful error handling** with no provider SDK errors exposed to clients

### Supported Providers

| Provider | Models | Features |
|----------|--------|----------|
| Google Gemini | gemini-2.0-flash, gemini-2.5-pro | Streaming, function calling |
| DeepSeek | deepseek-chat, deepseek-coder | Streaming, code assistance |

### Features

- Real-time streaming responses
- Conversation management (create, update, delete, archive)
- Message history with pagination
- Favorites and pinning
- System prompt customization
- Token usage tracking
- Request cancellation support

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

## Project Structure

```
Babnunur/
├── frontend/                    # Next.js 15 App Router
│   └── src/
│       ├── app/                 # App router pages
│       ├── components/          # Shared UI components
│       ├── features/
│       │   ├── ai-chat/         # AI Chat feature
│       │   ├── auth/            # Authentication
│       │   ├── dashboard/       # Dashboard
│       │   └── items/           # Items management
│       ├── lib/                 # Utilities
│       └── providers/           # Context providers
├── backend/                     # Express.js Modular Monolith
│   └── src/
│       ├── config/              # Configuration
│       ├── core/                # Core types, errors
│       ├── features/
│       │   ├── ai/              # AI services & providers
│       │   ├── auth/            # Authentication
│       │   ├── chat/            # Chat & conversations
│       │   ├── dashboard/       # Dashboard
│       │   ├── items/           # Items management
│       │   └── users/           # User management
│       ├── middleware/          # Auth, error handling
│       └── app.ts               # Express app setup
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
