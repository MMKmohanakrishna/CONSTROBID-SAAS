import mongoose, { Schema, Document, Model, Types } from 'mongoose';

/**
 * What a finance file hangs off. Invoices attach to an individual payment as
 * well as the material itself — a contractor photographs a bill per payment,
 * not once per material.
 */
export type FinanceFileEntity =
  | 'material'
  | 'material_update'
  | 'labour'
  | 'labour_update'
  | 'log'
  | 'design';

export interface IFinanceFile extends Document {
  contractorId: Types.ObjectId;
  financeProjectId: Types.ObjectId;

  entityType: FinanceFileEntity;
  entityId: Types.ObjectId;

  fileName: string;
  fileUrl: string;
  mimeType?: string;
  sizeBytes?: number;

  createdAt: Date;
  updatedAt: Date;
}

const FinanceFileSchema: Schema<IFinanceFile> = new Schema(
  {
    contractorId: { type: Schema.Types.ObjectId, ref: 'Contractor', required: true, index: true },
    financeProjectId: { type: Schema.Types.ObjectId, ref: 'FinanceProject', required: true, index: true },

    entityType: {
      type: String,
      enum: ['material', 'material_update', 'labour', 'labour_update', 'log', 'design'],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },

    fileName: { type: String, trim: true, default: 'File' },
    fileUrl: { type: String, required: true, trim: true },
    mimeType: { type: String, default: '' },
    sizeBytes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

FinanceFileSchema.index({ entityType: 1, entityId: 1 });

export const FinanceFile: Model<IFinanceFile> =
  (mongoose.models.FinanceFile as Model<IFinanceFile>) ||
  mongoose.model<IFinanceFile>('FinanceFile', FinanceFileSchema);

export default FinanceFile;
