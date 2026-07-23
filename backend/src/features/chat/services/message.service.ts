import { Message, MessageDocument } from '../models/message.model';
import { Conversation } from '../models/conversation.model';
import { NotFoundError } from '../../../core/errors';

export class MessageService {
  async listByConversation(
    conversationId: string,
    userId: string,
    params: { limit?: number; before?: string }
  ): Promise<MessageDocument[]> {
    const filter: Record<string, unknown> = {
      conversationId,
      userId,
      deletedAt: { $exists: false },
    };

    if (params.before) {
      filter.createdAt = { $lt: new Date(params.before) };
    }

    const messages = await Message.find(filter)
      .sort({ sequenceNumber: -1 })
      .limit(params.limit || 50)
      .lean();

    return messages.reverse() as unknown as MessageDocument[];
  }

  async create(data: {
    conversationId: string;
    userId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    provider: string;
    modelName: string;
    messageType?: string;
    parentMessageId?: string;
    status?: string;
    attachments?: Array<{ url: string; name: string; type: string; size: number }>;
  }): Promise<MessageDocument> {
    const lastMsg = await Message.findOne({ conversationId: data.conversationId })
      .sort({ sequenceNumber: -1 })
      .select('sequenceNumber');

    const sequenceNumber = (lastMsg?.sequenceNumber || 0) + 1;

    const message = await Message.create({
      ...data,
      sequenceNumber,
      messageType: data.messageType || 'text',
      status: data.status || 'completed',
    });

    await Conversation.findByIdAndUpdate(data.conversationId, {
      $inc: { messageCount: 1 },
      $set: { lastMessageAt: new Date() },
    });

    return message;
  }

  async updateStreaming(
    id: string,
    data: Partial<{
      content: string;
      status: string;
      latencyMs: number;
      tokenCount: number;
      inputTokens: number;
      outputTokens: number;
      totalTokens: number;
      estimatedCost: number;
      finishReason: string;
    }>
  ): Promise<MessageDocument> {
    const msg = await Message.findByIdAndUpdate(id, { $set: data }, { new: true });
    if (!msg) throw new NotFoundError('Message');
    return msg;
  }

  async delete(id: string, userId: string): Promise<void> {
    const msg = await Message.findOneAndUpdate(
      { _id: id, userId },
      { $set: { deletedAt: new Date() } }
    );
    if (!msg) throw new NotFoundError('Message');
  }

  async getMessageCount(conversationId: string): Promise<number> {
    return Message.countDocuments({ conversationId, deletedAt: { $exists: false } });
  }
}

export const messageService = new MessageService();
