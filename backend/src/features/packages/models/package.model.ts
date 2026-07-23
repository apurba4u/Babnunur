import mongoose, { Schema, Document } from 'mongoose';

export interface IPackage {
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly' | 'one-time';
  features: string[];
  limits: {
    chats: number;
    documents: number;
    storage: number;
    teamMembers: number;
  };
  stripePriceId?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PackageDocument extends IPackage, Document {}

const packageSchema = new Schema<PackageDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    interval: { type: String, enum: ['monthly', 'yearly', 'one-time'], required: true },
    features: [{ type: String }],
    limits: {
      chats: { type: Number, default: 0 },
      documents: { type: Number, default: 0 },
      storage: { type: Number, default: 0 },
      teamMembers: { type: Number, default: 0 },
    },
    stripePriceId: { type: String },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Package = mongoose.model<PackageDocument>('Package', packageSchema);
