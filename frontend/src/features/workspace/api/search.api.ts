import api from '@/lib/axios';
import { SearchResponse } from '../types';

export const searchApi = {
  search: (query: string, documentIds?: string[]) =>
    api.post<SearchResponse>('/search', { query, documentIds }),

  searchMulti: (query: string, documentIds?: string[]) =>
    api.post<SearchResponse>('/search/multi', { query, documentIds }),

  providers: () =>
    api.get<{ providers: string[] }>('/search/providers'),
};
