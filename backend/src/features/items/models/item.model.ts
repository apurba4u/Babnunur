import mongoose, { Schema, Document } from 'mongoose';
import { IItem } from '../types';

export interface ItemDocument extends IItem, Document {}

const itemSchema = new Schema<ItemDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'general' },
    tags: [{ type: String }],
    status: { type: String, enum: ['active', 'archived', 'draft'], default: 'active' },
  },
  { timestamps: true }
);

itemSchema.index({ userId: 1, createdAt: -1 });
itemSchema.index({ userId: 1, status: 1 });
itemSchema.index({ userId: 1, category: 1 });

export const Item = mongoose.model<ItemDocument>('Item', itemSchema);
