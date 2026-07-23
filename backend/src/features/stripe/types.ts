export interface StripeTransaction {
  id: string;
  userId: string;
  stripeId: string;
  type: 'payment_intent' | 'checkout_session' | 'subscription' | 'refund';
  amount: number;
  currency: string;
  status: string;
  metadata: Record<string, unknown>;
  description?: string;
  customerId?: string;
  paymentMethod?: string;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StripeSettings {
  enabled: boolean;
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  sandbox: boolean;
}
