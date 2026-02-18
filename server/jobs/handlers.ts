import { Job } from "bull";
import mongoose from "mongoose";
import { logger } from "../utils/logger";
import JobLogModel from "../models/JobLog";
import { NotificationModel } from "../models/Notification";
import ITCReconciliationService from "../services/ITCReconciliationService";
import ITCReconciliationRepository from "../repositories/ITCReconciliationRepository";
import { GSTClientModel } from "../models/GSTClient";
import { GSTReturnFilingModel } from "../models/GSTReturnFiling";
import { PurchaseInvoiceModel } from "../models/PurchaseInvoice";

/**
 * Background job handlers for GST compliance platform
 * Manages automated syncs, notifications, reminders, and cleanup
 */

/**
 * ITC Sync Job Handler
 * Automatically syncs ITC data with GST portal for all clients
 */
export async function handleITCSync(job: Job): Promise<void> {
  const jobLog = await JobLogModel.create({
    jobName: "ITC Sync",
    jobType: "itc_sync",
    status: "running",
    triggeredBy: "schedule",
    progress: 0,
  });

  try {
    const startTime = Date.now();

    // Get all clients
    const clients = await GSTClientModel.find({ active: true }).lean();
    if (!clients.length) {
      logger.info("No active clients found for ITC sync");
      jobLog.status = "completed";
      jobLog.processed = 0;
      jobLog.successful = 0;
      jobLog.duration = Date.now() - startTime;
      await jobLog.save();
      return;
    }

    let successful = 0;
    let failed = 0;

    // Process each client
    for (let i = 0; i < clients.length; i++) {
      try {
        const client = clients[i];
        const currentDate = new Date();
        const month = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
        const financialYear =
          currentDate.getMonth() < 3
            ? `${currentDate.getFullYear() - 1}-${currentDate.getFullYear().toString().slice(-2)}`
            : `${currentDate.getFullYear()}-${(currentDate.getFullYear() + 1).toString().slice(-2)}`;

        // Calculate claimed ITC
        await ITCReconciliationService.calculateClaimedITC({
          clientId: client._id,
          month,
          financialYear,
        });

        // In production, would fetch from GST portal API here
        // For now, we'll simulate portal sync
        const invoiceCount = await PurchaseInvoiceModel.countDocuments({
          clientId: client._id.toString(),
          month,
        });

        if (invoiceCount > 0) {
          // Simulate 5% variance from claimed for demo
          const invoices = await PurchaseInvoiceModel.find({
            clientId: client._id.toString(),
            month,
          }).lean();

          const claimedITC = invoices.reduce(
            (sum, inv) => sum + inv.cgst + inv.sgst + inv.igst,
            0,
          );

          const portalITC = Math.floor(claimedITC * 0.95); // 5% variance

          await ITCReconciliationService.syncWithGSTPortal(
            client._id,
            month,
            {
              availableITCFromGST: portalITC,
              pendingITC: Math.floor(claimedITC * 0.02),
              rejectedITC: 0,
            },
            new mongoose.Types.ObjectId(), // System user ID
          );
        }

        successful++;
        job.progress(((i + 1) / clients.length) * 100);
      } catch (error) {
        failed++;
        logger.error("Failed to process ITC sync for client:", {
          clientId: clients[i]._id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    jobLog.status = "completed";
    jobLog.processed = clients.length;
    jobLog.successful = successful;
    jobLog.failed = failed;
    jobLog.duration = Date.now() - startTime;
    jobLog.summary = {
      clientsProcessed: successful,
      clientsFailed: failed,
      totalClients: clients.length,
    };

    await jobLog.save();

    logger.info("ITC sync completed:", {
      processed: clients.length,
      successful,
      failed,
    });
  } catch (error) {
    jobLog.status = "failed";
    jobLog.error = String(error);
    jobLog.duration = Date.now() - Date.parse(jobLog.createdAt.toISOString());
    await jobLog.save();

    logger.error("ITC sync job failed:", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Filing Reminder Job Handler
 * Sends reminders for upcoming due filings
 */
export async function handleFilingReminder(job: Job): Promise<void> {
  const jobLog = await JobLogModel.create({
    jobName: "Filing Reminder",
    jobType: "filing_reminder",
    status: "running",
    triggeredBy: "schedule",
    progress: 0,
  });

  try {
    const startTime = Date.now();

    // Get filings due in next 5 days
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);

    const upcomingFilings = await GSTReturnFilingModel.find({
      gstr1DueDate: { $lte: dueDate, $gte: new Date() } as any,
      gstr1Status: { $ne: "filed" },
    }).populate("clientId");

    let processed = 0;

    for (const _filing of upcomingFilings) {
      try {
        // Here we would create notifications
        // The NotificationService will be called
        processed++;
        job.progress((processed / upcomingFilings.length) * 100);
      } catch (error) {
        logger.error("Failed to create filing reminder:", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    jobLog.status = "completed";
    jobLog.processed = upcomingFilings.length;
    jobLog.successful = processed;
    jobLog.duration = Date.now() - startTime;
    await jobLog.save();

    logger.info("Filing reminder job completed:", { processed });
  } catch (error) {
    jobLog.status = "failed";
    jobLog.error = String(error);
    jobLog.duration = Date.now() - Date.parse(jobLog.createdAt.toISOString());
    await jobLog.save();

    logger.error("Filing reminder job failed:", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Notification Sender Job Handler
 * Sends pending notifications via configured channels
 */
export async function handleNotificationSend(
  job: Job<{ notificationId: string }>,
): Promise<void> {
  const { notificationId } = job.data;

  const jobLog = await JobLogModel.create({
    jobName: "Send Notification",
    jobType: "notification_send",
    status: "running",
    triggeredBy: "api",
    progress: 0,
  });

  try {
    const startTime = Date.now();

    const notification = await NotificationModel.findById(notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    let sent = false;

    // Send via configured channels
    for (const channel of notification.channels) {
      try {
        if (channel === "email") {
          // Email sending logic (stubbed for demo)
          logger.info("Sending email notification", { notificationId });
          notification.emailDelivered = true;
          sent = true;
        } else if (channel === "sms") {
          // SMS sending logic (stubbed for demo)
          logger.info("Sending SMS notification", { notificationId });
          sent = true;
        } else if (channel === "in_app") {
          // In-app notification (always succeeds)
          sent = true;
        }
      } catch (error) {
        logger.error(`Failed to send ${channel} notification:`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (sent) {
      notification.status = "sent";
      notification.sentAt = new Date();
    }

    await notification.save();

    jobLog.status = "completed";
    jobLog.processed = 1;
    jobLog.successful = sent ? 1 : 0;
    jobLog.duration = Date.now() - startTime;
    await jobLog.save();
  } catch (error) {
    jobLog.status = "failed";
    jobLog.error = String(error);
    jobLog.duration = Date.now() - Date.parse(jobLog.createdAt.toISOString());
    await jobLog.save();

    logger.error("Notification send job failed:", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Compliance Check Job Handler
 * Performs periodic compliance checks on clients
 */
export async function handleComplianceCheck(job: Job): Promise<void> {
  const jobLog = await JobLogModel.create({
    jobName: "Compliance Check",
    jobType: "compliance_check",
    status: "running",
    triggeredBy: "schedule",
    progress: 0,
  });

  try {
    const startTime = Date.now();

    const clients = await GSTClientModel.find({ active: true }).lean();
    let processed = 0;
    let issues = 0;

    for (const client of clients) {
      try {
        // Check for overdue filings
        const overdueFilings = await GSTReturnFilingModel.find({
          clientId: client._id as any,
          gstr1Status: { $ne: "filed" },
          gstr1DueDate: { $lt: new Date() } as any,
        });

        if (overdueFilings.length > 0) {
          issues += overdueFilings.length;
        }

        // Check for unresolved ITC discrepancies
        const unresolvedDiscrepancies =
          await ITCReconciliationRepository.getDiscrepancies({
            clientId: client._id,
          });

        if (unresolvedDiscrepancies.length > 0) {
          issues += unresolvedDiscrepancies.length;
        }

        processed++;
        job.progress((processed / clients.length) * 100);
      } catch (error) {
        logger.error("Failed compliance check for client:", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    jobLog.status = "completed";
    jobLog.processed = clients.length;
    jobLog.successful = processed;
    jobLog.duration = Date.now() - startTime;
    jobLog.summary = {
      complianceIssuesFound: issues,
      clientsChecked: processed,
    };
    await jobLog.save();

    logger.info("Compliance check completed:", { processed, issues });
  } catch (error) {
    jobLog.status = "failed";
    jobLog.error = String(error);
    jobLog.duration = Date.now() - Date.parse(jobLog.createdAt.toISOString());
    await jobLog.save();

    logger.error("Compliance check job failed:", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Data Cleanup Job Handler
 * Cleans up old logs and completed jobs
 */
export async function handleDataCleanup(_job: Job): Promise<void> {
  const jobLog = await JobLogModel.create({
    jobName: "Data Cleanup",
    jobType: "cleanup",
    status: "running",
    triggeredBy: "schedule",
    progress: 0,
  });

  try {
    const startTime = Date.now();

    // Delete logs older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await JobLogModel.deleteMany({
      createdAt: { $lt: ninetyDaysAgo },
    });

    jobLog.status = "completed";
    jobLog.processed = result.deletedCount || 0;
    jobLog.successful = result.deletedCount || 0;
    jobLog.duration = Date.now() - startTime;
    await jobLog.save();

    logger.info("Data cleanup completed:", {
      logsDeleted: result.deletedCount,
    });
  } catch (error) {
    jobLog.status = "failed";
    jobLog.error = String(error);
    jobLog.duration = Date.now() - Date.parse(jobLog.createdAt.toISOString());
    await jobLog.save();

    logger.error("Data cleanup job failed:", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Report Generation Job Handler
 * Generates periodic reports for clients
 */
export async function handleReportGeneration(
  job: Job<{ clientId: string; reportType: string }>,
): Promise<void> {
  const { clientId, reportType } = job.data;

  const jobLog = await JobLogModel.create({
    jobName: "Report Generation",
    jobType: "report_generation",
    status: "running",
    clientId: new mongoose.Types.ObjectId(clientId),
    triggeredBy: "api",
    progress: 0,
  });

  try {
    const startTime = Date.now();

    logger.info("Generating report:", { clientId, reportType });

    // Generate different reports based on type
    switch (reportType) {
      case "itc_reconciliation":
        // Generate ITC reconciliation report
        const report = await ITCReconciliationService.generateClientReport(
          new mongoose.Types.ObjectId(clientId),
        );
        logger.info("ITC reconciliation report generated:", report);
        break;

      case "filing_status":
        // Generate filing status report
        const filings = await GSTReturnFilingModel.find({
          clientId,
        }).lean();
        logger.info("Filing status report generated:", {
          totalFilings: filings.length,
        });
        break;

      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    jobLog.status = "completed";
    jobLog.processed = 1;
    jobLog.successful = 1;
    jobLog.duration = Date.now() - startTime;
    await jobLog.save();
  } catch (error) {
    jobLog.status = "failed";
    jobLog.error = String(error);
    jobLog.duration = Date.now() - Date.parse(jobLog.createdAt.toISOString());
    await jobLog.save();

    logger.error("Report generation job failed:", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Webhook Delivery Job Handler
 * Processes webhook events and delivers them to subscribed endpoints
 */
export async function handleWebhookDelivery(job: Job): Promise<void> {
  const { eventId } = job.data;

  const jobLog = await JobLogModel.create({
    jobName: "Webhook Delivery",
    jobType: "webhook_delivery",
    status: "running",
    triggeredBy: "event",
    progress: 0,
    metadata: { eventId },
  });

  try {
    const startTime = Date.now();
    const { webhookService } = await import("../services/WebhookService");

    await webhookService.processWebhookEventDelivery(
      new mongoose.Types.ObjectId(eventId),
    );

    jobLog.status = "completed";
    jobLog.successful = 1;
    jobLog.processed = 1;
    jobLog.duration = Date.now() - startTime;
    jobLog.progress = 100;
    await jobLog.save();

    logger.info("Webhook delivery completed", {
      eventId,
      duration: jobLog.duration,
    });
  } catch (error) {
    logger.error("Webhook delivery failed", {
      eventId: eventId.toString(),
      error: (error as Error).message,
    });

    jobLog.status = "failed";
    jobLog.failed = 1;
    jobLog.duration = Date.now() - jobLog.createdAt.getTime();
    jobLog.errorMessage = (error as Error).message;
    jobLog.errorStack = (error as Error).stack;
    await jobLog.save();
  }
}

/**
 * Webhook Retry Handler
 * Retries failed webhook deliveries with exponential backoff
 */
export async function handleWebhookRetry(job: Job): Promise<void> {
  const { deliveryId } = job.data;

  const jobLog = await JobLogModel.create({
    jobName: "Webhook Retry",
    jobType: "webhook_retry",
    status: "running",
    triggeredBy: "retry",
    progress: 0,
    metadata: { deliveryId },
  });

  try {
    const startTime = Date.now();
    const { webhookService } = await import("../services/WebhookService");

    await webhookService.retryWebhookDelivery(
      new mongoose.Types.ObjectId(deliveryId),
    );

    jobLog.status = "completed";
    jobLog.successful = 1;
    jobLog.processed = 1;
    jobLog.duration = Date.now() - startTime;
    jobLog.progress = 100;
    await jobLog.save();

    logger.info("Webhook retry completed", {
      deliveryId,
      duration: jobLog.duration,
    });
  } catch (error) {
    logger.error("Webhook retry failed", {
      deliveryId: deliveryId.toString(),
      error: (error as Error).message,
    });

    jobLog.status = "failed";
    jobLog.failed = 1;
    jobLog.duration = Date.now() - jobLog.createdAt.getTime();
    jobLog.errorMessage = (error as Error).message;
    jobLog.errorStack = (error as Error).stack;
    await jobLog.save();
  }
}
