import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { ObjectId } from "mongodb";

/**
 * ClientRisk tracks compliance risk metrics and calculates risk score
 * Used to identify high-risk clients for proactive intervention
 */

export interface RiskFactor {
  name: string; // e.g., "overdue_filings", "low_itc_claim", "incomplete_docs"
  weight: number; // Contribution to overall risk (0-100)
  value: number; // Current value
  threshold: number; // Alert threshold
}

export interface ClientRiskRecord extends MongooseDocument {
  id: string;
  clientId: ObjectId;
  // Risk score (0-100)
  riskScore: number; // Calculated from risk factors
  complianceStatus: "good" | "warning" | "critical";
  // Risk factors
  overdueDaysAvg: number; // Average days overdue across filings
  overdueFilingsCount: number; // Number of overdue filings
  filingAccuracy: number; // % of filings without amendments (0-100)
  incompleteDocsCount: number; // Missing required documents
  itcClaimAccuracy: number; // % of correct ITC claims
  itcMismatchCount: number; // Number of ITC mismatches
  amendmentRate: number; // % of filings with amendments
  // Flags
  hasOverdueFiling: boolean;
  hasUnresolvedITCMismatch: boolean;
  hasMissingDocuments: boolean;
  hasRecurrentIssues: boolean; // Same issue recurring
  // Historical tracking
  previousRiskScore?: number; // Previous month's score
  scoreChangePercentage?: number; // % change in risk score
  // Calculated metrics
  filingTrendScore: number; // Trend of filing accuracy
  documentComplianceScore: number; // % of complete documents
  itcComplianceScore: number; // % of correct ITC claims
  // Last assessment
  lastAssessedAt: Date;
  assessedBy?: ObjectId;
  // Recommended actions
  recommendedActions?: string[];
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

const ClientRiskSchema = new Schema<ClientRiskRecord>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "GSTClient",
      required: true,
      unique: true,
      index: true,
    },
    riskScore: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
      index: true,
    },
    complianceStatus: {
      type: String,
      enum: ["good", "warning", "critical"],
      default: "good",
      index: true,
    },
    overdueDaysAvg: {
      type: Number,
      default: 0,
    },
    overdueFilingsCount: {
      type: Number,
      default: 0,
    },
    filingAccuracy: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    incompleteDocsCount: {
      type: Number,
      default: 0,
    },
    itcClaimAccuracy: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    itcMismatchCount: {
      type: Number,
      default: 0,
    },
    amendmentRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    hasOverdueFiling: {
      type: Boolean,
      default: false,
      index: true,
    },
    hasUnresolvedITCMismatch: {
      type: Boolean,
      default: false,
    },
    hasMissingDocuments: {
      type: Boolean,
      default: false,
    },
    hasRecurrentIssues: {
      type: Boolean,
      default: false,
    },
    previousRiskScore: Number,
    scoreChangePercentage: Number,
    filingTrendScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    documentComplianceScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    itcComplianceScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    lastAssessedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    assessedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    recommendedActions: [String],
  },
  { timestamps: true }
);

// Indexes for filtering and sorting
ClientRiskSchema.index({ riskScore: -1, createdAt: -1 });
ClientRiskSchema.index({ complianceStatus: 1, riskScore: -1 });
ClientRiskSchema.index({ hasOverdueFiling: 1, riskScore: -1 });
ClientRiskSchema.index({ lastAssessedAt: -1 });

// Convert to plain object with id field
ClientRiskSchema.set("toJSON", {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ClientRiskModel =
  mongoose.models.ClientRisk ||
  mongoose.model<ClientRiskRecord>("ClientRisk", ClientRiskSchema);

export default ClientRiskModel;
