'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <XCircle className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-6 text-3xl font-bold text-foreground">Payment Cancelled</h1>
        <p className="mt-2 text-muted-foreground">
          Your payment was cancelled. No charges have been made.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline">Try Again</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
