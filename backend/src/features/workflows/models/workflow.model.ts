import mongoose, { Schema, Document } from 'mongoose';
import { Workflow, WorkflowRun } from '../types';

export interface WorkflowDocument extends Omit<Workflow, 'id'>, Document {}
const workflowSchema = new Schema<WorkflowDocument>({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  steps: [{ id: String, type: String, name: String, config: Schema.Types.Mixed, nextStepId: String }],
  status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
  runCount: { type: Number, default: 0 },
}, { timestamps: true });
export const WorkflowModel = mongoose.model<WorkflowDocument>('Workflow', workflowSchema);

export interface WorkflowRunDocument extends Omit<WorkflowRun, 'id'>, Document {}
const workflowRunSchema = new Schema<WorkflowRunDocument>({
  workflowId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
  results: [{ stepId: String, output: Schema.Types.Mixed, duration: Number }],
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  error: String,
}, { timestamps: true });
export const WorkflowRunModel = mongoose.model<WorkflowRunDocument>('WorkflowRun', workflowRunSchema);
