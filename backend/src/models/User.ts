import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'CLIENT' | 'CONTRACTOR' | 'INSPECTOR' | 'INSPECTION_TEAM' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ['CLIENT', 'CONTRACTOR', 'INSPECTOR', 'INSPECTION_TEAM', 'ADMIN'] },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
