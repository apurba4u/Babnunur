'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { Item } from '../types';

interface ItemsListProps {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (id: string) => void;
}

export function ItemsList({ items, onEdit, onDelete }: ItemsListProps) {
  if (items.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">No items found. Create your first item to get started.</div>;
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item._id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(item)} aria-label={`Edit ${item.title}`}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(item._id)} aria-label={`Delete ${item.title}`}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">{item.description || 'No description'}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs bg-secondary px-2 py-1 rounded">{item.category}</span>
              <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
