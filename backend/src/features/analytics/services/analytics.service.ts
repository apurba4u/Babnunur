import { AnalyticsEvent } from '../models/analytics.model';
import { User } from '../../users/models/user.model';
import { Conversation } from '../../chat/models/conversation.model';
import { Document } from '../../documents/models/document.model';

export class AnalyticsService {
  async recordEvent(data: { userId: string; eventType: string; provider?: string; model?: string; tokens?: number; latency?: number; metadata?: Record<string, unknown> }) {
    return AnalyticsEvent.create(data);
  }

  async getUsageStats(): Promise<Record<string, unknown>> {
    const [totalUsers, totalRequests, totalTokens, providerBreakdown, recentActivity] = await Promise.all([
      User.countDocuments(),
      AnalyticsEvent.countDocuments(),
      AnalyticsEvent.aggregate([{ $group: { _id: null, total: { $sum: '$tokens' } } }]),
      AnalyticsEvent.aggregate([{ $group: { _id: '$provider', requests: { $sum: 1 }, tokens: { $sum: '$tokens' } } }]),
      AnalyticsEvent.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, requests: { $sum: 1 }, tokens: { $sum: '$tokens' } } },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ]),
    ]);

    return {
      totalUsers,
      totalRequests,
      totalTokens: totalTokens[0]?.total || 0,
      providerBreakdown: Object.fromEntries(providerBreakdown.map((p: any) => [p._id || 'unknown', { requests: p.requests, tokens: p.tokens }])),
      recentActivity: recentActivity.map((r: any) => ({ date: r._id, requests: r.requests, tokens: r.tokens })),
    };
  }

  async getUserStats(userId: string) {
    const [eventCount, tokenTotal, lastEvent] = await Promise.all([
      AnalyticsEvent.countDocuments({ userId }),
      AnalyticsEvent.aggregate([{ $match: { userId } }, { $group: { _id: null, total: { $sum: '$tokens' } } }]),
      AnalyticsEvent.findOne({ userId }).sort({ createdAt: -1 }),
    ]);
    return { requestCount: eventCount, tokenUsage: tokenTotal[0]?.total || 0, lastActive: lastEvent?.createdAt };
  }
}

export const analyticsService = new AnalyticsService();