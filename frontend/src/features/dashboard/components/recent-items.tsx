import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RecentItemsProps {
  items: Array<{ _id: string; title: string; category: string; createdAt: string }>;
}

export function RecentItems({ items }: RecentItemsProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Recent Items</CardTitle></CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item._id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.category}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
