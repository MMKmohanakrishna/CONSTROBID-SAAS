import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IProjectUpdate extends Document {
  projectId: Types.ObjectId;
  authorId: Types.ObjectId;
  percentComplete?: number;
  notes?: string;
  photos?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectUpdateSchema: Schema<IProjectUpdate> = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    percentComplete: { type: Number, min: 0, max: 100 },
    notes: { type: String, trim: true, maxlength: 2000 },
    photos: [{ type: Schema.Types.ObjectId, ref: 'DesignFile' }],
  },
  { timestamps: true }
);

// Compound index to quickly lookup timeline by project and creation time
ProjectUpdateSchema.index({ projectId: 1, createdAt: -1 });

export const ProjectUpdate: Model<IProjectUpdate> =
  mongoose.models.ProjectUpdate as any || mongoose.model<IProjectUpdate>('ProjectUpdate', ProjectUpdateSchema);

export default ProjectUpdate;

