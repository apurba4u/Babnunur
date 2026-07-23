import mongoose, { Schema, Document } from 'mongoose';

export interface ILanding {
  _id: string;
  heroTitle: string;
  heroSubtitle: string;
  features: { title: string; description: string; icon: string }[];
  ctaText: string;
  ctaLink: string;
  showTestimonials: boolean;
  showPricing: boolean;
  showFAQ: boolean;
}

export interface LandingDocument extends Omit<ILanding, '_id'>, Document<string> {}

const landingSchema = new Schema<LandingDocument>(
  {
    _id: { type: String, default: 'landing_settings' },
    heroTitle: { type: String, default: 'Welcome to Babnunur' },
    heroSubtitle: { type: String, default: 'AI-powered platform for your productivity' },
    features: [{
      title: { type: String, required: true },
      description: { type: String, required: true },
      icon: { type: String, required: true },
    }],
    ctaText: { type: String, default: 'Get Started' },
    ctaLink: { type: String, default: '/signup' },
    showTestimonials: { type: Boolean, default: true },
    showPricing: { type: Boolean, default: true },
    showFAQ: { type: Boolean, default: true },
  },
  { timestamps: true }
);

landingSchema.pre('save', async function (next) {
  if (this.isNew) {
    this._id = 'landing_settings';
  }
  next();
});

export const Landing = mongoose.model<LandingDocument>('Landing', landingSchema);
