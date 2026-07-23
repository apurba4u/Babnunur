import { Bot, Search, FileText, Code, Pen, MessagesSquare } from 'lucide-react';

const agents = [
  { icon: Search, title: 'Research Agent', description: 'Gathers and synthesizes information from multiple sources.' },
  { icon: FileText, title: 'Writing Agent', description: 'Helps draft, edit, and polish your documents.' },
  { icon: Code, title: 'Code Agent', description: 'Assists with code review, generation, and debugging.' },
  { icon: Pen, title: 'Content Agent', description: 'Creates and optimizes content for any audience.' },
  { icon: MessagesSquare, title: 'Support Agent', description: 'Handles common questions and escalates complex issues.' },
  { icon: Bot, title: 'Custom Agent', description: 'Build and train your own AI agent for any task.' },
];

export function AiAgents() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Meet your AI agents
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Specialized AI agents ready to help you with any task.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const Icon = agent.icon;
            return (
              <div
                key={agent.title}
                className="group rounded-xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-semibold text-card-foreground">{agent.title}</h3>
                <p className="text-sm text-muted-foreground">{agent.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
