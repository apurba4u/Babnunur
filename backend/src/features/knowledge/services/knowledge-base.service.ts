import { KnowledgeBaseModel } from '../models/knowledge-base.model';
import { Document as DocModel } from '../../documents/models/document.model';
import { Chunk } from '../../documents/models/chunk.model';
import { NotFoundError } from '../../../core/errors';

export class KnowledgeBaseService {
  async create(userId: string, data: { name: string; description?: string; tags?: string[] }) {
    return KnowledgeBaseModel.create({ userId, ...data });
  }

  async list(userId: string, params: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = params;
    const filter: Record<string, unknown> = { userId };
    if (search) filter.name = { $regex: search, $options: 'i' };
    const [items, total] = await Promise.all([
      KnowledgeBaseModel.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      KnowledgeBaseModel.countDocuments(filter),
    ]);
    return { data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string, userId: string) {
    const kb = await KnowledgeBaseModel.findOne({ _id: id, userId });
    if (!kb) throw new NotFoundError('Knowledge Base');
    return kb;
  }

  async addDocuments(id: string, userId: string, documentIds: string[]) {
    const kb = await this.getById(id, userId);
    const newIds = documentIds.filter(did => !kb.documentIds.includes(did));
    const docCount = await DocModel.countDocuments({ _id: { $in: newIds } });
    const chunkCount = await Chunk.countDocuments({ documentId: { $in: newIds } });
    return KnowledgeBaseModel.findByIdAndUpdate(id, {
      $addToSet: { documentIds: { $each: newIds } },
      $inc: { documentCount: docCount, totalChunks: chunkCount },
    }, { new: true });
  }

  async removeDocument(id: string, userId: string, documentId: string) {
    await this.getById(id, userId);
    const chunkCount = await Chunk.countDocuments({ documentId });
    return KnowledgeBaseModel.findByIdAndUpdate(id, {
      $pull: { documentIds: documentId },
      $inc: { documentCount: -1, totalChunks: -chunkCount },
    }, { new: true });
  }

  async delete(id: string, userId: string) {
    const kb = await this.getById(id, userId);
    await KnowledgeBaseModel.findByIdAndDelete(kb._id);
  }

  async addTags(id: string, userId: string, tags: string[]) {
    await this.getById(id, userId);
    return KnowledgeBaseModel.findByIdAndUpdate(id, { $addToSet: { tags: { $each: tags } } }, { new: true });
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
