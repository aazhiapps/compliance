import { ComplianceEventModel } from "../models/ComplianceEvent";
import { ClientModel } from "../models/Client";
import { NotificationService } from "./NotificationService";
import { AuditLogService } from "./AuditLogService";

/**
 * Compliance Event Service
 * PHASE 1: Automated Compliance Monitoring & Reminder Engine
 */

/**
 * Create a new compliance event
 */
export async function createComplianceEvent(data: {
  clientId: string;
  serviceType: string;
  complianceType: "filing" | "payment" | "document_renewal" | "audit" | "verification";
  frequency: "one_time" | "monthly" | "quarterly" | "half_yearly" | "yearly";
  dueDate: Date;
  description: string;
  priority?: "low" | "medium" | "high" | "critical";
  lateFeePerDay?: number;
  interestRate?: number;
  relatedEntityType?: "application" | "filing" | "document" | "payment";
  relatedEntityId?: string;
  createdBy: string;
}) {
  try {
    const event = await ComplianceEventModel.create({
      ...data,
      status: "scheduled",
      penaltyAmount: 0,
      daysOverdue: 0,
      remindersSent: [],
      requiresAction: true,
      lateFeePerDay: data.lateFeePerDay || 0,
      interestRate: data.interestRate || 0,
      priority: data.priority || "medium",
    });
    
    // Log the creation
    await AuditLogService.log({
      entityType: "compliance_event",
      entityId: event.id,
      action: "create",
      changes: {
        created: data,
      },
      performedBy: data.createdBy,
      performedAt: new Date().toISOString(),
    });
    
    return event;
  } catch (error) {
    console.error("Error creating compliance event:", error);
    throw error;
  }
}

/**
 * Generate recurring compliance events
 */
export async function generateRecurringEvents(
  clientId: string,
  serviceType: string,
  complianceType: "filing" | "payment" | "document_renewal" | "audit" | "verification",
  frequency: "monthly" | "quarterly" | "half_yearly" | "yearly",
  startDate: Date,
  endDate: Date,
  description: string,
  createdBy: string,
  lateFeePerDay: number = 0,
  interestRate: number = 0
): Promise<number> {
  try {
    let currentDate = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;
    
    while (currentDate <= end) {
      await createComplianceEvent({
        clientId,
        serviceType,
        complianceType,
        frequency,
        dueDate: new Date(currentDate),
        description,
        lateFeePerDay,
        interestRate,
        createdBy,
      });
      
      count++;
      
      // Calculate next due date based on frequency
      switch (frequency) {
        case "monthly":
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case "quarterly":
          currentDate.setMonth(currentDate.getMonth() + 3);
          break;
        case "half_yearly":
          currentDate.setMonth(currentDate.getMonth() + 6);
          break;
        case "yearly":
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
      }
    }
    
    return count;
  } catch (error) {
    console.error("Error generating recurring events:", error);
    throw error;
  }
}

/**
 * Detect overdue events and update status
 */
export async function detectOverdueEvents(): Promise<number> {
  try {
    const now = new Date();
    
    // Find events that are scheduled or due but past their due date
    const overdueEvents = await ComplianceEventModel.find({
      status: { $in: ["scheduled", "due"] },
      dueDate: { $lt: now },
    });
    
    let count = 0;
    
    for (const event of overdueEvents) {
      // Calculate days overdue
      const daysOverdue = Math.floor(
        (now.getTime() - event.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Calculate penalty
      const penaltyAmount = daysOverdue * event.lateFeePerDay;
      
      // Update event
      event.status = "overdue";
      event.daysOverdue = daysOverdue;
      event.penaltyAmount = penaltyAmount;
      await event.save();
      
      // Update client risk metrics
      await updateClientRiskMetrics(event.clientId);
      
      count++;
    }
    
    return count;
  } catch (error) {
    console.error("Error detecting overdue events:", error);
    return 0;
  }
}

/**
 * Send reminders for upcoming and overdue events
 */
export async function sendComplianceReminders(): Promise<number> {
  try {
    const now = new Date();
    const reminderThresholds = [7, 3, 1, 0]; // Days before due date
    let count = 0;
    
    for (const daysBeforeDue of reminderThresholds) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysBeforeDue);
      
      // Find events due around this date that haven't received reminder recently
      const events = await ComplianceEventModel.find({
        status: { $in: ["scheduled", "due"] },
        dueDate: {
          $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          $lte: new Date(targetDate.setHours(23, 59, 59, 999)),
        },
        $or: [
          { lastReminderSent: { $exists: false } },
          { lastReminderSent: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
        ],
      });
      
      for (const event of events) {
        // Get client details
        const client = await ClientModel.findById(event.clientId);
        if (!client) continue;
        
        // Send notification
        const notification = await NotificationService.create({
          userId: client.userId,
          type: "compliance_reminder",
          title: `Compliance Due: ${event.description}`,
          message: `Your ${event.complianceType} is due on ${event.dueDate.toLocaleDateString()}`,
          priority: event.priority === "critical" ? "high" : event.priority,
          channels: ["in_app", "email"],
          metadata: {
            complianceEventId: event.id,
            clientId: event.clientId,
            dueDate: event.dueDate.toISOString(),
            daysRemaining: daysBeforeDue,
          },
        });
        
        // Update reminder tracking
        event.remindersSent.push({
          sentAt: now,
          channel: "email",
          messageId: notification.id,
        });
        event.lastReminderSent = now;
        await event.save();
        
        count++;
      }
    }
    
    // Also send reminders for overdue events
    const overdueEvents = await ComplianceEventModel.find({
      status: "overdue",
      $or: [
        { lastReminderSent: { $exists: false } },
        { lastReminderSent: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
      ],
    });
    
    for (const event of overdueEvents) {
      const client = await ClientModel.findById(event.clientId);
      if (!client) continue;
      
      const notification = await NotificationService.create({
        userId: client.userId,
        type: "compliance_overdue",
        title: `OVERDUE: ${event.description}`,
        message: `Your ${event.complianceType} is ${event.daysOverdue} days overdue. Penalty: ₹${event.penaltyAmount}`,
        priority: "high",
        channels: ["in_app", "email", "sms"],
        metadata: {
          complianceEventId: event.id,
          clientId: event.clientId,
          daysOverdue: event.daysOverdue,
          penaltyAmount: event.penaltyAmount,
        },
      });
      
      event.remindersSent.push({
        sentAt: now,
        channel: "email",
        messageId: notification.id,
      });
      event.lastReminderSent = now;
      await event.save();
      
      count++;
    }
    
    return count;
  } catch (error) {
    console.error("Error sending compliance reminders:", error);
    return 0;
  }
}

/**
 * Complete a compliance event
 */
export async function completeComplianceEvent(
  eventId: string,
  completedBy: string,
  completedDate?: Date
): Promise<boolean> {
  try {
    const event = await ComplianceEventModel.findById(eventId);
    if (!event) return false;
    
    event.status = "completed";
    event.completedDate = completedDate || new Date();
    event.completedBy = completedBy;
    event.requiresAction = false;
    
    // Generate next event if recurring
    if (event.frequency !== "one_time") {
      const nextDueDate = calculateNextDueDate(event.dueDate, event.frequency);
      event.nextDueDate = nextDueDate;
      
      // Create next occurrence
      await createComplianceEvent({
        clientId: event.clientId,
        serviceType: event.serviceType,
        complianceType: event.complianceType,
        frequency: event.frequency,
        dueDate: nextDueDate,
        description: event.description,
        priority: event.priority,
        lateFeePerDay: event.lateFeePerDay,
        interestRate: event.interestRate,
        relatedEntityType: event.relatedEntityType,
        relatedEntityId: event.relatedEntityId,
        createdBy: "system",
      });
    }
    
    await event.save();
    
    // Log the completion
    await AuditLogService.log({
      entityType: "compliance_event",
      entityId: event.id,
      action: "update",
      changes: {
        status: { from: "due", to: "completed" },
        completedBy,
        completedDate: event.completedDate,
      },
      performedBy: completedBy,
      performedAt: new Date().toISOString(),
    });
    
    // Update client risk metrics
    await updateClientRiskMetrics(event.clientId);
    
    return true;
  } catch (error) {
    console.error("Error completing compliance event:", error);
    return false;
  }
}

/**
 * Waive a compliance event (admin action)
 */
export async function waiveComplianceEvent(
  eventId: string,
  waivedBy: string,
  reason: string
): Promise<boolean> {
  try {
    const event = await ComplianceEventModel.findById(eventId);
    if (!event) return false;
    
    const previousStatus = event.status;
    
    event.status = "waived";
    event.waivedBy = waivedBy;
    event.waivedReason = reason;
    event.requiresAction = false;
    event.penaltyAmount = 0;
    await event.save();
    
    // Log the waiver
    await AuditLogService.log({
      entityType: "compliance_event",
      entityId: event.id,
      action: "update",
      changes: {
        status: { from: previousStatus, to: "waived" },
        waivedBy,
        waivedReason: reason,
      },
      performedBy: waivedBy,
      performedAt: new Date().toISOString(),
      complianceImpact: "warning",
    });
    
    return true;
  } catch (error) {
    console.error("Error waiving compliance event:", error);
    return false;
  }
}

/**
 * Calculate next due date based on frequency
 */
function calculateNextDueDate(
  currentDueDate: Date,
  frequency: "monthly" | "quarterly" | "half_yearly" | "yearly"
): Date {
  const nextDate = new Date(currentDueDate);
  
  switch (frequency) {
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "quarterly":
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case "half_yearly":
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  
  return nextDate;
}

/**
 * Update client risk metrics based on compliance events
 */
async function updateClientRiskMetrics(clientId: string): Promise<void> {
  try {
    const client = await ClientModel.findById(clientId);
    if (!client) return;
    
    // Count overdue and missed compliance
    const overdueCount = await ComplianceEventModel.countDocuments({
      clientId,
      status: "overdue",
    });
    
    const missedCount = await ComplianceEventModel.countDocuments({
      clientId,
      status: { $in: ["overdue", "waived"] },
    });
    
    // Update client metrics
    client.overdueFilingsCount = overdueCount;
    client.missedComplianceCount = missedCount;
    
    // Calculate risk score
    let riskScore = 0;
    riskScore += overdueCount * 10; // 10 points per overdue
    riskScore += missedCount * 5; // 5 points per missed
    riskScore = Math.min(riskScore, 100);
    
    client.riskScore = riskScore;
    
    // Determine risk level
    if (riskScore >= 75) {
      client.riskLevel = "CRITICAL";
    } else if (riskScore >= 50) {
      client.riskLevel = "HIGH";
    } else if (riskScore >= 25) {
      client.riskLevel = "MEDIUM";
    } else {
      client.riskLevel = "LOW";
    }
    
    client.lastRiskAssessment = new Date();
    await client.save();
  } catch (error) {
    console.error("Error updating client risk metrics:", error);
  }
}

/**
 * Get compliance calendar for a client
 */
export async function getComplianceCalendar(
  clientId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const query: any = { clientId };
    
    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) query.dueDate.$gte = startDate;
      if (endDate) query.dueDate.$lte = endDate;
    }
    
    const events = await ComplianceEventModel.find(query)
      .sort({ dueDate: 1 })
      .lean();
    
    return events;
  } catch (error) {
    console.error("Error getting compliance calendar:", error);
    return [];
  }
}

export default {
  createComplianceEvent,
  generateRecurringEvents,
  detectOverdueEvents,
  sendComplianceReminders,
  completeComplianceEvent,
  waiveComplianceEvent,
  getComplianceCalendar,
};
