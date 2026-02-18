import { ObjectId } from "mongodb";
import {
  WebhookEndpointModel,
  WebhookEventType,
} from "../models/WebhookEndpoint";
import { WebhookEventModel } from "../models/WebhookEvent";
import { WebhookDeliveryModel } from "../models/WebhookDelivery";

export interface CreateWebhookEndpointInput {
  clientId: ObjectId;
  userId: ObjectId;
  url: string;
  description?: string;
  events: WebhookEventType[];
  secret: string;
  headers?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface UpdateWebhookEndpointInput {
  url?: string;
  description?: string;
  events?: WebhookEventType[];
  isActive?: boolean;
  isTestMode?: boolean;
  headers?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface CreateWebhookEventInput {
  clientId: ObjectId;
  eventType: WebhookEventType;
  entityType:
    | "filing"
    | "document"
    | "invoice"
    | "itc_reconciliation"
    | "payment"
    | "client";
  entityId: ObjectId;
  data: Record<string, any>;
  source:
    | "filing_service"
    | "itc_service"
    | "document_service"
    | "notification_service"
    | "manual";
  correlationId: string;
}

export interface CreateWebhookDeliveryInput {
  webhookEventId: ObjectId;
  webhookEndpointId: ObjectId;
  clientId: ObjectId;
  attemptNumber: number;
  requestPayload: Record<string, any>;
  signature: string;
  sentAt?: Date;
}

/**
 * WebhookRepository handles all webhook-related data operations
 */
export class WebhookRepository {
  // ==================== WEBHOOK ENDPOINTS ====================

  /**
   * Create a new webhook endpoint
   */
  async createWebhookEndpoint(input: CreateWebhookEndpointInput) {
    const endpoint = new WebhookEndpointModel(input);
    return endpoint.save();
  }

  /**
   * Get webhook endpoint by ID
   */
  async getWebhookEndpointById(id: ObjectId) {
    return WebhookEndpointModel.findById(id);
  }

  /**
   * Get all webhook endpoints for a client
   */
  async getClientWebhookEndpoints(clientId: ObjectId, activeOnly = false) {
    const query: any = { clientId };
    if (activeOnly) {
      query.isActive = true;
    }
    return WebhookEndpointModel.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get active webhook endpoints that subscribe to an event
   */
  async getSubscribedEndpoints(
    clientId: ObjectId,
    eventType: WebhookEventType,
  ) {
    return WebhookEndpointModel.find({
      clientId,
      isActive: true,
      $or: [{ subscribeToAll: true }, { events: eventType }, { events: "*" }],
    });
  }

  /**
   * Update webhook endpoint
   */
  async updateWebhookEndpoint(id: ObjectId, input: UpdateWebhookEndpointInput) {
    return WebhookEndpointModel.findByIdAndUpdate(id, input, { returnDocument: 'after' });
  }

  /**
   * Delete webhook endpoint
   */
  async deleteWebhookEndpoint(id: ObjectId) {
    return WebhookEndpointModel.findByIdAndDelete(id);
  }

  /**
   * Update endpoint success/failure counts
   */
  async updateEndpointStats(
    id: ObjectId,
    isSuccess: boolean,
    triggeredAt?: Date,
  ) {
    const update: any = {
      $inc: isSuccess ? { successCount: 1 } : { failureCount: 1 },
    };
    if (isSuccess) {
      update.lastSuccessfulDeliveryAt = triggeredAt || new Date();
    }
    if (triggeredAt) {
      update.lastTriggeredAt = triggeredAt;
    }
    return WebhookEndpointModel.findByIdAndUpdate(id, update, { returnDocument: 'after' });
  }

  /**
   * Get webhook endpoints with high failure rates
   */
  async getFailedEndpoints(maxFailures = 10, minAttempts = 5) {
    return WebhookEndpointModel.find({
      isActive: true,
      failureCount: { $gte: maxFailures },
      $expr: {
        $gte: [{ $add: ["$failureCount", "$successCount"] }, minAttempts],
      },
    });
  }

  // ==================== WEBHOOK EVENTS ====================

  /**
   * Create a new webhook event
   */
  async createWebhookEvent(input: CreateWebhookEventInput) {
    const event = new WebhookEventModel(input);
    return event.save();
  }

  /**
   * Get webhook event by ID
   */
  async getWebhookEventById(id: ObjectId) {
    return WebhookEventModel.findById(id);
  }

  /**
   * Get pending webhook events for processing
   */
  async getPendingEvents(limit = 100) {
    return WebhookEventModel.find({ status: "pending" })
      .sort({ createdAt: 1 })
      .limit(limit);
  }

  /**
   * Get webhook events for a client
   */
  async getClientWebhookEvents(
    clientId: ObjectId,
    filter?: {
      status?: "pending" | "processing" | "delivered" | "failed";
      eventType?: WebhookEventType;
      limit?: number;
      skip?: number;
    },
  ) {
    const query: any = { clientId };
    if (filter?.status) {
      query.status = filter.status;
    }
    if (filter?.eventType) {
      query.eventType = filter.eventType;
    }

    const limit = filter?.limit || 50;
    const skip = filter?.skip || 0;

    return WebhookEventModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  /**
   * Update webhook event status
   */
  async updateEventStatus(
    id: ObjectId,
    status: "pending" | "processing" | "delivered" | "failed",
    failureReason?: string,
  ) {
    const update: any = {
      status,
      lastAttemptAt: new Date(),
      $inc: { attemptCount: 1 },
    };
    if (failureReason) {
      update.failureReason = failureReason;
    }
    if (status === "delivered") {
      update.processedAt = new Date();
    }
    return WebhookEventModel.findByIdAndUpdate(id, update, { returnDocument: 'after' });
  }

  /**
   * Get events ready for retry
   */
  async getEventsForRetry(limit = 100) {
    return WebhookEventModel.find({ status: "failed" })
      .sort({ lastAttemptAt: 1 })
      .limit(limit);
  }

  /**
   * Get related webhook events (by correlation ID)
   */
  async getRelatedEvents(correlationId: string) {
    return WebhookEventModel.find({ correlationId }).sort({ createdAt: 1 });
  }

  /**
   * Count webhook events by status
   */
  async countEventsByStatus(clientId: ObjectId) {
    const result = await WebhookEventModel.aggregate([
      { $match: { clientId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      pending: 0,
      processing: 0,
      delivered: 0,
      failed: 0,
    };

    result.forEach((item: any) => {
      counts[item._id as keyof typeof counts] = item.count;
    });

    return counts;
  }

  // ==================== WEBHOOK DELIVERIES ====================

  /**
   * Create a new webhook delivery record
   */
  async createWebhookDelivery(input: CreateWebhookDeliveryInput) {
    const delivery = new WebhookDeliveryModel(input);
    return delivery.save();
  }

  /**
   * Get webhook delivery by ID
   */
  async getWebhookDeliveryById(id: ObjectId) {
    return WebhookDeliveryModel.findById(id);
  }

  /**
   * Get all deliveries for a webhook event
   */
  async getEventDeliveries(eventId: ObjectId) {
    return WebhookDeliveryModel.find({ webhookEventId: eventId }).sort({
      attemptNumber: 1,
    });
  }

  /**
   * Get all deliveries for a webhook endpoint
   */
  async getEndpointDeliveries(
    endpointId: ObjectId,
    filter?: {
      status?: "success" | "failed" | "pending" | "timeout" | "invalid_url";
      limit?: number;
      skip?: number;
    },
  ) {
    const query: any = { webhookEndpointId: endpointId };
    if (filter?.status) {
      query.deliveryStatus = filter.status;
    }

    const limit = filter?.limit || 50;
    const skip = filter?.skip || 0;

    return WebhookDeliveryModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  /**
   * Update webhook delivery with response details
   */
  async updateDeliveryResponse(
    id: ObjectId,
    deliveryStatus: "success" | "failed" | "timeout" | "invalid_url",
    details: {
      httpStatusCode?: number;
      responseTime?: number;
      responsePayload?: Record<string, any>;
      errorMessage?: string;
      errorStack?: string;
      nextRetryAt?: Date;
      willRetry?: boolean;
    },
  ) {
    const update: any = {
      deliveryStatus,
      respondedAt: new Date(),
      ...details,
    };
    return WebhookDeliveryModel.findByIdAndUpdate(id, update, { returnDocument: 'after' });
  }

  /**
   * Get failed deliveries for retry
   */
  async getFailedDeliveriesForRetry(limit = 100) {
    return WebhookDeliveryModel.find({
      deliveryStatus: "failed",
      willRetry: true,
      nextRetryAt: { $lte: new Date() },
    })
      .sort({ nextRetryAt: 1 })
      .limit(limit);
  }

  /**
   * Get delivery statistics for an endpoint
   */
  async getEndpointDeliveryStats(endpointId: ObjectId) {
    const result = await WebhookDeliveryModel.aggregate([
      { $match: { webhookEndpointId: endpointId } },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          successCount: {
            $sum: { $cond: [{ $eq: ["$deliveryStatus", "success"] }, 1, 0] },
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ["$deliveryStatus", "failed"] }, 1, 0] },
          },
          timeoutCount: {
            $sum: { $cond: [{ $eq: ["$deliveryStatus", "timeout"] }, 1, 0] },
          },
          avgResponseTime: { $avg: "$responseTime" },
          lastDelivery: { $max: "$createdAt" },
        },
      },
    ]);

    if (result.length === 0) {
      return {
        totalDeliveries: 0,
        successCount: 0,
        failedCount: 0,
        timeoutCount: 0,
        avgResponseTime: 0,
        lastDelivery: null,
        successRate: 0,
      };
    }

    const stats = result[0];
    return {
      ...stats,
      successRate:
        stats.totalDeliveries > 0
          ? Math.round((stats.successCount / stats.totalDeliveries) * 100)
          : 0,
    };
  }

  /**
   * Get recent delivery attempts for an endpoint
   */
  async getRecentDeliveries(endpointId: ObjectId, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return WebhookDeliveryModel.find({
      webhookEndpointId: endpointId,
      createdAt: { $gte: since },
    }).sort({ createdAt: -1 });
  }

  /**
   * Count delivery attempts per status
   */
  async countDeliveriesByStatus(clientId: ObjectId) {
    const result = await WebhookDeliveryModel.aggregate([
      { $match: { clientId } },
      {
        $group: {
          _id: "$deliveryStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = {
      success: 0,
      failed: 0,
      pending: 0,
      timeout: 0,
      invalid_url: 0,
    };

    result.forEach((item: any) => {
      counts[item._id as keyof typeof counts] = item.count;
    });

    return counts;
  }
}

export default new WebhookRepository();
