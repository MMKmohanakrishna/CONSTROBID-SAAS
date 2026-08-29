import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type PaymentPurpose = 'BOQ_UNLOCK' | 'FINANCE_SUBSCRIPTION';
export type PaymentStatus = 'CREATED' | 'PAID' | 'FAILED';

export interface IPayment extends Document {
  /** Set for project-scoped purposes. A finance subscription belongs to the contractor, not a project. */
  projectId?: Types.ObjectId;
  userId: Types.ObjectId;
  purpose: PaymentPurpose;

  /** Smallest currency unit, so ₹29 is stored as 2900. */
  amount: number;
  currency: string;

  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  status: PaymentStatus;

  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    purpose: { type: String, enum: ['BOQ_UNLOCK', 'FINANCE_SUBSCRIPTION'], required: true },

    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },

    razorpayOrderId: { type: String, required: true, index: true },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },

    status: { type: String, enum: ['CREATED', 'PAID', 'FAILED'], default: 'CREATED', index: true },
  },
  { timestamps: true }
);

PaymentSchema.index({ projectId: 1, purpose: 1, status: 1 });

export const Payment: Model<IPayment> =
  (mongoose.models.Payment as Model<IPayment>) ||
  mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
