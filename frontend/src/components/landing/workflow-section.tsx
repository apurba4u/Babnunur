import { ArrowRight, Zap, Repeat, GitBranch, Clock } from 'lucide-react';

const steps = [
  { icon: Zap, title: 'Trigger', description: 'Start with an event, schedule, or manual action.' },
  { icon: Repeat, title: 'Action', description: 'Define what happens — AI processing, data updates, notifications.' },
  { icon: GitBranch, title: 'Condition', description: 'Add logic with if/then branches and decision points.' },
  { icon: Clock, title: 'Automate', description: 'Run your workflow automatically and monitor results.' },
];

export function WorkflowSection() {
  return (
    <section className="bg-muted/30 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Automate your workflows
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Build powerful automations without writing a single line of code.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative text-center">
                {index < steps.length - 1 && (
                  <div className="absolute right-0 top-8 hidden -translate-y-1/2 lg:block">
                    <ArrowRight className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                )}
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
