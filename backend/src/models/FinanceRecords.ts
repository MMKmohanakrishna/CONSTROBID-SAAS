import mongoose, { Schema, Document, Model, Types } from 'mongoose';

import type { PaymentMode } from './FinanceLedger';

/** A day on site: what was done, what it cost, and the photos to prove it. */
export interface IFinanceDailyLog extends Document {
  financeProjectId: Types.ObjectId;
  contractorId: Types.ObjectId;

  date: Date;
  workDone?: string;
  workers?: number;
  labourCost: number;
  materialCost: number;
  mode?: PaymentMode | '';
  poNumber?: string;
  notes?: string;

  /**
   * Cloudinary URLs, stored inline rather than as FinanceFile rows: the photo
   * strip and the PDF report both need them in order, with the log.
   */
  photos: string[];

  deletedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const FinanceDailyLogSchema: Schema<IFinanceDailyLog> = new Schema(
  {
    financeProjectId: { type: Schema.Types.ObjectId, ref: 'FinanceProject', required: true, index: true },
    contractorId: { type: Schema.Types.ObjectId, ref: 'Contractor', required: true, index: true },

    date: { type: Date, required: true },
    workDone: { type: String, trim: true, maxlength: 5000, default: '' },
    workers: { type: Number, default: 0, min: 0 },
    labourCost: { type: Number, default: 0, min: 0 },
    materialCost: { type: Number, default: 0, min: 0 },
    mode: { type: String, enum: ['cash', 'upi', 'bank', 'cheque', ''], default: '' },
    poNumber: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, maxlength: 5000, default: '' },

    photos: { type: [String], default: [] },

    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

FinanceDailyLogSchema.index({ financeProjectId: 1, deletedAt: 1, date: -1 });

/** Money received from the client — the other half of the P&L. */
export interface IFinanceClientPayment extends Document {
  financeProjectId: Types.ObjectId;
  contractorId: Types.ObjectId;

  date: Date;
  amount: number;
  mode?: PaymentMode | '';
  note?: string;

  createdAt: Date;
  updatedAt: Date;
}

const FinanceClientPaymentSchema: Schema<IFinanceClientPayment> = new Schema(
  {
    financeProjectId: { type: Schema.Types.ObjectId, ref: 'FinanceProject', required: true, index: true },
    contractorId: { type: Schema.Types.ObjectId, ref: 'Contractor', required: true, index: true },

    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    mode: { type: String, enum: ['cash', 'upi', 'bank', 'cheque', ''], default: '' },
    note: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

FinanceClientPaymentSchema.index({ financeProjectId: 1, date: -1 });

export const FinanceDailyLog: Model<IFinanceDailyLog> =
  (mongoose.models.FinanceDailyLog as Model<IFinanceDailyLog>) ||
  mongoose.model<IFinanceDailyLog>('FinanceDailyLog', FinanceDailyLogSchema);

export const FinanceClientPayment: Model<IFinanceClientPayment> =
  (mongoose.models.FinanceClientPayment as Model<IFinanceClientPayment>) ||
  mongoose.model<IFinanceClientPayment>('FinanceClientPayment', FinanceClientPaymentSchema);

/**
 * The contractor's private notebook. Deliberately excluded from the inspector
 * view and from every report — it is the one place they can write freely.
 */
export interface IFinanceDiaryNote extends Document {
  financeProjectId: Types.ObjectId;
  contractorId: Types.ObjectId;

  date: Date;
  note: string;

  createdAt: Date;
  updatedAt: Date;
}

const FinanceDiaryNoteSchema: Schema<IFinanceDiaryNote> = new Schema(
  {
    financeProjectId: { type: Schema.Types.ObjectId, ref: 'FinanceProject', required: true, index: true },
    contractorId: { type: Schema.Types.ObjectId, ref: 'Contractor', required: true, index: true },

    date: { type: Date, required: true },
    note: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: true }
);

FinanceDiaryNoteSchema.index({ financeProjectId: 1, date: -1 });

export const FinanceDiaryNote: Model<IFinanceDiaryNote> =
  (mongoose.models.FinanceDiaryNote as Model<IFinanceDiaryNote>) ||
  mongoose.model<IFinanceDiaryNote>('FinanceDiaryNote', FinanceDiaryNoteSchema);
