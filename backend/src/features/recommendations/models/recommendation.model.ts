import mongoose, { Schema, Document } from 'mongoose';

export interface IRecommendation extends Document {
  userId: string;
  type: 'ai' | 'productivity' | 'insight' | 'action';
  title: string;
  description: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const recommendationSchema = new Schema<IRecommendation>({
  userId: { type: String, required: true },
  type: { type: String, enum: ['ai', 'productivity', 'insight', 'action'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  link: { type: String },
  read: { type: Boolean, default: false },
}, { timestamps: true });

export const Recommendation = mongoose.model<IRecommendation>('Recommendation', recommendationSchema);
