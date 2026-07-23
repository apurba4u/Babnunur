import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorCard({ title = 'Something went wrong', message, onRetry, className = '' }: ErrorCardProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center py-12 text-center ${className}`}
    >
      <AlertCircle className="h-10 w-10 text-destructive mb-4" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try Again
        </Button>
      )}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="flex-1">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="underline hover:no-underline font-medium whitespace-nowrap">
          Retry
        </button>
      )}
    </div>
  );
}
