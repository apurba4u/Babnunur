import { Router, Request, Response } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { getAgents, getAgent, selectBestAgent } from '../registry';

const router = Router();
router.use(requireAuth);

router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: getAgents() });
});

router.get('/:id', (req: Request, res: Response) => {
  const agent = getAgent(req.params.id as string);
  if (!agent) { res.status(404).json({ success: false, error: 'Agent not found' }); return; }
  res.json({ success: true, data: agent });
});

router.post('/select', (req: Request, res: Response) => {
  const { query } = req.body;
  const agent = selectBestAgent(query || '');
  res.json({ success: true, data: agent });
});

export default router;
