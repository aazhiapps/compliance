import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { ObjectId } from "mongodb";

/**
 * JobLog tracks all background job executions
 * Provides audit trail and debugging capabilities
 */

export interface JobLogRecord extends MongooseDocument {
  id: string;
  jobName: string;
  jobType:
    | "itc_sync"
    | "notification_send"
    | "filing_reminder"
    | "compliance_check"
    | "report_generation"
    | "cleanup"
    | "webhook_retry"
    | "custom";
  status: "queued" | "running" | "completed" | "failed" | "retrying";
  clientId?: ObjectId;
  // Execution details
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
  // Results
  processed: number; // Number of items processed
  successful: number; // Successful operations
  failed: number; // Failed operations
  skipped: number; // Skipped operations
  // Error handling
  error?: string;
  errorStack?: string;
  errorDetails?: Record<string, any>;
  // Retry
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: Date;
  // Progress
  progress: number; // 0-100
  progressMessage?: string;
  // Scheduling
  scheduledFor?: Date;
  triggeredBy: "schedule" | "manual" | "webhook" | "api";
  // Results summary
  summary?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const JobLogSchema = new Schema<JobLogRecord>(
  {
    jobName: {
      type: String,
      required: true,
      index: true,
    },
    jobType: {
      type: String,
      enum: [
        "itc_sync",
        "notification_send",
        "filing_reminder",
        "compliance_check",
        "report_generation",
        "cleanup",
        "webhook_retry",
        "custom",
      ],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed", "retrying"],
      default: "queued",
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "GSTClient",
      sparse: true,
      index: true,
    },
    startedAt: Date,
    completedAt: Date,
    duration: Number,
    processed: {
      type: Number,
      default: 0,
    },
    successful: {
      type: Number,
      default: 0,
    },
    failed: {
      type: Number,
      default: 0,
    },
    skipped: {
      type: Number,
      default: 0,
    },
    error: String,
    errorStack: String,
    errorDetails: Schema.Types.Mixed,
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    nextRetryAt: Date,
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    progressMessage: String,
    scheduledFor: Date,
    triggeredBy: {
      type: String,
      enum: ["schedule", "manual", "webhook", "api"],
      default: "schedule",
    },
    summary: Schema.Types.Mixed,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true },
);

// Indexes for common queries
JobLogSchema.index({ jobName: 1, createdAt: -1 });
JobLogSchema.index({ status: 1, createdAt: -1 });
JobLogSchema.index({ jobType: 1, status: 1 });
JobLogSchema.index({ clientId: 1, createdAt: -1 });
JobLogSchema.index({ nextRetryAt: 1, status: 1 });
JobLogSchema.index({ triggeredBy: 1, createdAt: -1 });

// TTL index - auto-delete logs older than 90 days
JobLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Convert to plain object with id field
JobLogSchema.set("toJSON", {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const JobLogModel =
  mongoose.models.JobLog ||
  mongoose.model<JobLogRecord>("JobLog", JobLogSchema);

export default JobLogModel;
