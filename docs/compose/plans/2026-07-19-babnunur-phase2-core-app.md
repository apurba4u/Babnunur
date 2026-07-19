# Babnunur Phase 2: Core Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement core application features including CRUD functionality, dashboard widgets, search, filtering, pagination, user profile, and settings page.

**Architecture:** Extend the existing modular monolith backend with new feature modules. Extend the Next.js App Router frontend with new pages and components.

**Tech Stack:** Same as Phase 1 — Next.js 15, React 19, TypeScript, Tailwind CSS 4, Express.js, MongoDB/Mongoose, shadcn/ui, React Hook Form, Zod, TanStack Query, Zustand

## Global Constraints

- Single Git monorepo with one root .git repository
- Never hardcode credentials
- Feature-first architecture
- Every feature: build passes, zero TS errors, lint passes, meaningful commit
- Use existing UI components (Button, Input, Card)
- Use existing API patterns (axios instance, /api/v1 prefix)

---

## Task 1: Backend — RBAC Middleware

**Covers:** Authorization layer for protected routes

**Files:**
- Create: `backend/src/middleware/auth.ts`
- Create: `backend/src/middleware/rbac.ts`

**Interfaces:**
- Produces: Auth middleware, role-based access control

- [ ] **Step 1: Create backend/src/middleware/auth.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/auth';
import { UnauthorizedError } from '../core/errors';
import { RequestUser } from '../core/types';

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || !session.user) {
      throw new UnauthorizedError('Authentication required');
    }
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: (session.user as any).role || 'user',
    };
    next();
  } catch {
    next(new UnauthorizedError('Authentication required'));
  }
};
```

- [ ] **Step 2: Create backend/src/middleware/rbac.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../core/errors';

export const requireRole = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Authentication required'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }
    next();
  };
};
```

- [ ] **Step 3: Verify TypeScript**

Run: `cd backend && npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add backend/src/middleware/auth.ts backend/src/middleware/rbac.ts
git commit -m "feat(backend): add auth and RBAC middleware"
```

---

## Task 2: Backend — Items CRUD Feature

**Covers:** CRUD functionality with search, filtering, pagination

**Files:**
- Create: `backend/src/features/items/types.ts`
- Create: `backend/src/features/items/models/item.model.ts`
- Create: `backend/src/features/items/services/item.service.ts`
- Create: `backend/src/features/items/controllers/item.controller.ts`
- Create: `backend/src/features/items/routes/item.routes.ts`
- Create: `backend/src/features/items/validations/item.validation.ts`
- Update: `backend/src/app.ts`

**Interfaces:**
- Produces: Full CRUD for Items with search, filter, paginate

- [ ] **Step 1: Create backend/src/features/items/types.ts**

```typescript
export interface IItem {
  userId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: 'active' | 'archived' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 2: Create backend/src/features/items/models/item.model.ts**

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import { IItem } from '../types';

export interface ItemDocument extends IItem, Document {}

const itemSchema = new Schema<ItemDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'general' },
    tags: [{ type: String }],
    status: { type: String, enum: ['active', 'archived', 'draft'], default: 'active' },
  },
  { timestamps: true }
);

itemSchema.index({ userId: 1, createdAt: -1 });
itemSchema.index({ userId: 1, status: 1 });
itemSchema.index({ userId: 1, category: 1 });

export const Item = mongoose.model<ItemDocument>('Item', itemSchema);
```

- [ ] **Step 3: Create backend/src/features/items/validations/item.validation.ts**

```typescript
import { z } from 'zod';

export const createItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['active', 'archived', 'draft']).optional(),
});

export const updateItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['active', 'archived', 'draft']).optional(),
});

export const queryItemSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['active', 'archived', 'draft']).optional(),
  sort: z.enum(['createdAt', '-createdAt', 'title', '-title']).optional().default('-createdAt'),
});
```

- [ ] **Step 4: Create backend/src/features/items/services/item.service.ts**

```typescript
import { Item, ItemDocument } from '../models/item.model';
import { NotFoundError } from '../../../core/errors';

interface QueryParams {
  userId: string;
  page: number;
  limit: number;
  search?: string;
  category?: string;
  status?: string;
  sort: string;
}

export class ItemService {
  async findAll(params: QueryParams) {
    const { userId, page, limit, search, category, status, sort } = params;

    const filter: Record<string, any> = { userId };
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (status) filter.status = status;

    const sortDir = sort.startsWith('-') ? -1 : 1;
    const sortField = sort.replace('-', '');

    const [items, total] = await Promise.all([
      Item.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Item.countDocuments(filter),
    ]);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, userId: string): Promise<ItemDocument> {
    const item = await Item.findOne({ _id: id, userId });
    if (!item) throw new NotFoundError('Item');
    return item;
  }

  async create(data: Partial<IItem>, userId: string): Promise<ItemDocument> {
    return Item.create({ ...data, userId });
  }

  async update(id: string, data: Partial<IItem>, userId: string): Promise<ItemDocument> {
    const item = await Item.findOneAndUpdate(
      { _id: id, userId },
      { $set: data },
      { new: true }
    );
    if (!item) throw new NotFoundError('Item');
    return item;
  }

  async delete(id: string, userId: string): Promise<void> {
    const item = await Item.findOneAndDelete({ _id: id, userId });
    if (!item) throw new NotFoundError('Item');
  }
}

export const itemService = new ItemService();
```

- [ ] **Step 5: Create backend/src/features/items/controllers/item.controller.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import { itemService } from '../services/item.service';
import { createItemSchema, updateItemSchema, queryItemSchema } from '../validations/item.validation';

export class ItemController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = queryItemSchema.parse(req.query);
      const result = await itemService.findAll({
        userId: req.user!.id,
        page: Number(query.page),
        limit: Number(query.limit),
        search: query.search,
        category: query.category,
        status: query.status,
        sort: query.sort,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await itemService.findById(req.params.id, req.user!.id);
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createItemSchema.parse(req.body);
      const item = await itemService.create(data, req.user!.id);
      res.status(201).json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateItemSchema.parse(req.body);
      const item = await itemService.update(req.params.id, data, req.user!.id);
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await itemService.delete(req.params.id, req.user!.id);
      res.json({ success: true, message: 'Item deleted' });
    } catch (err) {
      next(err);
    }
  }
}

export const itemController = new ItemController();
```

- [ ] **Step 6: Create backend/src/features/items/routes/item.routes.ts**

```typescript
import { Router } from 'express';
import { itemController } from '../controllers/item.controller';
import { requireAuth } from '../../../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', itemController.getAll);
router.get('/:id', itemController.getById);
router.post('/', itemController.create);
router.put('/:id', itemController.update);
router.delete('/:id', itemController.delete);

export default router;
```

- [ ] **Step 7: Update backend/src/app.ts**

Add after auth routes:
```typescript
import itemRoutes from './features/items/routes/item.routes';
app.use('/api/v1/items', itemRoutes);
```

- [ ] **Step 8: Verify TypeScript**

Run: `cd backend && npx tsc --noEmit`

- [ ] **Step 9: Commit**

```bash
git add backend/src/features/items/ backend/src/app.ts
git commit -m "feat(items): add CRUD with search, filtering, and pagination"
```

---

## Task 3: Backend — Dashboard Stats

**Covers:** Dashboard statistics endpoint

**Files:**
- Create: `backend/src/features/dashboard/services/dashboard.service.ts`
- Create: `backend/src/features/dashboard/controllers/dashboard.controller.ts`
- Create: `backend/src/features/dashboard/routes/dashboard.routes.ts`
- Update: `backend/src/app.ts`

- [ ] **Step 1: Create backend/src/features/dashboard/services/dashboard.service.ts**

```typescript
import { Item } from '../../items/models/item.model';

export class DashboardService {
  async getStats(userId: string) {
    const [totalItems, activeItems, archivedItems, draftItems, categoryStats] =
      await Promise.all([
        Item.countDocuments({ userId }),
        Item.countDocuments({ userId, status: 'active' }),
        Item.countDocuments({ userId, status: 'archived' }),
        Item.countDocuments({ userId, status: 'draft' }),
        Item.aggregate([
          { $match: { userId } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ]),
      ]);

    const recentItems = await Item.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return {
      totalItems,
      activeItems,
      archivedItems,
      draftItems,
      categoryStats: categoryStats.map((s) => ({
        category: s._id,
        count: s.count,
      })),
      recentItems,
    };
  }
}

export const dashboardService = new DashboardService();
```

- [ ] **Step 2: Create backend/src/features/dashboard/controllers/dashboard.controller.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';

export class DashboardController {
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await dashboardService.getStats(req.user!.id);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
}

export const dashboardController = new DashboardController();
```

- [ ] **Step 3: Create backend/src/features/dashboard/routes/dashboard.routes.ts**

```typescript
import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { requireAuth } from '../../../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/stats', dashboardController.getStats);

export default router;
```

- [ ] **Step 4: Update backend/src/app.ts**

```typescript
import dashboardRoutes from './features/dashboard/routes/dashboard.routes';
app.use('/api/v1/dashboard', dashboardRoutes);
```

- [ ] **Step 5: Verify TypeScript**

- [ ] **Step 6: Commit**

```bash
git add backend/src/features/dashboard/ backend/src/app.ts
git commit -m "feat(dashboard): add stats endpoint with item aggregation"
```

---

## Task 4: Frontend — TanStack Query Provider

**Covers:** Server state management setup

**Files:**
- Create: `frontend/src/providers/query-provider.tsx`
- Update: `frontend/src/app/layout.tsx`

- [ ] **Step 1: Create frontend/src/providers/query-provider.tsx**

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

- [ ] **Step 2: Update frontend/src/app/layout.tsx**

Wrap ThemeProvider children with QueryProvider:
```tsx
import { QueryProvider } from '@/providers/query-provider';

// Inside ThemeProvider:
<QueryProvider>{children}</QueryProvider>
```

- [ ] **Step 3: Verify build**

- [ ] **Step 4: Commit**

```bash
git add frontend/src/providers/ frontend/src/app/layout.tsx
git commit -m "feat(frontend): add TanStack Query provider for server state"
```

---

## Task 5: Frontend — Items Feature (List, Create, Edit, Delete)

**Covers:** CRUD UI with search, filtering, pagination

**Files:**
- Create: `frontend/src/features/items/types.ts`
- Create: `frontend/src/features/items/api/items.api.ts`
- Create: `frontend/src/features/items/hooks/useItems.ts`
- Create: `frontend/src/features/items/components/items-list.tsx`
- Create: `frontend/src/features/items/components/item-form.tsx`
- Create: `frontend/src/features/items/components/items-toolbar.tsx`
- Create: `frontend/src/app/(dashboard)/items/page.tsx`

- [ ] **Step 1: Create frontend/src/features/items/types.ts**

```typescript
export interface Item {
  _id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface ItemsResponse {
  success: boolean;
  data: Item[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

- [ ] **Step 2: Create frontend/src/features/items/api/items.api.ts**

```typescript
import api from '@/lib/axios';
import { ItemsResponse, Item } from '../types';

export const itemsApi = {
  getAll: (params?: Record<string, string>) =>
    api.get<ItemsResponse>('/items', { params }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: Item }>(`/items/${id}`),

  create: (data: Partial<Item>) =>
    api.post<{ success: boolean; data: Item }>('/items', data),

  update: (id: string, data: Partial<Item>) =>
    api.put<{ success: boolean; data: Item }>(`/items/${id}`, data),

  delete: (id: string) =>
    api.delete(`/items/${id}`),
};
```

- [ ] **Step 3: Create frontend/src/features/items/hooks/useItems.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsApi } from '../api/items.api';

export function useItems(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['items', params],
    queryFn: () => itemsApi.getAll(params),
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: itemsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });
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
  return useMutation({
    mutationFn: itemsApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });
}
```

- [ ] **Step 4: Create frontend/src/features/items/components/items-toolbar.tsx**

```tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';

interface ItemsToolbarProps {
  onSearch: (query: string) => void;
  onAdd: () => void;
}

export function ItemsToolbar({ onSearch, onAdd }: ItemsToolbarProps) {
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(search);
  };

  return (
    <div className="flex items-center gap-4">
      <form onSubmit={handleSearch} className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </form>
      <Button onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Create frontend/src/features/items/components/items-list.tsx**

```tsx
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
    return (
      <div className="text-center py-12 text-muted-foreground">
        No items found. Create your first item to get started.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item._id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(item._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.description || 'No description'}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs bg-secondary px-2 py-1 rounded">
                {item.category}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create frontend/src/features/items/components/item-form.tsx**

```tsx
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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
  });

  useEffect(() => {
    if (item) {
      reset({
        title: item.title,
        description: item.description,
        category: item.category,
        status: item.status,
      });
    }
  }, [item, reset]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{item ? 'Edit Item' : 'New Item'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <Input id="title" {...register('title')} placeholder="Item title" />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : item ? 'Update' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 7: Create frontend/src/app/(dashboard)/items/page.tsx**

```tsx
'use client';

import { useState } from 'react';
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

  const handleCreate = (formData: any) => {
    createItem.mutate(formData, {
      onSuccess: () => setShowForm(false),
    });
  };

  const handleUpdate = (formData: any) => {
    if (!editingItem) return;
    updateItem.mutate(
      { id: editingItem._id, data: formData },
      { onSuccess: () => setEditingItem(null) }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure?')) {
      deleteItem.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Items</h1>

      <ItemsToolbar
        onSearch={setSearch}
        onAdd={() => { setShowForm(true); setEditingItem(null); }}
      />

      {(showForm || editingItem) && (
        <ItemForm
          item={editingItem}
          onSubmit={editingItem ? handleUpdate : handleCreate}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
          isLoading={createItem.isPending || updateItem.isPending}
        />
      )}

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <ItemsList
          items={data?.data.data || []}
          onEdit={(item) => { setEditingItem(item); setShowForm(false); }}
          onDelete={handleDelete}
        />
      )}

      {data?.data.pagination && data.data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.data.pagination.totalPages }, (_, i) => (
            <Button
              key={i}
              variant={data.data.pagination.page === i + 1 ? 'default' : 'outline'}
              size="sm"
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 8: Update sidebar navigation**

Add Items link to frontend/src/components/layouts/sidebar.tsx:
```typescript
import { Package } from 'lucide-react';
// Add to navigation array:
{ name: 'Items', href: '/dashboard/items', icon: Package },
```

- [ ] **Step 9: Verify build**

- [ ] **Step 10: Commit**

```bash
git add frontend/src/features/items/ frontend/src/app/\(dashboard\)/items/ frontend/src/components/layouts/sidebar.tsx
git commit -m "feat(items): add CRUD UI with search, filtering, and pagination"
```

---

## Task 6: Frontend — Dashboard Page

**Covers:** Dashboard with stats widgets

**Files:**
- Create: `frontend/src/features/dashboard/api/dashboard.api.ts`
- Create: `frontend/src/features/dashboard/hooks/useDashboard.ts`
- Create: `frontend/src/features/dashboard/components/stats-cards.tsx`
- Create: `frontend/src/features/dashboard/components/recent-items.tsx`
- Update: `frontend/src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Create frontend/src/features/dashboard/api/dashboard.api.ts**

```typescript
import api from '@/lib/axios';

export interface DashboardStats {
  totalItems: number;
  activeItems: number;
  archivedItems: number;
  draftItems: number;
  categoryStats: { category: string; count: number }[];
  recentItems: any[];
}

export const dashboardApi = {
  getStats: () => api.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats'),
};
```

- [ ] **Step 2: Create frontend/src/features/dashboard/hooks/useDashboard.ts**

```typescript
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard.api';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });
}
```

- [ ] **Step 3: Create frontend/src/features/dashboard/components/stats-cards.tsx**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, Archive, Clock } from 'lucide-react';

interface StatsCardsProps {
  total: number;
  active: number;
  archived: number;
  draft: number;
}

export function StatsCards({ total, active, archived, draft }: StatsCardsProps) {
  const stats = [
    { title: 'Total Items', value: total, icon: FileText },
    { title: 'Active', value: active, icon: CheckCircle },
    { title: 'Archived', value: archived, icon: Archive },
    { title: 'Drafts', value: draft, icon: Clock },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Create frontend/src/features/dashboard/components/recent-items.tsx**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RecentItemsProps {
  items: Array<{
    _id: string;
    title: string;
    category: string;
    createdAt: string;
  }>;
}

export function RecentItems({ items }: RecentItemsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Items</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item._id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Update frontend/src/app/(dashboard)/dashboard/page.tsx**

```tsx
'use client';

import { useDashboardStats } from '@/features/dashboard/hooks/useDashboard';
import { StatsCards } from '@/features/dashboard/components/stats-cards';
import { RecentItems } from '@/features/dashboard/components/recent-items';

export default function DashboardPage() {
  const { data, isLoading } = useDashboardStats();
  const stats = data?.data.data;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {isLoading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : stats ? (
        <>
          <StatsCards
            total={stats.totalItems}
            active={stats.activeItems}
            archived={stats.archivedItems}
            draft={stats.draftItems}
          />
          <RecentItems items={stats.recentItems} />
        </>
      ) : (
        <div className="text-muted-foreground">No data available</div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Verify build**

- [ ] **Step 7: Commit**

```bash
git add frontend/src/features/dashboard/ frontend/src/app/\(dashboard\)/dashboard/
git commit -m "feat(dashboard): add stats cards and recent items widgets"
```

---

## Task 7: Frontend — Settings Page

**Covers:** User settings and theme preferences

**Files:**
- Create: `frontend/src/app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Create frontend/src/app/(dashboard)/settings/page.tsx**

```tsx
'use client';

import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Theme</label>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
              >
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
              >
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={() => setTheme('system')}
              >
                System
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/\(dashboard\)/settings/
git commit -m "feat(settings): add settings page with theme preferences"
```

---

## Task 8: Frontend — Profile Page

**Covers:** User profile display

**Files:**
- Create: `frontend/src/app/(dashboard)/profile/page.tsx`

- [ ] **Step 1: Create frontend/src/app/(dashboard)/profile/page.tsx**

```tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Name</label>
            <p className="text-sm">User</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="text-sm">user@example.com</p>
          </div>
          <Button variant="outline">Edit Profile</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/\(dashboard\)/profile/
git commit -m "feat(profile): add user profile page"
```

---

## Execution Handoff

Total tasks: 8
Execution approach: Subagent for parallel execution of backend (Tasks 1-3) and frontend (Tasks 4-8)
