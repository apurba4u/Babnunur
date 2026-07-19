import mongoose, { Schema, Document } from 'mongoose';
import { KnowledgeBase } from '../types';

export interface KnowledgeBaseDocument extends Omit<KnowledgeBase, 'id'>, Document {}

const kbSchema = new Schema<KnowledgeBaseDocument>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  documentIds: [{ type: String }],
  tags: [{ type: String }],
  documentCount: { type: Number, default: 0 },
  totalChunks: { type: Number, default: 0 },
}, { timestamps: true });

kbSchema.index({ userId: 1, name: 1 });
kbSchema.index({ userId: 1, tags: 1 });

export const KnowledgeBaseModel = mongoose.model<KnowledgeBaseDocument>('KnowledgeBase', kbSchema);
