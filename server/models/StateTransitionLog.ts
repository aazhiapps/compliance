import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

/**
 * StateTransitionLog tracks all state changes across entities
 * Provides detailed audit trail for state machine transitions
 */

export interface IStateTransitionLogDocument extends MongooseDocument {
  id: string;
  entityType: "application" | "filing" | "payment" | "document" | "compliance_event" | "client";
  entityId: string;
  
  // State transition
  fromState: string;
  toState: string;
  transitionType: "automatic" | "manual" | "system" | "scheduled";
  
  // Metadata
  reason?: string;
  comment?: string;
  triggeredBy: string; // User ID or "system"
  triggeredByName?: string;
  triggeredAt: Date;
  
  // Context
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    approvalRequired?: boolean;
    approvedBy?: string;
    relatedEntities?: {
      type: string;
      id: string;
    }[];
    [key: string]: any;
  };
  
  // Validation
  isValid: boolean;
  validationErrors?: string[];
  
  // Rollback support
  canRollback: boolean;
  rolledBackAt?: Date;
  rolledBackBy?: string;
  
  createdAt: Date;
}

const StateTransitionLogSchema = new Schema<IStateTransitionLogDocument>(
  {
    entityType: {
      type: String,
      enum: ["application", "filing", "payment", "document", "compliance_event", "client"],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    fromState: {
      type: String,
      required: true,
      index: true,
    },
    toState: {
      type: String,
      required: true,
      index: true,
    },
    transitionType: {
      type: String,
      enum: ["automatic", "manual", "system", "scheduled"],
      default: "manual",
      required: true,
      index: true,
    },
    reason: {
      type: String,
    },
    comment: {
      type: String,
    },
    triggeredBy: {
      type: String,
      required: true,
      index: true,
    },
    triggeredByName: {
      type: String,
    },
    triggeredAt: {
      type: Date,
      required: true,
      default: () => new Date(),
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isValid: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },
    validationErrors: {
      type: [String],
      default: [],
    },
    canRollback: {
      type: Boolean,
      default: false,
      required: true,
    },
    rolledBackAt: {
      type: Date,
    },
    rolledBackBy: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // No updates allowed
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
StateTransitionLogSchema.index({ entityType: 1, entityId: 1, triggeredAt: -1 });
StateTransitionLogSchema.index({ entityType: 1, entityId: 1, fromState: 1, toState: 1 });
StateTransitionLogSchema.index({ triggeredBy: 1, triggeredAt: -1 });
StateTransitionLogSchema.index({ transitionType: 1, triggeredAt: -1 });

// Index for recent transitions by entity
StateTransitionLogSchema.index(
  { entityType: 1, entityId: 1, triggeredAt: -1 },
  { background: true }
);

// Index for invalid transitions (debugging)
StateTransitionLogSchema.index(
  { isValid: 1, triggeredAt: -1 },
  {
    partialFilterExpression: {
      isValid: false
    }
  }
);

export const StateTransitionLogModel = mongoose.model<IStateTransitionLogDocument>(
  "StateTransitionLog",
  StateTransitionLogSchema,
);
