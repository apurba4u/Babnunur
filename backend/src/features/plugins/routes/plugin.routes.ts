import { Router, Request, Response } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { pluginRegistry } from '../registry';

const router = Router();
router.use(requireAuth);

router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: pluginRegistry.getAll() });
});

router.get('/enabled', (_req: Request, res: Response) => {
  res.json({ success: true, data: pluginRegistry.getEnabled() });
});

router.post('/register', (req: Request, res: Response) => {
  pluginRegistry.register(req.body);
  res.json({ success: true, message: 'Plugin registered' });
});

router.post('/:id/toggle', (req: Request, res: Response) => {
  const plugin = pluginRegistry.get(String(req.params.id));
  if (!plugin) { res.status(404).json({ success: false, error: 'Plugin not found' }); return; }
  plugin.enabled = !plugin.enabled;
  res.json({ success: true, data: plugin });
});

export default router;
