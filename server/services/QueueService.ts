import Queue, { Queue as BullQueue, Job } from "bull";
import { logger } from "../utils/logger";

/**
 * QueueService manages Bull queues for background jobs
 * Handles job scheduling, retry logic, and event management
 */

export type JobType =
  | "itc_sync"
  | "notification_send"
  | "filing_reminder"
  | "compliance_check"
  | "report_generation"
  | "cleanup"
  | "webhook_retry";

interface JobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: "fixed" | "exponential";
    delay: number;
  };
  removeOnComplete?: boolean | { age: number };
  removeOnFail?: boolean;
}

interface JobData {
  [key: string]: any;
}

class QueueService {
  private queues: Map<string, BullQueue> = new Map();
  private redisUrl: string;

  constructor() {
    this.redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
  }

  /**
   * Get or create a queue by name
   */
  private getQueue(queueName: string): BullQueue {
    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, this.redisUrl, {
        settings: {
          maxStalledCount: 2,
          maxStalledInterval: 5000,
          stalledInterval: 5000,
          retryProcessDelay: 5000,
          guardInterval: 5000,
          lockRenewTime: 15000,
        },
      });

      // Setup event listeners
      this.setupQueueListeners(queue);
      this.queues.set(queueName, queue);
    }
    return this.queues.get(queueName)!;
  }

  /**
   * Setup event listeners for a queue
   */
  private setupQueueListeners(queue: BullQueue): void {
    queue.on("error", (error) => {
      logger.error(`Queue ${queue.name} error:`, { error });
    });

    queue.on("failed", (job, error) => {
      logger.error(`Job ${job.name} (${job.id}) failed:`, {
        error: error.message,
        jobId: job.id,
      });
    });

    queue.on("stalled", (job) => {
      logger.warn(`Job ${job.name} (${job.id}) stalled`, { jobId: job.id });
    });

    queue.on("completed", (job) => {
      logger.info(`Job ${job.name} (${job.id}) completed`, {
        jobId: job.id,
        processingTime: job.finishedOn ? job.finishedOn - job.processedOn : 0,
      });
    });
  }

  /**
   * Add a job to a queue
   */
  async addJob<T extends JobData>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobOptions
  ): Promise<Job<T>> {
    try {
      const queue = this.getQueue(queueName);
      const jobOptions = {
        priority: options?.priority || 0,
        attempts: options?.attempts || 3,
        backoff: options?.backoff || {
          type: "exponential" as const,
          delay: 2000,
        },
        delay: options?.delay,
        removeOnComplete: options?.removeOnComplete || { age: 3600 }, // Keep for 1 hour
        removeOnFail: options?.removeOnFail || false,
      };

      const job = await queue.add(jobName, data, jobOptions);

      logger.info(`Job added to queue ${queueName}:`, {
        jobId: job.id,
        jobName,
        data: { ...data, password: undefined }, // Hide sensitive data
      });

      return job;
    } catch (error) {
      logger.error(`Failed to add job to queue ${queueName}:`, { error });
      throw error;
    }
  }

  /**
   * Add a recurring job (cron)
   */
  async addRecurringJob(
    queueName: string,
    jobName: string,
    data: JobData,
    cronPattern: string
  ): Promise<void> {
    try {
      const queue = this.getQueue(queueName);

      // Remove existing recurring job if any
      const existing = await queue.getRepeatableJobs();
      for (const job of existing) {
        if (job.name === jobName && job.pattern === cronPattern) {
          await queue.removeRepeatableByKey(job.key);
        }
      }

      // Add new recurring job
      await queue.add(jobName, data, {
        repeat: {
          cron: cronPattern,
          tz: "Asia/Kolkata",
        },
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      });

      logger.info(`Recurring job added to queue ${queueName}:`, {
        jobName,
        cronPattern,
      });
    } catch (error) {
      logger.error(`Failed to add recurring job:`, { error });
      throw error;
    }
  }

  /**
   * Process jobs in a queue
   */
  async processQueue<T extends JobData>(
    queueName: string,
    concurrency: number = 5,
    processor: (job: Job<T>) => Promise<void>
  ): Promise<void> {
    try {
      const queue = this.getQueue(queueName);

      queue.process(concurrency, async (job) => {
        const startTime = Date.now();

        try {
          logger.info(`Processing job ${job.name} (${job.id})`, { jobId: job.id });

          // Update progress
          if (job.progress) {
            job.progress(0);
          }

          // Execute processor
          await processor(job);

          const duration = Date.now() - startTime;
          logger.info(`Job ${job.name} (${job.id}) completed in ${duration}ms`, {
            jobId: job.id,
            duration,
          });

          return { success: true, duration };
        } catch (error) {
          logger.error(`Job ${job.name} (${job.id}) failed:`, {
            error,
            jobId: job.id,
          });
          throw error;
        }
      });

      logger.info(`Queue ${queueName} processing started (concurrency: ${concurrency})`);
    } catch (error) {
      logger.error(`Failed to setup queue processor:`, { error });
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string): Promise<{
    active: number;
    delayed: number;
    failed: number;
    completed: number;
    waiting: number;
    paused: number;
  }> {
    try {
      const queue = this.getQueue(queueName);

      const [active, delayed, failed, completed, waiting, paused] = await Promise.all([
        queue.getActiveCount(),
        queue.getDelayedCount(),
        queue.getFailedCount(),
        queue.getCompletedCount(),
        queue.getWaitingCount(),
        queue.getPausedCount(),
      ]);

      return { active, delayed, failed, completed, waiting, paused };
    } catch (error) {
      logger.error(`Failed to get queue stats:`, { error });
      throw error;
    }
  }

  /**
   * Get job by ID
   */
  async getJob(queueName: string, jobId: string): Promise<Job<any> | null> {
    try {
      const queue = this.getQueue(queueName);
      return await queue.getJob(jobId);
    } catch (error) {
      logger.error(`Failed to get job:`, { error });
      return null;
    }
  }

  /**
   * Get failed jobs
   */
  async getFailedJobs(
    queueName: string,
    start: number = 0,
    end: number = 100
  ): Promise<Job<any>[]> {
    try {
      const queue = this.getQueue(queueName);
      return await queue.getFailed(start, end);
    } catch (error) {
      logger.error(`Failed to get failed jobs:`, { error });
      return [];
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueName: string, jobId: string): Promise<boolean> {
    try {
      const queue = this.getQueue(queueName);
      const job = await queue.getJob(jobId);

      if (!job) {
        return false;
      }

      await job.retry();
      logger.info(`Job ${jobId} retried`, { jobId });
      return true;
    } catch (error) {
      logger.error(`Failed to retry job:`, { error });
      return false;
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(queueName: string, jobId: string): Promise<boolean> {
    try {
      const queue = this.getQueue(queueName);
      const job = await queue.getJob(jobId);

      if (!job) {
        return false;
      }

      await job.remove();
      logger.info(`Job ${jobId} cancelled`, { jobId });
      return true;
    } catch (error) {
      logger.error(`Failed to cancel job:`, { error });
      return false;
    }
  }

  /**
   * Clear a queue
   */
  async clearQueue(queueName: string): Promise<void> {
    try {
      const queue = this.getQueue(queueName);
      await queue.clean(0, "active");
      await queue.clean(0, "delayed");
      await queue.clean(0, "wait");
      logger.info(`Queue ${queueName} cleared`);
    } catch (error) {
      logger.error(`Failed to clear queue:`, { error });
      throw error;
    }
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    try {
      const queue = this.getQueue(queueName);
      await queue.pause();
      logger.info(`Queue ${queueName} paused`);
    } catch (error) {
      logger.error(`Failed to pause queue:`, { error });
      throw error;
    }
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    try {
      const queue = this.getQueue(queueName);
      await queue.resume();
      logger.info(`Queue ${queueName} resumed`);
    } catch (error) {
      logger.error(`Failed to resume queue:`, { error });
      throw error;
    }
  }

  /**
   * Close a queue
   */
  async closeQueue(queueName: string): Promise<void> {
    try {
      const queue = this.getQueue(queueName);
      await queue.close();
      this.queues.delete(queueName);
      logger.info(`Queue ${queueName} closed`);
    } catch (error) {
      logger.error(`Failed to close queue:`, { error });
      throw error;
    }
  }

  /**
   * Close all queues
   */
  async closeAllQueues(): Promise<void> {
    try {
      const promises = Array.from(this.queues.keys()).map((queueName) =>
        this.closeQueue(queueName).catch(() => {})
      );
      await Promise.all(promises);
      this.queues.clear();
      logger.info("All queues closed");
    } catch (error) {
      logger.error(`Failed to close all queues:`, { error });
    }
  }
}

export default new QueueService();
