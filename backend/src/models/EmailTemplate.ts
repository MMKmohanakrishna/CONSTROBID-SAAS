import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailTemplate extends Document {
  type: string;
  subject: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema = new Schema<IEmailTemplate>({
  type: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
}, { timestamps: true });

export const EmailTemplate = mongoose.models.EmailTemplate || mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);
