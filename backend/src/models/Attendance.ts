import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAttendance extends Document {
  projectId: Types.ObjectId;
  contractorId: Types.ObjectId;
  clientId: Types.ObjectId;

  attendanceDate: Date;
  checkInTime: Date;
  checkOutTime?: Date;

  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
  markedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
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

    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },

    attendanceDate: {
      type: Date,
      required: true,
      index: true,
    },

    checkInTime: {
      type: Date,
      required: true,
    },

    checkOutTime: {
      type: Date,
      required: false,
    },

    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"],
      default: "PRESENT",
    },

    markedBy: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance>("Attendance", AttendanceSchema);