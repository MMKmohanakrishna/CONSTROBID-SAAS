import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IMaterialEstimate extends Document {
  url: string;
  filename?: string;
  uploadedBy?: Types.ObjectId | string;
  uploadedAt: Date;
  items?: Record<string, any>[];
}

const MaterialEstimateSchema: Schema<IMaterialEstimate> = new Schema(
  {
    url: { type: String, required: true },
    filename: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
    items: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: false }
);

export const MaterialEstimate: Model<IMaterialEstimate> = mongoose.models.MaterialEstimate as any || mongoose.model<IMaterialEstimate>('MaterialEstimate', MaterialEstimateSchema);
