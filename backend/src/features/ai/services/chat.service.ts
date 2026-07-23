import { ProviderFactory } from '../providers/factory';
import { conversationService } from '../../chat/services/conversation.service';
import { messageService } from '../../chat/services/message.service';
import { ChatMessage, ChatResponse } from '../types';
import { MessageDocument } from '../../chat/models/message.model';
import { extractFileContent, buildAttachmentText } from '../utils/document-extractor';

export class ChatService {
  async sendMessage(params: {
    userId: string;
    conversationId: string;
    content: string;
    provider?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    attachments?: Array<{ url: string; name: string; type: string; size: number }>;
  }): Promise<{ userMessage: MessageDocument; assistantMessage: MessageDocument; response: ChatResponse }> {
    const { userId, conversationId, content, provider: providerName, model, temperature, maxTokens, attachments } = params;

    const conversation = await conversationService.getById(conversationId, userId);

    // Create user message
    const userMessage = await messageService.create({
      conversationId,
      userId,
      role: 'user',
      content: content || (attachments ? `[Sent ${attachments.length} file(s)]` : ''),
      provider: providerName || conversation.provider,
      modelName: model || conversation.modelName,
      attachments,
    });

    // Build context
    const history = await messageService.listByConversation(conversationId, userId, { limit: 50 });
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
    const providerChain = [primaryProviderName];

    console.log('6. Provider selected:', primaryProviderName);
    console.log('7. Model selected:', model || '(provider default)');

    // Build fallback chain
    let fallback = ProviderFactory.getFallbackProvider(primaryProviderName);
    while (fallback) {
      providerChain.push(fallback.name);
      fallback = ProviderFactory.getFallbackProvider(fallback.name);
    }

    let lastError: Error | null = null;
    let response: ChatResponse | null = null;
    let assistantMessage: MessageDocument | null = null;
    const providerErrors: string[] = [];

    for (const pName of providerChain) {
      try {
        const provider = ProviderFactory.getProvider(pName);

        // Create assistant message placeholder for this provider attempt
        assistantMessage = await messageService.create({
          conversationId,
          userId,
          role: 'assistant',
          content: '',
          provider: pName,
          modelName: model || provider.getModelInfo().name,
          status: 'streaming',
        });

        response = await provider.chat(messages, {
          temperature: temperature ?? conversation.settings?.temperature,
          maxTokens: maxTokens ?? conversation.settings?.maxTokens,
          model,
        });

        // Update assistant message
        assistantMessage = await messageService.updateStreaming(assistantMessage._id.toString(), {
          content: response.content,
          status: 'completed',
          latencyMs: response.latencyMs,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
        });

        console.log(`13. Database save: message _id=${assistantMessage._id}, content length=${response.content.length}, status=completed`);

        lastError = null;
        break;
      } catch (err) {
        lastError = err as Error;
        providerErrors.push(`${pName}: ${lastError.message.split('.')[0]}`);
        console.error(`[ChatService] Provider ${pName} failed:`, lastError.message);
      }
    }

    if (!response || lastError || !assistantMessage) {
      const errMsg = providerErrors.length > 0 ? providerErrors.join('; ') : (lastError?.message || 'Unknown error');
      console.error('[ChatService] All providers failed:', errMsg);
      throw new Error(errMsg);
    }

    return { userMessage, assistantMessage, response };
  }
}

export const chatService = new ChatService();