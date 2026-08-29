import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { ICategory } from './Category';

export interface IService extends Document {
  name: string;
  description?: string;
  categories: Types.ObjectId[] | ICategory[];
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema: Schema<IService> = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category', index: true }],
  },
  { timestamps: true }
);

ServiceSchema.index({ name: 1 });

export const Service: Model<IService> = mongoose.models.Service as any || mongoose.model<IService>('Service', ServiceSchema);
