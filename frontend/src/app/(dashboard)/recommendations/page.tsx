'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Lightbulb, Target, TrendingUp, Zap, Activity } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorCard } from '@/components/ui/error-card';
import { EmptyState } from '@/components/ui/empty-state';

interface ActionCard {
  title: string;
  description: string;
  link: string;
}

interface RecentActivity {
  conversations: number;
  documents: number;
  items: number;
}

interface RecommendationsData {
  recommendations: string[];
  productivityTips: string[];
  insights: string[];
  actionCards: ActionCard[];
  recentActivity: RecentActivity;
}

export default function RecommendationsPage() {
  const [data, setData] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ success: boolean; data: RecommendationsData }>('/recommendations')
      .then((res) => {
        setData(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err.message || 'Failed to load recommendations');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Recommendations</h1>
        <LoadingSpinner text="Loading recommendations..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Recommendations</h1>
        <ErrorCard message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Recommendations</h1>

      {data ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <CardTitle>AI Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recommendations.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    {data.recommendations.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No recommendations yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <Zap className="h-5 w-5 text-orange-500" />
                <CardTitle>Productivity Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                {data.productivityTips.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    {data.productivityTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No productivity tips yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <CardTitle>Insights</CardTitle>
              </CardHeader>
              <CardContent>
                {data.insights.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                    {data.insights.map((insight, i) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No insights available.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <Target className="h-5 w-5 text-blue-500" />
                <CardTitle>Action Cards</CardTitle>
              </CardHeader>
              <CardContent>
                {data.actionCards.length > 0 ? (
                  <div className="space-y-4">
                    {data.actionCards.map((card, i) => (
                      <div key={i} className="rounded-lg border p-4">
                        <h4 className="font-medium text-sm">{card.title}</h4>
                        <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No action cards yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-3">
                <Activity className="h-5 w-5 text-purple-500" />
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span>Conversations</span>
                    <span className="font-medium text-foreground">{data.recentActivity.conversations}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span>Documents</span>
                    <span className="font-medium text-foreground">{data.recentActivity.documents}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <span>Items</span>
                    <span className="font-medium text-foreground">{data.recentActivity.items}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <EmptyState title="No data available" description="We couldn't fetch your recommendations right now." />
      )}
    </div>
  );
}
