'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/axios';
import { Loader2 } from 'lucide-react';

interface Transaction {
  _id: string;
  userId: string;
  stripeId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [failedPayments, setFailedPayments] = useState<Transaction[]>([]);
  const [revenue, setRevenue] = useState<{ _id: string; total: number; count: number }[]>([]);
  const [adminCheck, setAdminCheck] = useState<'loading' | 'granted' | 'denied'>('loading');

  useEffect(() => {
    api.get('/users/me').then((res) => {
      setAdminCheck(res.data?.data?.role === 'admin' ? 'granted' : 'denied');
    }).catch(() => setAdminCheck('denied'));
  }, []);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'transactions') {
        const res = await api.get(`/stripe/admin/transactions?page=${page}&limit=20`);
        setTransactions(res.data.data);
        setTotalPages(res.data.totalPages);
      } else if (activeTab === 'failed') {
        const res = await api.get(`/stripe/admin/failed-payments?page=${page}&limit=20`);
        setFailedPayments(res.data.data);
        setTotalPages(res.data.totalPages);
      } else if (activeTab === 'revenue') {
        const res = await api.get('/stripe/admin/revenue');
        setRevenue(res.data.data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeTab, page]);

  const handleRefund = async (transactionId: string) => {
    try {
      await api.post('/stripe/refund', { transactionId });
      fetchData();
    } catch {}
  };

  if (adminCheck === 'loading') {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }
  if (adminCheck === 'denied') {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Admin privileges required.</p>
            <Button onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payments</h1>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="failed">Failed Payments</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader><CardTitle>All Transactions</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-muted-foreground">Loading...</p> : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="pb-3 font-medium">Date</th>
                          <th className="pb-3 font-medium">User</th>
                          <th className="pb-3 font-medium">Type</th>
                          <th className="pb-3 font-medium">Amount</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr key={tx._id} className="border-b last:border-0">
                            <td className="py-3 text-foreground">{new Date(tx.createdAt).toLocaleDateString()}</td>
                            <td className="py-3 font-mono text-xs text-muted-foreground">{tx.userId.substring(0, 12)}...</td>
                            <td className="py-3 capitalize">{tx.type.replace('_', ' ')}</td>
                            <td className="py-3 font-medium">{tx.currency.toUpperCase()} {(tx.amount / 100).toFixed(2)}</td>
                            <td className="py-3">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                ['succeeded', 'completed'].includes(tx.status) ? 'bg-green-500/10 text-green-600' :
                                tx.status === 'refunded' ? 'bg-blue-500/10 text-blue-600' :
                                'bg-muted text-muted-foreground'
                              }`}>{tx.status}</span>
                            </td>
                            <td className="py-3">
                              {tx.type !== 'refund' && tx.type !== 'subscription' && (
                                <Button variant="outline" size="sm" onClick={() => handleRefund(tx._id)}>Refund</Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-4 flex justify-between">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                      <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Failed Payments</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-muted-foreground">Loading...</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">User</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {failedPayments.map((tx) => (
                        <tr key={tx._id} className="border-b last:border-0">
                          <td className="py-3 text-foreground">{new Date(tx.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 font-mono text-xs text-muted-foreground">{tx.userId.substring(0, 12)}...</td>
                          <td className="py-3">{tx.currency.toUpperCase()} {(tx.amount / 100).toFixed(2)}</td>
                          <td className="py-3"><span className="text-destructive">{tx.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <Card>
            <CardHeader><CardTitle>Revenue Overview</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-muted-foreground">Loading...</p> : revenue.length === 0 ? (
                <p className="text-muted-foreground">No revenue data yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {revenue.map((r) => (
                    <Card key={r._id}>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">{r._id.toUpperCase()}</p>
                        <p className="text-2xl font-bold">{(r.total / 100).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{r.count} transactions</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
