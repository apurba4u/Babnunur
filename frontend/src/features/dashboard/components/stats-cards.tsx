import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, Archive, Clock } from 'lucide-react';

interface StatsCardsProps {
  total: number;
  active: number;
  archived: number;
  draft: number;
}

export function StatsCards({ total, active, archived, draft }: StatsCardsProps) {
  const stats = [
    { title: 'Total Items', value: total, icon: FileText },
    { title: 'Active', value: active, icon: CheckCircle },
    { title: 'Archived', value: archived, icon: Archive },
    { title: 'Drafts', value: draft, icon: Clock },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{stat.value}</div></CardContent>
          </Card>
        );
      })}
    </div>
  );
}
