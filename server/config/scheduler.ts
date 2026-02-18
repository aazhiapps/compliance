import cron from "node-cron";
import { logger } from "../utils/logger";
import {
  handleITCSync,
  handleFilingReminder,
  handleComplianceCheck,
  handleDataCleanup,
  handleComplianceEventDetection,
  handleComplianceReminders,
  handleTokenCleanup,
} from "../jobs/handlers";

/**
 * Scheduler Configuration
 * PHASE 1: Automated Compliance Monitoring Jobs
 * 
 * Manages cron jobs for recurring tasks:
 * - Compliance event detection
 * - Compliance reminders
 * - ITC synchronization
 * - Filing reminders
 * - Token cleanup
 * - Data cleanup
 */

export class Scheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Initialize all scheduled jobs
   */
  start(): void {
    logger.info("Starting scheduler...");

    // PHASE 1: Compliance Event Detection - Every hour
    this.scheduleJob(
      "compliance-event-detection",
      "0 * * * *", // Every hour at minute 0
      async () => {
        logger.info("Running compliance event detection job");
        await handleComplianceEventDetection({} as any);
      }
    );

    // PHASE 1: Compliance Reminders - Every day at 9 AM
    this.scheduleJob(
      "compliance-reminders",
      "0 9 * * *", // Daily at 9 AM
      async () => {
        logger.info("Running compliance reminders job");
        await handleComplianceReminders({} as any);
      }
    );

    // PHASE 1: Token Cleanup - Every day at 2 AM
    this.scheduleJob(
      "token-cleanup",
      "0 2 * * *", // Daily at 2 AM
      async () => {
        logger.info("Running token cleanup job");
        await handleTokenCleanup({} as any);
      }
    );

    // ITC Sync - Every day at 6 AM
    this.scheduleJob(
      "itc-sync",
      "0 6 * * *", // Daily at 6 AM
      async () => {
        logger.info("Running ITC sync job");
        await handleITCSync({} as any);
      }
    );

    // Filing Reminders - Every day at 8 AM
    this.scheduleJob(
      "filing-reminder",
      "0 8 * * *", // Daily at 8 AM
      async () => {
        logger.info("Running filing reminder job");
        await handleFilingReminder({} as any);
      }
    );

    // Compliance Check - Every 6 hours
    this.scheduleJob(
      "compliance-check",
      "0 */6 * * *", // Every 6 hours
      async () => {
        logger.info("Running compliance check job");
        await handleComplianceCheck({} as any);
      }
    );

    // Data Cleanup - Every week on Sunday at 3 AM
    this.scheduleJob(
      "data-cleanup",
      "0 3 * * 0", // Every Sunday at 3 AM
      async () => {
        logger.info("Running data cleanup job");
        await handleDataCleanup({} as any);
      }
    );

    logger.info(`Scheduler started with ${this.jobs.size} jobs`);
  }

  /**
   * Schedule a cron job
   */
  private scheduleJob(
    name: string,
    schedule: string,
    handler: () => Promise<void>
  ): void {
    try {
      const task = cron.schedule(schedule, async () => {
        try {
          await handler();
        } catch (error) {
          logger.error(`Error in scheduled job '${name}':`, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      this.jobs.set(name, task);
      logger.info(`Scheduled job '${name}' with cron: ${schedule}`);
    } catch (error) {
      logger.error(`Failed to schedule job '${name}':`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stop(): void {
    logger.info("Stopping scheduler...");

    for (const [name, task] of this.jobs) {
      task.stop();
      logger.info(`Stopped job '${name}'`);
    }

    this.jobs.clear();
    logger.info("Scheduler stopped");
  }

  /**
   * Get status of all scheduled jobs
   */
  getJobsStatus(): Array<{ name: string; running: boolean }> {
    const status: Array<{ name: string; running: boolean }> = [];

    for (const [name, task] of this.jobs) {
      status.push({
        name,
        running: task !== undefined, // Basic check, could be enhanced
      });
    }

    return status;
  }

  /**
   * Manually trigger a specific job
   */
  async triggerJob(name: string): Promise<boolean> {
    const jobHandlers: Record<string, () => Promise<void>> = {
      "compliance-event-detection": async () => await handleComplianceEventDetection({} as any),
      "compliance-reminders": async () => await handleComplianceReminders({} as any),
      "token-cleanup": async () => await handleTokenCleanup({} as any),
      "itc-sync": async () => await handleITCSync({} as any),
      "filing-reminder": async () => await handleFilingReminder({} as any),
      "compliance-check": async () => await handleComplianceCheck({} as any),
      "data-cleanup": async () => await handleDataCleanup({} as any),
    };

    const handler = jobHandlers[name];
    if (!handler) {
      logger.error(`Job '${name}' not found`);
      return false;
    }

    try {
      logger.info(`Manually triggering job '${name}'`);
      await handler();
      logger.info(`Job '${name}' completed successfully`);
      return true;
    } catch (error) {
      logger.error(`Error triggering job '${name}':`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

// Export singleton instance
export const scheduler = new Scheduler();
