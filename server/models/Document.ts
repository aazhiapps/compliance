import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

/**
 * Document represents files with versioning, metadata extraction, and S3 storage
 * Replaces embedded documents in invoices and applications
 */

export interface DocumentVersion {
  versionNum: number;
  uploadedAt: Date;
  uploadedBy: mongoose.Types.ObjectId;
  changes: string; // Description of what changed
  fileSize: number;
  s3Path: string;
}

export interface DocumentMetadata {
  invoiceNumber?: string;
  invoiceDate?: Date;
  vendorName?: string;
  vendorGSTIN?: string;
  customername?: string;
  customerGSTIN?: string;
  amount?: number;
  taxableValue?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  extractedAt?: Date;
  [key: string]: any; // Allow custom metadata fields
}

export interface DocumentRecord extends MongooseDocument {
  id: string;
  documentId: string; // UUID
  clientId?: mongoose.Types.ObjectId; // For GST documents
  userId?: mongoose.Types.ObjectId; // For application documents
  linkedEntityType:
    | "invoice_purchase"
    | "invoice_sales"
    | "filing"
    | "application"
    | "report";
  linkedEntityId: mongoose.Types.ObjectId;
  documentType:
    | "invoice"
    | "challan"
    | "certificate"
    | "gstr"
    | "report"
    | "other";
  fileName: string;
  fileUrl: string; // S3 path
  mimeType: string;
  fileSize: number; // In bytes
  // Metadata extracted from document (OCR/parsing)
  metadata?: DocumentMetadata;
  // Version history
  version: number; // Current version
  versionHistory?: DocumentVersion[];
  // Tagging and searchability
  tags?: string[];
  description?: string;
  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

const DocumentSchema = new Schema<DocumentRecord>(
  {
    documentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "GSTClient",
      sparse: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
    },
    linkedEntityType: {
      type: String,
      enum: [
        "invoice_purchase",
        "invoice_sales",
        "filing",
        "application",
        "report",
      ],
      required: true,
      index: true,
    },
    linkedEntityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ["invoice", "challan", "certificate", "gstr", "report", "other"],
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      default: "application/octet-stream",
    },
    fileSize: {
      type: Number,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    version: {
      type: Number,
      default: 1,
    },
    versionHistory: [
      {
        versionNum: Number,
        uploadedAt: Date,
        uploadedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        changes: String,
        fileSize: Number,
        s3Path: String,
      },
    ],
    tags: [String],
    description: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// Indexes for common queries
DocumentSchema.index({ clientId: 1, documentType: 1 });
DocumentSchema.index({ linkedEntityType: 1, linkedEntityId: 1 });
DocumentSchema.index({ tags: 1 }); // For search
DocumentSchema.index({ createdAt: -1 });
DocumentSchema.index({ userId: 1, createdAt: -1 });

// Convert to plain object with id field
DocumentSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const DocumentModel =
  mongoose.models.Document ||
  mongoose.model<DocumentRecord>("Document", DocumentSchema);

export default DocumentModel;
