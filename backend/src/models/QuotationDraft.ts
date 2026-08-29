import mongoose, { Schema, Document } from "mongoose";

export interface IQuotationDraft extends Document {
  projectId: mongoose.Types.ObjectId;
  contractorId: mongoose.Types.ObjectId;

  labourCost: number;
  electricalCost: number;
  plumbingCost: number;
  falseCeilingCost: number;
  paintingCost: number;

  materials: any[];
  extraCharges: any[];

  grandTotal: number;

  quotationExcel?: string;

  quotationPdf?: string;

  updatedAt: Date;
}

const QuotationDraftSchema = new Schema(
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

    labourCost: {
      type: Number,
      default: 0,
    },

    electricalCost: {
      type: Number,
      default: 0,
    },

    plumbingCost: {
      type: Number,
      default: 0,
    },

    falseCeilingCost: {
      type: Number,
      default: 0,
    },

    paintingCost: {
      type: Number,
      default: 0,
    },

    materials: {
      type: Array,
      default: [],
    },

    extraCharges: {
      type: Array,
      default: [],
    },

    grandTotal: {
      type: Number,
      default: 0,
    },

    quotationExcel: {
      type: String,
      default: "",
    },

    quotationPdf: {
  type: String,
  default: "",
},
  },
  {
    timestamps: true,
  }
);

QuotationDraftSchema.index(
  {
    projectId: 1,
    contractorId: 1,
  },
  {
    unique: true,
  }
);

export const QuotationDraft =
  mongoose.models.QuotationDraft ||
  mongoose.model("QuotationDraft", QuotationDraftSchema);