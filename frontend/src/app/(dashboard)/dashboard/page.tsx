'use client';
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboard';
import { StatsCards } from '@/features/dashboard/components/stats-cards';
import { RecentItems } from '@/features/dashboard/components/recent-items';
import { StatCardSkeleton, ListSkeleton } from '@/components/ui/skeleton';
import { ErrorCard } from '@/components/ui/error-card';

export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboardStats();
  const stats = data?.data.data;
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div aria-live="polite">
        {error ? (
          <ErrorCard message={error.message || 'Failed to load dashboard'} onRetry={refetch} />
        ) : isLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
            <ListSkeleton items={3} />
          </>
        ) : stats ? (
          <>
            <StatsCards total={stats.totalItems} active={stats.activeItems} archived={stats.archivedItems} draft={stats.draftItems} />
            <RecentItems items={stats.recentItems} />
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">No dashboard data available yet.</div>
        )}
      </div>
    </div>
  );
}
