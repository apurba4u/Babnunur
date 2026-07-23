'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h1 className="mt-6 text-3xl font-bold text-foreground">Payment Successful!</h1>
        <p className="mt-2 text-muted-foreground">
          Thank you for your purchase. Your account has been upgraded.
        </p>
        {sessionId && (
          <p className="mt-1 text-xs text-muted-foreground">
            Session ID: {sessionId}
          </p>
        )}
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
          <Link href="/payment">
            <Button variant="outline">View Payment History</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
