import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IReview extends Document {
  projectId: Types.ObjectId;
  contractorId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema<IReview> = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    contractorId: { type: Schema.Types.ObjectId, ref: 'Contractor', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 2000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ReviewSchema.index({ contractorId: 1, rating: -1 });

export const Review: Model<IReview> = mongoose.models.Review as any || mongoose.model<IReview>('Review', ReviewSchema);
