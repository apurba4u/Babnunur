import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { requestLogger } from './middleware/requestLogger';
import authRoutes from './features/auth/routes/auth.routes';
import itemRoutes from './features/items/routes/item.routes';
import dashboardRoutes from './features/dashboard/routes/dashboard.routes';
import chatRoutes from './features/chat/routes/chat.routes';
import conversationRoutes from './features/chat/routes/conversation.routes';
import documentRoutes from './features/documents/routes/document.routes';
import embeddingRoutes from './features/embeddings/routes/embedding.routes';
import ragRoutes from './features/rag/routes/rag.routes';
import searchRoutes from './features/websearch/routes/search.routes';
import toolRoutes from './features/tools/routes/tool.routes';
import agentRoutes from './features/agent/routes/agent.routes';
import agentsRoutes from './features/agents/routes/agent.routes';
import memoryRoutes from './features/memory/routes/memory.routes';
import knowledgeBaseRoutes from './features/knowledge/routes/knowledge-base.routes';
import workflowRoutes from './features/workflows/routes/workflow.routes';
import pluginRoutes from './features/plugins/routes/plugin.routes';

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: `${config.MAX_UPLOAD_SIZE}mb` }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(requestLogger);

const limiter = rateLimit({
  windowMs: Number(config.RATE_LIMIT_WINDOW),
  max: Number(config.RATE_LIMIT_MAX_REQUESTS),
  message: 'Too many requests from this IP',
});
app.use('/api', limiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '2.1.0' });
});

app.get('/ready', async (_req, res) => {
  try {
    if (!mongoose.connection.db) {
      res.status(503).json({ status: 'not ready', timestamp: new Date().toISOString() });
      return;
    }
    await mongoose.connection.db.admin().ping();
    res.json({ status: 'ready', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'not ready', timestamp: new Date().toISOString() });
  }
});

// Mount Better Auth at its default path
app.all('/api/auth/*', async (req, res) => {
  try {
    const url = new URL(req.originalUrl, `http://${req.headers.host || 'localhost'}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value[0] : value);
    }

    const init: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = JSON.stringify(req.body);
    }

    const webRequest = new globalThis.Request(url.toString(), init);
    const { auth } = await import('./config/auth');
    const webResponse = await auth.handler(webRequest);

    res.status(webResponse.status);
    webResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const body = await webResponse.text();
    res.send(body);
  } catch (error) {
    console.error('Auth handler error:', error);
    res.status(500).json({ success: false, error: 'Auth handler error' });
  }
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/items', itemRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/embeddings', embeddingRoutes);
app.use('/api/v1/rag', ragRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/tools', toolRoutes);
app.use('/api/v1/agent', agentRoutes);
app.use('/api/v1/memory', memoryRoutes);
app.use('/api/v1/knowledge', knowledgeBaseRoutes);
app.use('/api/v1/agents', agentsRoutes);
app.use('/api/v1/workflows', workflowRoutes);
app.use('/api/v1/plugins', pluginRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
