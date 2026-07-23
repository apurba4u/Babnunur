'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { CreditCard } from 'lucide-react';
import api from '@/lib/axios';

interface Transaction {
  _id: string;
  stripeId: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  createdAt: string;
}

export default function PaymentHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    api.get(`/stripe/transactions?page=${page}&limit=20`).then((res) => {
      setTransactions(res.data.data);
      setTotalPages(res.data.totalPages);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page]);

  if (loading) return <LoadingSpinner text="Loading payment history..." />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payment History</h1>

      {transactions.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState icon={<CreditCard className="h-8 w-8" />} title="No payments yet" description="Your payment history will appear here after your first transaction." />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="border-b last:border-0">
                      <td className="py-3 text-foreground">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 capitalize">{tx.type.replace('_', ' ')}</td>
                      <td className="py-3 font-medium">
                        {tx.type === 'refund' ? '-' : ''}{tx.currency.toUpperCase()} {(tx.amount / 100).toFixed(2)}
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          tx.status === 'succeeded' || tx.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                          tx.status === 'refunded' ? 'bg-blue-500/10 text-blue-600' :
                          tx.status === 'failed' ? 'bg-destructive/10 text-destructive' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-xs text-muted-foreground">{tx.stripeId.substring(0, 20)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
