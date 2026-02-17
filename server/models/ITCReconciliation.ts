import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

/**
 * ITCReconciliation tracks claimed vs available ITC and detects mismatches
 * Essential for GST compliance and filing accuracy
 */

export interface ITCReconciliationRecord extends MongooseDocument {
  id: string;
  clientId: mongoose.Types.ObjectId;
  month: string; // "2024-02"
  financialYear: string; // "2023-24"
  // Claimed ITC (from your purchase invoices)
  claimedITC: number;
  claimedInvoiceCount: number;
  claimedBreakdown?: {
    sgst: number;
    cgst: number;
    igst: number;
  };
  // Available ITC from GST Portal (GSTR-2A/2B)
  availableITCFromGST?: number;
  pendingITC?: number; // Awaiting acceptance
  rejectedITC?: number; // Rejected by GST office
  // Discrepancy analysis
  discrepancy: number; // Claimed - Available
  discrepancyPercentage: number; // (Discrepancy / Available) * 100
  discrepancyReason?:
    | "excess_claimed"
    | "unclaimed"
    | "gst_rejected"
    | "pending_acceptance"
    | "reconciled"
    | "awaiting_gstr2b";
  discrepancyDescription?: string;
  // Resolution
  resolution?: string; // Notes on how discrepancy was resolved
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  // Automatic flags
  hasDiscrepancy: boolean;
  needsReview: boolean;
  // Audit
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  syncedBy?: mongoose.Types.ObjectId;
}

const ITCReconciliationSchema = new Schema<ITCReconciliationRecord>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "GSTClient",
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
    },
    claimedITC: {
      type: Number,
      required: true,
      default: 0,
    },
    claimedInvoiceCount: {
      type: Number,
      default: 0,
    },
    claimedBreakdown: {
      sgst: { type: Number, default: 0 },
      cgst: { type: Number, default: 0 },
      igst: { type: Number, default: 0 },
    },
    availableITCFromGST: {
      type: Number,
      sparse: true,
    },
    pendingITC: {
      type: Number,
      default: 0,
    },
    rejectedITC: {
      type: Number,
      default: 0,
    },
    discrepancy: {
      type: Number,
      default: 0,
    },
    discrepancyPercentage: {
      type: Number,
      default: 0,
    },
    discrepancyReason: {
      type: String,
      enum: [
        "excess_claimed",
        "unclaimed",
        "gst_rejected",
        "pending_acceptance",
        "reconciled",
        "awaiting_gstr2b",
      ],
      sparse: true,
    },
    discrepancyDescription: String,
    resolution: String,
    resolvedAt: Date,
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    hasDiscrepancy: {
      type: Boolean,
      default: false,
      index: true,
    },
    needsReview: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastSyncedAt: Date,
    syncedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// Unique constraint on clientId + month to ensure one record per client-month
ITCReconciliationSchema.index({ clientId: 1, month: 1 }, { unique: true });

// Additional indexes for filtering and sorting
ITCReconciliationSchema.index({ hasDiscrepancy: 1, createdAt: -1 });
ITCReconciliationSchema.index({ needsReview: 1, createdAt: -1 });
ITCReconciliationSchema.index({ clientId: 1, financialYear: 1 });

// Convert to plain object with id field
ITCReconciliationSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ITCReconciliationModel =
  mongoose.models.ITCReconciliation ||
  mongoose.model<ITCReconciliationRecord>(
    "ITCReconciliation",
    ITCReconciliationSchema,
  );

export default ITCReconciliationModel;
