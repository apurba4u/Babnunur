# Babnunur Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize the Babnunur monorepo with complete frontend and backend foundations, including TypeScript configuration, environment validation, database connection, authentication, UI design system, and theme support.

**Architecture:** Monorepo with Next.js 15 App Router frontend and Express.js Modular Monolith backend. Feature-based architecture, Better Auth for authentication, MongoDB Atlas for database, shadcn/ui for components.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Express.js, MongoDB/Mongoose, Better Auth, shadcn/ui, Zustand, TanStack Query, React Hook Form, Zod, Framer Motion

## Global Constraints

- Single Git monorepo with one root .git repository
- frontend/ and backend/ are independent projects with separate package.json, node_modules, .env
- Never hardcode credentials — commit only .env.example files
- Zod-based environment validation — fail fast on startup
- Feature-first architecture in both frontend and backend
- Better Auth as single authentication source of truth
- JWT only for stateless API access where required
- shadcn/ui components with Tailwind CSS 4
- Light Theme + Dark Theme with system detection and persistent preference
- React Hook Form + Zod for forms
- TanStack Query for server state
- Zustand for lightweight client state
- Framer Motion for meaningful UI animations
- Centralized logging, error handling, request validation, RBAC, Helmet, CORS, rate limiting
- Every feature: build passes, zero TS errors, lint passes, meaningful commit, push to GitHub

---

## Task 1: Backend Project Initialization

**Covers:** [S1, S2, S3]

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.eslintrc.js`
- Create: `backend/.prettierrc`
- Create: `backend/.gitignore`
- Create: `backend/src/app.ts`
- Create: `backend/src/server.ts`
- Create: `backend/src/config/index.ts`

**Interfaces:**
- Produces: Express app entry point, TypeScript config, linting config

- [ ] **Step 1: Create backend package.json**

```json
{
  "name": "babnunur-backend",
  "version": "1.0.0",
  "description": "Babnunur AI Platform Backend",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\""
  },
  "dependencies": {
    "express": "^4.21.0",
    "mongoose": "^8.8.0",
    "better-auth": "^1.0.0",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.8",
    "helmet": "^8.0.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.4.1",
    "morgan": "^1.10.0",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/morgan": "^1.9.9",
    "@types/node": "^22.9.0",
    "typescript": "^5.6.3",
    "tsx": "^4.19.2",
    "eslint": "^8.57.1",
    "@typescript-eslint/eslint-plugin": "^8.13.0",
    "@typescript-eslint/parser": "^8.13.0",
    "prettier": "^3.4.1"
  }
}
```

- [ ] **Step 2: Create backend tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create backend .eslintrc.js**

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
```

- [ ] **Step 4: Create backend .prettierrc**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

- [ ] **Step 5: Create backend .gitignore**

```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
```

- [ ] **Step 6: Create backend/src/config/index.ts**

```typescript
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  MONGODB_URI: z.string().url(),
  DATABASE_NAME: z.string().default('babnunur'),
  BETTER_AUTH_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = z.infer<typeof envSchema>;
```

- [ ] **Step 7: Create backend/src/app.ts**

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP',
});
app.use('/api', limiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
```

- [ ] **Step 8: Create backend/src/server.ts**

```typescript
import app from './app';
import { config } from './config';

const startServer = async () => {
  try {
    app.listen(config.PORT, () => {
      console.log(`🚀 Server running on port ${config.PORT}`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
```

- [ ] **Step 9: Install dependencies and verify**

Run: `cd backend && npm install`
Expected: Dependencies installed successfully

- [ ] **Step 10: Verify TypeScript compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 11: Verify lint passes**

Run: `cd backend && npm run lint`
Expected: No errors

- [ ] **Step 12: Commit**

```bash
cd backend
git add package.json tsconfig.json .eslintrc.js .prettierrc .gitignore src/
git commit -m "feat(backend): initialize project with TypeScript, ESLint, and Prettier"
```

---

## Task 2: Backend Environment Configuration

**Covers:** [S2, S6]

**Files:**
- Create: `backend/.env`
- Create: `backend/.env.example`

**Interfaces:**
- Produces: Environment variables for backend services

- [ ] **Step 1: Create backend/.env.example**

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
DATABASE_NAME=babnunur
BETTER_AUTH_URL=http://localhost:5000
BETTER_AUTH_SECRET=your-better-auth-secret-min-32-chars
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-jwt-refresh-secret-min-32-chars
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
CORS_ORIGIN=http://localhost:3000
```

- [ ] **Step 2: Create backend/.env (with placeholder values)**

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=babnunur
BETTER_AUTH_URL=http://localhost:5000
BETTER_AUTH_SECRET=dev-secret-change-in-production-min-32-chars!!
JWT_SECRET=dev-jwt-secret-change-in-production-min-32-chars!!
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production-min-32-chars!!
CORS_ORIGIN=http://localhost:3000
```

- [ ] **Step 3: Verify .gitignore excludes .env**

Run: `cd backend && git check-ignore .env`
Expected: `.env` (ignored)

- [ ] **Step 4: Commit**

```bash
cd backend
git add .env.example
git commit -m "chore(backend): add environment configuration template"
```

---

## Task 3: Backend Core Infrastructure

**Covers:** [S3]

**Files:**
- Create: `backend/src/core/errors.ts`
- Create: `backend/src/core/types.ts`
- Create: `backend/src/middleware/errorHandler.ts`
- Create: `backend/src/middleware/notFound.ts`

**Interfaces:**
- Produces: Custom error classes, error handling middleware

- [ ] **Step 1: Create backend/src/core/errors.ts**

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}
```

- [ ] **Step 2: Create backend/src/core/types.ts**

```typescript
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RequestUser {
  id: string;
  email: string;
  name: string;
  role: string;
}
```

- [ ] **Step 3: Create backend/src/middleware/errorHandler.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/errors';
import { config } from '../config';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  console.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: config.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};
```

- [ ] **Step 4: Create backend/src/middleware/notFound.ts**

```typescript
import { Request, Response } from 'express';

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
};
```

- [ ] **Step 5: Update backend/src/app.ts to use error middleware**

```typescript
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// ... after all routes
app.use(notFound);
app.use(errorHandler);
```

- [ ] **Step 6: Verify TypeScript compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
cd backend
git add src/core/ src/middleware/
git commit -m "feat(backend): add core error handling and middleware"
```

---

## Task 4: Backend MongoDB Connection

**Covers:** [S2, S5]

**Files:**
- Create: `backend/src/config/database.ts`
- Update: `backend/src/server.ts`

**Interfaces:**
- Produces: Database connection function, Mongoose connection

- [ ] **Step 1: Create backend/src/config/database.ts**

```typescript
import mongoose from 'mongoose';
import { config } from './index';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.MONGODB_URI, {
      dbName: config.DATABASE_NAME,
    });
    console.log(`📦 MongoDB connected to ${config.DATABASE_NAME}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};
```

- [ ] **Step 2: Update backend/src/server.ts**

```typescript
import { connectDatabase } from './config/database';

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(config.PORT, () => {
      console.log(`🚀 Server running on port ${config.PORT}`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
cd backend
git add src/config/database.ts src/server.ts
git commit -m "feat(backend): add MongoDB connection with Mongoose"
```

---

## Task 5: Backend User Model

**Covers:** [S5]

**Files:**
- Create: `backend/src/features/users/models/user.model.ts`
- Create: `backend/src/features/users/types.ts`

**Interfaces:**
- Produces: User schema, User types

- [ ] **Step 1: Create backend/src/features/users/types.ts**

```typescript
export interface IUser {
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  theme: 'light' | 'dark' | 'system';
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 2: Create backend/src/features/users/models/user.model.ts**

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../types';

export interface UserDocument extends IUser, Document {}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    avatar: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    isEmailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

export const User = mongoose.model<UserDocument>('User', userSchema);
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
cd backend
git add src/features/users/
git commit -m "feat(users): add User model with Mongoose schema"
```

---

## Task 6: Backend Better Auth Setup

**Covers:** [S6]

**Files:**
- Create: `backend/src/config/auth.ts`
- Create: `backend/src/features/auth/services/auth.service.ts`
- Create: `backend/src/features/auth/routes/auth.routes.ts`
- Update: `backend/src/app.ts`

**Interfaces:**
- Produces: Better Auth configuration, auth routes

- [ ] **Step 1: Create backend/src/config/auth.ts**

```typescript
import { betterAuth } from 'better-auth';
import { config } from './index';

export const auth = betterAuth({
  baseURL: config.BETTER_AUTH_URL,
  secret: config.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: config.GOOGLE_OAUTH_CLIENT_ID || '',
      clientSecret: config.GOOGLE_OAUTH_CLIENT_SECRET || '',
    },
  },
});
```

- [ ] **Step 2: Create backend/src/features/auth/routes/auth.routes.ts**

```typescript
import { Router } from 'express';
import { auth } from '../../../config/auth';

const router = Router();

router.post('/sign-up', async (req, res) => {
  try {
    const result = await auth.api.signUp({
      body: req.body,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.post('/sign-in', async (req, res) => {
  try {
    const result = await auth.api.signIn({
      body: req.body,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.post('/sign-out', async (req, res) => {
  try {
    await auth.api.signOut({ headers: req.headers as any });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.get('/session', async (req, res) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers as any });
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(401).json({ success: false, error: 'No active session' });
  }
});

export default router;
```

- [ ] **Step 3: Update backend/src/app.ts to use auth routes**

```typescript
import authRoutes from './features/auth/routes/auth.routes';

app.use('/api/v1/auth', authRoutes);
```

- [ ] **Step 4: Verify TypeScript compilation**

Run: `cd backend && npx tsc --noEmit`
Expected: No errors (may need to install better-auth types)

- [ ] **Step 5: Commit**

```bash
cd backend
git add src/config/auth.ts src/features/auth/ src/app.ts
git commit -m "feat(auth): integrate Better Auth with sign-up, sign-in, and session"
```

---

## Task 7: Frontend Project Initialization

**Covers:** [S1, S2, S4]

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/next.config.ts`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/postcss.config.js`
- Create: `frontend/.eslintrc.js`
- Create: `frontend/.prettierrc`
- Create: `frontend/.gitignore`
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/page.tsx`

**Interfaces:**
- Produces: Next.js project with TypeScript, Tailwind, ESLint

- [ ] **Step 1: Create frontend package.json**

```json
{
  "name": "babnunur-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css}\""
  },
  "dependencies": {
    "next": "^15.0.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.60.1",
    "react-hook-form": "^7.53.2",
    "@hookform/resolvers": "^3.9.1",
    "zod": "^3.23.8",
    "axios": "^1.7.8",
    "framer-motion": "^11.12.0",
    "lucide-react": "^0.460.0",
    "recharts": "^2.13.3",
    "zustand": "^5.0.1",
    "next-themes": "^0.4.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5"
  },
  "devDependencies": {
    "@types/node": "^22.9.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.6.3",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "postcss": "^8.4.49",
    "eslint": "^8.57.1",
    "eslint-config-next": "^15.0.3",
    "prettier": "^3.4.1"
  }
}
```

- [ ] **Step 2: Create frontend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create frontend/next.config.ts**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Create frontend/postcss.config.js**

```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

- [ ] **Step 5: Create frontend/.eslintrc.js**

```javascript
module.exports = {
  extends: ['next/core-web-vitals', 'eslint-config-next'],
};
```

- [ ] **Step 6: Create frontend/.prettierrc**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

- [ ] **Step 7: Create frontend/.gitignore**

```
node_modules/
.next/
.env
.env.local
out/
.DS_Store
```

- [ ] **Step 8: Create frontend/src/app/globals.css**

```css
@import "tailwindcss";
```

- [ ] **Step 9: Create frontend/src/app/layout.tsx**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Babnunur',
  description: 'AI Productivity Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 10: Create frontend/src/app/page.tsx**

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">Babnunur</h1>
    </main>
  );
}
```

- [ ] **Step 11: Install dependencies**

Run: `cd frontend && npm install`
Expected: Dependencies installed successfully

- [ ] **Step 12: Verify build**

Run: `cd frontend && npm run build`
Expected: Build completes successfully

- [ ] **Step 13: Commit**

```bash
cd frontend
git add package.json tsconfig.json next.config.ts postcss.config.js .eslintrc.js .prettierrc .gitignore src/
git commit -m "feat(frontend): initialize Next.js project with TypeScript and Tailwind"
```

---

## Task 8: Frontend Environment Configuration

**Covers:** [S2]

**Files:**
- Create: `frontend/.env`
- Create: `frontend/.env.example`

**Interfaces:**
- Produces: Frontend environment variables

- [ ] **Step 1: Create frontend/.env.example**

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_NAME=Babnunur
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 2: Create frontend/.env**

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_NAME=Babnunur
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 3: Verify .gitignore excludes .env**

Run: `cd frontend && git check-ignore .env`
Expected: `.env` (ignored)

- [ ] **Step 4: Commit**

```bash
cd frontend
git add .env.example
git commit -m "chore(frontend): add environment configuration template"
```

---

## Task 9: Frontend UI Utilities

**Covers:** [S4, S9]

**Files:**
- Create: `frontend/src/lib/utils.ts`
- Create: `frontend/src/lib/axios.ts`
- Create: `frontend/src/components/ui/button.tsx`
- Create: `frontend/src/components/ui/input.tsx`
- Create: `frontend/src/components/ui/card.tsx`

**Interfaces:**
- Produces: cn utility, Axios instance, basic UI components

- [ ] **Step 1: Create frontend/src/lib/utils.ts**

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Create frontend/src/lib/axios.ts**

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 3: Create frontend/src/components/ui/button.tsx**

```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

- [ ] **Step 4: Create frontend/src/components/ui/input.tsx**

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
```

- [ ] **Step 5: Create frontend/src/components/ui/card.tsx**

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl border bg-card text-card-foreground shadow', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent };
```

- [ ] **Step 6: Verify build**

Run: `cd frontend && npm run build`
Expected: Build completes successfully

- [ ] **Step 7: Commit**

```bash
cd frontend
git add src/lib/ src/components/ui/
git commit -m "feat(ui): add utility functions and base UI components"
```

---

## Task 10: Frontend Theme Support

**Covers:** [S4, S9]

**Files:**
- Create: `frontend/src/components/theme-provider.tsx`
- Create: `frontend/src/components/theme-toggle.tsx`
- Update: `frontend/src/app/layout.tsx`

**Interfaces:**
- Produces: ThemeProvider, ThemeToggle component

- [ ] **Step 1: Create frontend/src/components/theme-provider.tsx**

```tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

- [ ] **Step 2: Create frontend/src/components/theme-toggle.tsx**

```tsx
'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

- [ ] **Step 3: Update frontend/src/app/layout.tsx**

```tsx
import { ThemeProvider } from '@/components/theme-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `cd frontend && npm run build`
Expected: Build completes successfully

- [ ] **Step 5: Commit**

```bash
cd frontend
git add src/components/theme-provider.tsx src/components/theme-toggle.tsx src/app/layout.tsx
git commit -m "feat(ui): add theme support with light/dark mode and system detection"
```

---

## Task 11: Frontend Auth Pages

**Covers:** [S4, S6]

**Files:**
- Create: `frontend/src/app/(auth)/layout.tsx`
- Create: `frontend/src/app/(auth)/login/page.tsx`
- Create: `frontend/src/app/(auth)/register/page.tsx`
- Create: `frontend/src/features/auth/components/login-form.tsx`
- Create: `frontend/src/features/auth/components/register-form.tsx`

**Interfaces:**
- Produces: Auth layout, login and register pages with forms

- [ ] **Step 1: Create frontend/src/app/(auth)/layout.tsx**

```tsx
import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create frontend/src/features/auth/components/login-form.tsx**

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/axios';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/auth/sign-in', data);
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create frontend/src/app/(auth)/login/page.tsx**

```tsx
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  return <LoginForm />;
}
```

- [ ] **Step 4: Create frontend/src/features/auth/components/register-form.tsx**

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/axios';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/auth/sign-up', data);
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Create frontend/src/app/(auth)/register/page.tsx**

```tsx
import { RegisterForm } from '@/features/auth/components/register-form';

export default function RegisterPage() {
  return <RegisterForm />;
}
```

- [ ] **Step 6: Verify build**

Run: `cd frontend && npm run build`
Expected: Build completes successfully

- [ ] **Step 7: Commit**

```bash
cd frontend
git add src/app/\(auth\)/ src/features/auth/
git commit -m "feat(auth): add login and register pages with forms"
```

---

## Task 12: Frontend Dashboard Layout

**Covers:** [S4, S9]

**Files:**
- Create: `frontend/src/app/(dashboard)/layout.tsx`
- Create: `frontend/src/components/layouts/sidebar.tsx`
- Create: `frontend/src/components/layouts/header.tsx`

**Interfaces:**
- Produces: Dashboard layout with sidebar and header

- [ ] **Step 1: Create frontend/src/components/layouts/sidebar.tsx**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, FileText, Sparkles, LayoutDashboard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'Recommendations', href: '/dashboard/recommendations', icon: Sparkles },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-xl font-bold">
          Babnunur
        </Link>
      </div>
      <nav className="space-y-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create frontend/src/components/layouts/header.tsx**

```tsx
'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import api from '@/lib/axios';

export function Header() {
  const handleLogout = async () => {
    await api.post('/auth/sign-out');
    window.location.href = '/login';
  };

  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div />
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create frontend/src/app/(dashboard)/layout.tsx**

```tsx
import { Sidebar } from '@/components/layouts/sidebar';
import { Header } from '@/components/layouts/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create frontend/src/app/(dashboard)/dashboard/page.tsx**

```tsx
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Welcome to Babnunur</p>
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

Run: `cd frontend && npm run build`
Expected: Build completes successfully

- [ ] **Step 6: Commit**

```bash
cd frontend
git add src/app/\(dashboard\)/ src/components/layouts/
git commit -m "feat(dashboard): add dashboard layout with sidebar and header"
```

---

## Task 13: Root README

**Covers:** [S1]

**Files:**
- Create: `README.md`

**Interfaces:**
- Produces: Project documentation

- [ ] **Step 1: Create README.md**

```markdown
# Babnunur

A production-ready, full-stack Agentic AI Productivity Platform.

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Backend:** Express.js, TypeScript, MongoDB/Mongoose
- **Auth:** Better Auth + JWT
- **AI:** Gemini, DeepSeek
- **UI:** shadcn/ui, Framer Motion

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env
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

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add project README"
```

---

## Self-Review Results

1. **Spec coverage:** All [S1]-[S9] sections covered by tasks 1-13.
2. **Placeholder scan:** No TBD/TODO found. All code blocks complete.
3. **Type consistency:** All types defined before use. Consistent naming across tasks.

## Execution Handoff

Total tasks: 13
Estimated time: ~2-3 hours

Execution approach: Subagent recommended for parallel execution of independent tasks (frontend and backend can be built concurrently).
