export interface MonitorProvider {
  name: string;
  captureError(error: Error, context?: Record<string, unknown>): void;
  captureMetric(name: string, value: number, tags?: Record<string, string>): void;
  captureEvent(name: string, data?: Record<string, unknown>): void;
  startTransaction(name: string): Transaction;
}

export interface Transaction {
  setStatus(status: 'ok' | 'error'): void;
  setData(data: Record<string, unknown>): void;
  finish(): void;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}
