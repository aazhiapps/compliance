import { RequestHandler } from "express";
import { HTTP_STATUS } from "../utils/constants";
import { ApplicationStatus, isValidStatusTransition } from "@shared/client";
import { StateTransitionLogModel } from "../models/StateTransitionLog";
import { AuditLogService } from "../services/AuditLogService";

/**
 * Middleware to validate application status transitions
 * Ensures that status changes follow the defined state machine
 * PHASE 1: Enhanced with StateTransitionLog tracking
 */
export const validateStatusTransition: RequestHandler = async (req, res, next) => {
  try {
    const { status: newStatus } = req.body;

    if (!newStatus) {
      // If no status in body, continue (might be other updates)
      return next();
    }

    // Get application ID from params (can be 'id' or 'applicationId')
    const applicationId = req.params.id || req.params.applicationId;
    if (!applicationId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Application ID required",
      });
    }

    // Import here to avoid circular dependency
    const { applicationRepository } = await import("../repositories/applicationRepository");
    
    // Get current application
    const application = await applicationRepository.findById(applicationId);
    if (!application) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Application not found",
      });
    }

    const currentStatus = application.status as ApplicationStatus;
    
    // Validate transition
    const isValid = isValidStatusTransition(currentStatus, newStatus);
    
    // Log the transition attempt
    const userId = (req as any).userId || "system";
    const userName = (req as any).userName;
    
    await StateTransitionLogModel.create({
      entityType: "application",
      entityId: applicationId,
      fromState: currentStatus,
      toState: newStatus,
      transitionType: "manual",
      reason: req.body.reason,
      comment: req.body.comment,
      triggeredBy: userId,
      triggeredByName: userName,
      triggeredAt: new Date(),
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
      isValid,
      validationErrors: isValid ? [] : [`Invalid transition from '${currentStatus}' to '${newStatus}'`],
      canRollback: false,
    });
    
    if (!isValid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Invalid status transition from '${currentStatus}' to '${newStatus}'`,
        currentStatus,
        attemptedStatus: newStatus,
        errorCode: "BUSINESS_INVALID_STATE_TRANSITION",
      });
    }

    // Valid transition, continue
    next();
  } catch (error) {
    console.error("Error validating status transition:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to validate status transition",
    });
  }
};
