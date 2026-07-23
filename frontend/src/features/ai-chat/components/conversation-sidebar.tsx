'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, MessageSquare, Search, Trash2, Archive, Star, Pin, MoreVertical } from 'lucide-react';
import { useConversations, useDeleteConversation, useFavoriteConversation, usePinConversation } from '../hooks/useConversations';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { cn } from '@/lib/utils';

export function ConversationSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const params = debouncedSearch ? { search: debouncedSearch } : undefined;
  const { data } = useConversations(params);
  const deleteConversation = useDeleteConversation();
  const favoriteConversation = useFavoriteConversation();
  const pinConversation = usePinConversation();

  const conversations = data?.data.data || [];

  const handleNewChat = () => {
    router.push('/chat');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-2">
        <Button className="w-full" size="sm" onClick={handleNewChat}>
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        {conversations.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              {debouncedSearch ? 'No conversations found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div key={conv._id} className="relative group">
              <Link
                href={`/chat/${conv._id}`}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                  pathname === `/chat/${conv._id}`
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50'
                )}
                aria-current={pathname === `/chat/${conv._id}` ? 'page' : undefined}
              >
                <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate flex-1">{conv.title}</span>
                {conv.favorite && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" aria-hidden="true" />}
                {conv.pinned && <Pin className="h-3 w-3" aria-hidden="true" />}
              </Link>
              <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  aria-label="More options"
                  aria-haspopup="true"
                  aria-expanded={openMenu === conv._id}
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenMenu(openMenu === conv._id ? null : conv._id);
                  }}
                >
                  <MoreVertical className="h-3 w-3" aria-hidden="true" />
                </Button>
              </div>
              {openMenu === conv._id && (
                <div className="absolute right-0 top-full z-10 bg-popover border rounded-md shadow-md py-1 w-32" role="menu" aria-label="Conversation options">
                  <button
                    className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2"
                    role="menuitem"
                    onClick={() => { favoriteConversation.mutate(conv._id); setOpenMenu(null); }}
                  >
                    <Star className="h-3 w-3" aria-hidden="true" /> {conv.favorite ? 'Unfavorite' : 'Favorite'}
                  </button>
                  <button
                    className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2"
                    role="menuitem"
                    onClick={() => { pinConversation.mutate(conv._id); setOpenMenu(null); }}
                  >
                    <Pin className="h-3 w-3" aria-hidden="true" /> {conv.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    className="w-full px-3 py-1.5 text-sm text-left hover:bg-accent flex items-center gap-2"
                    role="menuitem"
                    onClick={() => { deleteConversation.mutate(conv._id); setOpenMenu(null); }}
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" /> Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
