import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { GSTReturnFiling } from "@shared/gst";

export interface IGSTReturnFilingDocument extends Omit<GSTReturnFiling, "id">, MongooseDocument {}

const GSTReturnFilingSchema = new Schema<IGSTReturnFilingDocument>(
  {
    clientId: {
      type: String,
      required: true,
      index: true,
    },
    month: {
      type: String,
      required: true,
      index: true,
    },
    financialYear: {
      type: String,
      required: true,
      index: true,
    },
    gstr1Filed: {
      type: Boolean,
      default: false,
      required: true,
    },
    gstr1FiledDate: {
      type: String,
    },
    gstr1ARN: {
      type: String,
    },
    gstr1DueDate: {
      type: String,
    },
    gstr3bFiled: {
      type: Boolean,
      default: false,
      required: true,
    },
    gstr3bFiledDate: {
      type: String,
    },
    gstr3bARN: {
      type: String,
    },
    gstr3bDueDate: {
      type: String,
    },
    taxPaid: {
      type: Number,
      default: 0,
      required: true,
    },
    lateFee: {
      type: Number,
      default: 0,
      required: true,
    },
    lateFeeCalculated: {
      type: Boolean,
      default: false,
      required: true,
    },
    interest: {
      type: Number,
      default: 0,
      required: true,
    },
    interestCalculated: {
      type: Boolean,
      default: false,
      required: true,
    },
    filingStatus: {
      type: String,
      enum: ["pending", "filed", "late", "overdue"],
      default: "pending",
      required: true,
      index: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
      required: true,
    },
    lockedAt: {
      type: String,
    },
    lockedBy: {
      type: String,
    },
    returnDocuments: {
      type: [String],
      default: [],
    },
    challanDocuments: {
      type: [String],
      default: [],
    },
    workingSheets: {
      type: [String],
      default: [],
    },
    updatedBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        ret.createdAt = ret.createdAt.toISOString();
        ret.updatedAt = ret.updatedAt.toISOString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Create compound indexes for better query performance
GSTReturnFilingSchema.index({ clientId: 1, month: 1 }, { unique: true });
GSTReturnFilingSchema.index({ clientId: 1, financialYear: 1 });
GSTReturnFilingSchema.index({ filingStatus: 1 });
GSTReturnFilingSchema.index({ month: 1 });

export const GSTReturnFilingModel = mongoose.model<IGSTReturnFilingDocument>(
  "GSTReturnFiling",
  GSTReturnFilingSchema
);
