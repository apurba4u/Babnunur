'use client';

import { useState, useCallback } from 'react';
import { useConversation, useCreateConversation } from './useConversations';
import { useStream } from './useStream';
import { Message } from '../types';

export function useChat(conversationId: string | null) {
  const { data: conversationData } = useConversation(conversationId || '');
  const createConversation = useCreateConversation();
  const stream = useStream();
  const [messages, setMessages] = useState<Message[]>([]);

  // Load messages when conversation changes
  useState(() => {
    const conversation = conversationData?.data?.data;
    if (conversation?.messages) {
      setMessages(conversation.messages);
    }
  });

  const sendMessage = useCallback(async (content: string, provider?: string) => {
    let activeConversationId = conversationId;

    if (!activeConversationId) {
      const result = await createConversation.mutateAsync({
        title: content.slice(0, 50),
        provider,
      });
      activeConversationId = result.data.data._id;
    }

    const userMessage: Message = {
      _id: crypto.randomUUID(),
      conversationId: activeConversationId!,
      userId: '',
      role: 'user',
      content,
      messageType: 'text',
      sequenceNumber: messages.length + 1,
      status: 'completed',
      provider: provider || 'gemini',
      modelName: 'gemini-2.0-flash',
      tokenCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      latencyMs: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    await stream.startStream(
      { conversationId: activeConversationId!, message: content, provider },
      undefined,
      () => {
        // On end - refresh messages
      }
    );

    return activeConversationId;
  }, [conversationId, messages.length, createConversation, stream]);

  return {
    conversation: conversationData?.data?.data,
    messages,
    setMessages,
    isStreaming: stream.isStreaming,
    partialMessage: stream.partialMessage,
    error: stream.error,
    sendMessage,
    stopStream: stream.stopStream,
  };
}
