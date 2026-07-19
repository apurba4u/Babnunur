import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { embeddingService } from '../services/embedding.service';
import { EmbeddingFactory } from '../providers/factory';

const router = Router();
router.use(requireAuth);

router.get('/providers', (_req: Request, res: Response) => {
  res.json({ success: true, data: EmbeddingFactory.getAvailableProviders() });
});

router.post('/embed/:documentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await embeddingService.embedChunks(req.params.documentId, req.user!.id, req.body.provider);
    res.json({ success: true, message: 'Document embedded successfully' });
  } catch (err) { next(err); }
});

router.post('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, topK, documentIds, provider } = req.body;
    const queryEmbedding = await embeddingService.embedQuery(query, provider);
    const { vectorService } = await import('../services/vector.service');
    const results = await vectorService.search(queryEmbedding, req.user!.id, { topK, documentIds });
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

export default router;
