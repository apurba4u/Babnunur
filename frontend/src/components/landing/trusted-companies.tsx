const companies = [
  'TechCorp',
  'DataFlow',
  'CloudNine',
  'NeuralSys',
  'ApexDigital',
  'QuantumLabs',
];

export function TrustedCompanies() {
  return (
    <section className="border-y bg-muted/30 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl text-center">
        <p className="mb-8 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Trusted by innovative teams
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {companies.map((name) => (
            <div
              key={name}
              className="text-lg font-semibold text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              {name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
