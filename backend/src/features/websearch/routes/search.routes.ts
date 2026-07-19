import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { searchService } from '../services/search.service';
import { SearchProviderFactory } from '../providers/provider.factory';

const router = Router();
router.use(requireAuth);

router.get('/providers', (_req: Request, res: Response) => {
  res.json({ success: true, data: SearchProviderFactory.getAvailableProviders() });
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, count, provider } = req.body;
    if (!query) {
      res.status(400).json({ success: false, error: 'Query is required' });
      return;
    }
    const results = await searchService.search(query, { count }, provider);
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

router.post('/multi', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, count } = req.body;
    if (!query) {
      res.status(400).json({ success: false, error: 'Query is required' });
      return;
    }
    const results = await searchService.searchMultiple(query, { count });
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

export default router;
