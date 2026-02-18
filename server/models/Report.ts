import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { Report, ExportLog } from "@shared/api";

export interface IReportDocument extends Omit<Report, "id">, MongooseDocument {}

const ExportLogSchema = new Schema<ExportLog>(
  {
    exportedBy: { type: String, required: true },
    exportedByName: { type: String },
    format: {
      type: String,
      enum: ["csv", "pdf"],
      required: true,
    },
    exportedAt: { type: String, required: true },
  },
  { _id: false },
);

const ReportSchema = new Schema<IReportDocument>(
  {
    clientId: {
      type: String,
      required: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    financialYear: {
      type: String,
      required: true,
      index: true,
    },
    reportType: {
      type: String,
      enum: [
        "Financial Statements",
        "Income Tax Computation",
        "GST Summary",
        "Tax Audit Summary",
        "ROC Filing Summary",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "final", "filed"],
      default: "draft",
      required: true,
    },
    preparedBy: {
      type: String,
      required: true,
    },
    preparedByName: {
      type: String,
    },
    generatedOn: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    exportLogs: {
      type: [ExportLogSchema],
      default: [],
    },
  },
  {
    timestamps: false,
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

// Create indexes for better query performance
ReportSchema.index({ clientId: 1, financialYear: 1 });
ReportSchema.index({ reportType: 1, status: 1 });
ReportSchema.index({ preparedBy: 1 });
ReportSchema.index({ generatedOn: -1 });

export const ReportModel = mongoose.model<IReportDocument>(
  "Report",
  ReportSchema,
);
