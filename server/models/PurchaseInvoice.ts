import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { PurchaseInvoice } from "@shared/gst";

export interface IPurchaseInvoiceDocument
  extends Omit<PurchaseInvoice, "id">, MongooseDocument {}

const PurchaseInvoiceSchema = new Schema<IPurchaseInvoiceDocument>(
  {
    clientId: {
      type: String,
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    vendorName: {
      type: String,
      required: true,
      trim: true,
    },
    vendorGSTIN: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    invoiceDate: {
      type: String,
      required: true,
    },
    taxableAmount: {
      type: Number,
      required: true,
    },
    cgst: {
      type: Number,
      required: true,
      default: 0,
    },
    sgst: {
      type: Number,
      required: true,
      default: 0,
    },
    igst: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    documents: {
      type: [String],
      default: [],
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
    createdBy: {
      type: String,
      required: true,
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
PurchaseInvoiceSchema.index({ clientId: 1, month: 1 });
PurchaseInvoiceSchema.index({ month: 1 });
PurchaseInvoiceSchema.index({ financialYear: 1 });
PurchaseInvoiceSchema.index({ invoiceDate: -1 });

export const PurchaseInvoiceModel = mongoose.model<IPurchaseInvoiceDocument>(
  "PurchaseInvoice",
  PurchaseInvoiceSchema,
);
