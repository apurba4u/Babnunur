'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationApi } from '../api/conversation.api';

export function useConversations(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['conversations', params],
    queryFn: () => conversationApi.list(params),
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => conversationApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: conversationApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: conversationApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function useArchiveConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: conversationApi.archive,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function useRestoreConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: conversationApi.restore,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function useFavoriteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: conversationApi.favorite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function usePinConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: conversationApi.pin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function useRenameConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => conversationApi.update(id, { title } as any),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
}
