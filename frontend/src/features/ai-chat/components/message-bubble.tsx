'use client';

import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, User, Bot, AlertCircle, FileText, Image } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isPartial?: boolean;
  onCopy?: (content: string) => void;
  onRegenerate?: () => void;
}

export const MessageBubble = memo(function MessageBubble({ message, isPartial, onCopy, onRegenerate }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isError = message.status === 'failed';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          {isError ? <AlertCircle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
      )}
      <Card className={`max-w-[80%] px-4 py-3 ${isUser ? 'bg-primary text-primary-foreground' : ''} ${isError ? 'border-destructive' : ''}`}>
        {isUser ? (
          <div className="text-sm space-y-2">
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {message.attachments.map((att, i) => (
                  att.type.startsWith('image/') ? (
                    <div key={i} className="h-20 w-20 rounded-md overflow-hidden border border-primary/20">
                      <img src={att.url} alt={att.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div key={i} className="flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[120px]">{att.name}</span>
                    </div>
                  )
                ))}
              </div>
            )}
            {message.content && <p>{message.content}</p>}
          </div>
        ) : (
          <MarkdownRenderer content={message.content || (isPartial ? '' : '...')} />
        )}
        {isPartial && <span className="animate-pulse">|</span>}
        <div className="mt-2 flex items-center gap-2">
          {!isUser && onCopy && message.content && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onCopy(message.content)} aria-label="Copy message">
              <Copy className="h-3 w-3" />
            </Button>
          )}
          {!isUser && onRegenerate && !isPartial && !isError && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRegenerate} aria-label="Regenerate response">
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
        </div>
      </Card>
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
});
