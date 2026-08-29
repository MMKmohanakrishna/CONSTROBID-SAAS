import mongoose, { Schema, Document } from 'mongoose';

export interface IContractor extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  companyName: string;
  phone: string;
  experience: number;
  serviceCategories: string[];
  serviceCities: string[];
  aadhaar: string;
  pan: string;
  gst?: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'BLOCKED';

blockedReason?: string;
blockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ContractorSchema = new Schema<IContractor>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  companyName: {
    type: String,
    default: 'Individual Contractor'
  },

  phone: {
    type: String,
    default: ''
  },

  experience: {
    type: Number,
    default: 0
  },

  serviceCategories: {
    type: [String],
    default: []
  },

  serviceCities: {
    type: [String],
    default: []
  },

  aadhaar: {
    type: String,
    default: ''
  },

  pan: {
    type: String,
    default: ''
  },

  gst: {
    type: String,
    default: ''
  },

  status: {
    type: String,
    enum: [
      'PENDING_VERIFICATION',
      'VERIFIED',
      'REJECTED',
      'BLOCKED'
    ],
    default: 'PENDING_VERIFICATION'
  },
  
  blockedReason: {
  type: String,
  default: ""
},

blockedAt: {
  type: Date,
  default: null
},
}, {
  timestamps: true
});

ContractorSchema.index({ serviceCities: 1 });

export const Contractor =
  mongoose.models.Contractor ||
  mongoose.model<IContractor>('Contractor', ContractorSchema);