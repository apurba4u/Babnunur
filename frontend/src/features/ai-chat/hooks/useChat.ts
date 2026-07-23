'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useConversation, useCreateConversation } from './useConversations';
import { useStream } from './useStream';
import { Message } from '../types';
import { chatApi } from '../api/chat.api';

export function useChat(conversationId: string | null) {
  const { data: conversationData } = useConversation(conversationId || '');
  const createConversation = useCreateConversation();
  const stream = useStream();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(conversationId);
  const accumulatedRef = useRef('');

  useEffect(() => {
    setActiveConvId(conversationId);
  }, [conversationId]);

  const conversation = conversationData?.data?.data;
  useEffect(() => {
    if (conversation?.messages) {
      setMessages(conversation.messages);
    } else if (!conversationId) {
      setMessages([]);
    }
  }, [conversation?.messages, conversationId]);

  const sendMessage = useCallback(async (content: string, _provider?: string, files?: File[]) => {
    let id = activeConvId;

    let attachments = undefined;
    if (files && files.length > 0) {
      attachments = await chatApi.upload(files);
    }

    if (!id) {
      const title = attachments && attachments.length > 0
        ? `Chat with ${attachments[0].name}`
        : content.slice(0, 50);
      const result = await createConversation.mutateAsync({
        title,
        provider: 'opencodezen',
      });
      id = result.data.data._id;
      window.history.replaceState(null, '', `/chat/${id}`);
      setActiveConvId(id);
    }

    const userMessage: Message = {
      _id: crypto.randomUUID(),
      conversationId: id!,
      userId: '',
      role: 'user',
      content,
      messageType: 'text',
      sequenceNumber: messages.length + 1,
      status: 'completed',
      provider: 'opencodezen',
      modelName: 'deepseek-v4-flash',
      tokenCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      latencyMs: 0,
      attachments,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    accumulatedRef.current = '';

    await stream.startStream(
      {
        conversationId: id!,
        message: content,
        provider: 'opencodezen',
        model: 'deepseek-v4-flash-free',
        attachments,
      },
      (token) => {
        accumulatedRef.current += token;
      },
      () => {
        const fullContent = accumulatedRef.current;
        if (!fullContent) return;
        const assistantMsg: Message = {
          _id: crypto.randomUUID(),
          conversationId: id!,
          userId: '',
          role: 'assistant',
          content: fullContent,
          messageType: 'text',
          sequenceNumber: messages.length + 2,
          status: 'completed',
          provider: 'opencodezen',
          modelName: 'deepseek-v4-flash',
          tokenCount: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          latencyMs: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['conversation', id] });
      }
    );

    return id;
  }, [activeConvId, messages.length, createConversation, stream, queryClient]);

  const regenerate = useCallback(async () => {
    if (messages.length < 1) return;
    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') { lastUserIdx = i; break; }
    }
    if (lastUserIdx === -1) return;

    const lastUserMsg = messages[lastUserIdx];
    const id = activeConvId || lastUserMsg.conversationId;

    setMessages((prev) => prev.slice(0, lastUserIdx + 1));
    accumulatedRef.current = '';

    await stream.startStream(
      {
        conversationId: id!,
        message: lastUserMsg.content,
        provider: 'opencodezen',
        model: 'deepseek-v4-flash-free',
        attachments: lastUserMsg.attachments,
      },
      (token) => {
        accumulatedRef.current += token;
      },
      () => {
        const fullContent = accumulatedRef.current;
        if (!fullContent) return;
        const assistantMsg: Message = {
          _id: crypto.randomUUID(),
          conversationId: id!,
          userId: '',
          role: 'assistant',
          content: fullContent,
          messageType: 'text',
          sequenceNumber: messages.length + 1,
          status: 'completed',
          provider: 'opencodezen',
          modelName: 'deepseek-v4-flash',
          tokenCount: 0,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          latencyMs: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['conversation', id] });
      }
    );
  }, [messages, activeConvId, stream, queryClient]);

  return {
    conversation,
    messages,
    setMessages,
    isStreaming: stream.isStreaming,
    partialMessage: stream.partialMessage,
    error: stream.error,
    sendMessage,
    stopStream: stream.stopStream,
    regenerate,
  };
}
