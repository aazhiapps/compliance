import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

/**
 * RolePermission defines fine-grained access control
 * Maps roles to specific actions on resources with conditions
 */

export type RoleType = "super_admin" | "admin" | "auditor" | "compliance_manager" | "staff" | "client" | "viewer";

export type ResourceType = 
  | "user"
  | "client"
  | "application"
  | "service"
  | "document"
  | "payment"
  | "filing"
  | "compliance_event"
  | "audit_log"
  | "report"
  | "notification"
  | "webhook"
  | "settings";

export type ActionType =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "verify"
  | "assign"
  | "unassign"
  | "export"
  | "import"
  | "configure";

export interface PermissionCondition {
  field?: string;
  operator?: "equals" | "in" | "not_in" | "greater_than" | "less_than";
  value?: any;
  ownedByUser?: boolean; // Resource must be owned by the user
  assignedToUser?: boolean; // Resource must be assigned to the user
  statusIn?: string[]; // Resource status must be in this list
  departmentMatch?: boolean; // User department must match resource department
}

export interface IRolePermissionDocument extends MongooseDocument {
  id: string;
  role: RoleType;
  resource: ResourceType;
  action: ActionType;
  
  // Conditions for conditional access
  conditions?: PermissionCondition;
  
  // Hierarchy
  inheritsFrom?: RoleType[]; // Permissions inherited from these roles
  
  // Metadata
  description?: string;
  isActive: boolean;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
  grantedBy: string;
  grantedAt: Date;
  revokedAt?: Date;
  revokedBy?: string;
  revokedReason?: string;
}

const PermissionConditionSchema = new Schema(
  {
    field: String,
    operator: {
      type: String,
      enum: ["equals", "in", "not_in", "greater_than", "less_than"],
    },
    value: Schema.Types.Mixed,
    ownedByUser: Boolean,
    assignedToUser: Boolean,
    statusIn: [String],
    departmentMatch: Boolean,
  },
  { _id: false }
);

const RolePermissionSchema = new Schema<IRolePermissionDocument>(
  {
    role: {
      type: String,
      enum: ["super_admin", "admin", "auditor", "compliance_manager", "staff", "client", "viewer"],
      required: true,
      index: true,
    },
    resource: {
      type: String,
      enum: [
        "user",
        "client",
        "application",
        "service",
        "document",
        "payment",
        "filing",
        "compliance_event",
        "audit_log",
        "report",
        "notification",
        "webhook",
        "settings",
      ],
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        "create",
        "read",
        "update",
        "delete",
        "approve",
        "reject",
        "verify",
        "assign",
        "unassign",
        "export",
        "import",
        "configure",
      ],
      required: true,
      index: true,
    },
    conditions: {
      type: PermissionConditionSchema,
    },
    inheritsFrom: {
      type: [String],
      default: [],
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },
    grantedBy: {
      type: String,
      required: true,
    },
    grantedAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    revokedAt: {
      type: Date,
    },
    revokedBy: {
      type: String,
    },
    revokedReason: {
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

// Compound indexes for permission lookups
RolePermissionSchema.index({ role: 1, resource: 1, action: 1 });
RolePermissionSchema.index({ role: 1, isActive: 1 });
RolePermissionSchema.index({ resource: 1, action: 1, isActive: 1 });

// Unique constraint: one permission per role-resource-action combination
RolePermissionSchema.index(
  { role: 1, resource: 1, action: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isActive: true,
      revokedAt: { $exists: false }
    }
  }
);

export const RolePermissionModel = mongoose.model<IRolePermissionDocument>(
  "RolePermission",
  RolePermissionSchema,
);
