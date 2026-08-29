import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICompletionVerification extends Document {
  projectId: Types.ObjectId;
  inspectorId: Types.ObjectId;
  verificationDate: Date;
  outcome: string;
  summary?: string;
  metrics?: any;
  relatedPunchListId?: Types.ObjectId;
  handoverCertificateId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CompletionVerificationSchema: Schema<ICompletionVerification> = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    inspectorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    verificationDate: { type: Date, default: () => new Date() },
    outcome: { type: String, enum: ['PASS','FAIL','CONDITIONAL'], required: true },
    summary: { type: String },
    metrics: { type: Schema.Types.Mixed },
    relatedPunchListId: { type: Schema.Types.ObjectId, ref: 'PunchList' },
    handoverCertificateId: { type: Schema.Types.ObjectId, ref: 'HandoverCertificate' },
  },
  { timestamps: true }
);

CompletionVerificationSchema.index({ projectId: 1, verificationDate: -1 });

export const CompletionVerification: Model<ICompletionVerification> = mongoose.models.CompletionVerification as any || mongoose.model<ICompletionVerification>('CompletionVerification', CompletionVerificationSchema);

export default CompletionVerification;
