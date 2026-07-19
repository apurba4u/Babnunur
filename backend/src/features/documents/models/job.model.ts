import mongoose, { Schema, Document as MongoDocument } from 'mongoose';
import { IDocumentProcessingJob } from '../types';

export interface JobModel extends IDocumentProcessingJob, MongoDocument {}

const jobSchema = new Schema<JobModel>(
  {
    documentId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    progress: { type: Number, default: 0 },
    error: String,
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

export const ProcessingJob = mongoose.model<JobModel>('ProcessingJob', jobSchema);
