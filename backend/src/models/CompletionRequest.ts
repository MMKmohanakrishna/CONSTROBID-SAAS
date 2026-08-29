import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICompletionRequest extends Document {
  projectId: Types.ObjectId;
  contractorId: Types.ObjectId;
  requestedAt: Date;
  requestedDocuments?: string[];
  status: string;
  inspectionScheduledAt?: Date;
  notes?: string;
  attachments?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CompletionRequestSchema: Schema<ICompletionRequest> = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    contractorId: { type: Schema.Types.ObjectId, ref: 'Contractor', required: true, index: true },
    requestedAt: { type: Date, default: () => new Date() },
    requestedDocuments: [{ type: String }],
    status: { type: String, enum: ['PENDING','UNDER_REVIEW','REJECTED','ACCEPTED'], default: 'PENDING' },
    inspectionScheduledAt: { type: Date },
    notes: { type: String, trim: true },
    attachments: [{ type: Schema.Types.ObjectId, ref: 'DesignFile' }],
  },
  { timestamps: true }
);

CompletionRequestSchema.index({ projectId: 1, requestedAt: -1 });

export const CompletionRequest: Model<ICompletionRequest> = mongoose.models.CompletionRequest as any || mongoose.model<ICompletionRequest>('CompletionRequest', CompletionRequestSchema);

export default CompletionRequest;
