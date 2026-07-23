import Stripe from 'stripe';
import { StripeSettingsModel, StripeTransactionModel } from '../models/stripe.model';
import type { StripeTransaction } from '../types';
import { ValidationError } from '../../../core/errors';

let _stripe: Stripe | null = null;
let _settingsCache: { publishableKey: string; secretKey: string; webhookSecret: string; sandbox: boolean } | null = null;

async function getSettings() {
  if (_settingsCache) return _settingsCache;
  const doc = await StripeSettingsModel.findById('stripe').lean();
  if (!doc || !doc.enabled || !doc.secretKey) {
    throw new ValidationError('Stripe is not configured');
  }
  _settingsCache = { publishableKey: doc.publishableKey, secretKey: doc.secretKey, webhookSecret: doc.webhookSecret, sandbox: doc.sandbox };
  return _settingsCache;
}

function getStripe(secretKey: string) {
  if (!_stripe) {
    _stripe = new Stripe(secretKey, { apiVersion: '2026-06-24.dahlia' });
  }
  return _stripe;
}

export function invalidateCache() {
  _stripe = null;
  _settingsCache = null;
}

export const stripeService = {
  async getPublicConfig() {
    const settings = await StripeSettingsModel.findById('stripe').lean();
    return {
      enabled: settings?.enabled ?? false,
      publishableKey: settings?.publishableKey ?? '',
      sandbox: settings?.sandbox ?? true,
    };
  },

  async createCheckoutSession(userId: string, priceId: string, successUrl: string, cancelUrl: string, metadata?: Record<string, string>) {
    const settings = await getSettings();
    const stripe = getStripe(settings.secretKey);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId, ...metadata },
    });
    await StripeTransactionModel.create({
      userId, stripeId: session.id, type: 'checkout_session', amount: 0,
      currency: 'usd', status: session.status || 'pending', metadata: { priceId, ...metadata },
    });
    return { url: session.url, sessionId: session.id };
  },

  async createPaymentIntent(userId: string, amount: number, currency = 'usd', metadata?: Record<string, string>) {
    const settings = await getSettings();
    const stripe = getStripe(settings.secretKey);
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), currency, metadata: { userId, ...metadata },
      automatic_payment_methods: { enabled: true },
    });
    await StripeTransactionModel.create({
      userId, stripeId: intent.id, type: 'payment_intent',
      amount: Math.round(amount * 100), currency, status: intent.status,
      metadata: { ...metadata },
    });
    return { clientSecret: intent.client_secret, intentId: intent.id };
  },

  async handleWebhook(rawBody: string, signature: string) {
    const settings = await getSettings();
    const stripe = getStripe(settings.secretKey);
    const event = stripe.webhooks.constructEvent(rawBody, signature, settings.webhookSecret);

    const handler = WEBHOOK_HANDLERS[event.type];
    if (handler) await handler(event.data.object as Stripe.Event.Data.Object);

    return { received: true, type: event.type };
  },

  async refundPayment(userId: string, transactionId: string) {
    const settings = await getSettings();
    const stripe = getStripe(settings.secretKey);
    const tx = await StripeTransactionModel.findOne({ _id: transactionId, userId });
    if (!tx) throw new ValidationError('Transaction not found');
    if (tx.type === 'refund') throw new ValidationError('Already refunded');

    const refund = await stripe.refunds.create({ payment_intent: tx.stripeId });
    await StripeTransactionModel.create({
      userId, stripeId: refund.id, type: 'refund',
      amount: -tx.amount, currency: tx.currency, status: refund.status,
      metadata: { originalTransaction: tx.stripeId },
    });
    await StripeTransactionModel.updateOne({ _id: transactionId }, { status: 'refunded' });
    return refund;
  },

  async getTransactions(userId: string, page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      StripeTransactionModel.find({ userId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      StripeTransactionModel.countDocuments({ userId }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getAllTransactions(page = 1, limit = 20, status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const [data, total] = await Promise.all([
      StripeTransactionModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      StripeTransactionModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getRevenue() {
    const result = await StripeTransactionModel.aggregate([
      { $match: { type: { $in: ['payment_intent', 'subscription'] }, status: 'succeeded' } },
      { $group: { _id: '$currency', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    return result;
  },

  async getFailedPayments(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      StripeTransactionModel.find({ status: { $in: ['failed', 'requires_payment_method', 'canceled'] } })
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      StripeTransactionModel.countDocuments({ status: { $in: ['failed', 'requires_payment_method', 'canceled'] } }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async updateSettings(settings: { enabled?: boolean; publishableKey?: string; secretKey?: string; webhookSecret?: string; sandbox?: boolean }) {
    const doc = await StripeSettingsModel.findByIdAndUpdate(
      'stripe',
      { ...settings },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    invalidateCache();
    return { enabled: doc.enabled, publishableKey: doc.publishableKey, sandbox: doc.sandbox };
  },
};

const WEBHOOK_HANDLERS: Record<string, (obj: Stripe.Event.Data.Object) => Promise<void>> = {
  'checkout.session.completed': async (obj) => {
    const session = obj as unknown as Stripe.Checkout.Session;
    await StripeTransactionModel.updateOne(
      { stripeId: session.id },
      { status: session.status || 'completed', customerId: session.customer as string, invoiceUrl: (session.invoice as string) || undefined }
    );
  },
  'payment_intent.succeeded': async (obj) => {
    const intent = obj as unknown as Stripe.PaymentIntent;
    await StripeTransactionModel.updateOne(
      { stripeId: intent.id },
      { status: intent.status, paymentMethod: intent.payment_method as string }
    );
  },
  'payment_intent.payment_failed': async (obj) => {
    const intent = obj as unknown as Stripe.PaymentIntent;
    await StripeTransactionModel.updateOne(
      { stripeId: intent.id },
      { status: intent.status, metadata: { ...intent.metadata, error: intent.last_payment_error?.message } }
    );
  },
};
