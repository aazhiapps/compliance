import { ObjectId } from "mongodb";
import FilingRepository from "../repositories/FilingRepository";
import { logger } from "../utils/logger";
import { webhookService } from "./WebhookService";

/**
 * FilingWorkflowService manages GST filing state machine
 * Controls valid state transitions and step workflows
 */

export type WorkflowStatus =
  | "draft"
  | "prepared"
  | "validated"
  | "filed"
  | "amendment"
  | "locked"
  | "archived";
export type FilingStepType =
  | "gstr1_prepare"
  | "gstr1_validate"
  | "gstr1_file"
  | "gstr3b_prepare"
  | "gstr3b_validate"
  | "gstr3b_file"
  | "amendment"
  | "lock_month"
  | "unlock_month";

interface WorkflowTransition {
  from: WorkflowStatus;
  to: WorkflowStatus;
  step?: FilingStepType;
  requires?: string[]; // Prerequisites like "gstr1_filed"
}

export class FilingWorkflowService {
  /**
   * Valid state transitions for GST filing
   */
  private validTransitions: WorkflowTransition[] = [
    { from: "draft", to: "prepared", step: "gstr1_prepare" },
    { from: "prepared", to: "validated", step: "gstr1_validate" },
    { from: "validated", to: "filed", step: "gstr1_file" },
    { from: "filed", to: "filed", step: "gstr3b_prepare" },
    { from: "filed", to: "filed", step: "gstr3b_validate" },
    { from: "filed", to: "filed", step: "gstr3b_file" },
    { from: "filed", to: "amendment" },
    { from: "amendment", to: "filed" },
    { from: "filed", to: "locked", step: "lock_month" },
    { from: "locked", to: "filed", step: "unlock_month" },
    { from: "locked", to: "archived" },
  ];

  /**
   * Check if a state transition is valid
   */
  canTransition(
    from: WorkflowStatus,
    to: WorkflowStatus,
    step?: FilingStepType,
  ): boolean {
    return this.validTransitions.some(
      (t) =>
        t.from === from && t.to === to && (!step || !t.step || t.step === step),
    );
  }

  /**
   * Transition filing to new status
   */
  async transitionFiling(
    filingId: ObjectId,
    fromStatus: WorkflowStatus,
    toStatus: WorkflowStatus,
    performedBy: ObjectId,
    stepType: FilingStepType,
    comments?: string,
  ) {
    try {
      // Validate transition
      if (!this.canTransition(fromStatus, toStatus, stepType)) {
        throw new Error(
          `Invalid transition: ${fromStatus} -> ${toStatus} with step ${stepType}`,
        );
      }

      // Create filing step (audit trail)
      const step = await FilingRepository.createFilingStep({
        filingId,
        stepType,
        status: "in_progress",
        title: this.getStepTitle(stepType),
        description: this.getStepDescription(stepType),
        performedBy,
        comments,
      });

      // Update filing status
      const filing = await FilingRepository.updateFiling(filingId, {
        workflowStatus: toStatus,
        currentStep: stepType,
      });

      logger.info("Filing transitioned", {
        filingId,
        from: fromStatus,
        to: toStatus,
        step: stepType,
        performedBy,
      });

      // Publish webhook event for filing status change
      try {
        const clientId =
          typeof filing.clientId === "string"
            ? new ObjectId(filing.clientId)
            : filing.clientId;
        const filingId_obj =
          typeof filing._id === "string"
            ? new ObjectId(filing._id)
            : filing._id;

        await webhookService.publishWebhookEvent({
          clientId,
          eventType: "filing.status_changed",
          entityType: "filing",
          entityId: filingId_obj,
          data: {
            filingId: filingId_obj,
            clientId,
            previousStatus: fromStatus,
            newStatus: toStatus,
            step: stepType,
            financialYear: filing.financialYear,
            month: filing.month,
            updatedAt: new Date().toISOString(),
          },
          source: "filing_service",
        });
      } catch (webhookError) {
        logger.warn("Failed to publish webhook for filing transition", {
          filingId,
          message: (webhookError as Error).message,
        });
        // Don't throw - webhook failure shouldn't block the filing transition
      }

      return { filing, step };
    } catch (error) {
      logger.error("Failed to transition filing", error as Error, {
        filingId,
        fromStatus,
        toStatus,
      });
      throw error;
    }
  }

  /**
   * Start GSTR-1 filing workflow
   */
  async startGSTR1Filing(filingId: ObjectId, performedBy: ObjectId) {
    try {
      const filing = await FilingRepository.getFilingById(filingId);

      // Move from draft to prepared
      return await this.transitionFiling(
        filingId,
        "draft" as WorkflowStatus,
        "prepared" as WorkflowStatus,
        performedBy,
        "gstr1_prepare",
        "Starting GSTR-1 filing process",
      );
    } catch (error) {
      logger.error("Failed to start GSTR-1 filing", error as Error, {
        filingId,
      });
      throw error;
    }
  }

  /**
   * Complete GSTR-1 filing
   */
  async completeGSTR1Filing(
    filingId: ObjectId,
    performedBy: ObjectId,
    arn: string,
    filedDate: Date,
  ) {
    try {
      const filing = await FilingRepository.getFilingById(filingId);

      // Update GSTR-1 details
      const updated = await FilingRepository.updateFiling(filingId, {
        gstr1: {
          ...filing.gstr1,
          filed: true,
          filedDate,
          arn,
        },
        workflowStatus: "filed" as WorkflowStatus,
      });

      logger.info("GSTR-1 filing completed", { filingId, arn });

      return updated;
    } catch (error) {
      logger.error("Failed to complete GSTR-1 filing", error as Error, {
        filingId,
      });
      throw error;
    }
  }

  /**
   * Complete GSTR-3B filing
   */
  async completeGSTR3BFiling(
    filingId: ObjectId,
    performedBy: ObjectId,
    arn: string,
    filedDate: Date,
    taxDetails: Record<string, any>,
  ) {
    try {
      const filing = await FilingRepository.getFilingById(filingId);

      // Update GSTR-3B details
      const updated = await FilingRepository.updateFiling(filingId, {
        gstr3b: {
          ...filing.gstr3b,
          filed: true,
          filedDate,
          arn,
          ...taxDetails,
        },
        workflowStatus: "filed" as WorkflowStatus,
      });

      logger.info("GSTR-3B filing completed", { filingId, arn });

      return updated;
    } catch (error) {
      logger.error("Failed to complete GSTR-3B filing", error as Error, {
        filingId,
      });
      throw error;
    }
  }

  /**
   * Lock filing month (prevent further edits)
   */
  async lockFilingMonth(
    filingId: ObjectId,
    lockedBy: ObjectId,
    reason: string = "Monthly filing complete",
  ) {
    try {
      const updated = await FilingRepository.lockFiling(
        filingId,
        lockedBy,
        reason,
      );

      // Create audit step
      await FilingRepository.createFilingStep({
        filingId,
        stepType: "lock_month",
        status: "completed",
        title: "Month Locked",
        description: "Filing month locked to prevent further modifications",
        performedBy: lockedBy,
        comments: reason,
        completedAt: new Date(),
      });

      logger.info("Filing month locked", { filingId, reason });

      return updated;
    } catch (error) {
      logger.error("Failed to lock filing month", error as Error, { filingId });
      throw error;
    }
  }

  /**
   * Unlock filing month (allow edits for amendment)
   */
  async unlockFilingMonth(
    filingId: ObjectId,
    unlockedBy: ObjectId,
    reason: string,
  ) {
    try {
      const updated = await FilingRepository.unlockFiling(filingId, unlockedBy);

      // Create audit step
      await FilingRepository.createFilingStep({
        filingId,
        stepType: "unlock_month",
        status: "completed",
        title: "Month Unlocked",
        description: "Filing month unlocked for amendments",
        performedBy: unlockedBy,
        comments: reason,
        completedAt: new Date(),
      });

      logger.info("Filing month unlocked", { filingId, reason });

      return updated;
    } catch (error) {
      logger.error("Failed to unlock filing month", error as Error, {
        filingId,
      });
      throw error;
    }
  }

  /**
   * Start amendment workflow
   */
  async startAmendment(
    filingId: ObjectId,
    performedBy: ObjectId,
    reason: string,
  ) {
    try {
      const filing = await FilingRepository.getFilingById(filingId);

      // Transition to amendment
      const updated = await FilingRepository.updateFiling(filingId, {
        workflowStatus: "amendment" as WorkflowStatus,
      });

      // Create amendment record
      await FilingRepository.createFilingStep({
        filingId,
        stepType: "amendment",
        status: "in_progress",
        title: "Amendment in Progress",
        description: `Amendment for filing`,
        performedBy,
        comments: reason,
      });

      logger.info("Amendment started", { filingId, reason });

      return updated;
    } catch (error) {
      logger.error("Failed to start amendment", error as Error, { filingId });
      throw error;
    }
  }

  /**
   * Complete amendment and return to filed state
   */
  async completeAmendment(
    filingId: ObjectId,
    performedBy: ObjectId,
    arn: string,
    formType: "gstr1" | "gstr3b",
  ) {
    try {
      const filing = await FilingRepository.getFilingById(filingId);

      // Update appropriate form with amendment details
      const updateData: Record<string, any> = {
        workflowStatus: "filed" as WorkflowStatus,
      };

      updateData[formType] = {
        ...filing[formType],
        filed: true,
        filedDate: new Date(),
        arn,
      };

      const updated = await FilingRepository.updateFiling(filingId, updateData);

      logger.info("Amendment completed", { filingId, formType, arn });

      return updated;
    } catch (error) {
      logger.error("Failed to complete amendment", error as Error, {
        filingId,
      });
      throw error;
    }
  }

  /**
   * Get available next steps for a filing
   */
  async getAvailableNextSteps(filingId: ObjectId): Promise<FilingStepType[]> {
    try {
      const filing = await FilingRepository.getFilingById(filingId);
      const currentStatus = filing.workflowStatus as WorkflowStatus;

      const available = this.validTransitions
        .filter((t) => t.from === currentStatus && t.step)
        .map((t) => t.step as FilingStepType);

      return available;
    } catch (error) {
      logger.error("Failed to get available next steps", error as Error, {
        filingId,
      });
      throw error;
    }
  }

  /**
   * Helper to get step title
   */
  private getStepTitle(stepType: FilingStepType): string {
    const titles: Record<FilingStepType, string> = {
      gstr1_prepare: "Prepare GSTR-1",
      gstr1_validate: "Validate GSTR-1",
      gstr1_file: "File GSTR-1",
      gstr3b_prepare: "Prepare GSTR-3B",
      gstr3b_validate: "Validate GSTR-3B",
      gstr3b_file: "File GSTR-3B",
      amendment: "Amendment",
      lock_month: "Lock Month",
      unlock_month: "Unlock Month",
    };
    return titles[stepType];
  }

  /**
   * Helper to get step description
   */
  private getStepDescription(stepType: FilingStepType): string {
    const descriptions: Record<FilingStepType, string> = {
      gstr1_prepare: "Preparing GSTR-1 with sales invoice details",
      gstr1_validate: "Validating GSTR-1 data before filing",
      gstr1_file: "Filing GSTR-1 with GST authorities",
      gstr3b_prepare: "Preparing GSTR-3B 2025 with tax liability",
      gstr3b_validate: "Validating GSTR-3B calculation",
      gstr3b_file: "Filing GSTR-3B with GST authorities",
      amendment: "Filing amendment for corrections",
      lock_month: "Locking month to prevent further modifications",
      unlock_month: "Unlocking month for amendments",
    };
    return descriptions[stepType];
  }
}

export default new FilingWorkflowService();
