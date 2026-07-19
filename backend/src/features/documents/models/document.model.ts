import mongoose, { Schema, Document as MongoDocument } from 'mongoose';
import { IDocument } from '../types';

export interface DocumentModel extends IDocument, MongoDocument {}

const documentSchema = new Schema<DocumentModel>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storagePath: { type: String, required: true },
    status: { type: String, enum: ['uploading', 'processing', 'ready', 'failed'], default: 'uploading' },
    chunkCount: { type: Number, default: 0 },
    metadata: {
      pages: Number,
      wordCount: Number,
      charCount: Number,
      language: String,
      author: String,
      createdAt: String,
    },
    error: String,
    deletedAt: Date,
  },
  { timestamps: true }
);

documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ userId: 1, status: 1 });

export const Document = mongoose.model<DocumentModel>('Document', documentSchema);
