import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import authRoutes from './features/auth/routes/auth.routes';
import itemRoutes from './features/items/routes/item.routes';
import dashboardRoutes from './features/dashboard/routes/dashboard.routes';
import chatRoutes from './features/chat/routes/chat.routes';
import conversationRoutes from './features/chat/routes/conversation.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: `${config.MAX_UPLOAD_SIZE}mb` }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));

const limiter = rateLimit({
  windowMs: Number(config.RATE_LIMIT_WINDOW),
  max: Number(config.RATE_LIMIT_MAX_REQUESTS),
  message: 'Too many requests from this IP',
});
app.use('/api', limiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/items', itemRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/conversations', conversationRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
