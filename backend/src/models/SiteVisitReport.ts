import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ISiteVisitReport extends Document {
  projectId: Types.ObjectId;
  inspectorId: Types.ObjectId;
  visitDate: Date;
  geoLocation?: { lat: number; lng: number };
  issues?: { code?: string; description?: string }[];
  photos?: Types.ObjectId[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema(
  {
    code: { type: String, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false }
);

const SiteVisitReportSchema: Schema<ISiteVisitReport> = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    inspectorId: { type: Schema.Types.ObjectId, ref: 'InspectionTeam', required: true, index: true },
    visitDate: { type: Date, required: true, default: Date.now },
    geoLocation: {
      lat: { type: Number },
      lng: { type: Number },
    },
    issues: { type: [IssueSchema], default: [] },
    photos: [{ type: Schema.Types.ObjectId, ref: 'DesignFile' }],
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

SiteVisitReportSchema.index({ projectId: 1, visitDate: -1 });

export const SiteVisitReport: Model<ISiteVisitReport> =
  mongoose.models.SiteVisitReport as any || mongoose.model<ISiteVisitReport>('SiteVisitReport', SiteVisitReportSchema);

export default SiteVisitReport;

