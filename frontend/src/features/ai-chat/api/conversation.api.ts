import api from '@/lib/axios';
import { Conversation, Message } from '../types';

export const conversationApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: Conversation[]; pagination: any }>('/conversations', { params }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: Conversation & { messages: Message[] } }>(`/conversations/${id}`),

  create: (data: { title?: string; provider?: string; model?: string }) =>
    api.post<{ success: boolean; data: Conversation }>('/conversations', data),

  update: (id: string, data: Partial<Conversation>) =>
    api.patch<{ success: boolean; data: Conversation }>(`/conversations/${id}`, data),

  delete: (id: string) =>
    api.delete(`/conversations/${id}`),

  archive: (id: string) =>
    api.post(`/conversations/${id}/archive`),

  restore: (id: string) =>
    api.post(`/conversations/${id}/restore`),

  favorite: (id: string) =>
    api.post(`/conversations/${id}/favorite`),

  pin: (id: string) =>
    api.post(`/conversations/${id}/pin`),
};
