import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { ObjectId } from "mongodb";

/**
 * WebhookDelivery tracks individual delivery attempts for webhook events
 * Records HTTP response, status code, and timing information
 */

export interface WebhookDeliveryRecord extends MongooseDocument {
  id: string;
  webhookEventId: ObjectId;
  webhookEndpointId: ObjectId;
  clientId: ObjectId;
  // Attempt details
  attemptNumber: number;
  deliveryStatus: "success" | "failed" | "pending" | "timeout" | "invalid_url";
  // HTTP details
  httpStatusCode?: number;
  responseTime?: number; // milliseconds
  requestPayload: Record<string, any>;
  responsePayload?: Record<string, any>;
  // Error information
  errorMessage?: string;
  errorStack?: string;
  // Retry information
  nextRetryAt?: Date;
  willRetry: boolean;
  // Signature verification (for security)
  signatureAlgorithm: "hmac-sha256";
  signature: string;
  // Timing
  sentAt: Date;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookDeliverySchema = new Schema<WebhookDeliveryRecord>(
  {
    webhookEventId: {
      type: Schema.Types.ObjectId,
      ref: "WebhookEvent",
      required: true,
      index: true,
    },
    webhookEndpointId: {
      type: Schema.Types.ObjectId,
      ref: "WebhookEndpoint",
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "GSTClient",
      required: true,
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
    },
    deliveryStatus: {
      type: String,
      enum: ["success", "failed", "pending", "timeout", "invalid_url"],
      default: "pending",
      index: true,
    },
    httpStatusCode: Number,
    responseTime: Number,
    requestPayload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    responsePayload: Schema.Types.Mixed,
    errorMessage: String,
    errorStack: String,
    nextRetryAt: Date,
    willRetry: {
      type: Boolean,
      default: false,
    },
    signatureAlgorithm: {
      type: String,
      enum: ["hmac-sha256"],
      default: "hmac-sha256",
    },
    signature: {
      type: String,
      required: true,
    },
    sentAt: {
      type: Date,
      default: () => new Date(),
    },
    respondedAt: Date,
  },
  { timestamps: true }
);

// Indexes for common queries
WebhookDeliverySchema.index({ webhookEventId: 1, deliveryStatus: 1 });
WebhookDeliverySchema.index({ webhookEndpointId: 1, createdAt: -1 });
WebhookDeliverySchema.index({ clientId: 1, createdAt: -1 });
WebhookDeliverySchema.index({ deliveryStatus: 1, nextRetryAt: 1 }); // For retry processing
WebhookDeliverySchema.index({ createdAt: -1 });

// TTL index for automatic cleanup of old deliveries (90 days)
WebhookDeliverySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

// Convert to plain object with id field
WebhookDeliverySchema.set("toJSON", {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const WebhookDeliveryModel =
  mongoose.models.WebhookDelivery ||
  mongoose.model<WebhookDeliveryRecord>("WebhookDelivery", WebhookDeliverySchema);

export default WebhookDeliveryModel;
