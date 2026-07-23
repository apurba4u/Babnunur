import mongoose, { Schema } from 'mongoose';
import type { StripeTransaction, StripeSettings } from '../types';

const transactionSchema = new Schema<StripeTransaction>({
  userId: { type: String, required: true, index: true },
  stripeId: { type: String, required: true, unique: true },
  type: { type: String, enum: ['payment_intent', 'checkout_session', 'subscription', 'refund'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'usd' },
  status: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  description: String,
  customerId: String,
  paymentMethod: String,
  invoiceUrl: String,
}, { timestamps: true });

transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ status: 1 });

export const StripeTransactionModel = mongoose.model('StripeTransaction', transactionSchema);

const settingsSchema = new Schema<StripeSettings & { _id: string }>({
  _id: { type: String, default: 'stripe' },
  enabled: { type: Boolean, default: false },
  publishableKey: { type: String, default: '' },
  secretKey: { type: String, default: '' },
  webhookSecret: { type: String, default: '' },
  sandbox: { type: Boolean, default: true },
}, { timestamps: true });

export const StripeSettingsModel = mongoose.model('StripeSettings', settingsSchema);
