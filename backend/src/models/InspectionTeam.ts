import mongoose, { Schema, Document } from 'mongoose';

export interface IInspectionTeam extends Document {
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  fullName: string;
  email: string;
  phone?: string;
  designation?: string;
  city?: string;
  profilePhoto?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InspectionTeamSchema = new Schema<IInspectionTeam>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  employeeId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  designation: { type: String, default: '' },
  city: { type: String, default: '' },
  profilePhoto: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

InspectionTeamSchema.index({ employeeId: 1 });

export const InspectionTeam = mongoose.models.InspectionTeam || mongoose.model<IInspectionTeam>('InspectionTeam', InspectionTeamSchema);
