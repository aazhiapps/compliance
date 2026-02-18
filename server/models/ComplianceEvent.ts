import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

/**
 * ComplianceEvent tracks recurring compliance requirements and their status
 * Used for automated monitoring, reminders, and penalty calculation
 */

export interface IComplianceEventDocument extends MongooseDocument {
  id: string;
  clientId: string;
  serviceType: string;
  complianceType: "filing" | "payment" | "document_renewal" | "audit" | "verification";
  frequency: "one_time" | "monthly" | "quarterly" | "half_yearly" | "yearly";
  
  // Scheduling
  dueDate: Date;
  completedDate?: Date;
  nextDueDate?: Date;
  
  // Status tracking
  status: "scheduled" | "due" | "overdue" | "completed" | "waived";
  
  // Penalty calculation
  penaltyAmount: number;
  lateFeePerDay: number;
  interestRate: number;
  daysOverdue: number;
  
  // Notifications
  remindersSent: {
    sentAt: Date;
    channel: "email" | "sms" | "in_app";
    messageId: string;
  }[];
  lastReminderSent?: Date;
  
  // Related entities
  relatedEntityType?: "application" | "filing" | "document" | "payment";
  relatedEntityId?: string;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  completedBy?: string;
  waivedBy?: string;
  waivedReason?: string;
  
  // Metadata
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  requiresAction: boolean;
  actionUrl?: string;
}

const ComplianceEventSchema = new Schema<IComplianceEventDocument>(
  {
    clientId: {
      type: String,
      required: true,
      index: true,
    },
    serviceType: {
      type: String,
      required: true,
      index: true,
    },
    complianceType: {
      type: String,
      enum: ["filing", "payment", "document_renewal", "audit", "verification"],
      required: true,
      index: true,
    },
    frequency: {
      type: String,
      enum: ["one_time", "monthly", "quarterly", "half_yearly", "yearly"],
      required: true,
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    completedDate: {
      type: Date,
      index: true,
    },
    nextDueDate: {
      type: Date,
      index: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "due", "overdue", "completed", "waived"],
      default: "scheduled",
      required: true,
      index: true,
    },
    penaltyAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateFeePerDay: {
      type: Number,
      default: 0,
      min: 0,
    },
    interestRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    daysOverdue: {
      type: Number,
      default: 0,
      min: 0,
    },
    remindersSent: {
      type: [
        {
          sentAt: { type: Date, required: true },
          channel: {
            type: String,
            enum: ["email", "sms", "in_app"],
            required: true,
          },
          messageId: { type: String, required: true },
        },
      ],
      default: [],
    },
    lastReminderSent: {
      type: Date,
    },
    relatedEntityType: {
      type: String,
      enum: ["application", "filing", "document", "payment"],
    },
    relatedEntityId: {
      type: String,
      index: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    completedBy: {
      type: String,
    },
    waivedBy: {
      type: String,
    },
    waivedReason: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      required: true,
      index: true,
    },
    requiresAction: {
      type: Boolean,
      default: true,
      index: true,
    },
    actionUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
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
ComplianceEventSchema.index({ clientId: 1, status: 1 });
ComplianceEventSchema.index({ clientId: 1, dueDate: 1 });
ComplianceEventSchema.index({ status: 1, dueDate: 1 });
ComplianceEventSchema.index({ status: 1, priority: 1, dueDate: 1 });
ComplianceEventSchema.index({ serviceType: 1, status: 1 });
ComplianceEventSchema.index({ complianceType: 1, status: 1 });
ComplianceEventSchema.index({ requiresAction: 1, status: 1, dueDate: 1 });

// Index for overdue detection
ComplianceEventSchema.index(
  { status: 1, dueDate: 1 },
  { 
    partialFilterExpression: { 
      status: { $in: ["scheduled", "due"] },
      dueDate: { $lt: new Date() }
    } 
  }
);

// Index for upcoming reminders
ComplianceEventSchema.index(
  { status: 1, dueDate: 1, lastReminderSent: 1 },
  {
    partialFilterExpression: {
      status: { $in: ["scheduled", "due"] },
    }
  }
);

export const ComplianceEventModel = mongoose.model<IComplianceEventDocument>(
  "ComplianceEvent",
  ComplianceEventSchema,
);
