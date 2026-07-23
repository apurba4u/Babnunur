import api from '@/lib/axios';
import { ChatRequest, Attachment } from '../types';

export const chatApi = {
  upload: async (files: File[]): Promise<Attachment[]> => {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const res = await api.post('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  stream: async function* (request: ChatRequest): AsyncGenerator<{ type: string; data: Record<string, unknown> }> {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/chat/stream`;
    console.log('2. Request payload:', JSON.stringify(request));
    console.log('3. API URL:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    });
    console.log('4. Response status:', response.status, response.statusText);

    const reader = response.body?.getReader();
    if (!reader) {
      console.log('4. Response status: NO READER');
      return;
    }

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
