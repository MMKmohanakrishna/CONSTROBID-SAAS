import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IScopeOfWork extends Document {
  url: string;
  filename?: string;
  uploadedBy?: Types.ObjectId | string;
  uploadedAt: Date;
  description?: string;
}

const ScopeOfWorkSchema: Schema<IScopeOfWork> = new Schema(
  {
    url: { type: String, required: true },
    filename: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
    description: { type: String },
  },
  { timestamps: false }
);

export const ScopeOfWork: Model<IScopeOfWork> = mongoose.models.ScopeOfWork as any || mongoose.model<IScopeOfWork>('ScopeOfWork', ScopeOfWorkSchema);
