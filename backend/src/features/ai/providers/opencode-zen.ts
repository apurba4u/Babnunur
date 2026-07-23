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

interface OpenCodeZenApiResponse {
  choices: Array<{ message?: { content?: string }; finish_reason?: string }>;
  model?: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

interface OpenCodeZenError {
  error?: { message?: string };
}

export class OpenCodeZenProvider implements AIProvider {
  readonly name = 'opencodezen';
  private abortControllers = new Map<string, AbortController>();

  constructor() {
    if (!config.OPENCODE_ZEN_API_KEY) throw new AIConfigError(this.name, 'OPENCODE_ZEN_API_KEY is required');
  }

  private getApiUrl(): string {
    return (config.OPENCODE_ZEN_BASE_URL || 'https://opencode.ai/zen/v1').replace(/\/+$/, '') + '/chat/completions';
  }

  private getHeaders(): Record<string, string> {
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${config.OPENCODE_ZEN_API_KEY}` };
  }

  private getModel(options: ChatOptions): string {
    return options.model || config.OPENCODE_ZEN_MODEL || aiConfig.defaultModel.opencodezen;
  }

  private formatMessages(messages: ChatMessage[]): Array<{ role: string; content: string | Array<{ type: string; [key: string]: unknown }> }> {
    return messages.map((m) => {
      if (m.images && m.images.length > 0) {
        const parts: Array<{ type: string; [key: string]: unknown }> = [];
        if (m.content) parts.push({ type: 'text', text: m.content });
        for (const img of m.images) {
          parts.push({ type: 'image_url', image_url: { url: img } });
        }
        return { role: m.role, content: parts.length > 0 ? parts : m.content };
      }
      return { role: m.role, content: m.content };
    });
  }

  async chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResponse> {
    const start = Date.now();
    const url = this.getApiUrl();
    const model = this.getModel(options);
    const body = JSON.stringify({
      model,
      messages: this.formatMessages(messages),
      temperature: options.temperature ?? aiConfig.temperature,
      max_tokens: options.maxTokens ?? aiConfig.maxTokens,
      stream: false,
    });

    console.log('8. Final URL:', url);
    console.log('9. Request body:', body);

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body,
      signal: AbortSignal.timeout(aiConfig.requestTimeout),
    });

    console.log('10. HTTP status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      let errMsg: string;
      try { const e = JSON.parse(errorText); errMsg = e.error?.message || `OpenCode Zen API error: ${response.status}`; } catch { errMsg = `OpenCode Zen API error: ${response.status} - ${errorText}`; }
      throw new Error(errMsg);
    }

    const data = (await response.json()) as OpenCodeZenApiResponse;
    console.log('11. Response body:', JSON.stringify(data).slice(0, 800));
    const choice = data.choices?.[0];

    return {
      content: choice?.message?.content || '',
      model: data.model || this.getModel(options),
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
    const url = this.getApiUrl();
    const model = this.getModel(options);
    const reqBody = JSON.stringify({
      model,
      messages: this.formatMessages(messages),
      temperature: options.temperature ?? aiConfig.temperature,
      max_tokens: options.maxTokens ?? aiConfig.maxTokens,
      stream: true,
    });

    console.log('8. Final URL:', url);
    console.log('9. Request body:', reqBody);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: reqBody,
        signal: abortController.signal,
      });

      console.log('10. HTTP status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        let errMsg: string;
        try { const e = JSON.parse(errorText); errMsg = e.error?.message || `OpenCode Zen API error: ${response.status}`; } catch { errMsg = `OpenCode Zen API error: ${response.status} - ${errorText}`; }
        throw new Error(errMsg);
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
              if (content) {
                yield { content };
              }
            } catch {
              /* skip malformed JSON */
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

  supportsStreaming(): boolean { return true; }
  supportsVision(): boolean { return true; }
  supportsToolCalling(): boolean { return true; }

  getModelInfo(): ProviderModelInfo {
    return {
      name: 'opencodezen',
      version: aiConfig.defaultModel.opencodezen,
      maxTokens: 8192,
      supportsStreaming: true,
      supportsVision: true,
      supportsToolCalling: true,
    };
  }

  async abort(requestId?: string): Promise<void> {
    if (requestId) this.abortControllers.get(requestId)?.abort();
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.OPENCODE_ZEN_API_KEY) errors.push('OPENCODE_ZEN_API_KEY is required');
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
