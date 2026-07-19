import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { orchestratorService } from '../services/orchestrator.service';
import { memoryService } from '../services/memory.service';
import { plannerService } from '../services/planner.service';
import { ChatMessage } from '../../ai/types';

const router = Router();
router.use(requireAuth);

router.post('/run', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { goal, conversationId, provider, documentIds } = req.body;
    if (!goal) {
      res.status(400).json({ success: false, error: 'Goal is required' });
      return;
    }
    const convId = conversationId || Date.now().toString();
    const result = await orchestratorService.run(goal, convId, req.user!.id, { provider, documentIds });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/plan', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { goal, conversationId, provider, documentIds } = req.body;
    if (!goal) {
      res.status(400).json({ success: false, error: 'Goal is required' });
      return;
    }
    const convId = conversationId || Date.now().toString();
    const memory = memoryService.get(convId);
    const plan = await plannerService.plan(goal, memory.messages.slice(-5) as ChatMessage[], { provider, documentIds });
    res.json({ success: true, data: plan });
  } catch (err) { next(err); }
});

router.delete('/memory/:conversationId', (req: Request, res: Response) => {
  memoryService.clear(req.params.conversationId as string);
  res.json({ success: true, message: 'Memory cleared' });
});

export default router;
