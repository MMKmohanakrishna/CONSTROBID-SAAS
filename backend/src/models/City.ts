import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICity extends Document {
  name: string;
  state?: string;
  country?: string;
  slug?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CitySchema: Schema<ICity> = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    state: { type: String, trim: true, maxlength: 200 },
    country: { type: String, trim: true, maxlength: 200, default: 'India' },
    slug: { type: String, lowercase: true, trim: true, index: true },
  },
  { timestamps: true }
);

CitySchema.index({ name: 1 });

export const City: Model<ICity> = mongoose.models.City as any || mongoose.model<ICity>('City', CitySchema);
