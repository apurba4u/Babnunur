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
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); onSearch(search); };
  return (
    <div className="flex items-center gap-4">
      <form onSubmit={handleSearch} className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </form>
      <Button onClick={onAdd}><Plus className="mr-2 h-4 w-4" />Add Item</Button>
    </div>
  );
}
