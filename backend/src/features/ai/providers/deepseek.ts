import { config } from '../../../config';
import { aiConfig } from '../config';
import {
  AIProvider,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  ChatChunk,
  ProviderModelInfo,
  ProviderHealthStatus,
} from '../types';
import { AIConfigError } from '../utils/errors';

interface DeepSeekApiResponse {
  choices: Array<{ message?: { content?: string }; finish_reason?: string }>;
  model?: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

interface DeepSeekError {
  error?: { message?: string };
}

export class DeepSeekProvider implements AIProvider {
  readonly name = 'deepseek';
  private abortControllers = new Map<string, AbortController>();

  constructor() {
    if (!config.DEEPSEEK_API_KEY) throw new AIConfigError(this.name, 'DEEPSEEK_API_KEY is required');
  }

  private getApiUrl(): string {
    return 'https://api.deepseek.com/v1/chat/completions';
  }

  private getHeaders(): Record<string, string> {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${config.DEEPSEEK_API_KEY}` };
  }

  private formatMessages(messages: ChatMessage[]): Array<{ role: string; content: string }> {
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }

  async chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResponse> {
    const start = Date.now();
    const response = await fetch(this.getApiUrl(), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: options.model || aiConfig.defaultModel.deepseek,
        messages: this.formatMessages(messages),
        temperature: options.temperature ?? aiConfig.temperature,
        max_tokens: options.maxTokens ?? aiConfig.maxTokens,
        stream: false,
      }),
      signal: AbortSignal.timeout(aiConfig.requestTimeout),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as DeepSeekError;
      throw new Error(error.error?.message || `DeepSeek API error: ${response.status}`);
    }

    const data = (await response.json()) as DeepSeekApiResponse;
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content || '',
      model: data.model || aiConfig.defaultModel.deepseek,
      provider: this.name,
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
      latencyMs: Date.now() - start,
      finishReason: choice?.finish_reason === 'stop' ? 'stop' : 'length',
    };
  }

  async *streamChat(messages: ChatMessage[], options: ChatOptions): AsyncIterable<ChatChunk> {
    const requestId = options.requestId || crypto.randomUUID();
    const abortController = new AbortController();
    this.abortControllers.set(requestId, abortController);

    try {
      const response = await fetch(this.getApiUrl(), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: options.model || aiConfig.defaultModel.deepseek,
          messages: this.formatMessages(messages),
          temperature: options.temperature ?? aiConfig.temperature,
          max_tokens: options.maxTokens ?? aiConfig.maxTokens,
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as DeepSeekError;
        throw new Error(error.error?.message || `DeepSeek API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              yield { content: '', finishReason: 'stop' };
              return;
            }
            try {
              const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) yield { content };
            } catch {
              /* Skip malformed JSON */
            }
          }
        }
      }

      yield { content: '', finishReason: 'stop' };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        yield { content: '', finishReason: 'error' };
        return;
      }
      throw error;
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  async countTokens(text: string): Promise<number> {
    return Math.ceil(text.length / 4);
  }

  supportsStreaming(): boolean {
    return true;
  }

  supportsVision(): boolean {
    return false;
  }

  supportsToolCalling(): boolean {
    return true;
  }

  getModelInfo(): ProviderModelInfo {
    return {
      name: 'deepseek',
      version: aiConfig.defaultModel.deepseek,
      maxTokens: 8192,
      supportsStreaming: true,
      supportsVision: false,
      supportsToolCalling: true,
    };
  }

  async abort(requestId?: string): Promise<void> {
    if (requestId) this.abortControllers.get(requestId)?.abort();
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.DEEPSEEK_API_KEY) errors.push('DEEPSEEK_API_KEY is required');
    return { valid: errors.length === 0, errors };
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    const start = Date.now();
    try {
      await this.chat([{ role: 'user', content: 'hi' }], { maxTokens: 5 });
      return { healthy: true, latencyMs: Date.now() - start, lastChecked: new Date() };
    } catch (error) {
      return { healthy: false, error: (error as Error).message, lastChecked: new Date() };
    }
  }
}
