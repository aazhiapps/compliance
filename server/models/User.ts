import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
import { User } from "@shared/auth";

export interface IUserDocument extends Omit<User, "id">, MongooseDocument {
  password: string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "staff"],
      default: "user",
      required: true,
      index: true,
    },
    businessType: {
      type: String,
      enum: ["individual", "startup", "company", "nonprofit"],
      required: true,
    },
    language: {
      type: String,
      enum: ["en", "hi"],
      default: "en",
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        ret.createdAt = ret.createdAt.toISOString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.updatedAt;
        return ret;
      },
    },
  }
);

// Create indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

export const UserModel = mongoose.model<IUserDocument>("User", UserSchema);
