import mongoose, { Schema, Document } from 'mongoose';
import { IConversation } from '../types';

export interface ConversationDocument extends IConversation, Document {}

const conversationSchema = new Schema<ConversationDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, default: 'New Conversation' },
    provider: { type: String, required: true, default: 'gemini' },
    model: { type: String, required: true, default: 'gemini-2.0-flash' },
    modelVersion: { type: String, default: '' },
    systemPrompt: { type: String },
    status: { type: String, enum: ['active', 'archived', 'deleted'], default: 'active' },
    pinned: { type: Boolean, default: false },
    favorite: { type: Boolean, default: false },
    visibility: { type: String, enum: ['private', 'shared'], default: 'private' },
    messageCount: { type: Number, default: 0 },
    lastMessageAt: { type: Date },
    totalInputTokens: { type: Number, default: 0 },
    totalOutputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    lastError: { type: String },
    settings: {
      temperature: { type: Number, default: 0.7 },
      maxTokens: { type: Number, default: 4096 },
      topP: { type: Number },
      systemPromptOverride: { type: String },
    },
    summary: { type: String },
    tags: [{ type: String }],
    deletedAt: { type: Date },
    deletedBy: { type: String },
  },
  { timestamps: true }
);

conversationSchema.index({ userId: 1, lastMessageAt: -1 });
conversationSchema.index({ userId: 1, status: 1, updatedAt: -1 });
conversationSchema.index({ userId: 1, favorite: 1 });
conversationSchema.index({ userId: 1, pinned: 1 });
conversationSchema.index({ userId: 1, title: 'text' });

export const Conversation = mongoose.model<ConversationDocument>('Conversation', conversationSchema);
