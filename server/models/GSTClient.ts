import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { GSTClient } from "@shared/gst";

export interface IGSTClientDocument
  extends Omit<GSTClient, "id">, MongooseDocument {}

const GSTClientSchema = new Schema<IGSTClientDocument>(
  {
    userId: {
      type: String,
      required: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    gstin: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    filingFrequency: {
      type: String,
      enum: ["monthly", "quarterly", "annual"],
      required: true,
      index: true,
    },
    financialYearStart: {
      type: String,
      required: true,
    },
    panNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
    },
    deactivatedAt: {
      type: String,
    },
    assignedStaff: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: any) {
        ret.id = ret._id?.toString();
        if (ret.createdAt && typeof ret.createdAt !== "string") {
          ret.createdAt = ret.createdAt.toISOString();
        }
        if (ret.updatedAt && typeof ret.updatedAt !== "string") {
          ret.updatedAt = ret.updatedAt.toISOString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Create indexes for better query performance
GSTClientSchema.index({ userId: 1, status: 1 });
GSTClientSchema.index({ assignedStaff: 1 });

export const GSTClientModel = mongoose.model<IGSTClientDocument>(
  "GSTClient",
  GSTClientSchema,
);
