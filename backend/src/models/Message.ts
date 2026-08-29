import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  from: Types.ObjectId;
  to?: Types.ObjectId;
  content: string;
  attachments?: any[];
  read?: boolean;
  meta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema<IMessage> = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, index: true, required: true },
    from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, trim: true, maxlength: 5000 },
    attachments: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false, index: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message: Model<IMessage> = mongoose.models.Message as any || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
