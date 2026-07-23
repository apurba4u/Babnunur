import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center py-12 ${className}`}
    >
      <Loader2 className={`animate-spin text-muted-foreground ${sizeClasses[size]}`} aria-hidden="true" />
      {text && <p className="mt-3 text-sm text-muted-foreground">{text}</p>}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function InlineSpinner({ text }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {text && <span>{text}</span>}
      <span className="sr-only">Loading...</span>
    </span>
  );
}
