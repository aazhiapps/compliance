import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { Application, Document } from "@shared/auth";

export interface IApplicationDocument
  extends Omit<Application, "id">, MongooseDocument {}

const DocumentSchema = new Schema<Document>(
  {
    id: { type: String, required: true },
    applicationId: { type: String, required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number },
    status: {
      type: String,
      enum: ["uploaded", "verifying", "approved", "rejected"],
      default: "uploaded",
      required: true,
    },
    uploadedAt: { type: String, required: true },
    remarks: { type: String },
  },
  { _id: false },
);

const ApplicationSchema = new Schema<IApplicationDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    serviceId: {
      type: Number,
      required: true,
      index: true,
    },
    serviceName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "under_review", "approved", "rejected"],
      default: "draft",
      required: true,
      index: true,
    },
    documents: {
      type: [DocumentSchema],
      default: [],
    },
    assignedStaff: {
      type: String,
      index: true,
    },
    assignedStaffName: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
      required: true,
      index: true,
    },
    paymentAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    eta: {
      type: String,
      required: true,
    },
    internalNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: any) {
        ret.id = ret._id?.toString();
        if (ret.createdAt && typeof ret.createdAt !== 'string') {
          ret.createdAt = ret.createdAt.toISOString();
        }
        if (ret.updatedAt && typeof ret.updatedAt !== 'string') {
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
ApplicationSchema.index({ userId: 1, createdAt: -1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ assignedStaff: 1 });
ApplicationSchema.index({ paymentStatus: 1 });

export const ApplicationModel = mongoose.model<IApplicationDocument>(
  "Application",
  ApplicationSchema,
);
