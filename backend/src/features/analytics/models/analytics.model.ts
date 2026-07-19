import mongoose, { Schema, Document } from 'mongoose';

export interface AnalyticsEventDocument extends Document {
  userId: string;
  eventType: string;
  provider: string;
  model: string;
  tokens: number;
  latency: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const analyticsSchema = new Schema<AnalyticsEventDocument>({
  userId: { type: String, required: true, index: true },
  eventType: { type: String, required: true, index: true },
  provider: { type: String, default: 'unknown' },
  model: { type: String, default: 'unknown' },
  tokens: { type: Number, default: 0 },
  latency: { type: Number, default: 0 },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

analyticsSchema.index({ createdAt: -1 });
analyticsSchema.index({ userId: 1, createdAt: -1 });

export const AnalyticsEvent = mongoose.model<AnalyticsEventDocument>('AnalyticsEvent', analyticsSchema);