import { MonitorProvider, Transaction } from '../types';

export class ConsoleMonitor implements MonitorProvider {
  name = 'console';

  captureError(error: Error, context?: Record<string, unknown>): void {
    console.error(JSON.stringify({ level: 'error', message: error.message, stack: error.stack, ...context, timestamp: new Date().toISOString() }));
  }

  captureMetric(name: string, value: number, tags?: Record<string, string>): void {
    console.log(JSON.stringify({ level: 'metric', name, value, tags, timestamp: new Date().toISOString() }));
  }

  captureEvent(name: string, data?: Record<string, unknown>): void {
    console.log(JSON.stringify({ level: 'event', name, data, timestamp: new Date().toISOString() }));
  }

  startTransaction(name: string): Transaction {
    const start = Date.now();
    return {
      setStatus(status) { console.log(JSON.stringify({ level: 'transaction', name, status, duration: Date.now() - start })); },
      setData(data) { console.log(JSON.stringify({ level: 'transaction', name, data })); },
      finish() { console.log(JSON.stringify({ level: 'transaction', name, duration: Date.now() - start })); },
    };
  }
}
