import { ProviderFactory } from '../providers/factory';
import { promptEngine } from '../prompts/engine';
import { conversationService } from '../../chat/services/conversation.service';
import { messageService } from '../../chat/services/message.service';
import { ChatMessage, ChatOptions, ChatResponse } from '../types';

export class ChatService {
  async sendMessage(params: {
    userId: string;
    conversationId: string;
    content: string;
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{ userMessage: any; assistantMessage: any; response: ChatResponse }> {
    const { userId, conversationId, content, provider: providerName, model, temperature, maxTokens } = params;

    const conversation = await conversationService.getById(conversationId, userId);

    // Create user message
    const userMessage = await messageService.create({
      conversationId,
      userId,
      role: 'user',
      content,
      provider: providerName || conversation.provider,
      model: model || conversation.model,
    });

    // Build context
    const history = await messageService.listByConversation(conversationId, userId, { limit: 50 });
    const messages: ChatMessage[] = [
      { role: 'system', content: conversation.settings?.systemPromptOverride || 'You are a helpful assistant.' },
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    // Get provider
    const provider = ProviderFactory.getProvider(providerName || conversation.provider);

    // Create assistant message placeholder
    const assistantMessage = await messageService.create({
      conversationId,
      userId,
      role: 'assistant',
      content: '',
      provider: providerName || conversation.provider,
      model: model || conversation.model,
      status: 'streaming',
    });

    // Get response
    const response = await provider.chat(messages, {
      temperature: temperature ?? conversation.settings?.temperature,
      maxTokens: maxTokens ?? conversation.settings?.maxTokens,
      model: model || conversation.model,
    });

    // Update assistant message
    await messageService.updateStreaming(assistantMessage._id.toString(), {
      content: response.content,
      status: 'completed',
      latencyMs: response.latencyMs,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      totalTokens: response.totalTokens,
    });

    return { userMessage, assistantMessage, response };
  }
}

export const chatService = new ChatService();