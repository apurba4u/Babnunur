import { Response } from 'express';
import crypto from 'crypto';
import { ProviderFactory } from '../providers/factory';
import { conversationService } from '../../chat/services/conversation.service';
import { messageService } from '../../chat/services/message.service';
import { ChatMessage } from '../types';
import { aiConfig } from '../config';
import { StreamEvent, StreamMetrics, DEFAULT_STREAM_CONFIG } from './stream.types';
import { extractFileContent, buildAttachmentText } from '../utils/document-extractor';

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
    attachments?: Array<{ url: string; name: string; type: string; size: number }>;
    res: Response;
  }): Promise<void> {
    const { userId, conversationId, content, provider: providerName, model, temperature, maxTokens, requestId: reqId, attachments, res } = params;
    const requestId = reqId || crypto.randomUUID();
    const abortController = new AbortController();
    this.activeStreams.set(requestId, abortController);

    const pName = providerName || 'opencodezen';
    const metrics: StreamMetrics = {
      provider: pName,
      model: model || (aiConfig.defaultModel as Record<string, string>)[pName] || 'gemini-2.0-flash',
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

    // Abort stream if client disconnects
    const onClientClose = (): void => {
      abortController.abort();
    };
    res.on('close', onClientClose);

    try {
      const conversation = await conversationService.getById(conversationId, userId);

      // Create user message
      await messageService.create({
        conversationId,
        userId,
        role: 'user',
        content: content || (attachments ? `[Sent ${attachments.length} file(s)]` : ''),
        provider: providerName || conversation.provider,
        modelName: model || conversation.modelName,
        attachments,
      });

      // Process attachments (extract text from docs, note images as text)
      let documentText = '';
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          try {
            const extracted = await extractFileContent(att.url, att.type);
            if (extracted.isImage) {
              documentText += `\n[User uploaded an image file: ${att.name} (${att.type}, ${att.size} bytes)]`;
            } else if (extracted.text) {
              documentText += buildAttachmentText([extracted], att.name);
            }
          } catch {
            documentText += `\n[User uploaded a file: ${att.name} but it could not be read]`;
          }
        }
      }

      // Build context (user message is already in history)
      const history = await messageService.listByConversation(conversationId, userId, { limit: 50 });
      const messages: ChatMessage[] = [
        { role: 'system', content: conversation.settings?.systemPromptOverride || 'You are a helpful assistant.' },
        ...history.map((m) => {
          const msg: ChatMessage = { role: m.role as 'user' | 'assistant', content: m.content };
          if (m.role === 'user' && m === history[history.length - 1] && documentText) {
            msg.content += documentText;
          }
          return msg;
        }),
      ];

      // Try providers with fallback
      const primaryProviderName = providerName || conversation.provider;
      console.log('6. Provider selected:', primaryProviderName);
      console.log('7. Model selected:', model || '(provider default)');
      const providerChain = [primaryProviderName];
      let fallback = ProviderFactory.getFallbackProvider(primaryProviderName);
      while (fallback) {
        providerChain.push(fallback.name);
        fallback = ProviderFactory.getFallbackProvider(fallback.name);
      }

      let streamed = false;
      for (const pName of providerChain) {
        if (streamed) break;
        const provider = ProviderFactory.getProvider(pName);

        try {
          // Create assistant message placeholder
          const assistantMessage = await messageService.create({
            conversationId,
            userId,
            role: 'assistant',
            content: '',
            provider: pName,
            modelName: model || provider.getModelInfo().name,
            status: 'streaming',
          });

          sendEvent({ type: 'connected', data: { requestId } });
          sendEvent({ type: 'message_start', data: { messageId: assistantMessage._id, conversationId, provider: pName, model: metrics.model } });

          // Stream tokens
          const chunks: string[] = [];
          let chunkLogCount = 0;
          console.log('12. Stream chunks:');
          for await (const chunk of provider.streamChat(messages, {
            temperature: temperature ?? conversation.settings?.temperature,
            maxTokens: maxTokens ?? conversation.settings?.maxTokens,
            model,
            requestId,
          })) {
            if (abortController.signal.aborted) {
              sendEvent({ type: 'cancelled', data: { messageId: assistantMessage._id } });
              break;
            }

            if (chunk.content) {
              chunks.push(chunk.content);
              chunkLogCount++;
              if (chunkLogCount <= 20) console.log('12. Stream chunk:', JSON.stringify(chunk.content));
              sendEvent({ type: 'token', data: { content: chunk.content } });

              if (!metrics.firstTokenTime) {
                metrics.firstTokenTime = Date.now();
                metrics.ttft = metrics.firstTokenTime - metrics.startTime;
              }

              await messageService.updateStreaming(assistantMessage._id.toString(), {
                content: chunks.join(''),
              });
            }
          }

          if (!abortController.signal.aborted) {
            const finalContent = chunks.join('');
            metrics.endTime = Date.now();
            metrics.totalDuration = metrics.endTime - metrics.startTime;

            const updated = await messageService.updateStreaming(assistantMessage._id.toString(), {
              content: finalContent,
              status: 'completed',
              latencyMs: metrics.totalDuration,
            });

            console.log(`13. Database save: message _id=${updated._id}, content length=${finalContent.length}, status=completed`);

            sendEvent({ type: 'usage', data: {
              provider: pName,
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
            console.log('14. Response sent to frontend: SSE done event');
            streamed = true;
          }
        } catch (providerError) {
          const pErr = providerError as Error;
          console.error(`[StreamService] Provider ${pName} failed:`, pErr.message);
          sendEvent({ type: 'error', data: { code: 'PROVIDER_FALLBACK', message: `[${pName}] ${pErr.message}`, retryable: true } });
        }
      }

      if (!streamed) {
        sendEvent({ type: 'error', data: { code: 'ALL_PROVIDERS_FAILED', message: 'All AI providers failed. Please try again later.', retryable: false } });
      }
    } catch (error) {
      const err = error as Error;
      sendEvent({ type: 'error', data: { code: 'STREAM_ERROR', message: err.message, retryable: false } });
    } finally {
      res.removeListener('close', onClientClose);
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