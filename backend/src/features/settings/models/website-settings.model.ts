import mongoose, { Schema, Document } from 'mongoose';

export interface IWebsiteSettings {
  _id: string;
  name: string;
  description: string;
  logo?: string;
  favicon?: string;
  contactEmail?: string;
  socialLinks: { platform: string; url: string }[];
}

export interface WebsiteSettingsDocument extends Omit<IWebsiteSettings, '_id'>, Document<string> {}

const websiteSettingsSchema = new Schema<WebsiteSettingsDocument>(
  {
    _id: { type: String, default: 'website_settings' },
    name: { type: String, default: 'Babnunur' },
    description: { type: String, default: '' },
    logo: { type: String },
    favicon: { type: String },
    contactEmail: { type: String },
    socialLinks: [{
      platform: { type: String, required: true },
      url: { type: String, required: true },
    }],
  },
  { timestamps: true }
);

websiteSettingsSchema.pre('save', async function (next) {
  if (this.isNew) {
    this._id = 'website_settings';
  }
  next();
});

export const WebsiteSettings = mongoose.model<WebsiteSettingsDocument>('WebsiteSettings', websiteSettingsSchema);
