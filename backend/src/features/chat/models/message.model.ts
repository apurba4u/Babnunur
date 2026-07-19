import mongoose, { Schema, Document } from 'mongoose';
import { IMessage } from '../types';

export interface MessageDocument extends IMessage, Document {}

const messageSchema = new Schema<MessageDocument>(
  {
    conversationId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'markdown', 'code', 'image', 'file', 'system', 'tool'], default: 'text' },
    sequenceNumber: { type: Number, required: true },
    parentMessageId: { type: String },
    status: { type: String, enum: ['streaming', 'completed', 'failed', 'cancelled'], default: 'completed' },
    finishReason: { type: String, enum: ['stop', 'length', 'error', 'cancelled'] },
    provider: { type: String, required: true },
    modelName: { type: String, required: true },
    tokenCount: { type: Number, default: 0 },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
    attachments: [{
      name: { type: String },
      type: { type: String },
      size: { type: Number },
      url: { type: String },
    }],
    citations: [{
      title: { type: String },
      url: { type: String },
      snippet: { type: String },
    }],
    toolCalls: [{
      id: { type: String },
      name: { type: String },
      args: { type: Schema.Types.Mixed },
    }],
    toolResults: [{
      toolCallId: { type: String },
      result: { type: Schema.Types.Mixed },
    }],
    reasoning: { type: String },
    metadata: { type: Schema.Types.Mixed },
    error: { type: String },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, sequenceNumber: 1 });
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ conversationId: 1, status: 1 });
messageSchema.index({ userId: 1, createdAt: -1 });

export const Message = mongoose.model<MessageDocument>('Message', messageSchema);
