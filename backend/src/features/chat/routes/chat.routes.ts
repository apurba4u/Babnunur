import { Router, Request, Response } from 'express';
import { streamService } from '../../ai/services/stream.service';
import { chatService } from '../../ai/services/chat.service';
import { requireAuth } from '../../../middleware/auth';

const router = Router();
router.use(requireAuth);

router.post('/stream', async (req: Request, res: Response) => {
  const { conversationId, message, provider, model, temperature, maxTokens } = req.body;

  if (!conversationId || !message) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'conversationId and message are required' } });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  await streamService.streamChat({
    userId: req.user!.id,
    conversationId,
    content: message,
    provider,
    model,
    temperature,
    maxTokens,
    res,
  });
});

router.post('/send', async (req: Request, res: Response, next) => {
  try {
    const { conversationId, message, provider, model, temperature, maxTokens } = req.body;
    const result = await chatService.sendMessage({
      userId: req.user!.id,
      conversationId,
      content: message,
      provider,
      model,
      temperature,
      maxTokens,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/cancel', async (req: Request, res: Response) => {
  const { requestId } = req.body;
  const cancelled = streamService.cancelStream(requestId);
  res.json({ success: true, cancelled });
});

export default router;