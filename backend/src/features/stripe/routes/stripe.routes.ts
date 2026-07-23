import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { requireRole } from '../../../middleware/rbac';
import { stripeService } from '../services/stripe.service';

const router = Router();

router.get('/config', async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await stripeService.getPublicConfig() }); } catch (err) { next(err); }
});

router.post('/create-checkout-session', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { priceId, successUrl, cancelUrl, metadata } = req.body;
    const result = await stripeService.createCheckoutSession(req.user!.id, priceId, successUrl, cancelUrl, metadata);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/create-payment-intent', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, currency, metadata } = req.body;
    const result = await stripeService.createPaymentIntent(req.user!.id, amount, currency, metadata);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const rawBody = (req as unknown as { rawBody: string }).rawBody;
    const result = await stripeService.handleWebhook(rawBody, sig);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/refund', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refund = await stripeService.refundPayment(req.user!.id, req.body.transactionId);
    res.json({ success: true, data: refund });
  } catch (err) { next(err); }
});

router.get('/transactions', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await stripeService.getTransactions(req.user!.id, page, limit);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

router.get('/admin/transactions', requireAuth, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const result = await stripeService.getAllTransactions(page, limit, status);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
});

router.get('/admin/revenue', requireAuth, requireRole('admin'), async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await stripeService.getRevenue() }); } catch (err) { next(err); }
});

router.get('/admin/failed-payments', requireAuth, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    res.json({ success: true, ...await stripeService.getFailedPayments(page, limit) });
  } catch (err) { next(err); }
});

router.put('/admin/settings', requireAuth, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { enabled, publishableKey, secretKey, webhookSecret, sandbox } = req.body;
    const result = await stripeService.updateSettings({ enabled, publishableKey, secretKey, webhookSecret, sandbox });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

router.get('/admin/settings', requireAuth, requireRole('admin'), async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await stripeService.getPublicConfig() }); } catch (err) { next(err); }
});

export default router;
