import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { StaffAssignment } from "@shared/gst";

export interface IStaffAssignmentDocument
  extends Omit<StaffAssignment, "id">, MongooseDocument {}

const StaffAssignmentSchema = new Schema<IStaffAssignmentDocument>(
  {
    staffUserId: {
      type: String,
      required: true,
      unique: true,
    },
    staffName: {
      type: String,
      required: true,
      trim: true,
    },
    clientIds: {
      type: [String],
      default: [],
    },
    assignedAt: {
      type: String,
      required: true,
    },
    assignedBy: {
      type: String,
      required: true,
    },
    permissions: {
      type: [String],
      enum: ["view", "edit", "file", "upload"],
      default: ["view"],
      required: true,
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform: function (_doc, ret: any) {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const StaffAssignmentModel = mongoose.model<IStaffAssignmentDocument>(
  "StaffAssignment",
  StaffAssignmentSchema,
);
