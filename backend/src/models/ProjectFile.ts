import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type FileType = 'IMAGE' | 'DOCUMENT' | 'OTHER';
export type UploadedBy = 'CLIENT' | 'CONTRACTOR' | 'INSPECTOR' | 'ADMIN';

export interface IProjectFile extends Document {
  projectId: Types.ObjectId;
  fileUrl: string;
  fileType: FileType;
  uploadedBy: UploadedBy;
  meta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectFileSchema: Schema<IProjectFile> = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    fileUrl: { type: String, required: true, trim: true },
    fileType: { type: String, enum: ['IMAGE', 'DOCUMENT', 'OTHER'], default: 'IMAGE' },
    uploadedBy: { type: String, enum: ['CLIENT', 'CONTRACTOR', 'INSPECTOR', 'ADMIN'], default: 'CLIENT' },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ProjectFileSchema.index({ projectId: 1 });

export const ProjectFile: Model<IProjectFile> = mongoose.models.ProjectFile as any || mongoose.model<IProjectFile>('ProjectFile', ProjectFileSchema);
