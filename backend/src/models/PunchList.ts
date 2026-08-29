import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPunchListItem {
  id: string;
  description: string;
  severity?: string;
  location?: string;
  photos?: Types.ObjectId[];
  assignedTo?: Types.ObjectId;
  status?: string;
  createdAt?: Date;
  resolvedAt?: Date;
}

export interface IPunchList extends Document {
  projectId: Types.ObjectId;
  createdBy: Types.ObjectId;
  items: IPunchListItem[];
  createdAt: Date;
  updatedAt: Date;
}

const PunchListItemSchema: Schema<IPunchListItem> = new Schema(
  {
    description: { type: String, required: true },
    severity: { type: String, enum: ['MINOR','MAJOR','CRITICAL'], default: 'MINOR' },
    location: { type: String },
    photos: [{ type: Schema.Types.ObjectId, ref: 'DesignFile' }],
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['OPEN','FIXED','VERIFIED'], default: 'OPEN' },
    resolvedAt: { type: Date },
  },
  { _id: true }
);

const PunchListSchema: Schema<IPunchList> = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [PunchListItemSchema], default: [] },
  },
  { timestamps: true }
);

PunchListSchema.index({ projectId: 1, 'items.status': 1 });

export const PunchList: Model<IPunchList> = mongoose.models.PunchList as any || mongoose.model<IPunchList>('PunchList', PunchListSchema);

export default PunchList;
