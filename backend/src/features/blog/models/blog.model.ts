import mongoose, { Schema, Document } from 'mongoose';

export interface IBlog {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  image?: string;
  tags: string[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogDocument extends IBlog, Document {}

const blogSchema = new Schema<BlogDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    content: { type: String, required: true },
    excerpt: { type: String, required: true },
    author: { type: String, required: true },
    image: { type: String },
    tags: [{ type: String }],
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

blogSchema.index({ slug: 1 });
blogSchema.index({ published: 1, createdAt: -1 });
blogSchema.index({ tags: 1 });

export const Blog = mongoose.model<BlogDocument>('Blog', blogSchema);
