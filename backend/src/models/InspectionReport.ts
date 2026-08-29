import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IInspectionReport extends Document {
  projectId: Types.ObjectId;
  inspectionTeamId?: Types.ObjectId;
  clientId?: Types.ObjectId;
  inspectionDate?: Date;
  inspectionStatus?: string;
  propertyType?: string;
  projectCategory?: string;
  address?: string;
  city?: string;
  plotArea?: string | number;
  builtUpArea?: string | number;
  floors?: number;
  bedrooms?: number;
  bathrooms?: number;
  siteCondition?: string;
  requirements?: string;
  recommendations?: string;
  risks?: string;
  remarks?: string;
  photos?: string[];
  videos?: string[];
  documents?: string[];
  report?: Record<string, any>;
  submittedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const InspectionReportSchema: Schema<IInspectionReport> = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    inspectionTeamId: { type: Schema.Types.ObjectId, ref: 'InspectionTeam', index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', index: true },
    inspectionDate: { type: Date },
    inspectionStatus: { type: String, enum: ['SCHEDULED','ASSIGNED','IN_PROGRESS','COMPLETED','SUBMITTED','APPROVED','REJECTED'], default: 'SCHEDULED' },
    propertyType: { type: String },
    projectCategory: { type: String },
    address: { type: String },
    city: { type: String },
    plotArea: { type: Schema.Types.Mixed },
    builtUpArea: { type: Schema.Types.Mixed },
    floors: { type: Number },
    bedrooms: { type: Number },
    bathrooms: { type: Number },
    siteCondition: { type: String },
    requirements: { type: String },
    recommendations: { type: String },
    risks: { type: String },
    remarks: { type: String },
    photos: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    documents: { type: [String], default: [] },
    report: { type: Schema.Types.Mixed },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

InspectionReportSchema.index({ projectId: 1, inspectionTeamId: 1, inspectionDate: 1 });

export const InspectionReport: Model<IInspectionReport> = mongoose.models.InspectionReport as any || mongoose.model<IInspectionReport>('InspectionReport', InspectionReportSchema);
