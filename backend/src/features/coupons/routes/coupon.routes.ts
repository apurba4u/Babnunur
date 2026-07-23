import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { requireRole } from '../../../middleware/rbac';
import { couponService } from '../services/coupon.service';

const router = Router();
router.use(requireAuth);

router.get('/', requireRole('admin'), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
    const search = req.query.search as string | undefined;

    const result = await couponService.list({ page, limit, isActive, search });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const coupon = await couponService.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const coupon = await couponService.getById(req.params.id as string);
    res.json({ success: true, data: coupon });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const coupon = await couponService.update(req.params.id as string, req.body);
    res.json({ success: true, data: coupon });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    await couponService.delete(req.params.id as string);
    res.json({ success: true, data: { message: 'Coupon deleted successfully' } });
  } catch (err) {
    next(err);
  }
});

router.post('/validate', async (req, res, next) => {
  try {
    const { code, amount } = req.body;
    if (!code) {
      res.status(400).json({ success: false, error: 'Coupon code is required' });
      return;
    }
    const coupon = await couponService.validateCoupon(code, amount ? Number(amount) : undefined);
    res.json({ success: true, data: coupon });
  } catch (err) {
    next(err);
  }
});

export default router;
