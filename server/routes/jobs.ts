import { Router, Request, Response } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import QueueService from "../services/QueueService";
import JobLogModel from "../models/JobLog";
import {
  handleITCSync,
  handleFilingReminder,
  handleComplianceCheck,
  handleDataCleanup,
  handleReportGeneration,
  handleWebhookDelivery,
  handleWebhookRetry,
} from "../jobs/handlers";
import { logger } from "../utils/logger";

const router = Router();

/**
 * POST /api/jobs/trigger-itc-sync
 * Manually trigger ITC sync job
 * Requires: Authentication + Admin
 */
router.post(
  "/trigger-itc-sync",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const job = await QueueService.addJob("jobs", "itc_sync", {
        triggeredBy: "manual",
        timestamp: new Date(),
      });

      res.json({
        message: "ITC sync job triggered",
        jobId: job.id,
      });
    } catch (error) {
      logger.error("Failed to trigger ITC sync:", { error });
      res.status(500).json({ error: "Failed to trigger job" });
    }
  },
);

/**
 * POST /api/jobs/trigger-filing-reminder
 * Manually trigger filing reminder job
 * Requires: Authentication + Admin
 */
router.post(
  "/trigger-filing-reminder",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const job = await QueueService.addJob("jobs", "filing_reminder", {
        triggeredBy: "manual",
        timestamp: new Date(),
      });

      res.json({
        message: "Filing reminder job triggered",
        jobId: job.id,
      });
    } catch (error) {
      logger.error("Failed to trigger filing reminder:", { error });
      res.status(500).json({ error: "Failed to trigger job" });
    }
  },
);

/**
 * POST /api/jobs/trigger-compliance-check
 * Manually trigger compliance check job
 * Requires: Authentication + Admin
 */
router.post(
  "/trigger-compliance-check",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const job = await QueueService.addJob("jobs", "compliance_check", {
        triggeredBy: "manual",
        timestamp: new Date(),
      });

      res.json({
        message: "Compliance check job triggered",
        jobId: job.id,
      });
    } catch (error) {
      logger.error("Failed to trigger compliance check:", { error });
      res.status(500).json({ error: "Failed to trigger job" });
    }
  },
);

/**
 * POST /api/jobs/trigger-cleanup
 * Manually trigger data cleanup job
 * Requires: Authentication + Admin
 */
router.post(
  "/trigger-cleanup",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const job = await QueueService.addJob("jobs", "cleanup", {
        triggeredBy: "manual",
        timestamp: new Date(),
      });

      res.json({
        message: "Data cleanup job triggered",
        jobId: job.id,
      });
    } catch (error) {
      logger.error("Failed to trigger cleanup:", { error });
      res.status(500).json({ error: "Failed to trigger job" });
    }
  },
);

/**
 * POST /api/jobs/trigger-report
 * Manually trigger report generation
 * Requires: Authentication + Admin
 */
router.post(
  "/trigger-report",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { clientId, reportType } = req.body;

      if (!clientId || !reportType) {
        return res.status(400).json({
          error: "Missing required fields: clientId, reportType",
        });
      }

      const job = await QueueService.addJob("jobs", "report_generation", {
        clientId,
        reportType,
        triggeredBy: "manual",
        timestamp: new Date(),
      });

      res.json({
        message: "Report generation job triggered",
        jobId: job.id,
      });
    } catch (error) {
      logger.error("Failed to trigger report generation:", { error });
      res.status(500).json({ error: "Failed to trigger job" });
    }
  },
);

/**
 * GET /api/jobs/queue-stats/:queueName
 * Get queue statistics
 * Requires: Authentication + Admin
 */
router.get(
  "/queue-stats/:queueName",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { queueName } = req.params;

      const stats = await QueueService.getQueueStats(queueName);

      res.json({
        queueName,
        ...stats,
      });
    } catch (error) {
      logger.error("Failed to get queue stats:", { error });
      res.status(500).json({ error: "Failed to get queue stats" });
    }
  },
);

/**
 * GET /api/jobs/:jobId/status
 * Get job status by ID
 * Requires: Authentication + Admin
 */
router.get(
  "/:jobId/status",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;

      // Get from job logs
      const jobLog = await JobLogModel.findById(jobId);

      if (!jobLog) {
        return res.status(404).json({ error: "Job not found" });
      }

      res.json(jobLog);
    } catch (error) {
      logger.error("Failed to get job status:", { error });
      res.status(500).json({ error: "Failed to get job status" });
    }
  },
);

/**
 * GET /api/jobs/logs
 * Get job logs with filtering
 * Requires: Authentication + Admin
 */
router.get(
  "/logs",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { jobType, status, limit = 50, skip = 0, clientId } = req.query;

      const filter: any = {};
      if (jobType) filter.jobType = jobType;
      if (status) filter.status = status;
      if (clientId) filter.clientId = clientId;

      const [logs, total] = await Promise.all([
        JobLogModel.find(filter)
          .sort({ createdAt: -1 })
          .limit(Math.min(parseInt(limit as string), 100))
          .skip(parseInt(skip as string))
          .lean(),
        JobLogModel.countDocuments(filter),
      ]);

      res.json({
        total,
        logs,
      });
    } catch (error) {
      logger.error("Failed to fetch job logs:", { error });
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  },
);

/**
 * GET /api/jobs/logs/summary
 * Get job execution summary
 * Requires: Authentication + Admin
 */
router.get(
  "/logs/summary",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const summary = await JobLogModel.aggregate([
        {
          $match: {
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: "$jobType",
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            failed: {
              $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
            },
            totalDuration: { $sum: "$duration" },
          },
        },
        { $sort: { total: -1 } },
      ]);

      res.json({ period: "7_days", summary });
    } catch (error) {
      logger.error("Failed to get job summary:", { error });
      res.status(500).json({ error: "Failed to get summary" });
    }
  },
);

/**
 * POST /api/jobs/:jobId/retry
 * Retry a failed job
 * Requires: Authentication + Admin
 */
router.post(
  "/:jobId/retry",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const { queueName = "jobs" } = req.body;

      const success = await QueueService.retryJob(queueName, jobId);

      if (!success) {
        return res.status(404).json({ error: "Job not found" });
      }

      res.json({ message: "Job retried successfully" });
    } catch (error) {
      logger.error("Failed to retry job:", { error });
      res.status(500).json({ error: "Failed to retry job" });
    }
  },
);

/**
 * DELETE /api/jobs/:jobId/cancel
 * Cancel a job
 * Requires: Authentication + Admin
 */
router.delete(
  "/:jobId/cancel",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const { queueName = "jobs" } = req.body;

      const success = await QueueService.cancelJob(queueName, jobId);

      if (!success) {
        return res.status(404).json({ error: "Job not found" });
      }

      res.json({ message: "Job cancelled successfully" });
    } catch (error) {
      logger.error("Failed to cancel job:", { error });
      res.status(500).json({ error: "Failed to cancel job" });
    }
  },
);

export default router;
