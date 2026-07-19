export interface UsageStats {
  totalUsers: number;
  activeUsers: number;
  totalRequests: number;
  totalTokens: number;
  providerBreakdown: Record<string, { requests: number; tokens: number }>;
  recentActivity: Array<{ date: string; requests: number; tokens: number }>;
}

export interface UserStats {
  userId: string;
  requestCount: number;
  tokenUsage: number;
  lastActive: Date;
  conversationsCreated: number;
  documentsUploaded: number;
}