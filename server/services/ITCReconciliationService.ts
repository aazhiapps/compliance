import { ObjectId } from "mongodb";
import ITCReconciliationRepository from "../repositories/ITCReconciliationRepository";
import { PurchaseInvoiceModel } from "../models/PurchaseInvoice";
import { logger } from "../utils/logger";

/**
 * ITCReconciliationService handles ITC reconciliation logic
 * Calculates discrepancies between claimed and available ITC
 * Auto-detects and flags items for review
 */

export interface ITCClaimData {
  clientId: string | ObjectId;
  month: string; // "2024-02"
  financialYear: string; // "2023-24"
}

export interface GSTPortalSyncData {
  availableITCFromGST: number;
  pendingITC: number;
  rejectedITC: number;
}

export interface ReconciliationResult {
  clientId: ObjectId;
  month: string;
  claimedITC: number;
  claimedInvoiceCount: number;
  claimedBreakdown: {
    sgst: number;
    cgst: number;
    igst: number;
  };
  availableITCFromGST?: number;
  discrepancy?: number;
  discrepancyPercentage?: number;
  discrepancyReason?: string;
  hasDiscrepancy: boolean;
  needsReview: boolean;
}

export interface DiscrepancyReport {
  totalMonths: number;
  monthsWithDiscrepancy: number;
  totalClaimed: number;
  totalAvailable: number;
  totalDiscrepancy: number;
  averageDiscrepancyPercentage: number;
  discrepancyByReason: Record<string, number>;
  flaggedForReview: number;
  resolved: number;
}

// Configuration thresholds for auto-review flagging
const AUTO_REVIEW_THRESHOLDS = {
  discrepancyPercentageThreshold: 5, // Flag if discrepancy > 5%
  absoluteDiscrepancyThreshold: 10000, // Flag if discrepancy > 10,000
  pendingITCThreshold: 50000, // Flag if pending > 50,000
  rejectedITCThreshold: 25000, // Flag if rejected > 25,000
};

export class ITCReconciliationService {
  /**
   * Calculate claimed ITC from purchase invoices
   */
  async calculateClaimedITC(data: ITCClaimData): Promise<ReconciliationResult> {
    try {
      const clientId = new ObjectId(data.clientId);

      // Fetch all purchase invoices for the month
      const invoices = await PurchaseInvoiceModel.find({
        clientId: typeof data.clientId === "string" ? data.clientId : data.clientId.toString(),
        month: data.month,
        financialYear: data.financialYear,
      }).lean();

      // Calculate totals
      let claimedITC = 0;
      let sgstTotal = 0;
      let cgstTotal = 0;
      let igstTotal = 0;

      invoices.forEach((invoice) => {
        claimedITC += invoice.cgst + invoice.sgst + invoice.igst;
        sgstTotal += invoice.sgst;
        cgstTotal += invoice.cgst;
        igstTotal += invoice.igst;
      });

      // Check if reconciliation already exists
      const existingRecord = await ITCReconciliationRepository.getReconciliationByMonth(
        clientId,
        data.month
      );

      if (existingRecord) {
        // Update existing record
        await ITCReconciliationRepository.updateWithGSTData(clientId, data.month, {
          claimedITC,
          claimedInvoiceCount: invoices.length,
        });
      } else {
        // Create new record
        await ITCReconciliationRepository.createReconciliation({
          clientId,
          month: data.month,
          financialYear: data.financialYear,
          claimedITC,
          claimedInvoiceCount: invoices.length,
          claimedBreakdown: {
            sgst: sgstTotal,
            cgst: cgstTotal,
            igst: igstTotal,
          },
        });
      }

      logger.info("Calculated claimed ITC", {
        clientId: clientId.toString(),
        month: data.month,
        claimedITC,
        invoiceCount: invoices.length,
      });

      return {
        clientId,
        month: data.month,
        claimedITC,
        claimedInvoiceCount: invoices.length,
        claimedBreakdown: {
          sgst: sgstTotal,
          cgst: cgstTotal,
          igst: igstTotal,
        },
        hasDiscrepancy: false,
        needsReview: false,
      };
    } catch (error) {
      logger.error("Failed to calculate claimed ITC", { error });
      throw error;
    }
  }

  /**
   * Sync ITC data with GST portal
   * This would typically be called via webhook or scheduled job
   */
  async syncWithGSTPortal(
    clientId: ObjectId,
    month: string,
    portalData: GSTPortalSyncData,
    syncedBy: ObjectId
  ): Promise<ReconciliationResult> {
    try {
      const record = await ITCReconciliationRepository.getReconciliationByMonth(clientId, month);

      if (!record) {
        throw new Error(`Reconciliation record not found for ${clientId} - ${month}`);
      }

      // Determine if needs review
      const needsReview = this.shouldFlagForReview(
        record.claimedITC,
        portalData.availableITCFromGST,
        portalData.pendingITC,
        portalData.rejectedITC
      );

      // Update with portal data
      const updated = await ITCReconciliationRepository.updateWithGSTData(
        clientId,
        month,
        {
          availableITCFromGST: portalData.availableITCFromGST,
          pendingITC: portalData.pendingITC,
          rejectedITC: portalData.rejectedITC,
          needsReview,
          syncedBy,
        }
      );

      logger.info("Synced with GST portal", {
        clientId: clientId.toString(),
        month,
        availableITC: portalData.availableITCFromGST,
        discrepancy: record.claimedITC - portalData.availableITCFromGST,
      });

      return {
        clientId,
        month,
        claimedITC: record.claimedITC,
        claimedInvoiceCount: record.claimedInvoiceCount,
        claimedBreakdown: record.claimedBreakdown || { sgst: 0, cgst: 0, igst: 0 },
        availableITCFromGST: portalData.availableITCFromGST,
        discrepancy: record.claimedITC - portalData.availableITCFromGST,
        discrepancyPercentage:
          portalData.availableITCFromGST > 0
            ? ((record.claimedITC - portalData.availableITCFromGST) /
                portalData.availableITCFromGST) *
              100
            : 0,
        hasDiscrepancy: Math.abs(record.claimedITC - portalData.availableITCFromGST) > 0.01,
        needsReview,
      };
    } catch (error) {
      logger.error("Failed to sync with GST portal", { error });
      throw error;
    }
  }

  /**
   * Auto-flag discrepancies for review based on thresholds
   */
  private shouldFlagForReview(
    claimedITC: number,
    availableITC: number,
    pendingITC: number,
    rejectedITC: number
  ): boolean {
    const discrepancy = claimedITC - availableITC;
    const discrepancyPercentage = availableITC > 0 ? (discrepancy / availableITC) * 100 : 100;

    // Flag if discrepancy percentage exceeds threshold
    if (Math.abs(discrepancyPercentage) > AUTO_REVIEW_THRESHOLDS.discrepancyPercentageThreshold) {
      return true;
    }

    // Flag if absolute discrepancy exceeds threshold
    if (Math.abs(discrepancy) > AUTO_REVIEW_THRESHOLDS.absoluteDiscrepancyThreshold) {
      return true;
    }

    // Flag if pending ITC is significant
    if (pendingITC > AUTO_REVIEW_THRESHOLDS.pendingITCThreshold) {
      return true;
    }

    // Flag if rejected ITC is significant
    if (rejectedITC > AUTO_REVIEW_THRESHOLDS.rejectedITCThreshold) {
      return true;
    }

    return false;
  }

  /**
   * Generate comprehensive ITC reconciliation report
   */
  async generateClientReport(
    clientId: ObjectId,
    financialYear?: string
  ): Promise<DiscrepancyReport> {
    try {
      // Get statistics
      const stats = await ITCReconciliationRepository.getClientStats(clientId, financialYear);

      // Get discrepancy breakdown
      const breakdown = await ITCReconciliationRepository.getDiscrepancyBreakdown(
        clientId,
        financialYear
      );

      // Get pending review count
      const pendingReview = await ITCReconciliationRepository.getPendingReview(clientId);

      // Get all reconciliations
      let reconciliations;
      if (financialYear) {
        reconciliations = await ITCReconciliationRepository.getFinancialYearReconciliations(
          clientId,
          financialYear
        );
      } else {
        reconciliations = await ITCReconciliationRepository.getClientReconciliations(clientId);
      }

      const report: DiscrepancyReport = {
        totalMonths: reconciliations.length,
        monthsWithDiscrepancy: stats.withDiscrepancies,
        totalClaimed: stats.totalClaimed,
        totalAvailable: stats.totalAvailable,
        totalDiscrepancy: stats.totalDiscrepancy,
        averageDiscrepancyPercentage: stats.averageDiscrepancyPercentage,
        discrepancyByReason: breakdown,
        flaggedForReview: stats.pendingReview,
        resolved: stats.resolved,
      };

      logger.info("Generated ITC reconciliation report", {
        clientId: clientId.toString(),
        financialYear: financialYear || "all",
        monthsWithDiscrepancy: report.monthsWithDiscrepancy,
      });

      return report;
    } catch (error) {
      logger.error("Failed to generate report", { error });
      throw error;
    }
  }

  /**
   * Get detailed discrepancy analysis for a month
   */
  async getMonthDiscrepancyAnalysis(
    clientId: ObjectId,
    month: string
  ): Promise<{
    month: string;
    claimed: number;
    available: number;
    pending: number;
    rejected: number;
    discrepancy: number;
    discrepancyPercentage: number;
    reason: string;
    invoiceBreakdown: any;
    recommendations: string[];
  }> {
    try {
      const record = await ITCReconciliationRepository.getReconciliationByMonth(clientId, month);

      if (!record) {
        throw new Error(`Reconciliation record not found for ${month}`);
      }

      const recommendations = this.getRecommendations(record);

      // Get invoice breakdown
      const invoices = await PurchaseInvoiceModel.find({
        clientId: clientId.toString(),
        month,
      })
        .lean()
        .exec();

      const invoiceBreakdown = {
        totalInvoices: invoices.length,
        totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        breakdown: {
          sgst: invoices.reduce((sum, inv) => sum + inv.sgst, 0),
          cgst: invoices.reduce((sum, inv) => sum + inv.cgst, 0),
          igst: invoices.reduce((sum, inv) => sum + inv.igst, 0),
        },
      };

      return {
        month,
        claimed: record.claimedITC,
        available: record.availableITCFromGST || 0,
        pending: record.pendingITC || 0,
        rejected: record.rejectedITC || 0,
        discrepancy: record.discrepancy,
        discrepancyPercentage: record.discrepancyPercentage || 0,
        reason: record.discrepancyReason || "unknown",
        invoiceBreakdown,
        recommendations,
      };
    } catch (error) {
      logger.error("Failed to get discrepancy analysis", { error });
      throw error;
    }
  }

  /**
   * Generate recommendations based on discrepancy pattern
   */
  private getRecommendations(record: any): string[] {
    const recommendations: string[] = [];

    if (record.discrepancy > 0) {
      recommendations.push(
        "Review purchase invoices to ensure all GSTs are correctly claimed"
      );
      recommendations.push("Check if invoices have been uploaded to GST portal in time");
      recommendations.push("Verify vendor GST registration status");
    }

    if (record.pendingITC && record.pendingITC > 0) {
      recommendations.push("Monitor pending ITC acceptance status on GST portal");
      recommendations.push(
        "Follow up with vendors for missing or incorrect invoice details"
      );
    }

    if (record.rejectedITC && record.rejectedITC > 0) {
      recommendations.push("Review rejected invoices for compliance issues");
      recommendations.push("Correct invoices and resubmit if eligible");
    }

    if (!recommendations.length) {
      recommendations.push("ITC reconciliation is complete - no action needed");
    }

    return recommendations;
  }

  /**
   * Bulk calculate claimed ITC for all clients in a month
   */
  async bulkCalculateClaimedITC(month: string, financialYear: string): Promise<number> {
    try {
      // Get unique clients from purchase invoices
      const clients = await PurchaseInvoiceModel.distinct("clientId", {
        month,
        financialYear,
      });

      let processed = 0;
      for (const clientId of clients) {
        try {
          await this.calculateClaimedITC({
            clientId,
            month,
            financialYear,
          });
          processed++;
        } catch (error) {
          logger.error("Failed to calculate ITC for client", { clientId, error });
        }
      }

      logger.info("Bulk calculated claimed ITC", {
        month,
        financialYear,
        processedClients: processed,
      });

      return processed;
    } catch (error) {
      logger.error("Failed to bulk calculate claimed ITC", { error });
      throw error;
    }
  }
}

export default new ITCReconciliationService();
