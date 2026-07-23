'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { useChat } from '../hooks/useChat';
import { AlertTriangle } from 'lucide-react';

interface ChatWindowProps {
  conversationId: string | null;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { messages, isStreaming, partialMessage, sendMessage, stopStream, error, regenerate } = useChat(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  const prevMsgCount = useRef(0);
  useEffect(() => {
    if (shouldAutoScroll.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (messages.length > prevMsgCount.current) {
      console.log('16. Message rendered: new message count =', messages.length);
    }
    prevMsgCount.current = messages.length;
  }, [messages, partialMessage, error]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleSend = async (content: string, files?: File[]) => {
    await sendMessage(content, undefined, files);
  };

  const handleRegenerate = () => {
    regenerate();
  };

  const lastMsg = messages[messages.length - 1];
  const isLastAssistant = lastMsg?.role === 'assistant' && lastMsg?.status === 'completed';
  const showPartial = isStreaming && !isLastAssistant;

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 && !isStreaming && !error && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
            <div className="text-4xl">💬</div>
            <div className="text-lg font-medium">Start a conversation</div>
            <div className="text-sm">Type a message below to begin</div>
          </div>
        )}

        {messages.map((msg) => {
          const isLastAssistantMsg = msg === lastMsg && msg.role === 'assistant';
          return (
            <MessageBubble
              key={msg._id}
              message={msg}
              onCopy={handleCopy}
              onRegenerate={isLastAssistantMsg && !isStreaming ? handleRegenerate : undefined}
              isPartial={false}
            />
          );
        })}

        {showPartial && partialMessage && (
          <MessageBubble
            message={{
              _id: 'partial',
              conversationId: conversationId || '',
              userId: '',
              role: 'assistant',
              content: partialMessage,
              messageType: 'text',
              sequenceNumber: messages.length + 1,
              status: 'streaming',
              provider: 'opencodezen',
              modelName: 'deepseek-v4-flash',
              tokenCount: 0,
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
              latencyMs: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }}
            isPartial
          />
        )}

        {isStreaming && !partialMessage && <TypingIndicator />}

        {error && !isStreaming && (
          <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5" role="alert">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">AI Response Error</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <p className="text-xs text-muted-foreground mt-1">Try again later.</p>
            </div>
          </div>
        )}
      </div>
      <ChatInput
        onSend={handleSend}
        onStop={stopStream}
        isStreaming={isStreaming}
      />
    </div>
  );
}
