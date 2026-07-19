'use client';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3" role="status" aria-label="AI is thinking">
      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
      </div>
      <span className="text-sm text-muted-foreground">Thinking...</span>
    </div>
  );
}
