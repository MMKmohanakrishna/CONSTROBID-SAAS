import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type FinanceSubscriptionStatus = 'trialing' | 'active' | 'expired';

/** ₹149, in paise. Razorpay works in the smallest currency unit. */
export const FINANCE_PLAN_AMOUNT_PAISE = 14900;

/** Length of the free trial, in days. */
export const FINANCE_TRIAL_DAYS = 14;

/**
 * One subscription per contractor login.
 *
 * The trial clock starts the first time the contractor opens the finance
 * module, not at registration — otherwise every contractor who signed up
 * before this feature existed would arrive to an already-expired trial.
 */
export interface IFinanceSubscription extends Document {
  contractorId: Types.ObjectId;
  userId: Types.ObjectId;

  trialEndsAt: Date;

  /** Extended by one month per successful payment. Null until they first pay. */
  validUntil?: Date | null;

  lastPaymentId?: string;

  createdAt: Date;
  updatedAt: Date;
}

const FinanceSubscriptionSchema: Schema<IFinanceSubscription> = new Schema(
  {
    contractorId: { type: Schema.Types.ObjectId, ref: 'Contractor', required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    trialEndsAt: { type: Date, required: true },
    validUntil: { type: Date, default: null },

    lastPaymentId: { type: String, default: '' },
  },
  { timestamps: true }
);

/**
 * Status is derived from the dates rather than stored, so a subscription can
 * never sit at "active" because a job failed to run.
 */
export function resolveSubscriptionStatus(
  subscription: Pick<IFinanceSubscription, 'trialEndsAt' | 'validUntil'> | null,
  now: Date = new Date()
): FinanceSubscriptionStatus {
  if (!subscription) return 'trialing';

  if (subscription.validUntil && new Date(subscription.validUntil).getTime() > now.getTime()) {
    return 'active';
  }

  if (new Date(subscription.trialEndsAt).getTime() > now.getTime()) {
    return 'trialing';
  }

  return 'expired';
}

export const FinanceSubscription: Model<IFinanceSubscription> =
  (mongoose.models.FinanceSubscription as Model<IFinanceSubscription>) ||
  mongoose.model<IFinanceSubscription>('FinanceSubscription', FinanceSubscriptionSchema);

export default FinanceSubscription;
