import { Item } from '../../items/models/item.model';

export class DashboardService {
  async getStats(userId: string): Promise<{
    totalItems: number;
    activeItems: number;
    archivedItems: number;
    draftItems: number;
    categoryStats: { category: string; count: number }[];
    recentItems: Record<string, unknown>[];
  }> {
    const [totalItems, activeItems, archivedItems, draftItems, categoryStats] = await Promise.all([
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
    const recentItems = await Item.find({ userId }).sort({ createdAt: -1 }).limit(5).lean();
    return {
      totalItems, activeItems, archivedItems, draftItems,
      categoryStats: categoryStats.map((s) => ({ category: s._id, count: s.count })),
      recentItems,
    };
  }
}
export const dashboardService = new DashboardService();
