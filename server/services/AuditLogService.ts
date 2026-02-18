import { auditLogRepository } from "../repositories/auditLogRepository";
import {
  AuditEntityType,
  AuditAction,
  CreateAuditLogRequest,
  createStatusChangeLog,
} from "@shared/audit";
import { Request } from "express";

/**
 * Centralized service for audit logging
 */
class AuditLogService {
  /**
   * Log an action with automatic metadata extraction from request
   */
  async logAction(
    entityType: AuditEntityType,
    entityId: string,
    action: AuditAction,
    changes: Record<string, any>,
    performedBy: string,
    req?: Request
  ): Promise<void> {
    const logData: CreateAuditLogRequest = {
      entityType,
      entityId,
      action,
      changes,
      performedBy,
      ipAddress: req?.ip || req?.socket?.remoteAddress,
      userAgent: req?.get("user-agent"),
    };

    try {
      await auditLogRepository.create(logData);
    } catch (error) {
      console.error("Failed to create audit log:", error);
      // Don't throw - audit logging should not break the main flow
    }
  }

  /**
   * Log status change
   */
  async logStatusChange(
    entityType: AuditEntityType,
    entityId: string,
    oldStatus: string,
    newStatus: string,
    performedBy: string,
    reason?: string,
    req?: Request
  ): Promise<void> {
    const logData = createStatusChangeLog(
      entityType,
      entityId,
      oldStatus,
      newStatus,
      performedBy,
      reason
    );

    if (req) {
      logData.ipAddress = req.ip || req.socket?.remoteAddress;
      logData.userAgent = req.get("user-agent");
    }

    try {
      await auditLogRepository.create(logData);
    } catch (error) {
      console.error("Failed to log status change:", error);
    }
  }

  /**
   * Log client creation
   */
  async logClientCreated(
    clientId: string,
    clientData: Record<string, any>,
    userId: string,
    req?: Request
  ): Promise<void> {
    await this.logAction(
      "client",
      clientId,
      "create",
      { clientData },
      userId,
      req
    );
  }

  /**
   * Log client update
   */
  async logClientUpdated(
    clientId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    userId: string,
    req?: Request
  ): Promise<void> {
    await this.logAction(
      "client",
      clientId,
      "update",
      { oldData, newData },
      userId,
      req
    );
  }

  /**
   * Log application creation
   */
  async logApplicationCreated(
    applicationId: string,
    applicationData: Record<string, any>,
    userId: string,
    req?: Request
  ): Promise<void> {
    await this.logAction(
      "application",
      applicationId,
      "create",
      { applicationData },
      userId,
      req
    );
  }

  /**
   * Log application status change
   */
  async logApplicationStatusChange(
    applicationId: string,
    oldStatus: string,
    newStatus: string,
    userId: string,
    reason?: string,
    req?: Request
  ): Promise<void> {
    await this.logStatusChange(
      "application",
      applicationId,
      oldStatus,
      newStatus,
      userId,
      reason,
      req
    );
  }

  /**
   * Log document upload
   */
  async logDocumentUpload(
    documentId: string,
    documentData: Record<string, any>,
    userId: string,
    req?: Request
  ): Promise<void> {
    await this.logAction(
      "document",
      documentId,
      "upload",
      { documentData },
      userId,
      req
    );
  }

  /**
   * Log document verification
   */
  async logDocumentVerification(
    documentId: string,
    status: string,
    verifiedBy: string,
    remarks?: string,
    req?: Request
  ): Promise<void> {
    await this.logAction(
      "document",
      documentId,
      "verify",
      { status, remarks },
      verifiedBy,
      req
    );
  }

  /**
   * Log payment recorded
   */
  async logPaymentRecorded(
    paymentId: string,
    paymentData: Record<string, any>,
    userId: string,
    req?: Request
  ): Promise<void> {
    await this.logAction(
      "payment",
      paymentId,
      "payment_recorded",
      { paymentData },
      userId,
      req
    );
  }

  /**
   * Log staff assignment
   */
  async logStaffAssignment(
    entityType: AuditEntityType,
    entityId: string,
    staffId: string,
    assignedBy: string,
    req?: Request
  ): Promise<void> {
    await this.logAction(
      entityType,
      entityId,
      "assign",
      { staffId },
      assignedBy,
      req
    );
  }

  /**
   * Get audit trail for an entity
   */
  async getEntityAuditTrail(entityType: AuditEntityType, entityId: string) {
    return auditLogRepository.findByEntity(entityType, entityId);
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId: string, limit = 100) {
    return auditLogRepository.findByUser(userId, limit);
  }
}

export const auditLogService = new AuditLogService();
