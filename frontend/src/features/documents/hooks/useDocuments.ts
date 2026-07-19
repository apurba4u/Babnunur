'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../api/documents.api';

export function useDocuments(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => documentsApi.list(params),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.getById(id),
    enabled: !!id,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) => documentsApi.upload(file, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useDocumentStatus(id: string) {
  return useQuery({
    queryKey: ['document-status', id],
    queryFn: () => documentsApi.getStatus(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.data?.status;
      return status === 'processing' || status === 'pending' ? 2000 : false;
    },
  });
}