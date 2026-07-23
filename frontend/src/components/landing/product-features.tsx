import { Bot, FileText, Search, Workflow, Layout, Shield } from 'lucide-react';

const productFeatures = [
  {
    icon: Layout,
    title: 'Unified Workspace',
    description:
      'Bring your chat, documents, and tools together in one place. Switch between tasks without losing context.',
  },
  {
    icon: Bot,
    title: 'Multi-Model AI',
    description:
      'Access multiple AI models including Gemini and DeepSeek. Choose the best model for each task.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description:
      'Your data is encrypted at rest and in transit. Role-based access control keeps your workspace secure.',
  },
];

export function ProductFeatures() {
  return (
    <section className="bg-muted/30 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Built for modern teams
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Everything your team needs to collaborate effectively and get work done faster.
          </p>
        </div>
        <div className="mt-16 grid gap-12 sm:grid-cols-3">
          {productFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
