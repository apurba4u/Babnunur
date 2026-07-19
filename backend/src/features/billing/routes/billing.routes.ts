import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { billingService } from '../services/billing.service';

const router = Router();
router.use(requireAuth);

router.get('/plans', async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await billingService.getPlans() }); } catch (err) { next(err); }
});
router.post('/subscribe', async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json({ success: true, data: await billingService.subscribe(req.user!.id, req.body.planId) }); } catch (err) { next(err); }
});
router.get('/subscription', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await billingService.getSubscription(req.user!.id) }); } catch (err) { next(err); }
});
router.post('/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await billingService.cancelSubscription(req.user!.id) }); } catch (err) { next(err); }
});
router.get('/usage', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await billingService.getUsage(req.user!.id) }); } catch (err) { next(err); }
});
router.get('/invoices', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await billingService.getInvoices(req.user!.id) }); } catch (err) { next(err); }
});
export default router;
