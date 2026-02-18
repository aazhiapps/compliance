/**
 * Enhanced GST Routes - Additional endpoints for new features
 * Includes: notifications, reports, staff assignment, month locking, client status
 */

import { RequestHandler } from "express";
import { gstRepository } from "../repositories/gstRepository";
import { gstNotificationService } from "../services/gstNotificationService";
import { AuthRequest } from "../middleware/auth";
import { userRepository } from "../repositories/userRepository";
import {
  validateGSTIN,
  validatePAN,
  validateARN,
} from "../utils/gstValidation";

// ============ CLIENT STATUS MANAGEMENT ============

/**
 * Deactivate a GST client
 */
export const handleDeactivateClient: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid client ID" });
    }

    const client = await gstRepository.findClientById(id);
    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    // Check permissions
    if (user.role !== "admin" && client.userId !== user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const updated = await gstRepository.deactivateClient(id, userId);
    if (!updated) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to deactivate client" });
    }

    // Add audit log
    await gstRepository.addAuditLog({
      id: `audit_${Date.now()}`,
      entityType: "client",
      entityId: id,
      action: "status_change",
      changes: { status: "inactive" },
      performedBy: userId,
      performedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Client deactivated successfully",
      client: updated,
    });
  } catch (error) {
    console.error("Error deactivating client:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to deactivate client" });
  }
};

/**
 * Reactivate a GST client
 */
export const handleReactivateClient: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid client ID" });
    }

    const client = await gstRepository.findClientById(id);
    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    // Check permissions
    if (user.role !== "admin" && client.userId !== user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const updated = await gstRepository.reactivateClient(id);
    if (!updated) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to reactivate client" });
    }

    // Add audit log
    await gstRepository.addAuditLog({
      id: `audit_${Date.now()}`,
      entityType: "client",
      entityId: id,
      action: "status_change",
      changes: { status: "active" },
      performedBy: userId,
      performedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Client reactivated successfully",
      client: updated,
    });
  } catch (error) {
    console.error("Error reactivating client:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to reactivate client" });
  }
};

/**
 * Get only active clients
 */
export const handleGetActiveClients: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    let clients;
    if (user.role === "admin") {
      clients = await gstRepository.findActiveClients();
    } else {
      clients = await gstRepository.findActiveClientsByUserId(user.id);
    }

    res.json({
      success: true,
      clients,
      count: clients.length,
    });
  } catch (error) {
    console.error("Error fetching active clients:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch active clients" });
  }
};

// ============ MONTH LOCKING ============

/**
 * Lock a month to prevent further edits
 */
export const handleLockMonth: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    const { clientId, month } = req.params;
    if (
      !clientId ||
      Array.isArray(clientId) ||
      !month ||
      Array.isArray(month)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid parameters" });
    }

    const client = await gstRepository.findClientById(clientId);
    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    // Check permissions
    if (user.role !== "admin" && client.userId !== user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const filing = await gstRepository.lockMonth(clientId, month, userId);
    if (!filing) {
      return res
        .status(404)
        .json({ success: false, message: "Filing record not found" });
    }

    // Add audit log
    await gstRepository.addAuditLog({
      id: `audit_${Date.now()}`,
      entityType: "filing",
      entityId: filing.id,
      action: "status_change",
      changes: { isLocked: true, lockedBy: userId },
      performedBy: userId,
      performedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Month locked successfully",
      filing,
    });
  } catch (error) {
    console.error("Error locking month:", error);
    res.status(500).json({ success: false, message: "Failed to lock month" });
  }
};

/**
 * Unlock a month (admin only, for amendments)
 */
export const handleUnlockMonth: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    // Only admins can unlock
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can unlock months",
      });
    }

    const { clientId, month } = req.params;
    if (
      !clientId ||
      Array.isArray(clientId) ||
      !month ||
      Array.isArray(month)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid parameters" });
    }

    const filing = await gstRepository.unlockMonth(clientId, month);
    if (!filing) {
      return res
        .status(404)
        .json({ success: false, message: "Filing record not found" });
    }

    // Add audit log
    await gstRepository.addAuditLog({
      id: `audit_${Date.now()}`,
      entityType: "filing",
      entityId: filing.id,
      action: "status_change",
      changes: { isLocked: false, unlockedBy: userId },
      performedBy: userId,
      performedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: "Month unlocked successfully",
      filing,
    });
  } catch (error) {
    console.error("Error unlocking month:", error);
    res.status(500).json({ success: false, message: "Failed to unlock month" });
  }
};

/**
 * Check if a month is locked
 */
export const handleCheckMonthLock: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { clientId, month } = req.params;
    if (
      !clientId ||
      Array.isArray(clientId) ||
      !month ||
      Array.isArray(month)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid parameters" });
    }

    const isLocked = await gstRepository.isMonthLocked(clientId, month);

    res.json({
      success: true,
      isLocked,
      message: isLocked ? "Month is locked" : "Month is unlocked",
    });
  } catch (error) {
    console.error("Error checking month lock:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to check month lock status" });
  }
};

// ============ NOTIFICATIONS ============

/**
 * Get user notifications
 */
export const handleGetNotifications: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;
    const notifications = gstNotificationService.getUserNotifications(
      userId,
      limit,
    );

    res.json({
      success: true,
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch notifications" });
  }
};

/**
 * Get unread notifications
 */
export const handleGetUnreadNotifications: RequestHandler = async (
  req,
  res,
) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const notifications = gstNotificationService.getUnreadNotifications(userId);

    res.json({
      success: true,
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread notifications",
    });
  }
};

/**
 * Get notification statistics
 */
export const handleGetNotificationStats: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const stats = gstNotificationService.getNotificationStats(userId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch notification stats" });
  }
};

/**
 * Mark notification as read
 */
export const handleMarkNotificationRead: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid notification ID" });
    }

    const success = gstNotificationService.markNotificationRead(id);
    if (!success) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to mark notification as read" });
  }
};

/**
 * Mark all notifications as read
 */
export const handleMarkAllNotificationsRead: RequestHandler = async (
  req,
  res,
) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const count = gstNotificationService.markAllNotificationsRead(userId);

    res.json({
      success: true,
      message: `${count} notifications marked as read`,
      count,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};

// ============ REPORTS ============

/**
 * Get client filing status report
 */
export const handleGetClientFilingStatus: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    const { clientId } = req.params;
    if (!clientId || Array.isArray(clientId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid client ID" });
    }

    const client = await gstRepository.findClientById(clientId);
    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    // Check permissions
    if (user.role !== "admin" && client.userId !== user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const report = await gstRepository.getClientFilingStatusReport(clientId);
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not available" });
    }

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("Error generating client filing status report:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate report" });
  }
};

/**
 * Get annual compliance summary
 */
export const handleGetAnnualSummary: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    const { clientId, fy } = req.params;
    if (!clientId || Array.isArray(clientId) || !fy || Array.isArray(fy)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid parameters" });
    }

    const client = await gstRepository.findClientById(clientId);
    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    // Check permissions
    if (user.role !== "admin" && client.userId !== user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const summary = await gstRepository.getAnnualComplianceSummary(
      clientId,
      fy,
    );
    if (!summary) {
      return res
        .status(404)
        .json({ success: false, message: "Summary not available" });
    }

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Error generating annual summary:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to generate summary" });
  }
};

// ============ VALIDATION HELPERS ============

/**
 * Validate GSTIN format
 */
export const handleValidateGSTIN: RequestHandler = async (req, res) => {
  try {
    const { gstin } = req.body;
    if (!gstin) {
      return res
        .status(400)
        .json({ success: false, message: "GSTIN is required" });
    }

    const validation = validateGSTIN(gstin);

    res.json({
      success: validation.isValid,
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
    });
  } catch (error) {
    console.error("Error validating GSTIN:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to validate GSTIN" });
  }
};

/**
 * Validate PAN format
 */
export const handleValidatePAN: RequestHandler = async (req, res) => {
  try {
    const { pan } = req.body;
    if (!pan) {
      return res
        .status(400)
        .json({ success: false, message: "PAN is required" });
    }

    const validation = validatePAN(pan);

    res.json({
      success: validation.isValid,
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
    });
  } catch (error) {
    console.error("Error validating PAN:", error);
    res.status(500).json({ success: false, message: "Failed to validate PAN" });
  }
};

/**
 * Validate ARN format
 */
export const handleValidateARN: RequestHandler = async (req, res) => {
  try {
    const { arn } = req.body;
    if (!arn) {
      return res
        .status(400)
        .json({ success: false, message: "ARN is required" });
    }

    const validation = validateARN(arn);

    res.json({
      success: validation.isValid,
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
    });
  } catch (error) {
    console.error("Error validating ARN:", error);
    res.status(500).json({ success: false, message: "Failed to validate ARN" });
  }
};

// ============ STAFF ASSIGNMENT ============

/**
 * Assign staff to client
 */
export const handleAssignStaffToClient: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user || user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    const { clientId, staffUserId } = req.body;
    if (!clientId || !staffUserId) {
      return res.status(400).json({
        success: false,
        message: "clientId and staffUserId are required",
      });
    }

    // Verify staff user exists
    const staffUser = await userRepository.findById(staffUserId);
    if (!staffUser) {
      return res
        .status(404)
        .json({ success: false, message: "Staff user not found" });
    }

    const success = await gstRepository.assignStaffToClient(
      clientId,
      staffUserId,
    );
    if (!success) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });
    }

    res.json({
      success: true,
      message: "Staff assigned to client successfully",
    });
  } catch (error) {
    console.error("Error assigning staff:", error);
    res.status(500).json({ success: false, message: "Failed to assign staff" });
  }
};

/**
 * Remove staff from client
 */
export const handleRemoveStaffFromClient: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user || user.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    const { clientId, staffUserId } = req.body;
    if (!clientId || !staffUserId) {
      return res.status(400).json({
        success: false,
        message: "clientId and staffUserId are required",
      });
    }

    const success = await gstRepository.removeStaffFromClient(
      clientId,
      staffUserId,
    );
    if (!success) {
      return res.status(404).json({
        success: false,
        message: "Client not found or staff not assigned",
      });
    }

    res.json({
      success: true,
      message: "Staff removed from client successfully",
    });
  } catch (error) {
    console.error("Error removing staff:", error);
    res.status(500).json({ success: false, message: "Failed to remove staff" });
  }
};

/**
 * Get clients for a staff member
 */
export const handleGetStaffClients: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    const { staffId } = req.params;
    if (!staffId || Array.isArray(staffId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid staff ID" });
    }

    // Admins can view any staff's clients, staff can only view their own
    if (user.role !== "admin" && staffId !== user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const clients = await gstRepository.findClientsByStaffUserId(staffId);

    res.json({
      success: true,
      clients,
      count: clients.length,
    });
  } catch (error) {
    console.error("Error fetching staff clients:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch staff clients" });
  }
};
