import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  slug?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema<ICategory> = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000 },
    slug: { type: String, lowercase: true, trim: true, index: true },
  },
  { timestamps: true }
);

// indexes
CategorySchema.index({ name: 1 });

export const Category: Model<ICategory> = mongoose.models.Category as any || mongoose.model<ICategory>('Category', CategorySchema);
