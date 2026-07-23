'use client';

import { useState, useCallback, useRef } from 'react';
import { chatApi } from '../api/chat.api';
import { ChatRequest } from '../types';

export function useStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [partialMessage, setPartialMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (
    request: ChatRequest,
    onToken?: (content: string) => void,
    onEnd?: () => void,
    onUsage?: (usage: Record<string, unknown>) => void
  ) => {
    setIsStreaming(true);
    setPartialMessage('');
    setError(null);
    let tokenCount = 0;

    try {
      for await (const event of chatApi.stream(request)) {
        if (event.type === 'token') {
          const content = event.data.content as string;
          tokenCount++;
          setPartialMessage((prev) => prev + content);
          onToken?.(content);
        } else if (event.type === 'error') {
          console.log('15. Stream received: ERROR');
          setError(event.data.message as string);
        } else if (event.type === 'usage') {
          onUsage?.(event.data);
        } else if (event.type === 'done' || event.type === 'message_end') {
          console.log('15. Stream received: DONE (chunks:', tokenCount, ')');
          onEnd?.();
        }
      }
    } catch (err) {
      console.log('15. Stream received: ERROR -', (err as Error).message);
      setError((err as Error).message);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { isStreaming, partialMessage, error, startStream, stopStream, setPartialMessage };
}
