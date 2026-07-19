import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { requireRole } from '../../../middleware/rbac';
import { analyticsService } from '../services/analytics.service';

const router = Router();
router.use(requireAuth);

router.get('/usage', async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await analyticsService.getUsageStats() }); } catch (err) { next(err); }
});

router.get('/users/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await analyticsService.getUserStats(String(req.params.userId)) }); } catch (err) { next(err); }
});

router.post('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await analyticsService.recordEvent({ userId: req.user!.id, ...req.body });
    res.status(201).json({ success: true, data: event });
  } catch (err) { next(err); }
});

export default router;