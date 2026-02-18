/**
 * Shared types for Audit Logging
 * Unified audit log for all entities and operations
 */

export type AuditEntityType =
  | "user"
  | "client"
  | "application"
  | "document"
  | "payment"
  | "service"
  | "gst_client"
  | "gst_filing"
  | "invoice_purchase"
  | "invoice_sales"
  | "report";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "upload"
  | "download"
  | "verify"
  | "approve"
  | "reject"
  | "assign"
  | "unassign"
  | "payment_recorded"
  | "payment_refunded";

/**
 * Unified Audit Log
 */
export interface AuditLog {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  changes: Record<string, any>; // Old and new values
  performedBy: string; // User ID
  performedByName?: string; // User name for display
  performedAt: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>; // Additional context
}

/**
 * Audit log creation request
 */
export interface CreateAuditLogRequest {
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  changes: Record<string, any>;
  performedBy: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Audit log query filters
 */
export interface AuditLogFilters {
  entityType?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  performedBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * API Response types
 */
export interface AuditLogResponse {
  success: boolean;
  message?: string;
  log?: AuditLog;
}

export interface AuditLogsListResponse {
  success: boolean;
  message?: string;
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Helper to create change tracking object
 */
export function createChangeLog(
  oldValue: any,
  newValue: any,
  field: string
): Record<string, any> {
  return {
    field,
    oldValue,
    newValue,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper to create audit log entry for status changes
 */
export function createStatusChangeLog(
  entityType: AuditEntityType,
  entityId: string,
  oldStatus: string,
  newStatus: string,
  performedBy: string,
  reason?: string
): CreateAuditLogRequest {
  return {
    entityType,
    entityId,
    action: "status_change",
    changes: {
      field: "status",
      oldValue: oldStatus,
      newValue: newStatus,
      reason,
    },
    performedBy,
  };
}
