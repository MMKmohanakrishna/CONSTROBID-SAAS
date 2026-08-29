import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  details?: string;
  userId?: Types.ObjectId;
  ip?: string;
  meta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema: Schema<IAuditLog> = new Schema(
  {
    action: { type: String, required: true, trim: true, maxlength: 200, index: true },
    details: { type: String, trim: true, maxlength: 2000 },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    ip: { type: String, trim: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

AuditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog as any || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
