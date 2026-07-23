import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    quote: 'Babnunur transformed how our team collaborates. The AI chat alone saved us hours every week.',
    author: 'Sarah Chen',
    role: 'Engineering Lead, TechCorp',
  },
  {
    quote: 'The document management with AI assistance is incredible. It writes first drafts that need almost no editing.',
    author: 'Marcus Johnson',
    role: 'Product Manager, DataFlow',
  },
  {
    quote: 'We automated 80% of our repetitive tasks in the first month. The ROI was immediate.',
    author: 'Priya Patel',
    role: 'Operations Director, CloudNine',
  },
];

export function Testimonials() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Loved by teams everywhere
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            See what our customers have to say about Babnunur.
          </p>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.author} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col justify-between p-6">
                <p className="text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6">
                  <p className="font-semibold text-foreground">{t.author}</p>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
