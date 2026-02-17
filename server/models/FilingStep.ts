import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { ObjectId } from "mongodb";

/**
 * FilingStep represents each step in the GST filing workflow
 * Provides complete audit trail with timestamps, performer info, and changes
 */

export interface FilingStepDocument extends MongooseDocument {
  id: string;
  filingId: ObjectId;
  stepType: "gstr1_prepare" | "gstr1_validate" | "gstr1_file" | "gstr3b_prepare" | "gstr3b_validate" | "gstr3b_file" | "amendment" | "lock_month" | "unlock_month";
  status: "pending" | "in_progress" | "completed" | "failed" | "skipped";
  title: string; // Human-readable step name
  description?: string;
  startedAt?: Date;
  completedAt?: Date;
  completedBy?: ObjectId;
  performedBy: ObjectId; // User who performed the action
  comments?: string;
  changes?: {
    [key: string]: {
      before: any;
      after: any;
    };
  };
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
  errorDetails?: {
    errorCode: string;
    errorMessage: string;
    details?: any;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FilingStepSchema = new Schema<FilingStepDocument>(
  {
    filingId: {
      type: Schema.Types.ObjectId,
      ref: "GSTReturnFiling",
      required: true,
      index: true,
    },
    stepType: {
      type: String,
      enum: [
        "gstr1_prepare",
        "gstr1_validate",
        "gstr1_file",
        "gstr3b_prepare",
        "gstr3b_validate",
        "gstr3b_file",
        "amendment",
        "lock_month",
        "unlock_month",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "failed", "skipped"],
      default: "pending",
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    startedAt: Date,
    completedAt: Date,
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    comments: String,
    changes: Schema.Types.Mixed,
    attachments: [
      {
        name: String,
        url: String,
        type: String,
      },
    ],
    errorDetails: {
      errorCode: String,
      errorMessage: String,
      details: Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

// Index for efficient querying
FilingStepSchema.index({ filingId: 1, createdAt: -1 });
FilingStepSchema.index({ performedBy: 1, createdAt: -1 });
FilingStepSchema.index({ stepType: 1, status: 1 });

// Convert to plain object with id field
FilingStepSchema.set("toJSON", {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const FilingStepModel =
  mongoose.models.FilingStep || mongoose.model<FilingStepDocument>("FilingStep", FilingStepSchema);

export default FilingStepModel;
