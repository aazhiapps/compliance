import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { SalesInvoice } from "@shared/gst";

export interface ISalesInvoiceDocument
  extends Omit<SalesInvoice, "id">, MongooseDocument {}

const SalesInvoiceSchema = new Schema<ISalesInvoiceDocument>(
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
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerGSTIN: {
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
SalesInvoiceSchema.index({ clientId: 1, month: 1 });
SalesInvoiceSchema.index({ month: 1 });
SalesInvoiceSchema.index({ financialYear: 1 });
SalesInvoiceSchema.index({ invoiceDate: -1 });

export const SalesInvoiceModel = mongoose.model<ISalesInvoiceDocument>(
  "SalesInvoice",
  SalesInvoiceSchema,
);
