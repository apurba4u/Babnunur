import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { memoryService } from '../services/memory.service';

const router = Router();
router.use(requireAuth);

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await memoryService.add({ userId: req.user!.id, ...req.body });
    res.status(201).json({ success: true, data: entry });
  } catch (err) { next(err); }
});

router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queryType = Array.isArray(req.query.type) ? req.query.type[0] as string : (req.query.type as string | undefined);
    const querySearch = req.query.query as string | undefined;
    const results = await memoryService.search({ userId: req.user!.id, query: querySearch, type: queryType, limit: Number(req.query.limit) || 20 });
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

router.get('/summarize/:conversationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversationId = req.params.conversationId as string;
    const summary = await memoryService.summarize(conversationId, req.user!.id);
    res.json({ success: true, data: { summary } });
  } catch (err) { next(err); }
});

router.post('/prune', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pruned = await memoryService.prune(req.user!.id, req.body.maxEntries || 500);
    res.json({ success: true, data: { pruned } });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { Memory } = await import('../models/memory.model');
    await Memory.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
