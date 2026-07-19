import api from '@/lib/axios';
import { Document, DocumentChunk, ProcessingJob } from '../types';

export const documentsApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ success: boolean; data: Document[]; pagination: any }>('/documents', { params }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: Document }>(`/documents/${id}`),

  upload: (file: File, title?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    return api.post<{ success: boolean; data: Document }>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getChunks: (id: string) =>
    api.get<{ success: boolean; data: DocumentChunk[] }>(`/documents/${id}/chunks`),

  getStatus: (id: string) =>
    api.get<{ success: boolean; data: ProcessingJob }>(`/documents/${id}/status`),

  delete: (id: string) =>
    api.delete(`/documents/${id}`),
};