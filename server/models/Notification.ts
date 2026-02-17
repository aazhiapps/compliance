import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { ObjectId } from "mongodb";

/**
 * Notification tracks all system notifications to users
 * Supports in-app, email, and SMS notifications
 */

export interface NotificationRecord extends MongooseDocument {
  id: string;
  userId: ObjectId;
  clientId?: ObjectId;
  type:
    | "itc_discrepancy_detected"
    | "itc_sync_completed"
    | "filing_due"
    | "filing_status_changed"
    | "document_uploaded"
    | "document_rejected"
    | "payment_received"
    | "payment_failed"
    | "system_alert"
    | "custom";
  title: string;
  message: string;
  description?: string;
  // Notification routing
  channels: Array<"in_app" | "email" | "sms">;
  // Related entity
  entityType?:
    | "filing"
    | "document"
    | "invoice"
    | "itc_reconciliation"
    | "payment"
    | "client";
  entityId?: ObjectId;
  // Status
  status: "pending" | "sent" | "failed" | "read";
  readAt?: Date;
  sentAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  // Email tracking
  emailDelivered?: boolean;
  emailOpenedAt?: Date;
  // Retry
  retryCount: number;
  nextRetryAt?: Date;
  // Priority
  priority: "low" | "normal" | "high" | "critical";
  // Metadata
  metadata?: Record<string, any>;
  actionUrl?: string;
  actionText?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<NotificationRecord>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "GSTClient",
      sparse: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "itc_discrepancy_detected",
        "itc_sync_completed",
        "filing_due",
        "filing_status_changed",
        "document_uploaded",
        "document_rejected",
        "payment_received",
        "payment_failed",
        "system_alert",
        "custom",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    description: String,
    channels: [
      {
        type: String,
        enum: ["in_app", "email", "sms"],
      },
    ],
    entityType: {
      type: String,
      enum: [
        "filing",
        "document",
        "invoice",
        "itc_reconciliation",
        "payment",
        "client",
      ],
      sparse: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      sparse: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "read"],
      default: "pending",
      index: true,
    },
    readAt: Date,
    sentAt: Date,
    failedAt: Date,
    failureReason: String,
    emailDelivered: {
      type: Boolean,
      default: false,
    },
    emailOpenedAt: Date,
    retryCount: {
      type: Number,
      default: 0,
    },
    nextRetryAt: Date,
    priority: {
      type: String,
      enum: ["low", "normal", "high", "critical"],
      default: "normal",
      index: true,
    },
    metadata: Schema.Types.Mixed,
    actionUrl: String,
    actionText: String,
  },
  { timestamps: true },
);

// Indexes for common queries
NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, readAt: 1 });
NotificationSchema.index({ status: 1, nextRetryAt: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ type: 1, userId: 1 });

// Convert to plain object with id field
NotificationSchema.set("toJSON", {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model<NotificationRecord>("Notification", NotificationSchema);

export default NotificationModel;
