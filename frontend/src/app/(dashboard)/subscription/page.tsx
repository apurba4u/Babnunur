'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios';
import { Loader2, CheckCircle, XCircle, AlertTriangle, BarChart3, FileText, CreditCard } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';

interface Subscription {
  _id: string;
  userId: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  createdAt: string;
}

interface UsageRecord {
  _id: string;
  feature: string;
  quantity: number;
  unit: string;
  cost: number;
  recordedAt: string;
}

interface Invoice {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  period: { start: string; end: string };
  items: Array<{ description: string; amount: number }>;
  createdAt: string;
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, usageRes, invRes] = await Promise.all([
        api.get('/billing/subscription').catch(() => ({ data: { data: null } })),
        api.get('/billing/usage').catch(() => ({ data: { data: [] } })),
        api.get('/billing/invoices').catch(() => ({ data: { data: [] } })),
      ]);
      setSubscription(subRes.data.data);
      setUsage(usageRes.data.data);
      setInvoices(invRes.data.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    setCancelling(true);
    try {
      await api.post('/billing/cancel');
      fetchData();
    } catch {}
    setCancelling(false);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-500/10 text-green-600',
      cancelled: 'bg-muted text-muted-foreground',
      past_due: 'bg-yellow-500/10 text-yellow-600',
      trialing: 'bg-blue-500/10 text-blue-600',
    };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || 'bg-muted text-muted-foreground'}`}>
        {status === 'active' ? <CheckCircle className="h-3 w-3" /> : status === 'cancelled' ? <XCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
        {status}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner text="Loading subscription..." />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Subscription</h1>

      <Card>
        <CardHeader><CardTitle>Current Plan</CardTitle></CardHeader>
        <CardContent>
          {!subscription ? (
            <EmptyState icon={<CreditCard className="h-8 w-8" />} title="No active subscription" description="Choose a plan to unlock premium features." action={<Button onClick={() => window.location.href = '/plans'}>View Plans</Button>} />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold capitalize">{subscription.planId}</p>
                  <p className="text-sm text-muted-foreground">Plan ID: {subscription.planId}</p>
                </div>
                {statusBadge(subscription.status)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Started</span>
                  <p>{new Date(subscription.currentPeriodStart).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Renewal</span>
                  <p>{subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
              {subscription.status === 'active' && (
                <Button variant="destructive" onClick={handleCancel} disabled={cancelling} className="mt-4">
                  {cancelling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelling...</> : 'Cancel Subscription'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {usage.length > 0 && (
        <Card>
          <CardHeader><CardTitle><BarChart3 className="h-5 w-5 inline mr-2" />Usage</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Feature</th>
                    <th className="pb-3 font-medium">Quantity</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.map((u) => (
                    <tr key={u._id} className="border-b last:border-0">
                      <td className="py-3 capitalize">{u.feature}</td>
                      <td className="py-3">{u.quantity} {u.unit}</td>
                      <td className="py-3 text-muted-foreground">{new Date(u.recordedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {invoices.length > 0 && (
        <Card>
          <CardHeader><CardTitle><FileText className="h-5 w-5 inline mr-2" />Invoices</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Period</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="border-b last:border-0">
                      <td className="py-3">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 font-medium">{(inv.currency || 'USD').toUpperCase()} {inv.amount.toFixed(2)}</td>
                      <td className="py-3">{statusBadge(inv.status)}</td>
                      <td className="py-3 text-muted-foreground text-xs">
                        {inv.period?.start ? `${new Date(inv.period.start).toLocaleDateString()} - ${new Date(inv.period.end).toLocaleDateString()}` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
