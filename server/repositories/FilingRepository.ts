import { GSTReturnFilingModel } from "../models/GSTReturnFiling";
import { FilingStepModel } from "../models/FilingStep";
import { ITCReconciliationModel } from "../models/ITCReconciliation";
import { ObjectId } from "mongodb";
import { logger } from "../utils/logger";

/**
 * FilingRepository handles all database operations for GST filings
 * Provides type-safe methods for filing workflows
 */

export interface CreateFilingInput {
  clientId: ObjectId;
  month: string;
  financialYear: string;
  workflowStatus?: string;
  currentStep?: string;
}

export interface UpdateFilingInput {
  workflowStatus?: string;
  currentStep?: string;
  gstr1?: Record<string, any>;
  gstr3b?: Record<string, any>;
  isLocked?: boolean;
  lockedAt?: Date;
  lockedBy?: ObjectId;
  lockReason?: string;
  updatedBy?: ObjectId;
}

export interface CreateFilingStepInput {
  filingId: ObjectId;
  stepType: string;
  status: string;
  title: string;
  description?: string;
  performedBy: ObjectId;
  comments?: string;
  changes?: Record<string, any>;
  attachments?: Array<{ name: string; url: string; type: string }>;
}

export class FilingRepository {
  /**
   * Create a new filing record
   */
  async createFiling(data: CreateFilingInput) {
    try {
      const filing = await GSTReturnFilingModel.create({
        ...data,
        workflowStatus: data.workflowStatus || "draft",
        currentStep: data.currentStep || "initialization",
        steps: [],
      });
      logger.info("Filing created", { filingId: filing._id, clientId: data.clientId });
      return filing.toJSON();
    } catch (error) {
      logger.error("Failed to create filing", error as Error, { data });
      throw error;
    }
  }

  /**
   * Get filing by ID
   */
  async getFilingById(filingId: ObjectId) {
    try {
      const filing = await GSTReturnFilingModel.findById(filingId).lean();
      if (!filing) {
        throw new Error(`Filing not found: ${filingId}`);
      }
      return filing;
    } catch (error) {
      logger.error("Failed to get filing by ID", error as Error, { filingId });
      throw error;
    }
  }

  /**
   * Get filing by client and month (unique constraint)
   */
  async getFilingByClientMonth(clientId: ObjectId, month: string) {
    try {
      const filing = await GSTReturnFilingModel.findOne({ clientId, month }).lean();
      return filing;
    } catch (error) {
      logger.error("Failed to get filing by client-month", error as Error, {
        clientId,
        month,
      });
      throw error;
    }
  }

  /**
   * Get all filings for a client
   */
  async getClientFilings(clientId: ObjectId, financialYear?: string) {
    try {
      const query: Record<string, any> = { clientId };
      if (financialYear) {
        query.financialYear = financialYear;
      }
      const filings = await GSTReturnFilingModel.find(query)
        .sort({ month: -1 })
        .lean();
      return filings;
    } catch (error) {
      logger.error("Failed to get client filings", error as Error, { clientId });
      throw error;
    }
  }

  /**
   * Update filing status
   */
  async updateFiling(filingId: ObjectId, data: UpdateFilingInput) {
    try {
      const filing = await GSTReturnFilingModel.findByIdAndUpdate(filingId, data, {
        new: true,
      }).lean();
      if (!filing) {
        throw new Error(`Filing not found: ${filingId}`);
      }
      logger.info("Filing updated", { filingId, updates: Object.keys(data) });
      return filing;
    } catch (error) {
      logger.error("Failed to update filing", error as Error, { filingId });
      throw error;
    }
  }

  /**
   * Lock a filing month (prevent edits)
   */
  async lockFiling(filingId: ObjectId, lockedBy: ObjectId, lockReason: string) {
    try {
      const filing = await GSTReturnFilingModel.findByIdAndUpdate(
        filingId,
        {
          isLocked: true,
          lockedAt: new Date(),
          lockedBy,
          lockReason,
          workflowStatus: "locked",
        },
        { new: true }
      ).lean();
      if (!filing) {
        throw new Error(`Filing not found: ${filingId}`);
      }
      logger.info("Filing locked", { filingId, reason: lockReason });
      return filing;
    } catch (error) {
      logger.error("Failed to lock filing", error as Error, { filingId });
      throw error;
    }
  }

  /**
   * Unlock a filing month
   */
  async unlockFiling(filingId: ObjectId, unlockedBy: ObjectId) {
    try {
      const filing = await GSTReturnFilingModel.findByIdAndUpdate(
        filingId,
        {
          isLocked: false,
          lockedAt: null,
          lockedBy: null,
          lockReason: null,
          workflowStatus: "draft",
        },
        { new: true }
      ).lean();
      if (!filing) {
        throw new Error(`Filing not found: ${filingId}`);
      }
      logger.info("Filing unlocked", { filingId, unlockedBy });
      return filing;
    } catch (error) {
      logger.error("Failed to unlock filing", error as Error, { filingId });
      throw error;
    }
  }

  /**
   * Check if filing month is locked
   */
  async isFilingLocked(clientId: ObjectId, month: string): Promise<boolean> {
    try {
      const filing = await GSTReturnFilingModel.findOne({
        clientId,
        month,
      }).select("isLocked");
      return filing?.isLocked || false;
    } catch (error) {
      logger.error("Failed to check filing lock status", error as Error, {
        clientId,
        month,
      });
      return false;
    }
  }

  /**
   * Create filing step (audit trail)
   */
  async createFilingStep(data: CreateFilingStepInput) {
    try {
      const step = await FilingStepModel.create({
        ...data,
        status: data.status || "pending",
      });
      logger.info("Filing step created", {
        filingId: data.filingId,
        stepType: data.stepType,
      });
      return step.toJSON();
    } catch (error) {
      logger.error("Failed to create filing step", error as Error, { data });
      throw error;
    }
  }

  /**
   * Update filing step status
   */
  async updateFilingStep(
    stepId: ObjectId,
    status: string,
    completedBy?: ObjectId,
    comments?: string
  ) {
    try {
      const update: Record<string, any> = { status };
      if (completedBy) update.completedBy = completedBy;
      if (comments) update.comments = comments;
      if (status === "completed") update.completedAt = new Date();

      const step = await FilingStepModel.findByIdAndUpdate(stepId, update, {
        new: true,
      }).lean();
      if (!step) {
        throw new Error(`Filing step not found: ${stepId}`);
      }
      logger.info("Filing step updated", { stepId, status });
      return step;
    } catch (error) {
      logger.error("Failed to update filing step", error as Error, { stepId });
      throw error;
    }
  }

  /**
   * Get all steps for a filing
   */
  async getFilingSteps(filingId: ObjectId) {
    try {
      const steps = await FilingStepModel.find({ filingId })
        .sort({ createdAt: 1 })
        .lean();
      return steps;
    } catch (error) {
      logger.error("Failed to get filing steps", error as Error, { filingId });
      throw error;
    }
  }

  /**
   * Get overdue filings (for alerts/notifications)
   */
  async getOverdueFilings() {
    try {
      const now = new Date();
      const overdueFilings = await GSTReturnFilingModel.find({
        $or: [
          { "gstr1.dueDate": { $lt: now }, "gstr1.filed": false },
          { "gstr3b.dueDate": { $lt: now }, "gstr3b.filed": false },
        ],
      })
        .select("_id clientId month gstr1 gstr3b")
        .lean();
      return overdueFilings;
    } catch (error) {
      logger.error("Failed to get overdue filings", error as Error);
      throw error;
    }
  }

  /**
   * Get filings due in next N days
   */
  async getUpcomingDueFilings(daysAhead: number = 7) {
    try {
      const now = new Date();
      const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

      const upcoming = await GSTReturnFilingModel.find({
        $or: [
          {
            "gstr1.dueDate": { $gte: now, $lte: future },
            "gstr1.filed": false,
          },
          {
            "gstr3b.dueDate": { $gte: now, $lte: future },
            "gstr3b.filed": false,
          },
        ],
      })
        .select("_id clientId month gstr1 gstr3b")
        .lean();
      return upcoming;
    } catch (error) {
      logger.error("Failed to get upcoming due filings", error as Error);
      throw error;
    }
  }

  /**
   * Get filing status report
   */
  async getFilingStatusReport(clientId: ObjectId, financialYear: string) {
    try {
      const filings = await GSTReturnFilingModel.aggregate([
        { $match: { clientId, financialYear } },
        {
          $group: {
            _id: null,
            totalFilings: { $sum: 1 },
            filledFilings: {
              $sum: { $cond: [{ $eq: ["$workflowStatus", "filed"] }, 1, 0] },
            },
            lockedFilings: { $sum: { $cond: [{ $eq: ["$isLocked", true] }, 1, 0] } },
            overdueFilings: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$workflowStatus", "overdue"] },
                      { $eq: ["$gstr3b.filed", false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            totalTaxPaid: { $sum: "$gstr3b.taxPaid" },
            totalITC: { $sum: "$gstr3b.itcClaimed" },
          },
        },
      ]);

      return filings[0] || {
        totalFilings: 0,
        filledFilings: 0,
        lockedFilings: 0,
        overdueFilings: 0,
      };
    } catch (error) {
      logger.error("Failed to get filing status report", error as Error, { clientId });
      throw error;
    }
  }
}

export default new FilingRepository();
