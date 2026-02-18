import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

/**
 * WebhookEndpoint stores webhook endpoint URLs and configuration
 * Allows clients to register webhook endpoints for GST portal events
 */

export type WebhookEventType =
  | "filing.created"
  | "filing.status_changed"
  | "filing.locked"
  | "filing.amended"
  | "document.uploaded"
  | "document.processed"
  | "document.rejected"
  | "itc.reconciliation_completed"
  | "itc.discrepancy_detected"
  | "payment.received"
  | "payment.failed"
  | "compliance.alert"
  | "*";

export interface WebhookEndpointRecord extends MongooseDocument {
  id: string;
  clientId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  url: string;
  description?: string;
  // Event subscriptions
  events: WebhookEventType[];
  subscribeToAll: boolean;
  // Authentication
  secret: string; // Used for HMAC signature verification
  // Status and testing
  isActive: boolean;
  isTestMode: boolean;
  lastTriggeredAt?: Date;
  lastSuccessfulDeliveryAt?: Date;
  failureCount: number;
  successCount: number;
  // Rate limiting
  rateLimit?: number; // requests per minute
  retryPolicy: {
    maxRetries: number;
    initialBackoffMs: number; // exponential backoff
    maxBackoffMs: number;
  };
  // Metadata
  headers?: Record<string, string>; // Custom headers to send
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookEndpointSchema = new Schema<WebhookEndpointRecord>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "GSTClient",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    url: {
      type: String,
      required: true,
      validate: {
        validator: (url: string) => /^https?:\/\/.+/.test(url),
        message: "URL must be a valid HTTP(S) URL",
      },
    },
    description: String,
    events: [
      {
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
      },
    ],
    subscribeToAll: {
      type: Boolean,
      default: false,
    },
    secret: {
      type: String,
      required: true,
      select: false, // Don't return secret by default
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isTestMode: {
      type: Boolean,
      default: false,
    },
    lastTriggeredAt: Date,
    lastSuccessfulDeliveryAt: Date,
    failureCount: {
      type: Number,
      default: 0,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    rateLimit: Number,
    retryPolicy: {
      maxRetries: {
        type: Number,
        default: 5,
      },
      initialBackoffMs: {
        type: Number,
        default: 2000,
      },
      maxBackoffMs: {
        type: Number,
        default: 300000, // 5 minutes
      },
    },
    headers: Schema.Types.Mixed,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true },
);

// Indexes for common queries
WebhookEndpointSchema.index({ clientId: 1, isActive: 1 });
WebhookEndpointSchema.index({ userId: 1 });
WebhookEndpointSchema.index({ clientId: 1, createdAt: -1 });
WebhookEndpointSchema.index({ isActive: 1, failureCount: 1 });

// Convert to plain object with id field
WebhookEndpointSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const WebhookEndpointModel =
  mongoose.models.WebhookEndpoint ||
  mongoose.model<WebhookEndpointRecord>(
    "WebhookEndpoint",
    WebhookEndpointSchema,
  );

export default WebhookEndpointModel;
