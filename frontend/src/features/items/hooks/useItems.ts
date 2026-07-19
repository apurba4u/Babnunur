import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '../api/items.api';

export function useItems(params?: Record<string, string>) {
  return useQuery({ queryKey: ['items', params], queryFn: () => itemsApi.getAll(params) });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: itemsApi.create, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }) });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => itemsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: itemsApi.delete, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }) });
}
