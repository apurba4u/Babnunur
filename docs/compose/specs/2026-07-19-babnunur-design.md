# Babnunur — Architecture & Design Spec

> Version: 1.0
> Date: 2026-07-19
> Status: Approved

---

## [S1] Problem

Build a production-ready, full-stack Agentic AI Productivity Platform called **Babnunur** that combines AI Chat Assistant, AI Workspace, Document Intelligence, Smart Recommendations, and AI-powered automation into a single application. The platform allows users to chat with multiple LLMs (Gemini and DeepSeek), upload and analyze documents, generate AI content, manage conversations, receive personalized AI recommendations, and automate knowledge work through intelligent AI agents.

---

## [S2] Solution Overview

A monorepo containing two independent projects:

```
Babnunur/
├── .git/
├── frontend/          # Next.js 15 App Router
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── src/
├── backend/           # Express.js Modular Monolith
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── src/
└── README.md
```

**Key decisions:**
- Single Git repo at root, conventional commits
- Feature-based architecture in both frontend and backend
- Better Auth for primary auth, JWT for stateless API access
- MongoDB Atlas for database
- Vercel for frontend + backend (serverless)
- Gemini + DeepSeek for AI providers
- Both light and dark themes with system detection

---

## [S3] Backend Architecture

```
backend/src/
├── config/           # Database, auth, env validation (Zod)
├── core/             # Base classes, errors, types
├── middleware/        # Auth, rate-limit, CORS, logging, Helmet
├── shared/           # Utils, helpers, constants
├── features/
│   ├── auth/         # Better Auth integration, JWT, OAuth
│   ├── users/        # User CRUD, profiles
│   ├── ai/           # Provider abstraction, streaming, prompts
│   ├── chat/         # Conversations, messages, history
│   ├── documents/    # Upload, analyze, intelligence
│   ├── recommendations/  # AI-powered suggestions
│   ├── dashboard/    # Stats, analytics
│   └── settings/     # User preferences
├── routes/           # API versioning (/api/v1/*)
├── app.ts            # Express app setup
└── server.ts         # Entry point
```

**Layers per feature:** Route → Controller → Service → Repository → Model

**AI Provider Layer:**
```
features/ai/
├── providers/
│   ├── base.ts           # Abstract AIProvider interface
│   ├── gemini.ts         # Gemini implementation
│   └── deepseek.ts       # DeepSeek implementation
├── prompts/              # Prompt templates with versioning
├── streaming.ts          # SSE streaming
└── index.ts              # Provider factory
```

**Provider interface:**
```typescript
interface AIProvider {
  chat(messages: Message[], options: ChatOptions): AsyncIterable<Chunk>;
  streamChat(messages: Message[], options: ChatOptions): ReadableStream;
  countTokens(text: string): Promise<number>;
}
```

**Environment validation:** Zod-based config validation that fails fast on startup if required variables are missing.

**Security middleware:** Helmet, CORS, rate limiting, RBAC, secure cookies, request validation.

---

## [S4] Frontend Architecture

```
frontend/src/
├── app/
│   ├── (public)/         # Landing, about
│   ├── (auth)/           # Login, register, forgot-password
│   ├── (dashboard)/      # Main app area
│   │   ├── chat/
│   │   ├── documents/
│   │   ├── recommendations/
│   │   └── settings/
│   ├── api/              # API routes (if needed)
│   ├── layout.tsx        # Root layout + providers
│   └── page.tsx          # Home/landing
├── components/
│   ├── ui/               # shadcn/ui primitives
│   ├── common/           # Shared components
│   ├── layouts/          # DashboardLayout, AuthLayout
│   └── shared/           # Feature-agnostic components
├── features/
│   ├── auth/             # Login/Register forms, hooks
│   ├── ai-chat/          # Chat UI, message components
│   ├── documents/        # Upload, viewer, analyzer
│   ├── recommendations/  # Recommendation cards
│   ├── dashboard/        # Stats widgets, charts
│   └── settings/         # Theme toggle, profile
├── hooks/                # useAuth, useChat, useTheme
├── lib/                  # Axios instance, Better Auth client
├── services/             # API service functions
├── providers/            # ThemeProvider, AuthProvider
├── store/                # Zustand stores
├── types/                # TypeScript types
├── utils/                # Helpers, formatters
├── styles/               # Global styles, Tailwind config
└── middleware.ts          # Auth redirect middleware
```

**Key patterns:**
- Server Components by default
- Client Components only for interactivity
- Route Groups for layout isolation
- Suspense + streaming for async content
- Framer Motion for animations
- Zustand for client state
- React Hook Form + Zod for forms
- TanStack Query for server-state management

---

## [S5] Database Design (MongoDB/Mongoose)

**Core collections:**

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `users` | User profiles, settings | email, name, avatar, theme, role, timestamps |
| `accounts` | Better Auth account links | userId, provider, providerId |
| `sessions` | Better Auth sessions | userId, token, expiresAt |
| `conversations` | Chat threads | userId, title, model, timestamps |
| `messages` | Individual chat messages | conversationId, role, content, model, tokens |
| `documents` | Uploaded files metadata | userId, filename, mimeType, size, analysis |
| `recommendations` | AI-generated suggestions | userId, type, content, metadata |
| `api_keys` | User API keys (encrypted) | userId, key, name, lastUsed |

**Indexes:**
- users: email (unique), createdAt
- conversations: userId + createdAt (compound)
- messages: conversationId + createdAt (compound)
- documents: userId + createdAt (compound)
- recommendations: userId + type + createdAt (compound)

**Features:** Timestamps, soft-delete support, audit fields.

---

## [S6] Authentication Flow

1. **Better Auth** handles registration, login, OAuth, sessions
2. **Session tokens** stored in httpOnly cookies
3. **JWT** generated from Better Auth session for API access
4. **Middleware** validates JWT on protected routes
5. **Google OAuth** configured via Better Auth Google provider
6. **Password reset** via Better Auth's built-in flow

**Environment variables:**
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`

---

## [S7] AI Integration

**Provider abstraction** — completely provider-agnostic design:
- Base `AIProvider` interface with chat, streamChat, countTokens
- Gemini and DeepSeek as initial providers
- Easy to add OpenAI, Claude, Groq, Together AI, Ollama later

**Features:**
- Multi-provider support
- Streaming responses via SSE
- Prompt templates with versioning
- Token counting and rate limiting
- Error fallback between providers
- Conversation history management
- Retry mechanism
- Timeout handling
- Logging and monitoring

---

## [S8] API Design

```
/api/v1/
├── auth/*           # Better Auth endpoints
├── users/*          # User management
├── chat/
│   ├── conversations/*
│   └── messages/*
├── documents/*
├── recommendations/*
├── dashboard/*
├── settings/*
└── ai/
    ├── providers/*
    └── stream       # SSE streaming endpoint
```

**Standards:**
- RESTful conventions
- Consistent error responses
- Request validation (Zod)
- Rate limiting
- CORS configuration
- API versioning
- Structured logging

---

## [S9] UI/UX Design System

**Design principles:**
- Modern, premium, enterprise-grade aesthetic
- Inspired by Vercel, Linear, Raycast, Stripe, Notion
- Minimal and clean interface
- 8px spacing system
- Maximum 3 primary colors with neutral colors
- Smooth micro-interactions via Framer Motion
- Glassmorphism only where it improves usability

**Theme support:**
- Light Theme + Dark Theme
- System preference detection
- Manual Theme Toggle with persistent preference

**Typography:** Geist, Inter, Space Grotesk, Manrope, Outfit

**Components:** shadcn/ui with Tailwind CSS 4

**Accessibility:** WCAG-compliant, readable contrast, keyboard navigation, focus states

---

## [S10] Deployment

- **Frontend:** Vercel
- **Backend:** Vercel Serverless Functions
- **Database:** MongoDB Atlas
- **Auth:** Better Auth
- **AI:** Gemini + DeepSeek
- **Storage:** Cloudinary (if needed)

**Requirements:**
- Fully deployable to Vercel without source code changes
- Separate env vars for Development, Preview, Production
- Automatic deployments from GitHub
- Production builds without warnings/errors
- CORS, security headers, caching, environment validation
- SEO, Core Web Vitals optimization

---

## [S11] Definition of Done

Every completed feature must satisfy:
1. Build passes
2. TypeScript has zero errors
3. Lint passes
4. Tests pass where applicable
5. Responsive verification completed
6. Security verified
7. Documentation updated
8. Commit with meaningful Conventional Commit
9. Push immediately to GitHub repository

---

## [S12] Implementation Phases

**Phase 1: Foundation**
- Project initialization (frontend + backend)
- TypeScript, ESLint, Prettier configuration
- Tailwind CSS 4 setup
- Environment configuration with Zod validation
- Database connection and indexes
- Better Auth setup
- UI design system (shadcn/ui components)
- Theme support (light/dark)

**Phase 2: Core Application**
- User registration and login
- Dashboard layout and navigation
- User profile and settings
- CRUD functionality
- Search, filtering, pagination

**Phase 3: AI Chat Assistant**
- Multi-LLM integration (Gemini & DeepSeek)
- Provider abstraction layer
- Streaming responses (SSE)
- Conversation history
- Chat UI with message components
- Model selection

**Phase 4: Advanced Features**
- AI Recommendation Engine
- AI Content Generation
- Document upload and intelligence
- Agentic AI workflows
- Analytics and dashboard

**Phase 5: Production**
- Performance optimization
- Security hardening
- Testing
- Documentation
- Production deployment
