import { MessageSquare, FileText, Search, Workflow, Brain, BarChart } from 'lucide-react';

const categories = [
  { icon: MessageSquare, title: 'Chat', description: 'AI-powered conversations' },
  { icon: FileText, title: 'Documents', description: 'Smart document management' },
  { icon: Search, title: 'Search', description: 'Semantic content search' },
  { icon: Workflow, title: 'Automation', description: 'No-code workflow builder' },
  { icon: Brain, title: 'AI Agents', description: 'Specialized AI assistants' },
  { icon: BarChart, title: 'Analytics', description: 'Insights and reporting' },
];

export function Categories() {
  return (
    <section className="bg-muted/30 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Explore by category
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Find the tools you need organized by category.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.title}
                className="flex items-center gap-4 rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">{cat.title}</h3>
                  <p className="text-sm text-muted-foreground">{cat.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
