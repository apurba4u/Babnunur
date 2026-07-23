import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { streamService } from '../../ai/services/stream.service';
import { chatService } from '../../ai/services/chat.service';
import { requireAuth } from '../../../middleware/auth';
import { streamMessageSchema, sendMessageSchema } from '../validations/chat.validation';

const MIME_MAP: Record<string, string> = {
  '.csv': 'text/csv',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();
router.use(requireAuth);

router.post('/upload', upload.array('files', 10), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No files uploaded' } });
      return;
    }

    const attachments = files.map((f) => {
      const ext = path.extname(f.originalname).toLowerCase();
      const mappedMime = MIME_MAP[ext] || f.mimetype;
      return {
        url: `data:${mappedMime};base64,${f.buffer.toString('base64')}`,
        name: f.originalname,
        type: mappedMime,
        size: f.size,
      };
    });

    res.json({ success: true, data: attachments });
  } catch (err) {
    next(err);
  }
});

router.post('/stream', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = streamMessageSchema.parse(req.body);

    console.log('\n=========================');
    console.log('BACKEND');
    console.log('=========================');
    console.log('5. Request reached /chat/stream endpoint');
    console.log('   userId:', req.user?.id);
    console.log('   conversationId:', body.conversationId);
    console.log('   provider:', body.provider);
    console.log('   model:', body.model);

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
      attachments: body.attachments,
      res,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = sendMessageSchema.parse(req.body);
    console.log('\n=========================');
    console.log('BACKEND');
    console.log('=========================');
    console.log('5. Request reached /chat/send endpoint');
    console.log('   userId:', req.user?.id);
    const result = await chatService.sendMessage({
      userId: req.user!.id,
      conversationId: body.conversationId,
      content: body.message,
      provider: body.provider,
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      attachments: (body as any).attachments,
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
