import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { ObjectId } from "mongodb";

/**
 * ComplianceRule stores configurable GST rules
 * Allows admin to manage due dates, penalties, interest rates without code changes
 */

export interface ComplianceRuleRecord extends MongooseDocument {
  id: string;
  ruleType: "gst_due_date" | "late_fee" | "interest" | "filing_requirement";
  ruleCode: string; // e.g., "GSTR3B_DUE_20TH", "LATE_FEE_OVERDUE_100"
  description: string;
  // Rule parameters (flexible for different rules)
  parameters: {
    // For GST due dates
    dueDate?: number; // Day of month (e.g., 20 for GSTR-3B)
    dueHour?: number; // Hour of day (e.g., 23:59)
    applicableTo?: string[]; // ["monthly", "quarterly", "annual"]
    formType?: string[]; // ["gstr1", "gstr3b", "gstr2a", "gstr2b"]
    
    // For late fees
    lateFeeBase?: number; // Base amount (e.g., 100 for ₹100)
    lateFeePerDay?: number; // Fee per day of delay
    lateFeeMaxDays?: number; // Max number of days to apply fee
    lateFeeMax?: number; // Maximum total late fee
    
    // For interest
    interestRate?: number; // Interest rate % per annum
    interestAppliedFrom?: string; // "due_date" or "filing_date"
    
    // For filing requirements
    minimumTurnover?: number; // If applicable
    filingFrequency?: string; // "monthly", "quarterly", etc.
    exemptionCriteria?: string; // Conditions for exemption
    
    // Generic
    [key: string]: any;
  };
  // Rule status
  isActive: boolean;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  // Audit
  createdBy: ObjectId;
  updatedBy?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ComplianceRuleSchema = new Schema<ComplianceRuleRecord>(
  {
    ruleType: {
      type: String,
      enum: ["gst_due_date", "late_fee", "interest", "filing_requirement"],
      required: true,
      index: true,
    },
    ruleCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    parameters: {
      type: Schema.Types.Mixed,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    effectiveFrom: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    effectiveUntil: Date,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Index for finding active rules
ComplianceRuleSchema.index({ ruleType: 1, isActive: 1 });
ComplianceRuleSchema.index({ effectiveFrom: 1, effectiveUntil: 1 });

// Convert to plain object with id field
ComplianceRuleSchema.set("toJSON", {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ComplianceRuleModel =
  mongoose.models.ComplianceRule ||
  mongoose.model<ComplianceRuleRecord>("ComplianceRule", ComplianceRuleSchema);

export default ComplianceRuleModel;
