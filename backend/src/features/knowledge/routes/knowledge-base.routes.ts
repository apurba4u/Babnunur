import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { knowledgeBaseService } from '../services/knowledge-base.service';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await knowledgeBaseService.list(req.user!.id, { page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 20, search: req.query.search as string });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kb = await knowledgeBaseService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data: kb });
  } catch (err) { next(err); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kb = await knowledgeBaseService.getById(req.params.id as string, req.user!.id);
    res.json({ success: true, data: kb });
  } catch (err) { next(err); }
});

router.post('/:id/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kb = await knowledgeBaseService.addDocuments(req.params.id as string, req.user!.id, req.body.documentIds);
    res.json({ success: true, data: kb });
  } catch (err) { next(err); }
});

router.delete('/:id/documents/:documentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kb = await knowledgeBaseService.removeDocument(req.params.id as string, req.user!.id, req.params.documentId as string);
    res.json({ success: true, data: kb });
  } catch (err) { next(err); }
});

router.post('/:id/tags', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kb = await knowledgeBaseService.addTags(req.params.id as string, req.user!.id, req.body.tags);
    res.json({ success: true, data: kb });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await knowledgeBaseService.delete(req.params.id as string, req.user!.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
