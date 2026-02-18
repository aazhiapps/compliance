import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { AuditLog } from "@shared/audit";

export interface IAuditLogDocument
  extends Omit<AuditLog, "id">, MongooseDocument {}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    entityType: {
      type: String,
      enum: [
        "user",
        "client",
        "application",
        "document",
        "payment",
        "service",
        "gst_client",
        "gst_filing",
        "invoice_purchase",
        "invoice_sales",
        "report",
        "compliance_event", // PHASE 1
        "role_permission", // PHASE 1
        "state_transition", // PHASE 1
      ],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        "create",
        "update",
        "delete",
        "status_change",
        "upload",
        "download",
        "verify",
        "approve",
        "reject",
        "assign",
        "unassign",
        "payment_recorded",
        "payment_refunded",
      ],
      required: true,
      index: true,
    },
    changes: {
      type: Schema.Types.Mixed,
      required: true,
    },
    performedBy: {
      type: String,
      required: true,
      index: true,
    },
    performedByName: {
      type: String,
    },
    performedAt: {
      type: String,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    // PHASE 1: Compliance Impact Tracking
    complianceImpact: {
      type: String,
      enum: ["none", "info", "warning", "critical"],
      default: "none",
      index: true,
    },
    requiresApproval: {
      type: Boolean,
      default: false,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "not_required"],
      default: "not_required",
      index: true,
    },
    approvedBy: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    changeReason: {
      type: String,
    },
  },
  {
    timestamps: false, // We use performedAt instead
    toJSON: {
      transform: function (_doc, ret: any) {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Compound indexes for common queries
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, performedAt: -1 });
AuditLogSchema.index({ performedBy: 1, performedAt: -1 });
AuditLogSchema.index({ performedAt: -1 });
AuditLogSchema.index({ action: 1, performedAt: -1 });

// TTL index to automatically delete old audit logs after 2 years (optional)
// AuditLogSchema.index({ performedAt: 1 }, { expireAfterSeconds: 63072000 });

export const AuditLogModel = mongoose.model<IAuditLogDocument>(
  "AuditLog",
  AuditLogSchema,
);
