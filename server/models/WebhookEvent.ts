import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { ObjectId } from "mongodb";
import { WebhookEventType } from "./WebhookEndpoint";

/**
 * WebhookEvent tracks all events that need to be delivered to webhook endpoints
 * Each event is processed asynchronously for delivery to registered endpoints
 */

export interface WebhookEventRecord extends MongooseDocument {
  id: string;
  clientId: ObjectId;
  eventType: WebhookEventType;
  status: "pending" | "processing" | "delivered" | "failed";
  // Event data
  entityType:
    | "filing"
    | "document"
    | "invoice"
    | "itc_reconciliation"
    | "payment"
    | "client";
  entityId: ObjectId;
  data: Record<string, any>;
  // Metadata about the event
  source:
    | "filing_service"
    | "itc_service"
    | "document_service"
    | "notification_service"
    | "manual";
  correlationId: string; // For tracing related events
  // Delivery tracking
  attemptCount: number;
  lastAttemptAt?: Date;
  processedAt?: Date;
  failureReason?: string;
  // Retention
  expiresAt?: Date; // TTL for old events
  createdAt: Date;
  updatedAt: Date;
}

const WebhookEventSchema = new Schema<WebhookEventRecord>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "GSTClient",
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        "filing.created",
        "filing.status_changed",
        "filing.locked",
        "filing.amended",
        "document.uploaded",
        "document.processed",
        "document.rejected",
        "itc.reconciliation_completed",
        "itc.discrepancy_detected",
        "payment.received",
        "payment.failed",
        "compliance.alert",
        "*",
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "delivered", "failed"],
      default: "pending",
      index: true,
    },
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
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    source: {
      type: String,
      enum: [
        "filing_service",
        "itc_service",
        "document_service",
        "notification_service",
        "manual",
      ],
      default: "filing_service",
    },
    correlationId: {
      type: String,
      required: true,
      index: true,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    lastAttemptAt: Date,
    processedAt: Date,
    failureReason: String,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  },
  { timestamps: true },
);

// Indexes for common queries
WebhookEventSchema.index({ clientId: 1, status: 1, createdAt: -1 });
WebhookEventSchema.index({ status: 1, lastAttemptAt: 1 }); // For retry processing
WebhookEventSchema.index({ correlationId: 1 });
WebhookEventSchema.index({ eventType: 1, clientId: 1 });
WebhookEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Convert to plain object with id field
WebhookEventSchema.set("toJSON", {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const WebhookEventModel =
  mongoose.models.WebhookEvent ||
  mongoose.model<WebhookEventRecord>("WebhookEvent", WebhookEventSchema);

export default WebhookEventModel;
