'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquareText, FileText, Sparkles, LayoutDashboard, Settings, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Items', href: '/dashboard/items', icon: Package },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquareText },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'Recommendations', href: '/dashboard/recommendations', icon: Sparkles },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-xl font-bold">
          Babnunur
        </Link>
      </div>
      <nav className="space-y-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
