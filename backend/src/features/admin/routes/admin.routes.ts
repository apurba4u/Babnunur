import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../../middleware/auth';
import { requireRole } from '../../../middleware/rbac';
import { User } from '../../users/models/user.model';
import { Conversation } from '../../chat/models/conversation.model';
import { Document } from '../../documents/models/document.model';
import { KnowledgeBaseModel } from '../../knowledge/models/knowledge-base.model';
import { StripeTransactionModel } from '../../stripe/models/stripe.model';
import { SubscriptionModel } from '../../billing/models/billing.model';

let Coupon: any = null;
let PackageModel: any = null;
let BlogPost: any = null;
let FAQ: any = null;
let Testimonial: any = null;
let WebsiteSettings: any = null;
let LandingSettings: any = null;
let Notification: any = null;
let SupportTicket: any = null;

try { Coupon = require('../../coupons/models/coupon.model').Coupon; } catch {}
try { PackageModel = require('../../packages/models/package.model').Package; } catch {}
try { BlogPost = require('../../blog/models/blog.model').Blog; } catch {}
try { FAQ = require('../../faq/models/faq.model').Faq; } catch {}
try { Testimonial = require('../../testimonials/models/testimonial.model').Testimonial; } catch {}
try { WebsiteSettings = require('../../settings/models/website-settings.model').WebsiteSettings; } catch {}
try { LandingSettings = require('../../settings/models/landing.model').Landing; } catch {}
try { Notification = require('../../notifications/models/notification.model').Notification; } catch {}
try { SupportTicket = require('../../support/models/ticket.model').Ticket; } catch {}

const router = Router();

router.use(requireAuth);
router.use(requireRole('admin'));

function paginate(query: any) {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit as string, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function paginatedResponse(data: any[], total: number, page: number, limit: number) {
  return {
    success: true,
    data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

// ─── Users ───────────────────────────────────────────────────────────────────

router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const search = (req.query.search as string) || '';
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const [data, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (err) { next(err); }
});

router.patch('/users/:id/role', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ success: false, error: 'Invalid role' });
      return;
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

router.delete('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      todayUsers,
      activeUsers,
      totalChats,
      totalDocuments,
      transactionAgg,
      subscriptionCount,
      couponCount,
      packageCount,
      recentUsers,
      recentPayments,
      recentChats,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      Conversation.countDocuments(),
      Document.countDocuments(),
      StripeTransactionModel.aggregate([
        { $match: { status: { $in: ['succeeded', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      SubscriptionModel.countDocuments(),
      Coupon ? Coupon.countDocuments() : Promise.resolve(0),
      PackageModel ? PackageModel.countDocuments() : Promise.resolve(0),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt').lean(),
      StripeTransactionModel.find().sort({ createdAt: -1 }).limit(5).lean(),
      Conversation.find().sort({ updatedAt: -1 }).limit(5).select('title userId createdAt').lean(),
    ]);

    const revenueTotal = transactionAgg.length > 0 ? transactionAgg[0].total : 0;
    const revenueCount = transactionAgg.length > 0 ? transactionAgg[0].count : 0;

    const enrichedChats = await Promise.all(recentChats.map(async (conv: any) => {
      const user = await User.findById(conv.userId).select('name email').lean();
      return { ...conv, user };
    }));

    res.json({
      success: true,
      data: {
        totalUsers,
        todayUsers,
        activeUsers,
        totalChats,
        totalDocuments,
        revenue: { total: revenueTotal, count: revenueCount },
        totalCoupons: couponCount,
        totalSubscriptions: subscriptionCount,
        totalPackages: packageCount,
        recentUsers,
        recentPayments,
        recentChats: enrichedChats,
      },
    });
  } catch (err) { next(err); }
});

// ─── AI Providers ─────────────────────────────────────────────────────────────

router.get('/ai/providers', async (_req: Request, res: Response) => {
  try {
    const { ProviderFactory } = await import('../../ai/providers/factory');
    const data = ProviderFactory.getAvailableProviders();
    res.json({ success: true, data });
  } catch {
    res.json({ success: true, data: [] });
  }
});

router.patch('/ai/providers/:name', async (req: Request, res: Response) => {
  const { apiKey, enabled, model } = req.body;
  const update: any = {};
  if (apiKey !== undefined) update.apiKey = apiKey;
  if (enabled !== undefined) update.enabled = enabled;
  if (model !== undefined) update.model = model;
  res.json({ success: true, data: { provider: req.params.name, ...update } });
});

// ─── Prompts ──────────────────────────────────────────────────────────────────

router.get('/prompts', async (_req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

router.post('/prompts', async (req: Request, res: Response) => {
  res.json({ success: true, data: req.body });
});

router.patch('/prompts/:id', async (req: Request, res: Response) => {
  res.json({ success: true, data: { id: req.params.id, ...req.body } });
});

router.delete('/prompts/:id', async (_req: Request, res: Response) => {
  res.json({ success: true, data: { id: null } });
});

// ─── Chats ────────────────────────────────────────────────────────────────────

router.get('/chats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const [data, total] = await Promise.all([
      Conversation.find().sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      Conversation.countDocuments(),
    ]);
    const enriched = await Promise.all(data.map(async (conv: any) => {
      const user = await User.findById(conv.userId).select('name email').lean();
      return { ...conv, user };
    }));
    res.json(paginatedResponse(enriched, total, page, limit));
  } catch (err) { next(err); }
});

// ─── Documents ────────────────────────────────────────────────────────────────

router.get('/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const [data, total] = await Promise.all([
      Document.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Document.countDocuments(),
    ]);
    const enriched = await Promise.all(data.map(async (doc: any) => {
      const user = await User.findById(doc.userId).select('name email').lean();
      return { ...doc, user };
    }));
    res.json(paginatedResponse(enriched, total, page, limit));
  } catch (err) { next(err); }
});

// ─── Knowledge Bases ──────────────────────────────────────────────────────────

router.get('/knowledge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const [data, total] = await Promise.all([
      KnowledgeBaseModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      KnowledgeBaseModel.countDocuments(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (err) { next(err); }
});

// ─── Coupons ──────────────────────────────────────────────────────────────────

router.get('/coupons', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Coupon) { res.status(501).json({ success: false, error: 'Coupon model not available' }); return; }
    const { page, limit, skip } = paginate(req.query);
    const [data, total] = await Promise.all([
      Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Coupon.countDocuments(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (err) { next(err); }
});

router.post('/coupons', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Coupon) { res.status(501).json({ success: false, error: 'Coupon model not available' }); return; }
    const data = await Coupon.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/coupons/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Coupon) { res.status(501).json({ success: false, error: 'Coupon model not available' }); return; }
    const data = await Coupon.findById(req.params.id);
    if (!data) { res.status(404).json({ success: false, error: 'Coupon not found' }); return; }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.patch('/coupons/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Coupon) { res.status(501).json({ success: false, error: 'Coupon model not available' }); return; }
    const data = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) { res.status(404).json({ success: false, error: 'Coupon not found' }); return; }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.delete('/coupons/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Coupon) { res.status(501).json({ success: false, error: 'Coupon model not available' }); return; }
    const data = await Coupon.findByIdAndDelete(req.params.id);
    if (!data) { res.status(404).json({ success: false, error: 'Coupon not found' }); return; }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post('/coupons/seed', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Coupon) { res.status(501).json({ success: false, error: 'Coupon model not available' }); return; }
    const defaults = [
      { code: 'WELCOME50', description: '50% off your first purchase', discountType: 'percentage', discountValue: 50, maxUses: null, isActive: true },
      { code: 'GRE20', description: '20% off everything', discountType: 'percentage', discountValue: 20, maxUses: null, isActive: true },
      { code: 'AI30', description: '30% off AI features', discountType: 'percentage', discountValue: 30, maxUses: 100, isActive: true },
      { code: 'STUDENT15', description: '15% off for students', discountType: 'percentage', discountValue: 15, maxUses: 500, isActive: true },
      { code: 'SUMMER25', description: '25% off summer sale', discountType: 'percentage', discountValue: 25, maxUses: 200, isActive: true },
    ];
    const seeded: any[] = [];
    for (const coupon of defaults) {
      const existing = await Coupon.findOne({ code: coupon.code });
      if (!existing) seeded.push(await Coupon.create(coupon));
    }
    res.json({ success: true, data: seeded, message: `${seeded.length} coupons seeded` });
  } catch (err) { next(err); }
});

// ─── Payments (Stripe) ────────────────────────────────────────────────────────

router.get('/payments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const [data, total] = await Promise.all([
      StripeTransactionModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      StripeTransactionModel.countDocuments(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (err) { next(err); }
});

// ─── Packages ─────────────────────────────────────────────────────────────────

router.get('/packages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!PackageModel) { res.status(501).json({ success: false, error: 'Package model not available' }); return; }
    const { page, limit, skip } = paginate(req.query);
    const [data, total] = await Promise.all([
      PackageModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      PackageModel.countDocuments(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (err) { next(err); }
});

router.post('/packages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!PackageModel) { res.status(501).json({ success: false, error: 'Package model not available' }); return; }
    const data = await PackageModel.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.patch('/packages/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!PackageModel) { res.status(501).json({ success: false, error: 'Package model not available' }); return; }
    const data = await PackageModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) { res.status(404).json({ success: false, error: 'Package not found' }); return; }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.delete('/packages/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!PackageModel) { res.status(501).json({ success: false, error: 'Package model not available' }); return; }
    const data = await PackageModel.findByIdAndDelete(req.params.id);
    if (!data) { res.status(404).json({ success: false, error: 'Package not found' }); return; }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ─── Subscriptions ────────────────────────────────────────────────────────────

router.get('/subscriptions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const [data, total] = await Promise.all([
      SubscriptionModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      SubscriptionModel.countDocuments(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (err) { next(err); }
});

// ─── Blog ─────────────────────────────────────────────────────────────────────

router.get('/blog', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!BlogPost) { res.status(501).json({ success: false, error: 'Blog model not available' }); return; }
    const { page, limit, skip } = paginate(req.query);
    const [data, total] = await Promise.all([
      BlogPost.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      BlogPost.countDocuments(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (err) { next(err); }
});

router.post('/blog', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!BlogPost) { res.status(501).json({ success: false, error: 'Blog model not available' }); return; }
    const data = await BlogPost.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/blog/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!BlogPost) { res.status(501).json({ success: false, error: 'Blog model not available' }); return; }
    const data = await BlogPost.findById(req.params.id);
    if (!data) { res.status(404).json({ success: false, error: 'Blog post not found' }); return; }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.patch('/blog/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!BlogPost) { res.status(501).json({ success: false, error: 'Blog model not available' }); return; }
    const data = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) { res.status(404).json({ success: false, error: 'Blog post not found' }); return; }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.delete('/blog/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!BlogPost) { res.status(501).json({ success: false, error: 'Blog model not available' }); return; }
    const data = await BlogPost.findByIdAndDelete(req.params.id);
    if (!data) { res.status(404).json({ success: false, error: 'Blog post not found' }); return; }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ─── FAQ ──────────────────────────────────────────────────────────────────────

router.get('/faq', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!FAQ) { res.status(501).json({ success: false, error: 'FAQ model not available' }); return; }
    const { page, limit, skip } = paginate(req.query);
    const [data, total] = await Promise.all([
      FAQ.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      FAQ.countDocuments(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (err) { next(err); }
});

router.post('/faq', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!FAQ) { res.status(501).json({ success: false, error: 'FAQ model not available' }); return; }
    const data = await FAQ.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.patch('/faq/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!FAQ) { res.status(501).json({ success: false, error: 'FAQ model not available' }); return; }
    const data = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) { res.status(404).json({ success: false, error: 'FAQ not found' }); return; }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.delete('/faq/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!FAQ) { res.status(501).json({ success: false, error: 'FAQ model not available' }); return; }
    const data = await FAQ.findByIdAndDelete(req.params.id);
    if (!data) { res.status(404).json({ success: false, error: 'FAQ not found' }); return; }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ─── Testimonials ─────────────────────────────────────────────────────────────

router.get('/testimonials', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Testimonial) { res.status(501).json({ success: false, error: 'Testimonial model not available' }); return; }
    const { page, limit, skip } = paginate(req.query);
    const [data, total] = await Promise.all([
      Testimonial.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Testimonial.countDocuments(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (err) { next(err); }
});

router.post('/testimonials', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Testimonial) { res.status(501).json({ success: false, error: 'Testimonial model not available' }); return; }
    const data = await Testimonial.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) { next(err); }
});

router.patch('/testimonials/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Testimonial) { res.status(501).json({ success: false, error: 'Testimonial model not available' }); return; }
    const data = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) { res.status(404).json({ success: false, error: 'Testimonial not found' }); return; }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.delete('/testimonials/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Testimonial) { res.status(501).json({ success: false, error: 'Testimonial model not available' }); return; }
    const data = await Testimonial.findByIdAndDelete(req.params.id);
    if (!data) { res.status(404).json({ success: false, error: 'Testimonial not found' }); return; }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ─── Website Settings ─────────────────────────────────────────────────────────

router.get('/settings/website', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (!WebsiteSettings) { res.status(501).json({ success: false, error: 'Website settings model not available' }); return; }
    let data = await WebsiteSettings.findOne();
    if (!data) data = await WebsiteSettings.create({});
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.put('/settings/website', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!WebsiteSettings) { res.status(501).json({ success: false, error: 'Website settings model not available' }); return; }
    let data = await WebsiteSettings.findOne();
    if (!data) {
      data = await WebsiteSettings.create(req.body);
    } else {
      Object.assign(data, req.body);
      await data.save();
    }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get('/settings/landing', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (!LandingSettings) { res.status(501).json({ success: false, error: 'Landing settings model not available' }); return; }
    let data = await LandingSettings.findOne();
    if (!data) data = await LandingSettings.create({});
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.put('/settings/landing', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!LandingSettings) { res.status(501).json({ success: false, error: 'Landing settings model not available' }); return; }
    let data = await LandingSettings.findOne();
    if (!data) {
      data = await LandingSettings.create(req.body);
    } else {
      Object.assign(data, req.body);
      await data.save();
    }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ─── Analytics ────────────────────────────────────────────────────────────────

router.get('/analytics', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [userCount, conversationCount, documentCount, transactionAgg] = await Promise.all([
      User.countDocuments(),
      Conversation.countDocuments(),
      Document.countDocuments(),
      StripeTransactionModel.aggregate([
        { $match: { status: { $in: ['succeeded', 'completed'] } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);
    const revenueTotal = transactionAgg.length > 0 ? transactionAgg[0].total : 0;
    res.json({
      success: true,
      data: { userCount, conversationCount, documentCount, revenueTotal },
    });
  } catch (err) { next(err); }
});

// ─── Logs ─────────────────────────────────────────────────────────────────────

router.get('/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    let RequestLog: any;
    try { RequestLog = require('../../logs/models/log.model').RequestLog; } catch {}
    if (!RequestLog) {
      res.json(paginatedResponse([], 0, page, limit));
      return;
    }
    const [data, total] = await Promise.all([
      RequestLog.find().sort({ timestamp: -1 }).skip(skip).limit(limit),
      RequestLog.countDocuments(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (err) { next(err); }
});

// ─── Notifications ────────────────────────────────────────────────────────────

router.get('/notifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Notification) { res.status(501).json({ success: false, error: 'Notification model not available' }); return; }
    const { page, limit, skip } = paginate(req.query);
    const [data, total] = await Promise.all([
      Notification.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (err) { next(err); }
});

router.post('/notifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Notification) { res.status(501).json({ success: false, error: 'Notification model not available' }); return; }
    const { userId, title, message, type } = req.body;
    if (userId) {
      const data = await Notification.create({ userId, title, message, type });
      res.status(201).json({ success: true, data });
    } else {
      const users = await User.find({}).select('_id').lean();
      const notifications = users.map((u: any) => ({ userId: u._id.toString(), title, message, type }));
      const data = await Notification.insertMany(notifications);
      res.status(201).json({ success: true, data, count: data.length });
    }
  } catch (err) { next(err); }
});

router.delete('/notifications/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Notification) { res.status(501).json({ success: false, error: 'Notification model not available' }); return; }
    const data = await Notification.findByIdAndDelete(req.params.id);
    if (!data) { res.status(404).json({ success: false, error: 'Notification not found' }); return; }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

// ─── Support Tickets ──────────────────────────────────────────────────────────

router.get('/support', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!SupportTicket) { res.status(501).json({ success: false, error: 'Support ticket model not available' }); return; }
    const { page, limit, skip } = paginate(req.query);
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    const [data, total] = await Promise.all([
      SupportTicket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      SupportTicket.countDocuments(filter),
    ]);
    res.json(paginatedResponse(data, total, page, limit));
  } catch (err) { next(err); }
});

router.patch('/support/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!SupportTicket) { res.status(501).json({ success: false, error: 'Support ticket model not available' }); return; }
    const data = await SupportTicket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) { res.status(404).json({ success: false, error: 'Support ticket not found' }); return; }
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.post('/support/:id/reply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!SupportTicket) { res.status(501).json({ success: false, error: 'Support ticket model not available' }); return; }
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) { res.status(404).json({ success: false, error: 'Support ticket not found' }); return; }
    if (!ticket.messages) ticket.messages = [];
    ticket.messages.push({
      senderId: req.user!.id,
      senderName: req.user!.name,
      message: req.body.message,
      createdAt: new Date(),
    });
    if (req.body.status) ticket.status = req.body.status;
    await ticket.save();
    res.json({ success: true, data: ticket });
  } catch (err) { next(err); }
});

export default router;
