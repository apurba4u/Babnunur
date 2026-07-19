'use client';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import api from '@/lib/axios';

export function Header() {
  const handleLogout = async () => {
    await api.post('/auth/sign-out');
    window.location.href = '/login';
  };

  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div />
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
