import mongoose, { Schema, Document } from 'mongoose';

export interface ITestimonial {
  name: string;
  role: string;
  content: string;
  avatar?: string;
  rating: number;
  published: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestimonialDocument extends ITestimonial, Document {}

const testimonialSchema = new Schema<TestimonialDocument>(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    avatar: { type: String },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

testimonialSchema.index({ published: 1, order: 1 });

export const Testimonial = mongoose.model<TestimonialDocument>('Testimonial', testimonialSchema);
