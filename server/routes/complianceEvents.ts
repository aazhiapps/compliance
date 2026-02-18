import { Router, Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { requireAdmin, requireStaff } from "../middleware/admin";
import { requirePermission } from "../middleware/permission";
import { apiLimiter } from "../middleware/rateLimiter";
import { asyncHandler, sendSuccess, sendError, sendNotFound, sendPaginatedSuccess } from "../utils/apiResponse";
import ComplianceEventService from "../services/ComplianceEventService";
import { ComplianceEventModel } from "../models/ComplianceEvent";
import { ErrorCode } from "@shared/compliance";

const router = Router();

/**
 * PHASE 1: Compliance Event Routes
 * Manages compliance monitoring and reminders
 * All routes protected by rate limiting
 */

/**
 * GET /api/compliance-events
 * Get all compliance events (with optional filters)
 */
router.get(
  "/",
  apiLimiter,
  authenticateToken,
  requirePermission("compliance_event", "read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      clientId,
      status,
      complianceType,
      priority,
      page = 1,
      limit = 20,
    } = req.query;

    const query: any = {};
    
    if (clientId) query.clientId = clientId;
    if (status) query.status = status;
    if (complianceType) query.complianceType = complianceType;
    if (priority) query.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);

    const [events, total] = await Promise.all([
      ComplianceEventModel.find(query)
        .sort({ dueDate: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ComplianceEventModel.countDocuments(query),
    ]);

    return sendPaginatedSuccess(
      res,
      events,
      Number(page),
      Number(limit),
      total,
      "Compliance events retrieved successfully"
    );
  })
);

/**
 * GET /api/compliance-events/:id
 * Get a specific compliance event
 */
router.get(
  "/:id",
  apiLimiter,
  authenticateToken,
  requirePermission("compliance_event", "read"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const event = await ComplianceEventModel.findById(req.params.id).lean();

    if (!event) {
      return sendNotFound(res, "Compliance event");
    }

    return sendSuccess(res, event, "Compliance event retrieved successfully");
  })
);

/**
 * GET /api/compliance-events/client/:clientId
 * Get compliance calendar for a client
 */
router.get(
  "/client/:clientId",
  apiLimiter,
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { clientId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const events = await ComplianceEventService.getComplianceCalendar(
      clientId,
      start,
      end
    );

    return sendSuccess(
      res,
      events,
      "Compliance calendar retrieved successfully"
    );
  })
);

/**
 * POST /api/compliance-events
 * Create a new compliance event
 */
router.post(
  "/",
  apiLimiter,
  authenticateToken,
  requirePermission("compliance_event", "create"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;

    const event = await ComplianceEventService.createComplianceEvent({
      ...req.body,
      createdBy: userId,
    });

    return sendSuccess(
      res,
      event,
      "Compliance event created successfully",
      undefined,
      201
    );
  })
);

/**
 * POST /api/compliance-events/recurring
 * Generate recurring compliance events
 */
router.post(
  "/recurring",
  apiLimiter,
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const {
      clientId,
      serviceType,
      complianceType,
      frequency,
      startDate,
      endDate,
      description,
      lateFeePerDay,
      interestRate,
    } = req.body;

    const count = await ComplianceEventService.generateRecurringEvents(
      clientId,
      serviceType,
      complianceType,
      frequency,
      new Date(startDate),
      new Date(endDate),
      description,
      userId,
      lateFeePerDay,
      interestRate
    );

    return sendSuccess(
      res,
      { count },
      `${count} recurring compliance events created successfully`,
      undefined,
      201
    );
  })
);

/**
 * PATCH /api/compliance-events/:id/complete
 * Mark a compliance event as completed
 */
router.patch(
  "/:id/complete",
  apiLimiter,
  authenticateToken,
  requirePermission("compliance_event", "update"),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { completedDate } = req.body;

    const success = await ComplianceEventService.completeComplianceEvent(
      req.params.id,
      userId,
      completedDate ? new Date(completedDate) : undefined
    );

    if (!success) {
      return sendNotFound(res, "Compliance event");
    }

    return sendSuccess(
      res,
      { id: req.params.id },
      "Compliance event marked as completed"
    );
  })
);

/**
 * PATCH /api/compliance-events/:id/waive
 * Waive a compliance event (admin only)
 */
router.patch(
  "/:id/waive",
  apiLimiter,
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { reason } = req.body;

    if (!reason) {
      return sendError(
        res,
        "Waiver reason is required",
        ErrorCode.VALIDATION_REQUIRED_FIELD
      );
    }

    const success = await ComplianceEventService.waiveComplianceEvent(
      req.params.id,
      userId,
      reason
    );

    if (!success) {
      return sendNotFound(res, "Compliance event");
    }

    return sendSuccess(
      res,
      { id: req.params.id },
      "Compliance event waived successfully"
    );
  })
);

/**
 * GET /api/compliance-events/stats/summary
 * Get compliance statistics summary
 */
router.get(
  "/stats/summary",
  apiLimiter,
  authenticateToken,
  requireStaff,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { clientId } = req.query;

    const query: any = clientId ? { clientId } : {};

    const [
      total,
      scheduled,
      due,
      overdue,
      completed,
      waived,
    ] = await Promise.all([
      ComplianceEventModel.countDocuments(query),
      ComplianceEventModel.countDocuments({ ...query, status: "scheduled" }),
      ComplianceEventModel.countDocuments({ ...query, status: "due" }),
      ComplianceEventModel.countDocuments({ ...query, status: "overdue" }),
      ComplianceEventModel.countDocuments({ ...query, status: "completed" }),
      ComplianceEventModel.countDocuments({ ...query, status: "waived" }),
    ]);

    const stats = {
      total,
      scheduled,
      due,
      overdue,
      completed,
      waived,
      requiresAction: scheduled + due + overdue,
    };

    return sendSuccess(res, stats, "Compliance statistics retrieved successfully");
  })
);

export default router;
