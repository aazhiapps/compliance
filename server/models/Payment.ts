import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { PaymentRecord } from "@shared/api";

export interface IPaymentDocument extends Omit<PaymentRecord, "id">, MongooseDocument {}

const PaymentSchema = new Schema<IPaymentDocument>(
  {
    applicationId: {
      type: String,
      required: true,
      index: true,
    },
    applicantName: {
      type: String,
      required: true,
    },
    applicantEmail: {
      type: String,
      required: true,
      index: true,
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
      index: true,
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
      index: true,
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
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
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        return ret;
      },
    },
  }
);

// Create indexes for better query performance
PaymentSchema.index({ applicationId: 1 });
PaymentSchema.index({ applicantEmail: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ date: -1 });

export const PaymentModel = mongoose.model<IPaymentDocument>(
  "Payment",
  PaymentSchema
);
