import mongoose from "mongoose";
import NotificationModel, { NotificationRecord } from "../models/Notification";
import QueueService from "./QueueService";
import { logger } from "../utils/logger";

/**
 * NotificationService handles creating, managing, and sending notifications
 * Supports in-app, email, and SMS channels with customizable templates
 */

export type NotificationType =
  | "itc_discrepancy_detected"
  | "itc_sync_completed"
  | "filing_due"
  | "filing_status_changed"
  | "document_uploaded"
  | "document_rejected"
  | "payment_received"
  | "payment_failed"
  | "system_alert"
  | "custom";

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  description?: string;
  actionUrl?: string;
  actionText?: string;
  priority: "low" | "normal" | "high" | "critical";
  channels: Array<"in_app" | "email" | "sms">;
}

export interface CreateNotificationInput {
  userId: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  description?: string;
  channels: Array<"in_app" | "email" | "sms">;
  priority?: "low" | "normal" | "high" | "critical";
  entityType?:
    | "filing"
    | "document"
    | "invoice"
    | "itc_reconciliation"
    | "payment"
    | "client";
  entityId?: mongoose.Types.ObjectId;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
}

// Email/SMS Template Library
const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  itc_discrepancy_detected: {
    type: "itc_discrepancy_detected",
    title: "ITC Discrepancy Detected",
    message:
      "A discrepancy has been detected in your ITC reconciliation. Review and resolve to maintain compliance.",
    description:
      "Your claimed ITC differs from the portal data. This requires your attention to ensure accurate GST filing.",
    actionUrl: "/gst/itc-reconciliation",
    actionText: "Review Discrepancy",
    priority: "high",
    channels: ["in_app", "email"],
  },

  itc_sync_completed: {
    type: "itc_sync_completed",
    title: "ITC Sync Completed",
    message: "Your ITC data has been successfully synced with the GST portal.",
    description:
      "The latest ITC information is now available in your dashboard.",
    actionUrl: "/gst/itc-reconciliation",
    actionText: "View Results",
    priority: "normal",
    channels: ["in_app"],
  },

  filing_due: {
    type: "filing_due",
    title: "GST Filing Due",
    message:
      "Your GST filing deadline is approaching. Please complete and file your return.",
    description: "File your GST return before the deadline to avoid penalties.",
    actionUrl: "/gst/filings",
    actionText: "File Now",
    priority: "critical",
    channels: ["in_app", "email", "sms"],
  },

  filing_status_changed: {
    type: "filing_status_changed",
    title: "Filing Status Updated",
    message: "Your GST filing status has been updated.",
    description: "Check your dashboard for the latest filing status.",
    actionUrl: "/gst/filings",
    actionText: "View Filing",
    priority: "normal",
    channels: ["in_app", "email"],
  },

  document_uploaded: {
    type: "document_uploaded",
    title: "Document Uploaded",
    message: "A new document has been uploaded to your account.",
    description: "The document is available for download and review.",
    actionUrl: "/documents",
    actionText: "View Document",
    priority: "normal",
    channels: ["in_app"],
  },

  document_rejected: {
    type: "document_rejected",
    title: "Document Rejected",
    message: "Your document has been rejected. Please review and resubmit.",
    description:
      "A document was rejected for compliance review. Please check the details and resubmit.",
    actionUrl: "/documents",
    actionText: "Resubmit Document",
    priority: "high",
    channels: ["in_app", "email"],
  },

  payment_received: {
    type: "payment_received",
    title: "Payment Received",
    message: "Your payment has been successfully received.",
    description: "Thank you for your payment. Your account has been updated.",
    actionUrl: "/payments",
    actionText: "View Receipt",
    priority: "normal",
    channels: ["in_app", "email"],
  },

  payment_failed: {
    type: "payment_failed",
    title: "Payment Failed",
    message: "Your payment could not be processed. Please try again.",
    description:
      "The payment transaction failed. Please verify your details and retry.",
    actionUrl: "/payments",
    actionText: "Retry Payment",
    priority: "high",
    channels: ["in_app", "email"],
  },

  system_alert: {
    type: "system_alert",
    title: "System Alert",
    message: "There is an important system message for you.",
    description: "Please review this important message regarding your account.",
    priority: "critical",
    channels: ["in_app", "email"],
  },

  custom: {
    type: "custom",
    title: "Notification",
    message: "You have a new notification.",
    priority: "normal",
    channels: ["in_app"],
  },
};

class NotificationService {
  /**
   * Get notification template by type
   */
  getTemplate(type: NotificationType): NotificationTemplate {
    return NOTIFICATION_TEMPLATES[type] || NOTIFICATION_TEMPLATES.custom;
  }

  /**
   * Create a notification
   */
  async createNotification(
    input: CreateNotificationInput,
  ): Promise<NotificationRecord> {
    try {
      const template = this.getTemplate(input.type);

      const notification = await NotificationModel.create({
        userId: input.userId,
        clientId: input.clientId,
        type: input.type,
        title: input.title || template.title,
        message: input.message || template.message,
        description: input.description || template.description,
        channels: input.channels || template.channels,
        priority: input.priority || template.priority,
        entityType: input.entityType,
        entityId: input.entityId,
        actionUrl: input.actionUrl || template.actionUrl,
        actionText: input.actionText || template.actionText,
        metadata: input.metadata,
        status: "pending",
        retryCount: 0,
      });

      logger.info("Notification created:", {
        notificationId: notification._id.toString(),
        userId: input.userId.toString(),
        type: input.type,
      });

      // Queue notification for sending
      await QueueService.addJob("notifications", "send_notification", {
        notificationId: notification._id.toString(),
      });

      return notification;
    } catch (error) {
      logger.error("Failed to create notification:", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create batch notifications for multiple users
   */
  async createBatchNotifications(
    userIds: mongoose.Types.ObjectId[],
    input: Omit<CreateNotificationInput, "userId">,
  ): Promise<NotificationRecord[]> {
    try {
      const notifications = await Promise.all(
        userIds.map((userId) => this.createNotification({ ...input, userId })),
      );

      logger.info("Batch notifications created:", {
        count: notifications.length,
        type: input.type,
      });

      return notifications;
    } catch (error) {
      logger.error("Failed to create batch notifications:", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: mongoose.Types.ObjectId,
    options?: {
      limit?: number;
      skip?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
    },
  ): Promise<NotificationRecord[]> {
    try {
      const query: any = { userId };

      if (options?.unreadOnly) {
        query.status = { $ne: "read" };
      }

      if (options?.type) {
        query.type = options.type;
      }

      const notifications = await NotificationModel.find(query)
        .sort({ createdAt: -1 })
        .limit(options?.limit || 50)
        .skip(options?.skip || 0)
        .lean();

      return notifications;
    } catch (error) {
      logger.error("Failed to fetch notifications:", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    notificationId: mongoose.Types.ObjectId | string,
  ): Promise<NotificationRecord> {
    try {
      const notification = await NotificationModel.findByIdAndUpdate(
        notificationId,
        {
          status: "read",
          readAt: new Date(),
        },
        { returnDocument: 'after' },
      );

      if (!notification) {
        throw new Error("Notification not found");
      }

      return notification;
    } catch (error) {
      logger.error("Failed to mark notification as read:", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: mongoose.Types.ObjectId): Promise<number> {
    try {
      const result = await NotificationModel.updateMany(
        { userId, status: { $ne: "read" } },
        { status: "read", readAt: new Date() },
      );

      return result.modifiedCount;
    } catch (error) {
      logger.error("Failed to mark all notifications as read:", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(
    notificationId: mongoose.Types.ObjectId | string,
  ): Promise<void> {
    try {
      await NotificationModel.findByIdAndDelete(notificationId);

      logger.info("Notification deleted:", { notificationId });
    } catch (error) {
      logger.error("Failed to delete notification:", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: mongoose.Types.ObjectId): Promise<number> {
    try {
      return await NotificationModel.countDocuments({
        userId,
        status: "pending",
      });
    } catch (error) {
      logger.error("Failed to get unread count:", { error });
      return 0;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: mongoose.Types.ObjectId): Promise<{
    total: number;
    unread: number;
    read: number;
    failed: number;
    byType: Record<string, number>;
  }> {
    try {
      const [total, unread, read, failed] = await Promise.all([
        NotificationModel.countDocuments({ userId }),
        NotificationModel.countDocuments({ userId, status: "pending" }),
        NotificationModel.countDocuments({ userId, status: "read" }),
        NotificationModel.countDocuments({ userId, status: "failed" }),
      ]);

      // Get breakdown by type
      const typeBreakdown = await NotificationModel.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ]);

      const byType: Record<string, number> = {};
      typeBreakdown.forEach((item) => {
        byType[item._id] = item.count;
      });

      return { total, unread, read, failed, byType };
    } catch (error) {
      logger.error("Failed to get notification stats:", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create notification for ITC discrepancy
   */
  async notifyITCDiscrepancy(
    userId: mongoose.Types.ObjectId,
    clientId: mongoose.Types.ObjectId,
    month: string,
    discrepancy: number,
    discrepancyPercentage: number,
  ): Promise<NotificationRecord> {
    const description = `A discrepancy of ₹${Math.abs(discrepancy / 100000).toFixed(2)}L (${discrepancyPercentage.toFixed(1)}%) has been detected for ${month}.`;

    return this.createNotification({
      userId,
      clientId,
      type: "itc_discrepancy_detected",
      title: "ITC Discrepancy Detected",
      message: `${description} Please review and resolve it.`,
      description,
      channels: ["in_app", "email"],
      priority: "high",
      entityType: "itc_reconciliation",
      metadata: { month, discrepancy, discrepancyPercentage },
    });
  }

  /**
   * Create notification for filing due
   */
  async notifyFilingDue(
    userId: mongoose.Types.ObjectId,
    clientId: mongoose.Types.ObjectId,
    filingType: string,
    dueDate: Date,
  ): Promise<NotificationRecord> {
    const description = `Your ${filingType} filing is due on ${dueDate.toLocaleDateString()}. Please complete and file your return to avoid penalties.`;

    return this.createNotification({
      userId,
      clientId,
      type: "filing_due",
      title: `${filingType} Filing Due`,
      message: `${filingType} filing deadline approaching.`,
      description,
      channels: ["in_app", "email", "sms"],
      priority: "critical",
      actionUrl: "/gst/filings",
      actionText: "File Now",
      metadata: { filingType, dueDate },
    });
  }

  /**
   * Create notification for filing status change
   */
  async notifyFilingStatusChange(
    userId: mongoose.Types.ObjectId,
    clientId: mongoose.Types.ObjectId,
    filingType: string,
    status: string,
  ): Promise<NotificationRecord> {
    const description = `Your ${filingType} filing status has been updated to ${status}.`;

    return this.createNotification({
      userId,
      clientId,
      type: "filing_status_changed",
      title: `${filingType} Filing Status Updated`,
      message: description,
      channels: ["in_app", "email"],
      priority: "normal",
      actionUrl: "/gst/filings",
      actionText: "View Filing",
      metadata: { filingType, status },
    });
  }

  /**
   * Create alert for compliance issues
   */
  async notifyComplianceAlert(
    userId: mongoose.Types.ObjectId,
    clientId: mongoose.Types.ObjectId,
    issueType: string,
    details: string,
  ): Promise<NotificationRecord> {
    return this.createNotification({
      userId,
      clientId,
      type: "system_alert",
      title: "Compliance Alert",
      message: `Compliance issue detected: ${issueType}`,
      description: details,
      channels: ["in_app", "email"],
      priority: "critical",
      metadata: { issueType },
    });
  }
}

export default new NotificationService();
