/**
 * GST Notification Service
 * Handles reminders, alerts, and notifications for GST compliance
 */

import { GSTReminder, GSTNotification, GSTClient, GSTReturnFiling } from "@shared/gst";
import { calculateDueDates, isMonthOverdue } from "../utils/gstValidation";

/**
 * Notification Service for GST reminders and alerts
 */
export class GSTNotificationService {
  private reminders: Map<string, GSTReminder>;
  private notifications: Map<string, GSTNotification>;

  constructor() {
    this.reminders = new Map();
    this.notifications = new Map();
  }

  /**
   * Create reminders for upcoming due dates
   * Should be called when a new filing record is created
   */
  createRemindersForMonth(
    client: GSTClient,
    month: string,
    filing: GSTReturnFiling
  ): GSTReminder[] {
    const createdReminders: GSTReminder[] = [];

    // Create GSTR-1 reminder if not filed
    if (!filing.gstr1Filed && filing.gstr1DueDate) {
      const gstr1Reminder = this.createReminder(
        client,
        month,
        "GSTR-1",
        filing.gstr1DueDate
      );
      createdReminders.push(gstr1Reminder);
    }

    // Create GSTR-3B reminder if not filed
    if (!filing.gstr3bFiled && filing.gstr3bDueDate) {
      const gstr3bReminder = this.createReminder(
        client,
        month,
        "GSTR-3B",
        filing.gstr3bDueDate
      );
      createdReminders.push(gstr3bReminder);
    }

    return createdReminders;
  }

  /**
   * Create a single reminder
   */
  private createReminder(
    client: GSTClient,
    month: string,
    returnType: "GSTR-1" | "GSTR-3B" | "GSTR-9",
    dueDate: string
  ): GSTReminder {
    // Calculate reminder date (5 days before due date)
    const due = new Date(dueDate);
    const reminderDate = new Date(due);
    reminderDate.setDate(reminderDate.getDate() - 5);

    const reminder: GSTReminder = {
      id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientId: client.id,
      clientName: client.clientName,
      month,
      returnType,
      dueDate,
      reminderDate: reminderDate.toISOString().split('T')[0],
      status: "pending",
      notificationChannels: ["dashboard", "email"],
      createdAt: new Date().toISOString()
    };

    this.reminders.set(reminder.id, reminder);
    return reminder;
  }

  /**
   * Get pending reminders that need to be sent today
   */
  getPendingRemindersForToday(): GSTReminder[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    return Array.from(this.reminders.values()).filter(
      reminder => 
        reminder.status === "pending" && 
        reminder.reminderDate === todayStr
    );
  }

  /**
   * Get overdue filings
   */
  getOverdueReminders(): GSTReminder[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from(this.reminders.values()).filter(reminder => {
      const dueDate = new Date(reminder.dueDate);
      return reminder.status !== "sent" && today > dueDate;
    });
  }

  /**
   * Mark reminder as sent
   */
  markReminderSent(reminderId: string): void {
    const reminder = this.reminders.get(reminderId);
    if (reminder) {
      reminder.status = "sent";
      reminder.sentAt = new Date().toISOString();
      this.reminders.set(reminderId, reminder);
    }
  }

  /**
   * Mark reminder as overdue
   */
  markReminderOverdue(reminderId: string): void {
    const reminder = this.reminders.get(reminderId);
    if (reminder) {
      reminder.status = "overdue";
      this.reminders.set(reminderId, reminder);
    }
  }

  /**
   * Create a notification for a user
   */
  createNotification(
    clientId: string,
    userId: string,
    type: "due_date_reminder" | "overdue_alert" | "filing_success" | "escalation",
    title: string,
    message: string,
    priority: "low" | "medium" | "high" = "medium",
    metadata?: Record<string, any>
  ): GSTNotification {
    const notification: GSTNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      clientId,
      userId,
      type,
      title,
      message,
      priority,
      isRead: false,
      metadata,
      createdAt: new Date().toISOString()
    };

    this.notifications.set(notification.id, notification);
    return notification;
  }

  /**
   * Get unread notifications for a user
   */
  getUnreadNotifications(userId: string): GSTNotification[] {
    return Array.from(this.notifications.values()).filter(
      notif => notif.userId === userId && !notif.isRead
    );
  }

  /**
   * Get all notifications for a user
   */
  getUserNotifications(userId: string, limit?: number): GSTNotification[] {
    const notifications = Array.from(this.notifications.values())
      .filter(notif => notif.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return limit ? notifications.slice(0, limit) : notifications;
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date().toISOString();
      this.notifications.set(notificationId, notification);
      return true;
    }
    return false;
  }

  /**
   * Mark all notifications as read for a user
   */
  markAllNotificationsRead(userId: string): number {
    let count = 0;
    Array.from(this.notifications.values())
      .filter(notif => notif.userId === userId && !notif.isRead)
      .forEach(notif => {
        notif.isRead = true;
        notif.readAt = new Date().toISOString();
        this.notifications.set(notif.id, notif);
        count++;
      });
    return count;
  }

  /**
   * Delete old notifications (older than specified days)
   */
  deleteOldNotifications(daysOld: number = 90): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deleted = 0;
    Array.from(this.notifications.values()).forEach(notif => {
      const createdDate = new Date(notif.createdAt);
      if (createdDate < cutoffDate && notif.isRead) {
        this.notifications.delete(notif.id);
        deleted++;
      }
    });

    return deleted;
  }

  /**
   * Process due date reminders (should be run daily via cron job)
   */
  processDueDateReminders(
    clients: GSTClient[],
    filings: Map<string, GSTReturnFiling>
  ): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process each active client
    clients.filter(c => c.status === "active").forEach(client => {
      // Get all filings for this client
      const clientFilings = Array.from(filings.values()).filter(
        f => f.clientId === client.id
      );

      clientFilings.forEach(filing => {
        // Check GSTR-1 reminder
        if (!filing.gstr1Filed && filing.gstr1DueDate) {
          const dueDate = new Date(filing.gstr1DueDate);
          const reminderDate = new Date(dueDate);
          reminderDate.setDate(reminderDate.getDate() - 5);

          if (today.toDateString() === reminderDate.toDateString()) {
            // Send reminder
            this.createNotification(
              client.id,
              client.userId,
              "due_date_reminder",
              `GSTR-1 Due Soon - ${client.clientName}`,
              `GSTR-1 for ${filing.month} is due on ${filing.gstr1DueDate}. Please file before the deadline to avoid late fees.`,
              "high",
              { month: filing.month, returnType: "GSTR-1", dueDate: filing.gstr1DueDate }
            );
          }

          // Check if overdue
          if (today > dueDate) {
            this.createNotification(
              client.id,
              client.userId,
              "overdue_alert",
              `GSTR-1 OVERDUE - ${client.clientName}`,
              `GSTR-1 for ${filing.month} is overdue! Due date was ${filing.gstr1DueDate}. Late fees are applicable.`,
              "high",
              { month: filing.month, returnType: "GSTR-1", dueDate: filing.gstr1DueDate }
            );
          }
        }

        // Check GSTR-3B reminder
        if (!filing.gstr3bFiled && filing.gstr3bDueDate) {
          const dueDate = new Date(filing.gstr3bDueDate);
          const reminderDate = new Date(dueDate);
          reminderDate.setDate(reminderDate.getDate() - 5);

          if (today.toDateString() === reminderDate.toDateString()) {
            // Send reminder
            this.createNotification(
              client.id,
              client.userId,
              "due_date_reminder",
              `GSTR-3B Due Soon - ${client.clientName}`,
              `GSTR-3B for ${filing.month} is due on ${filing.gstr3bDueDate}. Please file before the deadline to avoid late fees.`,
              "high",
              { month: filing.month, returnType: "GSTR-3B", dueDate: filing.gstr3bDueDate }
            );
          }

          // Check if overdue
          if (today > dueDate) {
            this.createNotification(
              client.id,
              client.userId,
              "overdue_alert",
              `GSTR-3B OVERDUE - ${client.clientName}`,
              `GSTR-3B for ${filing.month} is overdue! Due date was ${filing.gstr3bDueDate}. Late fees and interest are applicable.`,
              "high",
              { month: filing.month, returnType: "GSTR-3B", dueDate: filing.gstr3bDueDate }
            );
          }
        }
      });
    });
  }

  /**
   * Get reminder statistics
   */
  getReminderStats(): {
    totalReminders: number;
    pendingReminders: number;
    sentReminders: number;
    overdueReminders: number;
  } {
    const all = Array.from(this.reminders.values());
    
    return {
      totalReminders: all.length,
      pendingReminders: all.filter(r => r.status === "pending").length,
      sentReminders: all.filter(r => r.status === "sent").length,
      overdueReminders: all.filter(r => r.status === "overdue").length
    };
  }

  /**
   * Get notification statistics for a user
   */
  getNotificationStats(userId: string): {
    totalNotifications: number;
    unreadNotifications: number;
    highPriorityUnread: number;
  } {
    const userNotifs = Array.from(this.notifications.values()).filter(
      n => n.userId === userId
    );
    
    return {
      totalNotifications: userNotifs.length,
      unreadNotifications: userNotifs.filter(n => !n.isRead).length,
      highPriorityUnread: userNotifs.filter(n => !n.isRead && n.priority === "high").length
    };
  }

  /**
   * Get reminders for a specific client
   */
  getClientReminders(clientId: string): GSTReminder[] {
    return Array.from(this.reminders.values()).filter(
      r => r.clientId === clientId
    );
  }

  /**
   * Delete reminder
   */
  deleteReminder(reminderId: string): boolean {
    return this.reminders.delete(reminderId);
  }

  /**
   * Clear all reminders (for testing)
   */
  clearAllReminders(): void {
    this.reminders.clear();
  }

  /**
   * Clear all notifications (for testing)
   */
  clearAllNotifications(): void {
    this.notifications.clear();
  }
}

// Singleton instance
export const gstNotificationService = new GSTNotificationService();
