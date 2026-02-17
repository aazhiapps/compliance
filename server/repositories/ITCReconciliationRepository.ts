import { ITCReconciliationModel, ITCReconciliationRecord } from "../models/ITCReconciliation";
import { ObjectId } from "mongodb";
import { logger } from "../utils/logger";

/**
 * ITCReconciliationRepository handles all database operations for ITC reconciliation
 * Manages claimed vs available ITC tracking and discrepancy detection
 */

export interface CreateITCReconciliationInput {
  clientId: ObjectId;
  month: string; // "2024-02"
  financialYear: string; // "2023-24"
  claimedITC: number;
  claimedInvoiceCount: number;
  claimedBreakdown?: {
    sgst: number;
    cgst: number;
    igst: number;
  };
}

export interface UpdateITCReconciliationInput {
  availableITCFromGST?: number;
  pendingITC?: number;
  rejectedITC?: number;
  discrepancy?: number;
  discrepancyPercentage?: number;
  discrepancyReason?: string;
  discrepancyDescription?: string;
  hasDiscrepancy?: boolean;
  needsReview?: boolean;
  lastSyncedAt?: Date;
  syncedBy?: ObjectId;
}

export interface ResolveDiscrepancyInput {
  resolution: string;
  resolvedBy: ObjectId;
}

export interface ITCReconciliationFilter {
  clientId?: ObjectId;
  month?: string;
  financialYear?: string;
  hasDiscrepancy?: boolean;
  needsReview?: boolean;
  discrepancyReason?: string;
}

export interface ITCStats {
  totalClaimed: number;
  totalAvailable: number;
  totalDiscrepancy: number;
  averageDiscrepancyPercentage: number;
  withDiscrepancies: number;
  pendingReview: number;
  resolved: number;
}

export class ITCReconciliationRepository {
  /**
   * Create a new ITC reconciliation record
   */
  async createReconciliation(
    data: CreateITCReconciliationInput
  ): Promise<ITCReconciliationRecord> {
    try {
      const record = await ITCReconciliationModel.create({
        ...data,
        hasDiscrepancy: false,
        needsReview: false,
      });
      logger.info("Created ITC reconciliation record", {
        clientId: data.clientId.toString(),
        month: data.month,
        claimedITC: data.claimedITC,
      });
      return record;
    } catch (error) {
      logger.error("Failed to create ITC reconciliation record", { error });
      throw error;
    }
  }

  /**
   * Get reconciliation record by clientId and month
   */
  async getReconciliationByMonth(
    clientId: ObjectId,
    month: string
  ): Promise<ITCReconciliationRecord | null> {
    try {
      return await ITCReconciliationModel.findOne({
        clientId,
        month,
      }).lean();
    } catch (error) {
      logger.error("Failed to fetch reconciliation by month", { error });
      throw error;
    }
  }

  /**
   * Get all reconciliation records for a client
   */
  async getClientReconciliations(clientId: ObjectId): Promise<ITCReconciliationRecord[]> {
    try {
      return await ITCReconciliationModel.find({ clientId })
        .sort({ month: -1 })
        .lean();
    } catch (error) {
      logger.error("Failed to fetch client reconciliations", { error });
      throw error;
    }
  }

  /**
   * Get reconciliation records for a financial year
   */
  async getFinancialYearReconciliations(
    clientId: ObjectId,
    financialYear: string
  ): Promise<ITCReconciliationRecord[]> {
    try {
      return await ITCReconciliationModel.find({
        clientId,
        financialYear,
      })
        .sort({ month: 1 })
        .lean();
    } catch (error) {
      logger.error("Failed to fetch financial year reconciliations", { error });
      throw error;
    }
  }

  /**
   * Update reconciliation with GST portal data
   */
  async updateWithGSTData(
    clientId: ObjectId,
    month: string,
    data: UpdateITCReconciliationInput & { syncedBy: ObjectId }
  ): Promise<ITCReconciliationRecord> {
    try {
      // Calculate discrepancy if we have both values
      let discrepancy = undefined;
      let discrepancyPercentage = undefined;
      let discrepancyReason = undefined;

      const record = await ITCReconciliationModel.findOne({
        clientId,
        month,
      });

      if (!record) {
        throw new Error("Reconciliation record not found");
      }

      if (data.availableITCFromGST !== undefined) {
        discrepancy = record.claimedITC - data.availableITCFromGST;
        if (data.availableITCFromGST > 0) {
          discrepancyPercentage = (discrepancy / data.availableITCFromGST) * 100;
        }

        // Auto-detect discrepancy reason
        if (discrepancy > 0) {
          discrepancyReason = "excess_claimed";
        } else if (discrepancy < 0) {
          discrepancyReason = "unclaimed";
        } else {
          discrepancyReason = "reconciled";
        }
      }

      const updated = await ITCReconciliationModel.findOneAndUpdate(
        { clientId, month },
        {
          ...data,
          discrepancy:
            discrepancy !== undefined ? discrepancy : data.discrepancy,
          discrepancyPercentage:
            discrepancyPercentage !== undefined
              ? discrepancyPercentage
              : data.discrepancyPercentage,
          discrepancyReason:
            discrepancyReason !== undefined
              ? discrepancyReason
              : data.discrepancyReason,
          hasDiscrepancy:
            data.hasDiscrepancy !== undefined
              ? data.hasDiscrepancy
              : discrepancy !== undefined && Math.abs(discrepancy) > 0.01,
          lastSyncedAt: data.lastSyncedAt || new Date(),
        },
        { new: true }
      ).lean();

      logger.info("Updated reconciliation with GST data", {
        clientId: clientId.toString(),
        month,
        discrepancy,
      });

      return updated!;
    } catch (error) {
      logger.error("Failed to update reconciliation with GST data", { error });
      throw error;
    }
  }

  /**
   * Resolve a discrepancy
   */
  async resolveDiscrepancy(
    clientId: ObjectId,
    month: string,
    data: ResolveDiscrepancyInput
  ): Promise<ITCReconciliationRecord> {
    try {
      const updated = await ITCReconciliationModel.findOneAndUpdate(
        { clientId, month },
        {
          resolution: data.resolution,
          resolvedBy: data.resolvedBy,
          resolvedAt: new Date(),
          hasDiscrepancy: false,
          needsReview: false,
          discrepancyReason: "reconciled",
        },
        { new: true }
      ).lean();

      if (!updated) {
        throw new Error("Reconciliation record not found");
      }

      logger.info("Resolved discrepancy", {
        clientId: clientId.toString(),
        month,
        resolution: data.resolution,
      });

      return updated;
    } catch (error) {
      logger.error("Failed to resolve discrepancy", { error });
      throw error;
    }
  }

  /**
   * Mark reconciliation for review
   */
  async markForReview(clientId: ObjectId, month: string): Promise<ITCReconciliationRecord> {
    try {
      const updated = await ITCReconciliationModel.findOneAndUpdate(
        { clientId, month },
        {
          needsReview: true,
          updatedAt: new Date(),
        },
        { new: true }
      ).lean();

      if (!updated) {
        throw new Error("Reconciliation record not found");
      }

      return updated;
    } catch (error) {
      logger.error("Failed to mark for review", { error });
      throw error;
    }
  }

  /**
   * Get all reconciliation records with discrepancies
   */
  async getDiscrepancies(
    filter?: ITCReconciliationFilter
  ): Promise<ITCReconciliationRecord[]> {
    try {
      const query: Record<string, any> = { hasDiscrepancy: true };

      if (filter?.clientId) query.clientId = filter.clientId;
      if (filter?.financialYear) query.financialYear = filter.financialYear;
      if (filter?.discrepancyReason)
        query.discrepancyReason = filter.discrepancyReason;

      return await ITCReconciliationModel.find(query)
        .sort({ month: -1 })
        .lean();
    } catch (error) {
      logger.error("Failed to fetch discrepancies", { error });
      throw error;
    }
  }

  /**
   * Get reconciliation records pending review
   */
  async getPendingReview(
    clientId?: ObjectId
  ): Promise<ITCReconciliationRecord[]> {
    try {
      const query: Record<string, any> = { needsReview: true };
      if (clientId) query.clientId = clientId;

      return await ITCReconciliationModel.find(query)
        .sort({ createdAt: -1 })
        .lean();
    } catch (error) {
      logger.error("Failed to fetch pending review", { error });
      throw error;
    }
  }

  /**
   * Get ITC reconciliation statistics for a client
   */
  async getClientStats(
    clientId: ObjectId,
    financialYear?: string
  ): Promise<ITCStats> {
    try {
      const query: Record<string, any> = { clientId };
      if (financialYear) query.financialYear = financialYear;

      const records = await ITCReconciliationModel.find(query).lean();

      if (records.length === 0) {
        return {
          totalClaimed: 0,
          totalAvailable: 0,
          totalDiscrepancy: 0,
          averageDiscrepancyPercentage: 0,
          withDiscrepancies: 0,
          pendingReview: 0,
          resolved: 0,
        };
      }

      const stats: ITCStats = {
        totalClaimed: 0,
        totalAvailable: 0,
        totalDiscrepancy: 0,
        averageDiscrepancyPercentage: 0,
        withDiscrepancies: 0,
        pendingReview: 0,
        resolved: 0,
      };

      let validDiscrepancyCount = 0;

      records.forEach((record) => {
        stats.totalClaimed += record.claimedITC;
        if (record.availableITCFromGST)
          stats.totalAvailable += record.availableITCFromGST;
        stats.totalDiscrepancy += record.discrepancy;

        if (record.discrepancyPercentage > 0) {
          stats.averageDiscrepancyPercentage += record.discrepancyPercentage;
          validDiscrepancyCount++;
        }

        if (record.hasDiscrepancy) stats.withDiscrepancies++;
        if (record.needsReview) stats.pendingReview++;
        if (record.discrepancyReason === "reconciled") stats.resolved++;
      });

      if (validDiscrepancyCount > 0) {
        stats.averageDiscrepancyPercentage /= validDiscrepancyCount;
      }

      return stats;
    } catch (error) {
      logger.error("Failed to get client statistics", { error });
      throw error;
    }
  }

  /**
   * Get aggregated ITC data by discrepancy reason
   */
  async getDiscrepancyBreakdown(
    clientId: ObjectId,
    financialYear?: string
  ): Promise<Record<string, number>> {
    try {
      const query: Record<string, any> = {
        clientId,
        discrepancyReason: { $exists: true, $ne: null },
      };
      if (financialYear) query.financialYear = financialYear;

      const results = await ITCReconciliationModel.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$discrepancyReason",
            count: { $sum: 1 },
            totalDiscrepancy: { $sum: "$discrepancy" },
          },
        },
      ]);

      const breakdown: Record<string, number> = {
        excess_claimed: 0,
        unclaimed: 0,
        gst_rejected: 0,
        pending_acceptance: 0,
        reconciled: 0,
        awaiting_gstr2b: 0,
      };

      results.forEach((result) => {
        if (result._id in breakdown) {
          breakdown[result._id] = result.count;
        }
      });

      return breakdown;
    } catch (error) {
      logger.error("Failed to get discrepancy breakdown", { error });
      throw error;
    }
  }

  /**
   * Check if reconciliation exists for a client-month
   */
  async exists(clientId: ObjectId, month: string): Promise<boolean> {
    try {
      const count = await ITCReconciliationModel.countDocuments({
        clientId,
        month,
      });
      return count > 0;
    } catch (error) {
      logger.error("Failed to check reconciliation existence", { error });
      throw error;
    }
  }

  /**
   * Delete reconciliation record (soft delete)
   */
  async deleteReconciliation(clientId: ObjectId, month: string): Promise<void> {
    try {
      await ITCReconciliationModel.deleteOne({
        clientId,
        month,
      });
      logger.info("Deleted reconciliation record", {
        clientId: clientId.toString(),
        month,
      });
    } catch (error) {
      logger.error("Failed to delete reconciliation", { error });
      throw error;
    }
  }
}

export default new ITCReconciliationRepository();
