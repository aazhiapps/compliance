import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { requireStaff } from "../middleware/staff";
import ITCReconciliationService from "../services/ITCReconciliationService";
import ITCReconciliationRepository from "../repositories/ITCReconciliationRepository";
import { logger } from "../utils/logger";

const router = Router();

/**
 * POST /api/itc-reconciliation/calculate
 * Calculate claimed ITC from purchase invoices for a specific month
 * Requires: Authentication + Staff
 */
router.post(
  "/calculate",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const { clientId, month, financialYear } = req.body;

      // Validate required fields
      if (!clientId || !month || !financialYear) {
        return res.status(400).json({
          error: "Missing required fields: clientId, month, financialYear",
        });
      }

      const result = await ITCReconciliationService.calculateClaimedITC({
        clientId: new ObjectId(clientId),
        month,
        financialYear,
      });

      res.json(result);
    } catch (error) {
      logger.error("Failed to calculate claimed ITC", { error });
      res.status(500).json({ error: "Failed to calculate claimed ITC" });
    }
  }
);

/**
 * POST /api/itc-reconciliation/sync
 * Sync ITC data with GST portal
 * Requires: Authentication + Admin (typically called via webhook)
 */
router.post(
  "/sync",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { clientId, month, portalData } = req.body;
      const userId = (req as any).userId;

      // Validate required fields
      if (!clientId || !month || !portalData) {
        return res.status(400).json({
          error: "Missing required fields: clientId, month, portalData",
        });
      }

      const { availableITCFromGST, pendingITC = 0, rejectedITC = 0 } = portalData;

      if (availableITCFromGST === undefined) {
        return res.status(400).json({
          error: "portalData must include availableITCFromGST",
        });
      }

      const result = await ITCReconciliationService.syncWithGSTPortal(
        new ObjectId(clientId),
        month,
        {
          availableITCFromGST,
          pendingITC,
          rejectedITC,
        },
        new ObjectId(userId)
      );

      res.json(result);
    } catch (error) {
      logger.error("Failed to sync with GST portal", { error });
      res.status(500).json({ error: "Failed to sync with GST portal" });
    }
  }
);

/**
 * GET /api/itc-reconciliation/:clientId/:month
 * Get reconciliation details for a specific month
 * Requires: Authentication
 */
router.get(
  "/:clientId/:month",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { clientId, month } = req.params;

      const record = await ITCReconciliationRepository.getReconciliationByMonth(
        new ObjectId(clientId),
        month
      );

      if (!record) {
        return res.status(404).json({ error: "Reconciliation record not found" });
      }

      res.json(record);
    } catch (error) {
      logger.error("Failed to fetch reconciliation", { error });
      res.status(500).json({ error: "Failed to fetch reconciliation" });
    }
  }
);

/**
 * GET /api/itc-reconciliation/:clientId
 * Get all reconciliation records for a client
 * Requires: Authentication
 */
router.get(
  "/:clientId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;

      const records = await ITCReconciliationRepository.getClientReconciliations(
        new ObjectId(clientId)
      );

      res.json(records);
    } catch (error) {
      logger.error("Failed to fetch client reconciliations", { error });
      res.status(500).json({ error: "Failed to fetch reconciliations" });
    }
  }
);

/**
 * GET /api/itc-reconciliation/:clientId/fy/:financialYear
 * Get all reconciliation records for a financial year
 * Requires: Authentication
 */
router.get(
  "/:clientId/fy/:financialYear",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { clientId, financialYear } = req.params;

      const records =
        await ITCReconciliationRepository.getFinancialYearReconciliations(
          new ObjectId(clientId),
          financialYear
        );

      res.json(records);
    } catch (error) {
      logger.error("Failed to fetch financial year reconciliations", { error });
      res.status(500).json({ error: "Failed to fetch reconciliations" });
    }
  }
);

/**
 * GET /api/itc-reconciliation/:clientId/:month/analysis
 * Get detailed discrepancy analysis for a month
 * Requires: Authentication
 */
router.get(
  "/:clientId/:month/analysis",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { clientId, month } = req.params;

      const analysis = await ITCReconciliationService.getMonthDiscrepancyAnalysis(
        new ObjectId(clientId),
        month
      );

      res.json(analysis);
    } catch (error) {
      logger.error("Failed to get discrepancy analysis", { error });
      res.status(500).json({ error: "Failed to get analysis" });
    }
  }
);

/**
 * POST /api/itc-reconciliation/:clientId/:month/resolve
 * Resolve a discrepancy
 * Requires: Authentication + Staff
 */
router.post(
  "/:clientId/:month/resolve",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const { clientId, month } = req.params;
      const { resolution } = req.body;
      const userId = (req as any).userId;

      if (!resolution) {
        return res.status(400).json({ error: "Resolution details required" });
      }

      const record = await ITCReconciliationRepository.resolveDiscrepancy(
        new ObjectId(clientId),
        month,
        {
          resolution,
          resolvedBy: new ObjectId(userId),
        }
      );

      res.json(record);
    } catch (error) {
      logger.error("Failed to resolve discrepancy", { error });
      res.status(500).json({ error: "Failed to resolve discrepancy" });
    }
  }
);

/**
 * POST /api/itc-reconciliation/:clientId/:month/review
 * Mark reconciliation for review
 * Requires: Authentication + Staff
 */
router.post(
  "/:clientId/:month/review",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const { clientId, month } = req.params;

      const record = await ITCReconciliationRepository.markForReview(
        new ObjectId(clientId),
        month
      );

      res.json(record);
    } catch (error) {
      logger.error("Failed to mark for review", { error });
      res.status(500).json({ error: "Failed to mark for review" });
    }
  }
);

/**
 * GET /api/itc-reconciliation/:clientId/report
 * Generate comprehensive ITC reconciliation report
 * Requires: Authentication
 */
router.get(
  "/:clientId/report",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const { financialYear } = req.query;

      const report = await ITCReconciliationService.generateClientReport(
        new ObjectId(clientId),
        financialYear as string | undefined
      );

      res.json(report);
    } catch (error) {
      logger.error("Failed to generate report", { error });
      res.status(500).json({ error: "Failed to generate report" });
    }
  }
);

/**
 * GET /api/itc-reconciliation/discrepancies/list
 * Get all discrepancy records (with filtering)
 * Requires: Authentication + Admin
 */
router.get(
  "/discrepancies/list",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { clientId, financialYear, reason } = req.query;

      const filter: any = {};
      if (clientId) filter.clientId = new ObjectId(clientId as string);
      if (financialYear) filter.financialYear = financialYear;
      if (reason) filter.discrepancyReason = reason;

      const discrepancies = await ITCReconciliationRepository.getDiscrepancies(filter);

      res.json({
        total: discrepancies.length,
        discrepancies,
      });
    } catch (error) {
      logger.error("Failed to fetch discrepancies", { error });
      res.status(500).json({ error: "Failed to fetch discrepancies" });
    }
  }
);

/**
 * GET /api/itc-reconciliation/:clientId/stats
 * Get ITC statistics for a client
 * Requires: Authentication
 */
router.get(
  "/:clientId/stats",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const { financialYear } = req.query;

      const stats = await ITCReconciliationRepository.getClientStats(
        new ObjectId(clientId),
        financialYear as string | undefined
      );

      res.json(stats);
    } catch (error) {
      logger.error("Failed to get statistics", { error });
      res.status(500).json({ error: "Failed to get statistics" });
    }
  }
);

/**
 * GET /api/itc-reconciliation/:clientId/pending-review
 * Get reconciliations pending review
 * Requires: Authentication
 */
router.get(
  "/:clientId/pending-review",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;

      const pending = await ITCReconciliationRepository.getPendingReview(
        new ObjectId(clientId)
      );

      res.json({
        total: pending.length,
        pending,
      });
    } catch (error) {
      logger.error("Failed to fetch pending review", { error });
      res.status(500).json({ error: "Failed to fetch pending items" });
    }
  }
);

/**
 * POST /api/itc-reconciliation/bulk-calculate
 * Bulk calculate claimed ITC for all clients in a month
 * Requires: Authentication + Admin
 */
router.post(
  "/bulk-calculate",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { month, financialYear } = req.body;

      if (!month || !financialYear) {
        return res.status(400).json({
          error: "Missing required fields: month, financialYear",
        });
      }

      const processed = await ITCReconciliationService.bulkCalculateClaimedITC(
        month,
        financialYear
      );

      res.json({
        message: "Bulk calculation completed",
        processedClients: processed,
        month,
        financialYear,
      });
    } catch (error) {
      logger.error("Failed to bulk calculate ITC", { error });
      res.status(500).json({ error: "Failed to bulk calculate ITC" });
    }
  }
);

export default router;
