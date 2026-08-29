import mongoose, { Schema, Document } from 'mongoose';

// Messages sent through the public landing-page chat widget or Contact Us
// form — visitors are unauthenticated, so this is intentionally not tied to
// a User account. name/phone come from the Contact Us form only; the chat
// widget just sends email + message.
export interface ISupportMessage extends Document {
  name?: string;
  phone?: string;
  email: string;
  message: string;
  source: 'CHAT_WIDGET' | 'CONTACT_FORM';
  createdAt: Date;
}

const SupportMessageSchema = new Schema<ISupportMessage>({
  name: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  email: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  source: { type: String, enum: ['CHAT_WIDGET', 'CONTACT_FORM'], default: 'CHAT_WIDGET' },
  createdAt: { type: Date, default: Date.now },
});

export const SupportMessage =
  mongoose.models.SupportMessage || mongoose.model<ISupportMessage>('SupportMessage', SupportMessageSchema);
