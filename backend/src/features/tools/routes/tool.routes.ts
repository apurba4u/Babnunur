import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { toolRegistry } from '../registry';
import { toolExecutor } from '../executor';

const router = Router();
router.use(requireAuth);

router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: toolRegistry.getSchemas() });
});

router.post('/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, arguments: args } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Tool name is required' });
      return;
    }
    const result = await toolExecutor.execute({ id: Date.now().toString(), name, arguments: args || {} }, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/execute-batch', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { toolCalls } = req.body;
    if (!Array.isArray(toolCalls)) {
      res.status(400).json({ success: false, error: 'toolCalls must be an array' });
      return;
    }
    const results = await toolExecutor.executeMultiple(toolCalls, req.user!.id);
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

export default router;
