import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

export interface IQuotationItem {
  description: string;
  quantity?: number;
  unit?: string;
  rate?: number;
}

export interface IQuotation extends Document {
  projectId: Types.ObjectId;
  contractorId: Types.ObjectId;

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

  // The quotation the inspection team prepares from the contractor's figures.
  // This is what the client is shown — the contractor's own files stay internal.
  constrobidQuotation?: string;

  constrobidQuotationName?: string;

  items?: IQuotationItem[];

  cost: number;

  message?: string;

  timelineDays?: number;

  validityDays?: number;

  selected: boolean;

  isVerified: boolean;

  rejected: boolean;

  // Inspector sent the quotation back and wants the contractor to quote again.
  requoteRequested: boolean;

  // Contractor has since submitted revised figures. Stays true afterwards so
  // the inspector can tell a re-quoted quotation from a first submission.
  requoted: boolean;

  // The contractor was selected by the client but declined the job before
  // confirming — distinct from `rejected`, which is the inspector rejecting
  // the quotation itself.
  contractorDeclined: boolean;
  contractorDeclineReason?: string;
  contractorDeclinedAt?: Date;

  inspectorRemarks?: string;

  createdAt: Date;

  updatedAt: Date;
}

const QuotationSchema = new Schema<IQuotation>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    contractorId: {
      type: Schema.Types.ObjectId,
      ref: "Contractor",
      required: true,
      index: true,
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
      type: [],
      default: [],
    },

    extraCharges: {
      type: [],
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

    constrobidQuotation: {
      type: String,
      default: "",
    },

    constrobidQuotationName: {
      type: String,
      default: "",
    },

    items: [
      {
        description: {
          type: String,
          trim: true,
        },

        quantity: Number,

        unit: String,

        rate: Number,
      },
    ],

    cost: {
      type: Number,
      required: true,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    timelineDays: {
      type: Number,
    },

    validityDays: {
      type: Number,
      default: 7,
    },

    selected: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

rejected: {
  type: Boolean,
  default: false,
},

requoteRequested: {
  type: Boolean,
  default: false,
  index: true,
},

requoted: {
  type: Boolean,
  default: false,
},

contractorDeclined: {
  type: Boolean,
  default: false,
},
contractorDeclineReason: {
  type: String,
  default: "",
},
contractorDeclinedAt: {
  type: Date,
},

inspectorRemarks: {
  type: String,
  default: "",
},
},
{
  timestamps: true,
}
);

QuotationSchema.index(
  {
    projectId: 1,
    contractorId: 1,
  },
  {
    unique: true,
  }
);

export const Quotation: Model<IQuotation> =
  (mongoose.models.Quotation as Model<IQuotation>) ||
  mongoose.model<IQuotation>("Quotation", QuotationSchema);