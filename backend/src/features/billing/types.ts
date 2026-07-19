export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: { requests: number; tokens: number; documents: number; };
}

export interface Subscription {
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdAt: Date;
}

export interface UsageRecord {
  userId: string;
  feature: string;
  quantity: number;
  unit: string;
  cost: number;
  recordedAt: Date;
}

export interface Invoice {
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'paid' | 'overdue';
  period: { start: Date; end: Date };
  items: Array<{ description: string; amount: number }>;
  createdAt: Date;
}
