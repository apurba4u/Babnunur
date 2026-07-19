import { Response } from 'express';
import { ProviderFactory } from '../providers/factory';
import { conversationService } from '../../chat/services/conversation.service';
import { messageService } from '../../chat/services/message.service';
import { ChatMessage } from '../types';
import { StreamEvent, StreamMetrics, DEFAULT_STREAM_CONFIG } from './stream.types';

export class StreamService {
  private activeStreams = new Map<string, AbortController>();

  async streamChat(params: {
    userId: string;
    conversationId: string;
    content: string;
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    requestId?: string;
    res: Response;
  }): Promise<void> {
    const { userId, conversationId, content, provider: providerName, model, temperature, maxTokens, requestId: reqId, res } = params;
    const requestId = reqId || crypto.randomUUID();
    const abortController = new AbortController();
    this.activeStreams.set(requestId, abortController);

    const metrics: StreamMetrics = {
      provider: providerName || 'gemini',
      model: model || 'gemini-2.0-flash',
      requestId,
      startTime: Date.now(),
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      estimatedCost: 0,
    };

    const sendEvent = (event: StreamEvent): void => {
      if (!res.writableEnded) {
        res.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);
      }
    };

    const heartbeat = setInterval(() => {
      sendEvent({ type: 'heartbeat', data: { timestamp: new Date().toISOString() } });
    }, DEFAULT_STREAM_CONFIG.heartbeatInterval);

    try {
      const conversation = await conversationService.getById(conversationId, userId);
      const provider = ProviderFactory.getProvider(providerName || conversation.provider);

      // Create user message
      await messageService.create({
        conversationId,
        userId,
        role: 'user',
        content,
        provider: providerName || conversation.provider,
        modelName: model || conversation.modelName,
      });

      // Build context
      const history = await messageService.listByConversation(conversationId, userId, { limit: 50 });
      const messages: ChatMessage[] = [
        { role: 'system', content: conversation.settings?.systemPromptOverride || 'You are a helpful assistant.' },
        ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ];

      // Create assistant message placeholder
      const assistantMessage = await messageService.create({
        conversationId,
        userId,
        role: 'assistant',
        content: '',
        provider: providerName || conversation.provider,
        modelName: model || conversation.modelName,
        status: 'streaming',
      });

      sendEvent({ type: 'connected', data: { requestId } });
      sendEvent({ type: 'message_start', data: { messageId: assistantMessage._id, conversationId, provider: metrics.provider, model: metrics.model } });

      // Stream tokens
      const chunks: string[] = [];
      for await (const chunk of provider.streamChat(messages, {
        temperature: temperature ?? conversation.settings?.temperature,
        maxTokens: maxTokens ?? conversation.settings?.maxTokens,
        model: model || conversation.modelName,
        requestId,
      })) {
        if (abortController.signal.aborted) {
          sendEvent({ type: 'cancelled', data: { messageId: assistantMessage._id } });
          break;
        }

        if (chunk.content) {
          chunks.push(chunk.content);
          sendEvent({ type: 'token', data: { content: chunk.content } });

          if (!metrics.firstTokenTime) {
            metrics.firstTokenTime = Date.now();
            metrics.ttft = metrics.firstTokenTime - metrics.startTime;
          }

          // Update message in DB periodically
          await messageService.updateStreaming(assistantMessage._id.toString(), {
            content: chunks.join(''),
          });
        }
      }

      const finalContent = chunks.join('');
      metrics.endTime = Date.now();
      metrics.totalDuration = metrics.endTime - metrics.startTime;

      await messageService.updateStreaming(assistantMessage._id.toString(), {
        content: finalContent,
        status: 'completed',
        latencyMs: metrics.totalDuration,
      });

      sendEvent({ type: 'usage', data: {
        provider: metrics.provider,
        model: metrics.model,
        ttft: metrics.ttft,
        totalDuration: metrics.totalDuration,
        inputTokens: metrics.inputTokens,
        outputTokens: metrics.outputTokens,
        totalTokens: metrics.totalTokens,
        estimatedCost: metrics.estimatedCost,
      }});

      sendEvent({ type: 'message_end', data: { messageId: assistantMessage._id, finishReason: 'stop' } });
      sendEvent({ type: 'done', data: { requestId } });
    } catch (error) {
      const err = error as Error;
      sendEvent({ type: 'error', data: { code: 'STREAM_ERROR', message: err.message, retryable: false } });
    } finally {
      clearInterval(heartbeat);
      this.activeStreams.delete(requestId);
      if (!res.writableEnded) res.end();
    }
  }

  cancelStream(requestId: string): boolean {
    const controller = this.activeStreams.get(requestId);
    if (controller) {
      controller.abort();
      return true;
    }
    return false;
  }

  getActiveStreamCount(): number {
    return this.activeStreams.size;
  }
}

export const streamService = new StreamService();