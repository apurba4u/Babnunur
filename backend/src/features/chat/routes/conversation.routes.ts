import { Router, Request, Response, NextFunction } from 'express';
import { conversationService } from '../services/conversation.service';
import { messageService } from '../services/message.service';
import { requireAuth } from '../../../middleware/auth';
import { createConversationSchema, updateConversationSchema, queryConversationSchema } from '../validations/chat.validation';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = queryConversationSchema.parse(req.query);
    const result = await conversationService.list({
      userId: req.user!.id,
      page: Number(query.page),
      limit: Number(query.limit),
      search: query.search,
      status: query.status,
      provider: query.provider,
      favorite: query.favorite,
      pinned: query.pinned,
      sort: query.sort,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createConversationSchema.parse(req.body);
    const conv = await conversationService.create({ userId: req.user!.id, ...data });
    res.status(201).json({ success: true, data: conv });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const conv = await conversationService.getById(id, req.user!.id);
    const messages = await messageService.listByConversation(id, req.user!.id, { limit: 100 });
    res.json({ success: true, data: { ...conv.toObject(), messages } });
  } catch (err) { next(err); }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const data = updateConversationSchema.parse(req.body);
    const conv = await conversationService.update(id, req.user!.id, data);
    res.json({ success: true, data: conv });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await conversationService.delete(id, req.user!.id);
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (err) { next(err); }
});

router.post('/:id/archive', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const conv = await conversationService.archive(id, req.user!.id);
    res.json({ success: true, data: conv });
  } catch (err) { next(err); }
});

router.post('/:id/restore', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const conv = await conversationService.restore(id, req.user!.id);
    res.json({ success: true, data: conv });
  } catch (err) { next(err); }
});

router.post('/:id/favorite', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const conv = await conversationService.toggleFavorite(id, req.user!.id);
    res.json({ success: true, data: conv });
  } catch (err) { next(err); }
});

router.post('/:id/pin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const conv = await conversationService.togglePin(id, req.user!.id);
    res.json({ success: true, data: conv });
  } catch (err) { next(err); }
});

export default router;