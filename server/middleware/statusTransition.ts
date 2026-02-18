import { RequestHandler } from "express";
import { HTTP_STATUS } from "../utils/constants";
import { ApplicationStatus, isValidStatusTransition } from "@shared/client";

/**
 * Middleware to validate application status transitions
 * Ensures that status changes follow the defined state machine
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
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: `Invalid status transition from '${currentStatus}' to '${newStatus}'`,
        currentStatus,
        attemptedStatus: newStatus,
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
