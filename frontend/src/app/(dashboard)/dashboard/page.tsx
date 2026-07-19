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
          <StatsCards total={stats.totalItems} active={stats.activeItems} archived={stats.archivedItems} draft={stats.draftItems} />
          <RecentItems items={stats.recentItems} />
        </>
      ) : (
        <div className="text-muted-foreground">No data available</div>
      )}
    </div>
  );
}
