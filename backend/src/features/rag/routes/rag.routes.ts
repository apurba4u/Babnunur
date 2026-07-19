import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { ragService } from '../services/rag.service';

const router = Router();
router.use(requireAuth);

router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, documentIds, provider } = req.body;
    const result = await ragService.chatWithDocuments(
      { query: message, documentIds, provider },
      req.user!.id
    );
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/stream', async (req: Request, res: Response) => {
  const { message, documentIds, provider } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (event: string, data: unknown): void => {
    if (!res.writableEnded) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    }
  };

  try {
    sendEvent('connected', { requestId: Date.now().toString() });

    for await (const event of ragService.streamWithDocuments(
      { query: message, documentIds, provider },
      req.user!.id
    )) {
      if (event.type === 'citations') {
        sendEvent('citations', event.data);
      } else if (event.type === 'token') {
        sendEvent('token', { content: (event.data as { content: string }).content || '' });
      }
    }

    sendEvent('done', {});
  } catch (error) {
    sendEvent('error', { code: 'RAG_ERROR', message: (error as Error).message });
  } finally {
    if (!res.writableEnded) res.end();
  }
});

export default router;
