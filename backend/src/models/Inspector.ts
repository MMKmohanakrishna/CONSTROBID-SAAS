import mongoose, { Schema, Document } from 'mongoose';

export interface IInspector extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InspectorSchema = new Schema<IInspector>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
}, { timestamps: true });

export const Inspector = mongoose.models.Inspector || mongoose.model<IInspector>('Inspector', InspectorSchema);
