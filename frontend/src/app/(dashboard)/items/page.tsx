'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ItemsToolbar } from '@/features/items/components/items-toolbar';
import { ItemsList } from '@/features/items/components/items-list';
import { ItemForm } from '@/features/items/components/item-form';
import { useItems, useCreateItem, useUpdateItem, useDeleteItem } from '@/features/items/hooks/useItems';
import { Item } from '@/features/items/types';

export default function ItemsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const params = search ? { search } : undefined;
  const { data, isLoading } = useItems(params);
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();

  const handleCreate = (formData: any) => { createItem.mutate(formData, { onSuccess: () => setShowForm(false) }); };
  const handleUpdate = (formData: any) => { if (!editingItem) return; updateItem.mutate({ id: editingItem._id, data: formData }, { onSuccess: () => setEditingItem(null) }); };
  const handleDelete = (id: string) => { if (confirm('Are you sure?')) deleteItem.mutate(id); };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Items</h1>
      <ItemsToolbar onSearch={setSearch} onAdd={() => { setShowForm(true); setEditingItem(null); }} />
      {(showForm || editingItem) && (
        <ItemForm item={editingItem} onSubmit={editingItem ? handleUpdate : handleCreate} onCancel={() => { setShowForm(false); setEditingItem(null); }} isLoading={createItem.isPending || updateItem.isPending} />
      )}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <ItemsList items={data?.data.data || []} onEdit={(item) => { setEditingItem(item); setShowForm(false); }} onDelete={handleDelete} />
      )}
      {data?.data.pagination && data.data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.data.pagination.totalPages }, (_, i) => (
            <Button key={i} variant={data.data.pagination.page === i + 1 ? 'default' : 'outline'} size="sm">{i + 1}</Button>
          ))}
        </div>
      )}
    </div>
  );
}
