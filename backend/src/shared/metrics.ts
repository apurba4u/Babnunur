export interface Metrics {
  requestCount: number;
  errorCount: number;
  avgLatency: number;
  activeStreams: number;
}

const metrics: Metrics = {
  requestCount: 0,
  errorCount: 0,
  avgLatency: 0,
  activeStreams: 0,
};

const latencies: number[] = [];

export function recordRequest(duration: number, isError: boolean): void {
  metrics.requestCount++;
  if (isError) metrics.errorCount++;
  latencies.push(duration);
  if (latencies.length > 1000) latencies.shift();
  metrics.avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
}

export function incrementActiveStreams(): void { metrics.activeStreams++; }
export function decrementActiveStreams(): void { metrics.activeStreams--; }

export function getMetrics(): Metrics { return { ...metrics }; }
