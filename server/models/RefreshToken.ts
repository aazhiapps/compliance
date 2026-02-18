import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

/**
 * RefreshToken manages long-lived tokens for session management
 * Implements token rotation strategy for enhanced security
 */

export interface IRefreshTokenDocument extends MongooseDocument {
  id: string;
  userId: string;
  token: string; // hashed token
  expiresAt: Date;
  issuedAt: Date;
  revokedAt?: Date;
  
  // Device tracking
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  deviceName?: string;
  
  // Security
  isRevoked: boolean;
  revokedReason?: "logout" | "security" | "expired" | "replaced" | "admin_action";
  replacedBy?: string; // New token ID when rotated
  
  // Audit
  lastUsedAt: Date;
  useCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshTokenDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    issuedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    revokedAt: {
      type: Date,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    deviceId: {
      type: String,
      index: true,
    },
    deviceName: {
      type: String,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    revokedReason: {
      type: String,
      enum: ["logout", "security", "expired", "replaced", "admin_action"],
    },
    replacedBy: {
      type: String,
    },
    lastUsedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    useCount: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret: any) {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.token; // Never expose token in JSON
        return ret;
      },
    },
  },
);

// Compound indexes for common queries
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });
RefreshTokenSchema.index({ userId: 1, expiresAt: 1 });
RefreshTokenSchema.index({ userId: 1, deviceId: 1 });
RefreshTokenSchema.index({ expiresAt: 1, isRevoked: 1 });

// Index for active tokens per user
RefreshTokenSchema.index(
  { userId: 1, isRevoked: 1, expiresAt: 1 },
  {
    partialFilterExpression: {
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    }
  }
);

// TTL index to automatically delete expired tokens after 30 days
RefreshTokenSchema.index(
  { expiresAt: 1 },
  { 
    expireAfterSeconds: 2592000, // 30 days
    partialFilterExpression: {
      isRevoked: true
    }
  }
);

export const RefreshTokenModel = mongoose.model<IRefreshTokenDocument>(
  "RefreshToken",
  RefreshTokenSchema,
);
