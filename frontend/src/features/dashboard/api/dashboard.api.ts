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
