import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type FinanceProjectStatus = 'active' | 'completed' | 'on-hold';

/**
 * A project inside the contractor's private finance tracker.
 *
 * Deliberately separate from the marketplace `Project`: a contractor can track
 * jobs that never went through ConstroBID, which have no client login, no
 * inspector and no bidding lifecycle. `sourceProjectId` links the two when the
 * job did come from the platform.
 */
export interface IFinanceProject extends Document {
  contractorId: Types.ObjectId;
  sourceProjectId?: Types.ObjectId;

  name: string;
  clientName?: string;
  location?: string;

  /** Typed by the contractor. Prefilled from the accepted quotation only when that total is above zero. */
  contractValue: number;

  status: FinanceProjectStatus;

  startDate?: Date;
  endDate?: Date;
  notes?: string;

  /** Soft delete: contractor data is never hard-deleted. */
  deletedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const FinanceProjectSchema: Schema<IFinanceProject> = new Schema(
  {
    contractorId: { type: Schema.Types.ObjectId, ref: 'Contractor', required: true, index: true },
    sourceProjectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },

    name: { type: String, required: true, trim: true, maxlength: 200 },
    clientName: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },

    contractValue: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: ['active', 'completed', 'on-hold'],
      default: 'active',
      index: true,
    },

    startDate: { type: Date },
    endDate: { type: Date },
    notes: { type: String, trim: true, maxlength: 5000, default: '' },

    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

// The list view is always "my projects, not deleted, newest first".
FinanceProjectSchema.index({ contractorId: 1, deletedAt: 1, createdAt: -1 });

// A platform project is tracked at most once per contractor.
FinanceProjectSchema.index(
  { contractorId: 1, sourceProjectId: 1 },
  { unique: true, partialFilterExpression: { sourceProjectId: { $type: 'objectId' } } }
);

export const FinanceProject: Model<IFinanceProject> =
  (mongoose.models.FinanceProject as Model<IFinanceProject>) ||
  mongoose.model<IFinanceProject>('FinanceProject', FinanceProjectSchema);

export default FinanceProject;
