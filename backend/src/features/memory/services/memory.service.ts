import { Memory, MemoryDocument } from '../models/memory.model';
import { MemoryEntry, MemoryQuery } from '../types';

export class MemoryService {
  async add(entry: Omit<MemoryEntry, 'id' | 'accessCount' | 'lastAccessedAt' | 'createdAt'>): Promise<MemoryDocument> {
    return Memory.create({ ...entry, accessCount: 0, lastAccessedAt: new Date() });
  }

  async search(query: MemoryQuery): Promise<MemoryEntry[]> {
    const filter: Record<string, unknown> = { userId: query.userId };
    if (query.type) filter.type = query.type;
    if (query.minImportance) filter.importance = { $gte: query.minImportance };
    if (query.query) filter.$text = { $search: query.query };

    return Memory.find(filter)
      .sort({ importance: -1, lastAccessedAt: -1 })
      .limit(query.limit || 20)
      .lean();
  }

  async get(id: string): Promise<MemoryDocument | null> {
    return Memory.findByIdAndUpdate(id, { $inc: { accessCount: 1 }, lastAccessedAt: new Date() });
  }

  async summarize(conversationId: string, userId: string): Promise<string> {
    const messages = await Memory.find({ conversationId, userId, type: 'session' }).sort({ createdAt: 1 });
    const facts = await Memory.find({ conversationId, userId, type: 'fact' });
    const topics = await Memory.find({ conversationId, userId, type: 'topic' });

    let summary = 'Conversation summary:\n';
    if (facts.length > 0) summary += `Key facts: ${facts.map(f => f.content).join('; ')}\n`;
    if (topics.length > 0) summary += `Topics discussed: ${topics.map(t => t.content).join(', ')}\n`;
    summary += `Messages: ${messages.length}`;
    return summary;
  }

  async prune(userId: string, maxEntries: number = 500): Promise<number> {
    const count = await Memory.countDocuments({ userId });
    if (count <= maxEntries) return 0;
    const toDelete = count - maxEntries;
    const oldest = await Memory.find({ userId }).sort({ lastAccessedAt: 1 }).limit(toDelete).select('_id');
    await Memory.deleteMany({ _id: { $in: oldest.map(m => m._id) } });
    return toDelete;
  }

  async deleteByConversation(conversationId: string): Promise<void> {
    await Memory.deleteMany({ conversationId });
  }

  async deleteByUser(userId: string): Promise<void> {
    await Memory.deleteMany({ userId });
  }
}

export const memoryService = new MemoryService();
