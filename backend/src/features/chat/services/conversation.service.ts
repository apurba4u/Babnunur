import { Conversation, ConversationDocument } from '../models/conversation.model';
import { IConversation } from '../types';
import { NotFoundError } from '../../../core/errors';

interface ListParams {
  userId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  provider?: string;
  favorite?: string;
  pinned?: string;
  sort?: string;
}

export class ConversationService {
  async list(params: ListParams): Promise<{ data: Record<string, unknown>[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const { userId, page, limit, search, status, provider, favorite, pinned, sort } = params;
    const filter: Record<string, unknown> = { userId, deletedAt: { $exists: false } };

    if (search) filter.title = { $regex: search, $options: 'i' };
    if (status) filter.status = status;
    if (provider) filter.provider = provider;
    if (favorite === 'true') filter.favorite = true;
    if (pinned === 'true') filter.pinned = true;

    const sortDir = sort?.startsWith('-') ? -1 : 1;
    const sortField = (sort || '-lastMessageAt').replace('-', '');

    const [conversations, total] = await Promise.all([
      Conversation.find(filter)
        .sort({ [sortField]: sortDir })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(filter),
    ]);

    return {
      data: conversations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string, userId: string): Promise<ConversationDocument> {
    const conv = await Conversation.findOne({ _id: id, userId, deletedAt: { $exists: false } });
    if (!conv) throw new NotFoundError('Conversation');
    return conv;
  }

  async create(data: {
    userId: string;
    title?: string;
    provider?: string;
    model?: string;
    systemPrompt?: string;
    settings?: Record<string, unknown>;
  }): Promise<ConversationDocument> {
    return Conversation.create({
      userId: data.userId,
      title: data.title || 'New Conversation',
      provider: data.provider || 'gemini',
      modelName: data.model || 'gemini-2.0-flash',
      systemPrompt: data.systemPrompt,
      settings: data.settings as IConversation['settings'],
    });
  }

  async update(
    id: string,
    userId: string,
    data: Partial<{
      title: string;
      provider: string;
      modelName: string;
      systemPrompt: string;
      settings: Record<string, unknown>;
      tags: string[];
    }>
  ): Promise<ConversationDocument> {
    const conv = await Conversation.findOneAndUpdate(
      { _id: id, userId, deletedAt: { $exists: false } },
      { $set: data },
      { new: true }
    );
    if (!conv) throw new NotFoundError('Conversation');
    return conv;
  }

  async delete(id: string, userId: string): Promise<void> {
    const conv = await Conversation.findOneAndUpdate(
      { _id: id, userId, deletedAt: { $exists: false } },
      { $set: { deletedAt: new Date(), deletedBy: userId, status: 'deleted' } }
    );
    if (!conv) throw new NotFoundError('Conversation');
  }

  async restore(id: string, userId: string): Promise<ConversationDocument> {
    const conv = await Conversation.findOneAndUpdate(
      { _id: id, userId, deletedAt: { $exists: true } },
      { $set: { status: 'active' }, $unset: { deletedAt: '', deletedBy: '' } },
      { new: true }
    );
    if (!conv) throw new NotFoundError('Conversation');
    return conv;
  }

  async archive(id: string, userId: string): Promise<ConversationDocument> {
    const conv = await Conversation.findOneAndUpdate(
      { _id: id, userId, deletedAt: { $exists: false } },
      { $set: { status: 'archived' } },
      { new: true }
    );
    if (!conv) throw new NotFoundError('Conversation');
    return conv;
  }

  async toggleFavorite(id: string, userId: string): Promise<ConversationDocument> {
    const conv = await Conversation.findOne({ _id: id, userId, deletedAt: { $exists: false } });
    if (!conv) throw new NotFoundError('Conversation');
    conv.favorite = !conv.favorite;
    await conv.save();
    return conv;
  }

  async togglePin(id: string, userId: string): Promise<ConversationDocument> {
    const conv = await Conversation.findOne({ _id: id, userId, deletedAt: { $exists: false } });
    if (!conv) throw new NotFoundError('Conversation');
    conv.pinned = !conv.pinned;
    await conv.save();
    return conv;
  }
}

export const conversationService = new ConversationService();
