'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Item } from '../types';

const itemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'archived', 'draft']).optional(),
});
type ItemFormData = z.infer<typeof itemSchema>;

interface ItemFormProps {
  item?: Item | null;
  onSubmit: (data: ItemFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ItemForm({ item, onSubmit, onCancel, isLoading }: ItemFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ItemFormData>({ resolver: zodResolver(itemSchema) });
  useEffect(() => { if (item) reset({ title: item.title, description: item.description, category: item.category, status: item.status }); }, [item, reset]);
  return (
    <Card>
      <CardHeader><CardTitle>{item ? 'Edit Item' : 'New Item'}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <Input id="title" {...register('title')} placeholder="Item title" />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Input id="description" {...register('description')} placeholder="Description" />
          </div>
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">Category</label>
            <Input id="category" {...register('category')} placeholder="Category" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : item ? 'Update' : 'Create'}</Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
