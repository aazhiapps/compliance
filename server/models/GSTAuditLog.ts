import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { GSTAuditLog } from "@shared/gst";

export interface IGSTAuditLogDocument extends Omit<GSTAuditLog, "id">, MongooseDocument {}

const GSTAuditLogSchema = new Schema<IGSTAuditLogDocument>(
  {
    entityType: {
      type: String,
      enum: ["client", "purchase", "sales", "filing"],
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
      enum: ["create", "update", "delete", "status_change"],
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
    performedAt: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: false,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Create indexes for better query performance
GSTAuditLogSchema.index({ entityType: 1, entityId: 1 });
GSTAuditLogSchema.index({ performedBy: 1, performedAt: -1 });
GSTAuditLogSchema.index({ performedAt: -1 });

export const GSTAuditLogModel = mongoose.model<IGSTAuditLogDocument>(
  "GSTAuditLog",
  GSTAuditLogSchema
);
