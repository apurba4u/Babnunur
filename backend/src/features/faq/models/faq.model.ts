import mongoose, { Schema, Document } from 'mongoose';

export interface IFaq {
  question: string;
  answer: string;
  category: string;
  order: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FaqDocument extends IFaq, Document {}

const faqSchema = new Schema<FaqDocument>(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
    category: { type: String, default: 'general', trim: true },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

faqSchema.index({ category: 1, order: 1 });

export const Faq = mongoose.model<FaqDocument>('Faq', faqSchema);
