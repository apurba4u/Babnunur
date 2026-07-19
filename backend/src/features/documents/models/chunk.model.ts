import mongoose, { Schema, Document as MongoDocument } from 'mongoose';
import { IDocumentChunk } from '../types';

export interface ChunkModel extends IDocumentChunk, MongoDocument {}

const chunkSchema = new Schema<ChunkModel>(
  {
    documentId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    content: { type: String, required: true },
    pageNumber: Number,
    startIndex: { type: Number, required: true },
    endIndex: { type: Number, required: true },
    tokenCount: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    embedding: { type: [Number], default: [] },
  },
  { timestamps: true }
);

chunkSchema.index({ documentId: 1, chunkIndex: 1 });
chunkSchema.index({ userId: 1, documentId: 1 });

export const Chunk = mongoose.model<ChunkModel>('Chunk', chunkSchema);
