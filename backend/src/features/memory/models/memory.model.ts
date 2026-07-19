import mongoose, { Schema, Document } from 'mongoose';
import { MemoryEntry } from '../types';

export interface MemoryDocument extends Omit<MemoryEntry, 'id'>, Document {}

const memorySchema = new Schema<MemoryDocument>({
  userId: { type: String, required: true, index: true },
  conversationId: { type: String, index: true },
  type: { type: String, enum: ['session', 'user', 'topic', 'fact'], required: true, index: true },
  content: { type: String, required: true },
  importance: { type: Number, default: 0.5 },
  accessCount: { type: Number, default: 0 },
  lastAccessedAt: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

memorySchema.index({ userId: 1, type: 1 });
memorySchema.index({ userId: 1, importance: -1 });
memorySchema.index({ userId: 1, content: 'text' });

export const Memory = mongoose.model<MemoryDocument>('Memory', memorySchema);
