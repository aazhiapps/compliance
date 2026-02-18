import { RequestHandler } from "express";
import { auditLogRepository } from "../repositories/auditLogRepository";
import { HTTP_STATUS } from "../utils/constants";
import {
  AuditLogFilters,
  AuditEntityType,
  AuditAction,
} from "@shared/audit";

/**
 * Get audit logs with filters
 * GET /api/admin/audit-logs
 */
export const handleGetAuditLogs: RequestHandler = async (req, res) => {
  try {
    const {
      entityType,
      entityId,
      action,
      performedBy,
      startDate,
      endDate,
      page,
      limit,
    } = req.query;

    const filters: AuditLogFilters = {
      entityType: entityType as AuditEntityType,
      entityId: entityId as string,
      action: action as AuditAction,
      performedBy: performedBy as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 50,
    };

    const { logs, total } = await auditLogRepository.find(filters);

    res.json({
      success: true,
      logs,
      total,
      page: filters.page,
      limit: filters.limit,
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};

/**
 * Get audit logs for a specific entity
 * GET /api/admin/audit-logs/:entityType/:entityId
 */
export const handleGetEntityAuditLogs: RequestHandler = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const logs = await auditLogRepository.findByEntity(
      entityType as AuditEntityType,
      entityId,
      limit
    );

    res.json({
      success: true,
      logs,
      total: logs.length,
    });
  } catch (error) {
    console.error("Error fetching entity audit logs:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};

/**
 * Get recent audit logs
 * GET /api/admin/audit-logs/recent
 */
export const handleGetRecentAuditLogs: RequestHandler = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const logs = await auditLogRepository.getRecent(limit);

    res.json({
      success: true,
      logs,
      total: logs.length,
    });
  } catch (error) {
    console.error("Error fetching recent audit logs:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch recent audit logs",
    });
  }
};

/**
 * Get audit statistics
 * GET /api/admin/audit-logs/stats
 */
export const handleGetAuditStats: RequestHandler = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await auditLogRepository.getStatistics(
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching audit statistics:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch audit statistics",
    });
  }
};
