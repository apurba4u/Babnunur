export type StreamEventType = 'connected' | 'message_start' | 'token' | 'usage' | 'warning' | 'heartbeat' | 'message_end' | 'cancelled' | 'error' | 'done';

export interface StreamEvent {
  type: StreamEventType;
  data: Record<string, unknown>;
}

export interface StreamMetrics {
  provider: string;
  model: string;
  requestId: string;
  startTime: number;
  firstTokenTime?: number;
  endTime?: number;
  ttft?: number;
  totalDuration?: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface StreamConfig {
  timeout: number;
  heartbeatInterval: number;
  maxRetries: number;
  retryDelay: number;
}

export const DEFAULT_STREAM_CONFIG: StreamConfig = {
  timeout: 120000,
  heartbeatInterval: 30000,
  maxRetries: 2,
  retryDelay: 1000,
};