import { ChatRequest } from '../types';

export const chatApi = {
  stream: async function* (request: ChatRequest): AsyncGenerator<{ type: string; data: Record<string, unknown> }> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ') && currentEvent) {
          try {
            const data = JSON.parse(line.slice(6));
            yield { type: currentEvent, data };
            currentEvent = '';
          } catch {
            /* Skip malformed JSON */
          }
        }
      }
    }
  },
};
