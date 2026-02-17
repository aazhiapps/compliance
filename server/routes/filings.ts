import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { requireStaff } from "../middleware/staff";
import FilingWorkflowService from "../services/FilingWorkflowService";
import FilingRepository from "../repositories/FilingRepository";
import gstRepository from "../repositories/gstRepository";
import { logger } from "../utils/logger";

const router = Router();

/**
 * POST /api/filings
 * Create a new filing record for a client-month
 * Required: Admin or Staff
 */
router.post(
  "/",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const { clientId, month, financialYear } = req.body;

      // Validate input
      if (!clientId || !month || !financialYear) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if filing already exists
      const existing = await FilingRepository.getFilingByClientMonth(
        new ObjectId(clientId),
        month,
      );
      if (existing) {
        return res
          .status(409)
          .json({ error: "Filing already exists for this month" });
      }

      // Create filing
      const filing = await FilingRepository.createFiling({
        clientId: new ObjectId(clientId),
        month,
        financialYear,
        workflowStatus: "draft",
        currentStep: "initialization",
      });

      logger.info("Filing created via API", {
        correlationId: req.correlationId,
        filingId: filing.id,
        clientId,
      });

      res.status(201).json(filing);
    } catch (error) {
      logger.error("Failed to create filing", error as Error, {
        correlationId: req.correlationId,
      });
      res.status(500).json({ error: "Failed to create filing" });
    }
  },
);

/**
 * GET /api/filings/:filingId
 * Get filing details
 */
router.get(
  "/:filingId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { filingId } = req.params;

      const filing = await FilingRepository.getFilingById(
        new ObjectId(filingId),
      );
      const steps = await FilingRepository.getFilingSteps(
        new ObjectId(filingId),
      );

      res.json({
        ...filing,
        steps,
      });
    } catch (error) {
      logger.error("Failed to get filing", error as Error, {
        correlationId: req.correlationId,
      });
      res.status(500).json({ error: "Failed to get filing" });
    }
  },
);

/**
 * GET /api/filings/client/:clientId
 * Get all filings for a client
 */
router.get(
  "/client/:clientId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { clientId } = req.params;
      const { financialYear } = req.query;

      const filings = await FilingRepository.getClientFilings(
        new ObjectId(clientId),
        financialYear as string,
      );

      res.json(filings);
    } catch (error) {
      logger.error("Failed to get client filings", error as Error, {
        correlationId: req.correlationId,
      });
      res.status(500).json({ error: "Failed to get client filings" });
    }
  },
);

/**
 * POST /api/filings/:filingId/transition
 * Transition filing to next workflow status
 * Body: { toStatus, stepType, comments? }
 */
router.post(
  "/:filingId/transition",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const { filingId } = req.params;
      const { toStatus, stepType, comments } = req.body;
      const userId = (req as any).userId;

      if (!toStatus || !stepType) {
        return res.status(400).json({ error: "Missing toStatus or stepType" });
      }

      const filing = await FilingRepository.getFilingById(
        new ObjectId(filingId),
      );

      // Transition filing
      const result = await FilingWorkflowService.transitionFiling(
        new ObjectId(filingId),
        filing.workflowStatus,
        toStatus,
        new ObjectId(userId),
        stepType,
        comments,
      );

      logger.info("Filing transitioned via API", {
        correlationId: req.correlationId,
        filingId,
        toStatus,
        stepType,
      });

      res.json(result.filing);
    } catch (error) {
      logger.error("Failed to transition filing", error as Error, {
        correlationId: req.correlationId,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  },
);

/**
 * POST /api/filings/:filingId/gstr1/file
 * Mark GSTR-1 as filed
 * Body: { arn, filedDate }
 */
router.post(
  "/:filingId/gstr1/file",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const { filingId } = req.params;
      const { arn, filedDate } = req.body;
      const userId = (req as any).userId;

      if (!arn || !filedDate) {
        return res.status(400).json({ error: "Missing arn or filedDate" });
      }

      const updated = await FilingWorkflowService.completeGSTR1Filing(
        new ObjectId(filingId),
        new ObjectId(userId),
        arn,
        new Date(filedDate),
      );

      res.json(updated);
    } catch (error) {
      logger.error("Failed to file GSTR-1", error as Error, {
        correlationId: req.correlationId,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  },
);

/**
 * POST /api/filings/:filingId/gstr3b/file
 * Mark GSTR-3B as filed
 * Body: { arn, filedDate, taxDetails }
 */
router.post(
  "/:filingId/gstr3b/file",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const { filingId } = req.params;
      const { arn, filedDate, taxDetails } = req.body;
      const userId = (req as any).userId;

      if (!arn || !filedDate) {
        return res.status(400).json({ error: "Missing arn or filedDate" });
      }

      const updated = await FilingWorkflowService.completeGSTR3BFiling(
        new ObjectId(filingId),
        new ObjectId(userId),
        arn,
        new Date(filedDate),
        taxDetails || {},
      );

      res.json(updated);
    } catch (error) {
      logger.error("Failed to file GSTR-3B", error as Error, {
        correlationId: req.correlationId,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  },
);

/**
 * POST /api/filings/:filingId/lock
 * Lock filing month
 * Body: { reason? }
 */
router.post(
  "/:filingId/lock",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const { filingId } = req.params;
      const { reason } = req.body;
      const userId = (req as any).userId;

      const updated = await FilingWorkflowService.lockFilingMonth(
        new ObjectId(filingId),
        new ObjectId(userId),
        reason || "Monthly filing complete",
      );

      res.json(updated);
    } catch (error) {
      logger.error("Failed to lock filing", error as Error, {
        correlationId: req.correlationId,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  },
);

/**
 * POST /api/filings/:filingId/unlock
 * Unlock filing month for amendments
 * Body: { reason }
 */
router.post(
  "/:filingId/unlock",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { filingId } = req.params;
      const { reason } = req.body;
      const userId = (req as any).userId;

      if (!reason) {
        return res.status(400).json({ error: "Reason is required" });
      }

      const updated = await FilingWorkflowService.unlockFilingMonth(
        new ObjectId(filingId),
        new ObjectId(userId),
        reason,
      );

      res.json(updated);
    } catch (error) {
      logger.error("Failed to unlock filing", error as Error, {
        correlationId: req.correlationId,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  },
);

/**
 * POST /api/filings/:filingId/amendment
 * Start amendment workflow
 * Body: { reason }
 */
router.post(
  "/:filingId/amendment",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const { filingId } = req.params;
      const { reason } = req.body;
      const userId = (req as any).userId;

      if (!reason) {
        return res.status(400).json({ error: "Reason is required" });
      }

      const updated = await FilingWorkflowService.startAmendment(
        new ObjectId(filingId),
        new ObjectId(userId),
        reason,
      );

      res.json(updated);
    } catch (error) {
      logger.error("Failed to start amendment", error as Error, {
        correlationId: req.correlationId,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  },
);

/**
 * GET /api/filings/:filingId/steps
 * Get filing workflow steps
 */
router.get(
  "/:filingId/steps",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { filingId } = req.params;

      const steps = await FilingRepository.getFilingSteps(
        new ObjectId(filingId),
      );

      res.json(steps);
    } catch (error) {
      logger.error("Failed to get filing steps", error as Error, {
        correlationId: req.correlationId,
      });
      res.status(500).json({ error: "Failed to get filing steps" });
    }
  },
);

/**
 * GET /api/filings/status/overdue
 * Get overdue filings (Admin only)
 */
router.get(
  "/status/overdue",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const overdue = await FilingRepository.getOverdueFilings();

      res.json(overdue);
    } catch (error) {
      logger.error("Failed to get overdue filings", error as Error, {
        correlationId: req.correlationId,
      });
      res.status(500).json({ error: "Failed to get overdue filings" });
    }
  },
);

/**
 * GET /api/filings/status/upcoming
 * Get filings due in next N days
 */
router.get(
  "/status/upcoming",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const { days = "7" } = req.query;
      const upcoming = await FilingRepository.getUpcomingDueFilings(
        parseInt(days as string),
      );

      res.json(upcoming);
    } catch (error) {
      logger.error("Failed to get upcoming filings", error as Error, {
        correlationId: req.correlationId,
      });
      res.status(500).json({ error: "Failed to get upcoming filings" });
    }
  },
);

/**
 * GET /api/filings/report/:clientId/:financialYear
 * Get filing status report
 */
router.get(
  "/report/:clientId/:financialYear",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { clientId, financialYear } = req.params;

      const report = await FilingRepository.getFilingStatusReport(
        new ObjectId(clientId),
        financialYear,
      );

      res.json(report);
    } catch (error) {
      logger.error("Failed to get filing status report", error as Error, {
        correlationId: req.correlationId,
      });
      res.status(500).json({ error: "Failed to get filing status report" });
    }
  },
);

export default router;
