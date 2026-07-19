import api from '@/lib/axios';
import { ItemsResponse, Item } from '../types';

export const itemsApi = {
  getAll: (params?: Record<string, string>) => api.get<ItemsResponse>('/items', { params }),
  getById: (id: string) => api.get<{ success: boolean; data: Item }>(`/items/${id}`),
  create: (data: Partial<Item>) => api.post<{ success: boolean; data: Item }>('/items', data),
  update: (id: string, data: Partial<Item>) => api.put<{ success: boolean; data: Item }>(`/items/${id}`, data),
  delete: (id: string) => api.delete(`/items/${id}`),
};
