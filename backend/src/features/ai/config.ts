import { config } from '../../config';

export const aiConfig = {
  defaultProvider: 'gemini' as const,
  defaultModel: {
    gemini: 'gemini-2.0-flash',
    deepseek: 'deepseek-chat',
  },
  requestTimeout: Number(config.AI_REQUEST_TIMEOUT),
  maxTokens: Number(config.AI_MAX_TOKENS),
  temperature: Number(config.AI_TEMPERATURE),
  maxConcurrentStreams: 5,
  heartbeatInterval: 30000,
  retryCount: 3,
  retryDelay: 1000,
};
