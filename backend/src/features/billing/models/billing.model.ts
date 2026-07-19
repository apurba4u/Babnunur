import mongoose, { Schema, Document } from 'mongoose';
import { Plan, Subscription, UsageRecord, Invoice } from '../types';

const planSchema = new Schema<Plan & Document>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  interval: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  features: [{ type: String }],
  limits: { requests: Number, tokens: Number, documents: Number },
});
export const PlanModel = mongoose.model('Plan', planSchema);

const subscriptionSchema = new Schema<Subscription & Document>({
  userId: { type: String, required: true, index: true },
  planId: { type: String, required: true },
  status: { type: String, enum: ['active', 'cancelled', 'past_due', 'trialing'], default: 'active' },
  currentPeriodStart: { type: Date, default: Date.now },
  currentPeriodEnd: { type: Date },
}, { timestamps: true });
export const SubscriptionModel = mongoose.model('Subscription', subscriptionSchema);

const usageSchema = new Schema<UsageRecord & Document>({
  userId: { type: String, required: true, index: true },
  feature: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  cost: { type: Number, default: 0 },
  recordedAt: { type: Date, default: Date.now },
});
export const UsageModel = mongoose.model('Usage', usageSchema);

const invoiceSchema = new Schema<Invoice & Document>({
  userId: { type: String, required: true, index: true },
  subscriptionId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['draft', 'paid', 'overdue'], default: 'draft' },
  period: { start: Date, end: Date },
  items: [{ description: String, amount: Number }],
}, { timestamps: true });
export const InvoiceModel = mongoose.model('Invoice', invoiceSchema);
