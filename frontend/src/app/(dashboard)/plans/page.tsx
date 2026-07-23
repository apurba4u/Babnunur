'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios';
import { Loader2, Check, Zap, Shield, Users, Infinity, Star } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: { requests: number; tokens: number; documents: number };
}

const planIcons: Record<string, typeof Zap> = {
  free: Star,
  basic: Zap,
  pro: Zap,
  enterprise: Shield,
};

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    api.get('/billing/plans').then((res) => {
      setPlans(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    try {
      await api.post('/billing/subscribe', { planId });
      window.location.href = '/subscription';
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to subscribe');
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(price);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Choose Your Plan</h1>
        <p className="mt-2 text-muted-foreground">Unlock the full power of Babnunur AI</p>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No plans available yet. Contact admin.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plans.map((plan) => {
            const Icon = planIcons[plan.id] || Zap;
            const isFree = plan.price === 0;
            return (
              <Card key={plan.id} className={`flex flex-col relative ${plan.id === 'pro' ? 'border-primary shadow-lg' : ''}`}>
                {plan.id === 'pro' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${isFree ? 'bg-muted' : 'bg-primary/10'}`}>
                      <Icon className={`h-5 w-5 ${isFree ? 'text-muted-foreground' : 'text-primary'}`} />
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-6">
                    <span className="text-3xl font-bold">{formatPrice(plan.price, plan.currency)}</span>
                    <span className="text-muted-foreground ml-1">/{plan.interval}</span>
                  </div>
                  <ul className="space-y-3 flex-1 mb-6">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {plan.limits.requests === 0 ? 'Unlimited requests' : `${plan.limits.requests.toLocaleString()} requests/mo`}
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {plan.limits.tokens === 0 ? 'Unlimited tokens' : `${plan.limits.tokens.toLocaleString()} tokens/mo`}
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {plan.limits.documents === 0 ? 'Unlimited documents' : `${plan.limits.documents} documents`}
                    </li>
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing === plan.id}
                    variant={isFree ? 'outline' : 'default'}
                    className="w-full"
                  >
                    {subscribing === plan.id ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subscribing...</>
                    ) : isFree ? (
                      'Get Started Free'
                    ) : (
                      'Subscribe'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
