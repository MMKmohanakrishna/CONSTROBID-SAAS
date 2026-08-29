import mongoose, { Schema, Document } from "mongoose";

export interface IVariationRequest extends Document {
  projectId: mongoose.Types.ObjectId;
  contractorId: mongoose.Types.ObjectId;

  title: string;
  reason: string;

  items: {
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    total: number;
  }[];

  requestedAmount: number;

  status:
    | "PENDING_INSPECTOR"
    | "PENDING_CLIENT"
    | "APPROVED"
    | "REJECTED";

  inspectorRemarks?: string;
  clientRemarks?: string;
}

const VariationRequestSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    contractorId: {
      type: Schema.Types.ObjectId,
      ref: "Contractor",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },

    items: [
      {
        description: String,
        quantity: Number,
        unit: String,
        unitPrice: Number,
        total: Number,
      },
    ],

    requestedAmount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      default: "PENDING_INSPECTOR",
    },

    inspectorRemarks: String,

    clientRemarks: String,
  },
  {
    timestamps: true,
  }
);

export const VariationRequest =
  mongoose.models.VariationRequest ||
  mongoose.model<IVariationRequest>(
    "VariationRequest",
    VariationRequestSchema
  );