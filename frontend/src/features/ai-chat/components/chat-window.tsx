'use client';

import { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { useChat } from '../hooks/useChat';
import { Message } from '../types';

interface ChatWindowProps {
  conversationId: string | null;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { messages, isStreaming, partialMessage, sendMessage, stopStream } = useChat(conversationId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  useEffect(() => {
    if (shouldAutoScroll.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, partialMessage]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleSend = async (content: string) => {
    await sendMessage(content);
  };

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
            <div className="text-4xl">💬</div>
            <div className="text-lg font-medium">Start a conversation</div>
            <div className="text-sm">Type a message below to begin</div>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            onCopy={handleCopy}
          />
        ))}
        {isStreaming && partialMessage && (
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
              provider: 'gemini',
              modelName: 'gemini-2.0-flash',
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
      </div>
      <ChatInput
        onSend={handleSend}
        onStop={stopStream}
        isStreaming={isStreaming}
      />
    </div>
  );
}
