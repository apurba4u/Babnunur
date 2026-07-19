import { Router, Request, Response, NextFunction } from 'express';
import { streamService } from '../../ai/services/stream.service';
import { chatService } from '../../ai/services/chat.service';
import { requireAuth } from '../../../middleware/auth';
import { streamMessageSchema, sendMessageSchema } from '../validations/chat.validation';

// Rate limiting applied globally via app.ts (/api prefix)
const router = Router();
router.use(requireAuth);

router.post('/stream', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = streamMessageSchema.parse(req.body);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    await streamService.streamChat({
      userId: req.user!.id,
      conversationId: body.conversationId,
      content: body.message,
      provider: body.provider,
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      requestId: body.requestId,
      res,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = sendMessageSchema.parse(req.body);
    const result = await chatService.sendMessage({
      userId: req.user!.id,
      conversationId: body.conversationId,
      content: body.message,
      provider: body.provider,
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.body;
    if (!requestId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'requestId is required' } });
      return;
    }
    const cancelled = streamService.cancelStream(requestId);
    res.json({ success: true, cancelled });
  } catch (err) {
    next(err);
  }
});

export default router;
