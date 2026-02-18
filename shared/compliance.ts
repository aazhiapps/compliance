/**
 * Shared types for Compliance Events
 * PHASE 1: Enterprise Compliance Monitoring
 */

export interface ComplianceEvent {
  id: string;
  clientId: string;
  serviceType: string;
  complianceType: "filing" | "payment" | "document_renewal" | "audit" | "verification";
  frequency: "one_time" | "monthly" | "quarterly" | "half_yearly" | "yearly";
  
  // Scheduling
  dueDate: string;
  completedDate?: string;
  nextDueDate?: string;
  
  // Status tracking
  status: "scheduled" | "due" | "overdue" | "completed" | "waived";
  
  // Penalty calculation
  penaltyAmount: number;
  lateFeePerDay: number;
  interestRate: number;
  daysOverdue: number;
  
  // Notifications
  remindersSent: {
    sentAt: string;
    channel: "email" | "sms" | "in_app";
    messageId: string;
  }[];
  lastReminderSent?: string;
  
  // Related entities
  relatedEntityType?: "application" | "filing" | "document" | "payment";
  relatedEntityId?: string;
  
  // Audit
  createdAt: string;
  updatedAt: string;
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

export interface ComplianceEventCreateRequest {
  clientId: string;
  serviceType: string;
  complianceType: "filing" | "payment" | "document_renewal" | "audit" | "verification";
  frequency: "one_time" | "monthly" | "quarterly" | "half_yearly" | "yearly";
  dueDate: string;
  description: string;
  priority?: "low" | "medium" | "high" | "critical";
  lateFeePerDay?: number;
  interestRate?: number;
  relatedEntityType?: "application" | "filing" | "document" | "payment";
  relatedEntityId?: string;
}

export interface ComplianceEventUpdateRequest {
  status?: "scheduled" | "due" | "overdue" | "completed" | "waived";
  completedDate?: string;
  waivedReason?: string;
  priority?: "low" | "medium" | "high" | "critical";
}

/**
 * Shared types for Refresh Tokens
 * PHASE 1: Session Management
 */

export interface RefreshToken {
  id: string;
  userId: string;
  expiresAt: string;
  issuedAt: string;
  revokedAt?: string;
  ipAddress: string;
  userAgent: string;
  deviceId?: string;
  deviceName?: string;
  isRevoked: boolean;
  revokedReason?: "logout" | "security" | "expired" | "replaced" | "admin_action";
  lastUsedAt: string;
  useCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  tokenType: "Bearer";
}

/**
 * Shared types for Role Permissions
 * PHASE 1: Fine-Grained RBAC
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

export interface RolePermission {
  id: string;
  role: RoleType;
  resource: ResourceType;
  action: ActionType;
  conditions?: {
    field?: string;
    operator?: "equals" | "in" | "not_in" | "greater_than" | "less_than";
    value?: any;
    ownedByUser?: boolean;
    assignedToUser?: boolean;
    statusIn?: string[];
    departmentMatch?: boolean;
  };
  inheritsFrom?: RoleType[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  grantedBy: string;
  grantedAt: string;
  revokedAt?: string;
  revokedBy?: string;
  revokedReason?: string;
}

export interface PermissionCheckRequest {
  userId: string;
  role: RoleType;
  resource: ResourceType;
  action: ActionType;
  resourceData?: any; // For condition checking
}

export interface PermissionCheckResponse {
  allowed: boolean;
  reason?: string;
}

/**
 * Shared types for State Transition Logs
 * PHASE 1: State Machine History
 */

export interface StateTransitionLog {
  id: string;
  entityType: "application" | "filing" | "payment" | "document" | "compliance_event" | "client";
  entityId: string;
  fromState: string;
  toState: string;
  transitionType: "automatic" | "manual" | "system" | "scheduled";
  reason?: string;
  comment?: string;
  triggeredBy: string;
  triggeredByName?: string;
  triggeredAt: string;
  metadata?: any;
  isValid: boolean;
  validationErrors?: string[];
  canRollback: boolean;
  rolledBackAt?: string;
  rolledBackBy?: string;
  createdAt: string;
}

export interface StateTransitionCreateRequest {
  entityType: "application" | "filing" | "payment" | "document" | "compliance_event" | "client";
  entityId: string;
  fromState: string;
  toState: string;
  transitionType?: "automatic" | "manual" | "system" | "scheduled";
  reason?: string;
  comment?: string;
  metadata?: any;
}

/**
 * Standardized API Response Format
 * PHASE 1: Error Handling Standardization
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
  errors?: {
    field?: string;
    message: string;
    code?: string;
  }[];
  metadata?: {
    page?: number;
    pageSize?: number;
    total?: number;
    hasMore?: boolean;
    [key: string]: any;
  };
}

/**
 * Error Codes
 * PHASE 1: Structured Error Codes
 */

export enum ErrorCode {
  // Authentication & Authorization
  AUTH_INVALID_CREDENTIALS = "AUTH_001",
  AUTH_TOKEN_EXPIRED = "AUTH_002",
  AUTH_TOKEN_INVALID = "AUTH_003",
  AUTH_INSUFFICIENT_PERMISSIONS = "AUTH_004",
  AUTH_ACCOUNT_LOCKED = "AUTH_005",
  AUTH_SESSION_EXPIRED = "AUTH_006",
  
  // Validation
  VALIDATION_REQUIRED_FIELD = "VAL_001",
  VALIDATION_INVALID_FORMAT = "VAL_002",
  VALIDATION_OUT_OF_RANGE = "VAL_003",
  VALIDATION_DUPLICATE_ENTRY = "VAL_004",
  
  // Business Logic
  BUSINESS_INVALID_STATE_TRANSITION = "BUS_001",
  BUSINESS_OPERATION_NOT_ALLOWED = "BUS_002",
  BUSINESS_DUPLICATE_RESOURCE = "BUS_003",
  BUSINESS_RESOURCE_LOCKED = "BUS_004",
  
  // Payment
  PAYMENT_SIGNATURE_INVALID = "PAY_001",
  PAYMENT_ALREADY_PROCESSED = "PAY_002",
  PAYMENT_RECONCILIATION_FAILED = "PAY_003",
  PAYMENT_REFUND_FAILED = "PAY_004",
  
  // Compliance
  COMPLIANCE_OVERDUE = "COM_001",
  COMPLIANCE_PENALTY_APPLIED = "COM_002",
  COMPLIANCE_DOCUMENT_EXPIRED = "COM_003",
  
  // System
  SYSTEM_DATABASE_ERROR = "SYS_001",
  SYSTEM_EXTERNAL_SERVICE_ERROR = "SYS_002",
  SYSTEM_INTERNAL_ERROR = "SYS_003",
  SYSTEM_MAINTENANCE = "SYS_004",
}
