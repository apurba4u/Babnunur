import { PlanModel, SubscriptionModel, UsageModel, InvoiceModel } from '../models/billing.model';
import { NotFoundError } from '../../../core/errors';

export class BillingService {
  async getPlans() { return PlanModel.find().lean(); }
  async getPlan(id: string) { const plan = await PlanModel.findOne({ id }); if (!plan) throw new NotFoundError('Plan'); return plan; }
  
  async subscribe(userId: string, planId: string) {
    const plan = await this.getPlan(planId);
    return SubscriptionModel.create({ userId, planId, status: 'active', currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + (plan.interval === 'yearly' ? 365 : 30) * 86400000) });
  }
  
  async getSubscription(userId: string) {
    return SubscriptionModel.findOne({ userId, status: 'active' }).lean();
  }
  
  async cancelSubscription(userId: string) {
    const sub = await SubscriptionModel.findOneAndUpdate({ userId, status: 'active' }, { status: 'cancelled' }, { new: true });
    if (!sub) throw new NotFoundError('Subscription');
    return sub;
  }
  
  async recordUsage(userId: string, feature: string, quantity: number, unit: string, cost: number = 0) {
    return UsageModel.create({ userId, feature, quantity, unit, cost });
  }
  
  async getUsage(userId: string, startDate?: Date, endDate?: Date) {
    const filter: Record<string, unknown> = { userId };
    if (startDate) filter.recordedAt = { $gte: startDate };
    if (endDate) filter.recordedAt = { ...filter.recordedAt as Record<string, unknown>, $lte: endDate };
    return UsageModel.find(filter).sort({ recordedAt: -1 }).lean();
  }
  
  async getInvoices(userId: string) {
    return InvoiceModel.find({ userId }).sort({ createdAt: -1 }).lean();
  }
}

export const billingService = new BillingService();
