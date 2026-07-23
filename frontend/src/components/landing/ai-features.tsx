import { Bot, FileText, Search, Workflow, Cpu, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'AI Chat',
    description: 'Intelligent conversations with context-aware AI that understands your work.',
  },
  {
    icon: FileText,
    title: 'Document Management',
    description: 'Create, edit, and organize documents with AI-powered assistance.',
  },
  {
    icon: Search,
    title: 'Intelligent Search',
    description: 'Find anything instantly with semantic search across all your content.',
  },
  {
    icon: Workflow,
    title: 'Workflow Automation',
    description: 'Automate repetitive tasks and build custom workflows without code.',
  },
  {
    icon: Cpu,
    title: 'AI Agents',
    description: 'Deploy specialized AI agents for research, analysis, and content generation.',
  },
  {
    icon: Sparkles,
    title: 'Smart Suggestions',
    description: 'Get proactive recommendations and insights based on your work patterns.',
  },
];

export function AiFeatures() {
  return (
    <section id="features" className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Everything you need to be productive
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          AI-powered tools that work together to help you accomplish more in less time.
        </p>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-xl border bg-card p-6 text-left transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-card-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
