import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IDesignPackage extends Document {
  projectId: Types.ObjectId;
  inspectionTeamId?: Types.ObjectId;
  status?: string;
  designFiles?: Types.ObjectId[];
  floorPlans?: Types.ObjectId[];
  elevations?: Types.ObjectId[];
  materialEstimates?: Types.ObjectId[];
  scopeOfWorks?: Types.ObjectId[];
  comments?: string;
  submittedAt?: Date | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DesignPackageSchema: Schema<IDesignPackage> = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    inspectionTeamId: { type: Schema.Types.ObjectId, ref: 'InspectionTeam', index: true },
    status: { type: String, enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'], default: 'DRAFT' },
    designFiles: [{ type: Schema.Types.ObjectId, ref: 'DesignFile' }],
    floorPlans: [{ type: Schema.Types.ObjectId, ref: 'DesignFile' }],
    elevations: [{ type: Schema.Types.ObjectId, ref: 'DesignFile' }],
    materialEstimates: [{ type: Schema.Types.ObjectId, ref: 'MaterialEstimate' }],
    scopeOfWorks: [{ type: Schema.Types.ObjectId, ref: 'ScopeOfWork' }],
    comments: { type: String },
    submittedAt: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

DesignPackageSchema.index({ projectId: 1, inspectionTeamId: 1, status: 1 });

export const DesignPackage: Model<IDesignPackage> =
  mongoose.models.DesignPackage as any || mongoose.model<IDesignPackage>('DesignPackage', DesignPackageSchema);
