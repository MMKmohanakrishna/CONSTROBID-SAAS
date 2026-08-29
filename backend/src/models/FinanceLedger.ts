import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type PaymentMode = 'cash' | 'upi' | 'bank' | 'cheque';
export type LedgerStatus = 'pending' | 'partial' | 'paid';

export interface ILedgerUpdate {
  _id?: Types.ObjectId;
  date: Date;
  paidAdded: number;
  budgetAdded: number;
  mode?: PaymentMode | '';
  note?: string;
  createdAt?: Date;
}

/** Shared shape: a material and a labour crew are the same ledger with different labels. */
interface ILedgerEntry extends Document {
  financeProjectId: Types.ObjectId;
  contractorId: Types.ObjectId;

  name: string;

  /** What the contractor budgeted at the start. Extra budget arrives through updates. */
  openingBudget: number;

  /**
   * Derived caches, recomputed from `updates` on every write. Never assign to
   * these directly — see recalculateLedgerTotals.
   */
  budget: number;
  paid: number;
  status: LedgerStatus;

  updates: ILedgerUpdate[];

  deletedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface IFinanceMaterial extends ILedgerEntry {
  quantity?: string;
  supplier?: string;
  poNumber?: string;
}

export interface IFinanceLabour extends ILedgerEntry {
  trade?: string;
  workers?: number;
  contact?: string;
}

const LedgerUpdateSchema = new Schema<ILedgerUpdate>(
  {
    date: { type: Date, required: true },
    paidAdded: { type: Number, default: 0, min: 0 },
    budgetAdded: { type: Number, default: 0, min: 0 },
    mode: { type: String, enum: ['cash', 'upi', 'bank', 'cheque', ''], default: '' },
    note: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

function ledgerBase(): Record<string, any> {
  return {
    financeProjectId: { type: Schema.Types.ObjectId, ref: 'FinanceProject', required: true, index: true },
    contractorId: { type: Schema.Types.ObjectId, ref: 'Contractor', required: true, index: true },

    name: { type: String, required: true, trim: true, maxlength: 200 },

    openingBudget: { type: Number, default: 0, min: 0 },

    budget: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending', index: true },

    updates: { type: [LedgerUpdateSchema], default: [] },

    deletedAt: { type: Date, default: null, index: true },
  };
}

/**
 * The payment history is the single source of truth. Totals are recalculated
 * from it on every write, so deleting an update can never leave the headline
 * figures — and therefore the P&L — quietly wrong.
 */
export function recalculateLedgerTotals(entry: any) {
  const updates: ILedgerUpdate[] = entry.updates || [];

  const paid = updates.reduce((total, update) => total + Number(update.paidAdded || 0), 0);
  const addedBudget = updates.reduce((total, update) => total + Number(update.budgetAdded || 0), 0);

  entry.paid = paid;
  entry.budget = Number(entry.openingBudget || 0) + addedBudget;

  if (paid <= 0) entry.status = 'pending';
  else if (entry.budget > 0 && paid >= entry.budget) entry.status = 'paid';
  else entry.status = 'partial';

  return entry;
}

const FinanceMaterialSchema = new Schema<IFinanceMaterial>(
  {
    ...ledgerBase(),
    quantity: { type: String, trim: true, default: '' },
    supplier: { type: String, trim: true, default: '' },
    poNumber: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

const FinanceLabourSchema = new Schema<IFinanceLabour>(
  {
    ...ledgerBase(),
    trade: { type: String, trim: true, default: '' },
    workers: { type: Number, default: 0, min: 0 },
    contact: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

FinanceMaterialSchema.index({ financeProjectId: 1, deletedAt: 1, createdAt: -1 });
FinanceLabourSchema.index({ financeProjectId: 1, deletedAt: 1, createdAt: -1 });

export const FinanceMaterial: Model<IFinanceMaterial> =
  (mongoose.models.FinanceMaterial as Model<IFinanceMaterial>) ||
  mongoose.model<IFinanceMaterial>('FinanceMaterial', FinanceMaterialSchema);

export const FinanceLabour: Model<IFinanceLabour> =
  (mongoose.models.FinanceLabour as Model<IFinanceLabour>) ||
  mongoose.model<IFinanceLabour>('FinanceLabour', FinanceLabourSchema);
