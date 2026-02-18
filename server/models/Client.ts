import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { Client } from "@shared/client";

export interface IClientDocument extends Omit<Client, "id">, MongooseDocument {}

const ClientSchema = new Schema<IClientDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    clientType: {
      type: String,
      enum: ["individual", "proprietorship", "partnership", "llp", "company", "trust"],
      required: true,
      index: true,
    },
    // KYC Information
    panNumber: {
      type: String,
      uppercase: true,
      trim: true,
      sparse: true,
      index: true,
    },
    aadhaarNumber: {
      type: String,
      trim: true,
      sparse: true,
    },
    gstin: {
      type: String,
      uppercase: true,
      trim: true,
      sparse: true,
      index: true,
    },
    // Contact Information
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },
    // Address
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    // Business Information
    businessName: {
      type: String,
      trim: true,
    },
    incorporationDate: {
      type: String,
    },
    cin: {
      type: String,
      uppercase: true,
      trim: true,
      sparse: true,
    },
    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
      required: true,
      index: true,
    },
    kycStatus: {
      type: String,
      enum: ["pending", "verified", "rejected", "expired"],
      default: "pending",
      required: true,
      index: true,
    },
    // Metadata
    createdBy: {
      type: String,
      required: true,
    },
    lastModifiedBy: {
      type: String,
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

// Compound indexes for common queries
ClientSchema.index({ userId: 1, status: 1 });
ClientSchema.index({ userId: 1, createdAt: -1 });
ClientSchema.index({ email: 1, status: 1 });
ClientSchema.index({ kycStatus: 1, status: 1 });

// Unique constraint on PAN within active clients
ClientSchema.index(
  { panNumber: 1 },
  { 
    unique: true, 
    partialFilterExpression: { 
      panNumber: { $exists: true, $ne: null },
      status: "active" 
    } 
  }
);

export const ClientModel = mongoose.model<IClientDocument>(
  "Client",
  ClientSchema,
);
