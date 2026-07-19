# Babnunur

A production-ready, full-stack Agentic AI Productivity Platform.

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Backend:** Express.js, TypeScript, MongoDB/Mongoose
- **Auth:** Better Auth (Google OAuth + Email/Password)
- **AI:** Gemini, DeepSeek
- **UI:** shadcn/ui, Framer Motion

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

## Project Structure

```
Babnunur/
├── frontend/          # Next.js 15 App Router
├── backend/           # Express.js Modular Monolith
└── README.md
```

## Environment Variables

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| NODE_ENV | No | development/production/test |
| PORT | No | Server port (default: 5000) |
| MONGODB_URI | Yes | MongoDB connection string |
| DATABASE_NAME | No | Database name (default: babnunur) |
| BETTER_AUTH_URL | Yes | Auth base URL |
| BETTER_AUTH_SECRET | Yes | Auth secret (min 32 chars) |
| JWT_SECRET | Yes | JWT signing secret (min 32 chars) |
| GOOGLE_CLIENT_ID | No | Google OAuth client ID |
| GOOGLE_CLIENT_SECRET | No | Google OAuth client secret |
| GEMINI_API_KEY | No | Google Gemini API key |
| DEEPSEEK_API_KEY | No | DeepSeek API key |
| SMTP_HOST | No | SMTP server host |
| SMTP_PORT | No | SMTP server port |
| SMTP_USER | No | SMTP username |
| SMTP_PASS | No | SMTP password |
| CORS_ORIGIN | No | Allowed CORS origin |

### Frontend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| NEXT_PUBLIC_APP_URL | Yes | Frontend URL |
| NEXT_PUBLIC_BACKEND_URL | Yes | Backend URL |
| NEXT_PUBLIC_API_URL | Yes | Backend API URL |

## License

MIT
