import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IMonitoringReport extends Document {
  projectId?: Types.ObjectId;
  weekStart: Date;
  metrics: {
    totalUpdates: number;
    totalVisits: number;
    delayedCount: number;
    qualityScoreAvg?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MonitoringReportSchema: Schema<IMonitoringReport> = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true, required: false },
    weekStart: { type: Date, required: true, index: true },
    metrics: {
      totalUpdates: { type: Number, default: 0 },
      totalVisits: { type: Number, default: 0 },
      delayedCount: { type: Number, default: 0 },
      qualityScoreAvg: { type: Number },
    },
  },
  { timestamps: true }
);

// Index for quick week-range queries and optional per-project lookup
MonitoringReportSchema.index({ weekStart: 1, projectId: 1 });

export const MonitoringReport: Model<IMonitoringReport> =
  mongoose.models.MonitoringReport as any || mongoose.model<IMonitoringReport>('MonitoringReport', MonitoringReportSchema);

export default MonitoringReport;
