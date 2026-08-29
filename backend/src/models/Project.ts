import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ProjectStatusType =
  | 'PROJECT_POSTED'
  | 'PENDING_INSPECTION'
  | 'PROJECT_PUBLISHED'
  | 'BIDDING_OPEN'
  | 'INSPECTION_SCHEDULED'
  | 'INSPECTION_COMPLETED'
  | 'INSPECTION_REJECTED'
  | 'DESIGN_CREATION'
  | 'DESIGN_REVIEW'
  | 'DESIGN_SUBMITTED'
  | 'CLIENT_REVIEW'
  | 'DESIGN_APPROVED'
  | 'CLIENT_COMPARISON'
  | 'CONTRACTOR_SELECTED'
  | 'CONTRACTOR_CONFIRMED'
  | 'WORK_STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETION_VERIFICATION'
  | 'READY_FOR_HANDOVER'
  | 'PROJECT_COMPLETED'
  | 'REVIEW_SUBMITTED'
  | 'CANCELLED';

export type QuotationStatusType =
  | "NOT_OPEN"
  | "OPEN"
  | "CLOSED"
  | "NO_BIDS_RECEIVED";

export interface IProject extends Document {
  clientId: Types.ObjectId;
  contractorId?: Types.ObjectId;
  selectedContractor?: Types.ObjectId;
  selectedQuotation?: Types.ObjectId;
  assignedInspectorId?: Types.ObjectId;
  title: string;
  category?: string;
  description?: string;
  propertyType?: string;
  squareFeet?: number;
  budget?: number;
  address?: string;
  city?: string;
  status: ProjectStatusType;

  /** One-time BOQ unlock payment; covers every future BOQ revision. */
  boqUnlocked?: boolean;
  boqUnlockedAt?: Date;
  files?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  inspectionPhotos?: string[];
  inspectionReportPdf?: string;
  inspectionNotes?: string;
  inspectionRejectedReason?: string;
  selectedDesignId?: Types.ObjectId;
  selectedBoqId?: Types.ObjectId;
  contractorConfirmed?: boolean;
  contractorConfirmedAt?: Date;
  inspectionCompletedAt?: Date;
  contractorSiteVisited?: boolean;
contractorSiteVisitedAt?: Date;

  approvedDesignId?: Types.ObjectId;

  clientApproved?: boolean;
  inspectorApproved?: boolean;
  contractorAccepted?: boolean;

  quotationStatus?: QuotationStatusType;

quotationDeadline?: Date;

biddingOpenedAt?: Date;

quotationClosedAt?: Date;

  clientApprovedAt?: Date;
  inspectorApprovedAt?: Date;
  contractorAcceptedAt?: Date;
}

const ProjectSchema: Schema<IProject> = new Schema(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    contractorId: { type: Schema.Types.ObjectId, ref: 'Contractor', index: true },
    selectedContractor: { type: Schema.Types.ObjectId, ref: 'Contractor', default: null, index: true },
    selectedQuotation: { type: Schema.Types.ObjectId, ref: 'Quotation', default: null, index: true },
    assignedInspectorId: { type: Schema.Types.ObjectId, ref: 'InspectionTeam', index: true },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    category: {
  type: String,
  trim: true,
  maxlength: 100,
  index: true,
},
    description: { type: String, trim: true, maxlength: 2000 },
    propertyType: { type: String, trim: true, maxlength: 100 },
    squareFeet: { type: Number },
    budget: { type: Number },
    address: { type: String, trim: true, maxlength: 1000 },
    city: {
  type: String,
  trim: true,
  maxlength: 100,
  index: true,
},
    status: {
  type: String,
  enum: [
  'PROJECT_POSTED',
  'PENDING_INSPECTION',
  'PROJECT_PUBLISHED',
  'BIDDING_OPEN',
  'INSPECTION_SCHEDULED',
  'INSPECTION_COMPLETED',
  'INSPECTION_REJECTED',
  'DESIGN_CREATION',
  'DESIGN_REVIEW',
  'DESIGN_SUBMITTED',
  'CLIENT_REVIEW',
  'DESIGN_APPROVED',
  'CLIENT_COMPARISON',
  'CONTRACTOR_SELECTED',
  'CONTRACTOR_CONFIRMED',
  'WORK_STARTED',
  'IN_PROGRESS',
  'COMPLETION_VERIFICATION',
  'READY_FOR_HANDOVER',
  'PROJECT_COMPLETED',
  'REVIEW_SUBMITTED',
  'CANCELLED'
],
  default: 'PENDING_INSPECTION'
},

boqUnlocked: {
  type: Boolean,
  default: false,
},

boqUnlockedAt: {
  type: Date,
},

inspectionPhotos: {
  type: [String],
  default: []
},

inspectionReportPdf: {
  type: String,
  default: ""
},

inspectionNotes: {
  type: String,
  default: ""
},

files: [
  {
    type: Schema.Types.ObjectId,
    ref: "ProjectFile"
  }
],
  
selectedDesignId: {
  type: Schema.Types.ObjectId,
  ref: "DesignFile",
  default: null,
},

selectedBoqId: {
  type: Schema.Types.ObjectId,
  ref: "ProjectFile",
  default: null,
},

approvedDesignId: {
  type: Schema.Types.ObjectId,
  ref: "DesignFile",
  default: null,
},

clientApproved: {
  type: Boolean,
  default: false,
},

inspectorApproved: {
  type: Boolean,
  default: false,
},

inspectionRejectedReason: {
    type: String,
    default: ""
},

contractorAccepted: {
  type: Boolean,
  default: false,
},

contractorConfirmed: {
  type: Boolean,
  default: false,
},

clientApprovedAt: {
  type: Date,
  default: null,
},

inspectorApprovedAt: {
  type: Date,
  default: null,
},

contractorAcceptedAt: {
  type: Date,
  default: null,
},

contractorConfirmedAt: {
  type: Date,
  default: null,
},

inspectionCompletedAt: {
  type: Date,
  default: null,
},
quotationStatus: {
  type: String,
  enum: [
    "NOT_OPEN",
    "OPEN",
    "CLOSED",
    "NO_BIDS_RECEIVED",
  ],
  default: "NOT_OPEN",
},

quotationDeadline: {
  type: Date,
  default: null,
},

biddingOpenedAt: {
  type: Date,
  default: null,
},

quotationClosedAt: {
  type: Date,
  default: null,
},

contractorSiteVisited: {
  type: Boolean,
  default: false,
},

contractorSiteVisitedAt: {
  type: Date,
  default: null,
},

  },
  { timestamps: true }
);

// indexes for querying by status, category, city and createdAt
ProjectSchema.index({ status: 1, category: 1, city: 1, createdAt: -1 });

ProjectSchema.index({
    quotationStatus: 1,
    quotationDeadline: 1,
});

export const Project: Model<IProject> = mongoose.models.Project as any || mongoose.model<IProject>('Project', ProjectSchema);
