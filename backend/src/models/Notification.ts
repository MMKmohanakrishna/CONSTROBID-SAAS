import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type NotificationType =
  | 'PROJECT_UPDATE'
  | 'INSPECTION_SCHEDULED'
  | 'INSPECTION_COMPLETED'
  | 'NEW_QUOTATION'
  | 'GENERAL';

export interface INotification extends Document {
  recipient: Types.ObjectId;
  type: NotificationType;
  title?: string;
  message?: string;
  data?: Record<string, any>;
  read: boolean;
  meta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema<INotification> = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['PROJECT_UPDATE', 'INSPECTION_SCHEDULED', 'INSPECTION_COMPLETED', 'NEW_QUOTATION', 'GENERAL'], default: 'GENERAL' },
    title: { type: String, trim: true, maxlength: 200 },
    message: { type: String, trim: true, maxlength: 2000 },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, read: 1 });

export const Notification: Model<INotification> = mongoose.models.Notification as any || mongoose.model<INotification>('Notification', NotificationSchema);
