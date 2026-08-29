import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ReviewStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED';

export interface IDesignFile extends Document {
  projectId?: Types.ObjectId;
  fileUrl: string;
  url?: string;
  filename?: string;
  version?: number;
  fileType?: string;
  status?: ReviewStatus;
  uploadedBy?: Types.ObjectId | string;
  clientComments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DesignFileSchema: Schema<IDesignFile> = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    fileUrl: { type: String, required: true, trim: true },
    url: { type: String },
    filename: { type: String },
    version: {
  type: Number,
  default: 1,
},
    fileType: { type: String },
    status: { type: String, enum: ['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'], default: 'PENDING_REVIEW' },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    clientComments: { type: String },
  },
  { timestamps: true }
);

DesignFileSchema.index({ projectId: 1, status: 1 });

export const DesignFile: Model<IDesignFile> = mongoose.models.DesignFile as any || mongoose.model<IDesignFile>('DesignFile', DesignFileSchema);
