import { AuditLogModel } from "../models/AuditLog";
import {
  AuditLog,
  CreateAuditLogRequest,
  AuditLogFilters,
  AuditEntityType,
  AuditAction,
} from "@shared/audit";

class AuditLogRepository {
  /**
   * Create a new audit log entry
   */
  async create(logData: CreateAuditLogRequest): Promise<AuditLog> {
    const log = new AuditLogModel({
      ...logData,
      performedAt: new Date().toISOString(),
    });
    await log.save();
    return log.toJSON() as AuditLog;
  }

  /**
   * Find audit logs with filters
   */
  async find(filters: AuditLogFilters): Promise<{ logs: AuditLog[]; total: number }> {
    const {
      entityType,
      entityId,
      action,
      performedBy,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const query: any = {};

    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (action) query.action = action;
    if (performedBy) query.performedBy = performedBy;

    if (startDate || endDate) {
      query.performedAt = {};
      if (startDate) query.performedAt.$gte = startDate;
      if (endDate) query.performedAt.$lte = endDate;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLogModel.find(query)
        .sort({ performedAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLogModel.countDocuments(query),
    ]);

    return {
      logs: logs.map((log) => log.toJSON() as AuditLog),
      total,
    };
  }

  /**
   * Find logs for a specific entity
   */
  async findByEntity(
    entityType: AuditEntityType,
    entityId: string,
    limit = 50
  ): Promise<AuditLog[]> {
    const logs = await AuditLogModel.find({ entityType, entityId })
      .sort({ performedAt: -1 })
      .limit(limit);
    return logs.map((log) => log.toJSON() as AuditLog);
  }

  /**
   * Find logs by user
   */
  async findByUser(userId: string, limit = 100): Promise<AuditLog[]> {
    const logs = await AuditLogModel.find({ performedBy: userId })
      .sort({ performedAt: -1 })
      .limit(limit);
    return logs.map((log) => log.toJSON() as AuditLog);
  }

  /**
   * Find logs by action
   */
  async findByAction(action: AuditAction, limit = 100): Promise<AuditLog[]> {
    const logs = await AuditLogModel.find({ action })
      .sort({ performedAt: -1 })
      .limit(limit);
    return logs.map((log) => log.toJSON() as AuditLog);
  }

  /**
   * Get recent logs
   */
  async getRecent(limit = 100): Promise<AuditLog[]> {
    const logs = await AuditLogModel.find()
      .sort({ performedAt: -1 })
      .limit(limit);
    return logs.map((log) => log.toJSON() as AuditLog);
  }

  /**
   * Get audit statistics
   */
  async getStatistics(startDate?: string, endDate?: string) {
    const query: any = {};
    if (startDate || endDate) {
      query.performedAt = {};
      if (startDate) query.performedAt.$gte = startDate;
      if (endDate) query.performedAt.$lte = endDate;
    }

    const [
      total,
      byEntityType,
      byAction,
      topPerformers,
    ] = await Promise.all([
      AuditLogModel.countDocuments(query),
      AuditLogModel.aggregate([
        { $match: query },
        { $group: { _id: "$entityType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      AuditLogModel.aggregate([
        { $match: query },
        { $group: { _id: "$action", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      AuditLogModel.aggregate([
        { $match: query },
        { $group: { _id: "$performedBy", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return {
      total,
      byEntityType,
      byAction,
      topPerformers,
    };
  }

  /**
   * Delete old logs (for cleanup)
   */
  async deleteOldLogs(beforeDate: string): Promise<number> {
    const result = await AuditLogModel.deleteMany({
      performedAt: { $lt: beforeDate },
    });
    return result.deletedCount || 0;
  }
}

export const auditLogRepository = new AuditLogRepository();
