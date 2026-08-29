import mongoose, { Schema, Document } from 'mongoose';

/**
 * Holds a registration in flight while its OTP is unconfirmed. Nothing lands
 * in User/Client/Contractor until verifyRegistrationOtp succeeds — this is
 * the only place the submitted data (and hashed password) lives until then.
 * TTL-expires 30 minutes after creation so abandoned attempts clean themselves up.
 */
export interface IPendingRegistration extends Document {
  email: string;
  passwordHash: string;
  role: 'CLIENT' | 'CONTRACTOR';
  otpChannel: 'EMAIL' | 'SMS';
  otpHash: string;
  otpExpiresAt: Date;
  attempts: number;
  payload: Record<string, any>;
  createdAt: Date;
}

const PendingRegistrationSchema = new Schema<IPendingRegistration>({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ['CLIENT', 'CONTRACTOR'] },
  otpChannel: { type: String, required: true, enum: ['EMAIL', 'SMS'] },
  otpHash: { type: String, required: true },
  otpExpiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  payload: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now, expires: 1800 }, // 30 minutes
});

export const PendingRegistration =
  mongoose.models.PendingRegistration ||
  mongoose.model<IPendingRegistration>('PendingRegistration', PendingRegistrationSchema);
