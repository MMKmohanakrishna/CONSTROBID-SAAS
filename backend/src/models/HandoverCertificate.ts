import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISignature {
  role: string;
  name: string;
  signedAt: Date;
}

export interface IHandoverCertificate extends Document {
  projectId: Types.ObjectId;
  issuedBy: Types.ObjectId;
  issuedAt: Date;
  certificateUrl?: string;
  status: string;
  signatures?: ISignature[];
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const SignatureSchema: Schema<ISignature> = new Schema({ role: String, name: String, signedAt: Date }, { _id: false });

const HandoverCertificateSchema: Schema<IHandoverCertificate> = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    issuedAt: { type: Date, default: () => new Date() },
    certificateUrl: { type: String },
    status: { type: String, enum: ['DRAFT','SIGNED','REVOKED'], default: 'DRAFT' },
    signatures: { type: [SignatureSchema], default: [] },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const HandoverCertificate: Model<IHandoverCertificate> = mongoose.models.HandoverCertificate as any || mongoose.model<IHandoverCertificate>('HandoverCertificate', HandoverCertificateSchema);

export default HandoverCertificate;
