import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type DisputeStatus = 'OPEN' | 'RESOLVED' | 'CLOSED';

export interface IDispute extends Document {
  projectId: Types.ObjectId;
  raisedBy: Types.ObjectId; // user who raised
  againstContractorId?: Types.ObjectId;
  reason?: string;
  amountClaimed?: number;
  status: DisputeStatus;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DisputeSchema: Schema<IDispute> = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    againstContractorId: { type: Schema.Types.ObjectId, ref: 'Contractor' },
    reason: { type: String, trim: true, maxlength: 2000 },
    amountClaimed: { type: Number },
    status: { type: String, enum: ['OPEN', 'RESOLVED', 'CLOSED'], default: 'OPEN', index: true },
    resolutionNotes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

DisputeSchema.index({ projectId: 1, status: 1 });

export const Dispute: Model<IDispute> = mongoose.models.Dispute as any || mongoose.model<IDispute>('Dispute', DisputeSchema);
