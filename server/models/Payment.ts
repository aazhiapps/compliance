import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { PaymentRecord } from "@shared/api";

export interface IPaymentDocument
  extends Omit<PaymentRecord, "id">, MongooseDocument {}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    applicationId: {
      type: String,
      required: true,
    },
    applicantName: {
      type: String,
      required: true,
    },
    applicantEmail: {
      type: String,
      required: true,
    },
    service: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      required: true,
    },
    method: {
      type: String,
      enum: ["razorpay", "bank_transfer", "cash", "cheque", "manual"],
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    // PHASE 1: Payment Security Enhancement
    signatureVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    reconciliationStatus: {
      type: String,
      enum: ["pending", "reconciled", "disputed", "failed"],
      default: "pending",
      index: true,
    },
    reconciledAt: { type: Date },
    reconciledBy: { type: String },
    retryCount: {
      type: Number,
      default: 0,
    },
    nextRetryAt: { type: Date },
    failureReason: { type: String },
    reversalId: { type: String }, // For refunds
    statementReference: { type: String }, // Bank reconciliation
    webhookReceived: {
      type: Boolean,
      default: false,
    },
    webhookVerified: {
      type: Boolean,
      default: false,
    },
    webhookPayload: { type: Schema.Types.Mixed },
    // Manual override protection (PHASE 1)
    canManuallyOverride: {
      type: Boolean,
      default: false,
    },
    manualOverrideApprovedBy: { type: String },
    manualOverrideReason: { type: String },
    date: {
      type: String,
      required: true,
    },
    notes: { type: String },
    recordedBy: { type: String },
    recordedAt: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: any) {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
  },
);

// Create indexes for better query performance
PaymentSchema.index({ applicationId: 1 });
PaymentSchema.index({ applicantEmail: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ date: -1 });
PaymentSchema.index({ reconciliationStatus: 1 }); // PHASE 1
PaymentSchema.index({ signatureVerified: 1, status: 1 }); // PHASE 1

export const PaymentModel = mongoose.model<IPaymentDocument>(
  "Payment",
  PaymentSchema,
);
