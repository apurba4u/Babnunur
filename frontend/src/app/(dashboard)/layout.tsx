'use client';

import { useCallback } from 'react';
import { Sidebar } from '@/components/layouts/sidebar';
import { Header } from '@/components/layouts/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const handleToggleSidebar = useCallback(() => {
    document.dispatchEvent(new CustomEvent('toggle-sidebar'));
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={handleToggleSidebar} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6" id="main-content">{children}</main>
      </div>
    </div>
  );
}
