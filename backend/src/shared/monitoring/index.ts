import { MonitorProvider } from './types';
import { ConsoleMonitor } from './providers/console';

let monitor: MonitorProvider = new ConsoleMonitor();

export function setMonitor(provider: MonitorProvider): void {
  monitor = provider;
}

export function getMonitor(): MonitorProvider {
  return monitor;
}

export function captureError(error: Error, context?: Record<string, unknown>): void {
  monitor.captureError(error, context);
}

export function captureMetric(name: string, value: number, tags?: Record<string, string>): void {
  monitor.captureMetric(name, value, tags);
}

export function captureEvent(name: string, data?: Record<string, unknown>): void {
  monitor.captureEvent(name, data);
}
