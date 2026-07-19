import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../../../config';
import { aiConfig } from '../config';
import {
  AIProvider, ChatMessage, ChatOptions, ChatResponse, ChatChunk,
  ProviderModelInfo, ProviderHealthStatus,
} from '../types';
import { AIConfigError, AITimeoutError } from '../utils/errors';

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private client: GoogleGenerativeAI;
  private abortControllers = new Map<string, AbortController>();

  constructor() {
    if (!config.GEMINI_API_KEY) {
      throw new AIConfigError(this.name, 'GEMINI_API_KEY is required');
    }
    this.client = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  }

  private get model(): ReturnType<GoogleGenerativeAI['getGenerativeModel']> {
    return this.client.getGenerativeModel({ model: aiConfig.defaultModel.gemini });
  }

  async chat(messages: ChatMessage[], options: ChatOptions): Promise<ChatResponse> {
    const start = Date.now();
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const systemInstruction = messages.find((m) => m.role === 'system')?.content;
    try {
      const result = await this.model.generateContent({
        contents,
        systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature: options.temperature ?? aiConfig.temperature,
          maxOutputTokens: options.maxTokens ?? aiConfig.maxTokens,
        },
      });
      const response = result.response;
      const text = response.text();
      const usage = response.usageMetadata;
      return {
        content: text,
        model: aiConfig.defaultModel.gemini,
        provider: this.name,
        inputTokens: usage?.promptTokenCount || 0,
        outputTokens: usage?.candidatesTokenCount || 0,
        totalTokens: usage?.totalTokenCount || 0,
        latencyMs: Date.now() - start,
        finishReason: 'stop',
      };
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw new AITimeoutError(this.name);
      throw error;
    }
  }

  async *streamChat(messages: ChatMessage[], options: ChatOptions): AsyncIterable<ChatChunk> {
    const requestId = options.requestId || crypto.randomUUID();
    const abortController = new AbortController();
    this.abortControllers.set(requestId, abortController);
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    const systemInstruction = messages.find((m) => m.role === 'system')?.content;
    try {
      const result = await this.model.generateContentStream({
        contents,
        systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature: options.temperature ?? aiConfig.temperature,
          maxOutputTokens: options.maxTokens ?? aiConfig.maxTokens,
        },
      });
      for await (const chunk of result.stream) {
        if (abortController.signal.aborted) break;
        const text = chunk.text();
        if (text) yield { content: text };
      }
      yield { content: '', finishReason: 'stop' };
    } catch (error) {
      if (abortController.signal.aborted) { yield { content: '', finishReason: 'error' }; return; }
      throw error;
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  async countTokens(text: string): Promise<number> {
    const result = await this.model.countTokens({ contents: [{ role: 'user', parts: [{ text }] }] });
    return result.totalTokens;
  }

  supportsStreaming(): boolean { return true; }
  supportsVision(): boolean { return true; }
  supportsToolCalling(): boolean { return true; }
  getModelInfo(): ProviderModelInfo {
    return { name: 'gemini', version: aiConfig.defaultModel.gemini, maxTokens: 8192, supportsStreaming: true, supportsVision: true, supportsToolCalling: true };
  }
  async abort(requestId?: string): Promise<void> { if (requestId) this.abortControllers.get(requestId)?.abort(); }
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!config.GEMINI_API_KEY) errors.push('GEMINI_API_KEY is required');
    return { valid: errors.length === 0, errors };
  }
  async healthCheck(): Promise<ProviderHealthStatus> {
    const start = Date.now();
    try { await this.countTokens('health check'); return { healthy: true, latencyMs: Date.now() - start, lastChecked: new Date() }; }
    catch (error) { return { healthy: false, error: (error as Error).message, lastChecked: new Date() }; }
  }
}
