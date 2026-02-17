import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { Service } from "@shared/service";

export interface IServiceDocument
  extends Omit<Service, "id">, MongooseDocument {}

const FAQSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false },
);

const ServiceSchema = new Schema<IServiceDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    turnaround: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    documentsRequired: {
      type: [String],
      required: true,
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    features: {
      type: [String],
      required: true,
      default: [],
    },
    requirements: {
      type: [String],
      required: true,
      default: [],
    },
    faqs: {
      type: [FAQSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        ret.createdAt = ret.createdAt.toISOString();
        ret.updatedAt = ret.updatedAt.toISOString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Create indexes for better query performance
ServiceSchema.index({ category: 1 });
ServiceSchema.index({ active: 1 });
ServiceSchema.index({ name: 1 });

export const ServiceModel = mongoose.model<IServiceDocument>(
  "Service",
  ServiceSchema,
);
