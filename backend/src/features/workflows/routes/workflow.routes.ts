import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { workflowService } from '../services/workflow.service';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await workflowService.list(req.user!.id) }); } catch (err) { next(err); }
});
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json({ success: true, data: await workflowService.create(req.user!.id, req.body) }); } catch (err) { next(err); }
});
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await workflowService.getById(String(req.params.id), req.user!.id) }); } catch (err) { next(err); }
});
router.post('/:id/run', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await workflowService.run(String(req.params.id), req.user!.id, req.body.input || '') }); } catch (err) { next(err); }
});
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { await workflowService.delete(String(req.params.id), req.user!.id); res.json({ success: true }); } catch (err) { next(err); }
});
export default router;
