import axios, { AxiosError } from "axios";
import crypto from "crypto";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import WebhookRepository from "../repositories/WebhookRepository";
import QueueService from "./QueueService";
import { WebhookEventType } from "../models/WebhookEndpoint";
import logger from "../utils/logger";

export interface PublishWebhookEventInput {
  clientId: mongoose.Types.ObjectId;
  eventType: WebhookEventType;
  entityType:
    | "filing"
    | "document"
    | "invoice"
    | "itc_reconciliation"
    | "payment"
    | "client";
  entityId: mongoose.Types.ObjectId;
  data: Record<string, any>;
  source:
    | "filing_service"
    | "itc_service"
    | "document_service"
    | "notification_service"
    | "manual";
}

export interface WebhookDeliveryConfig {
  timeout?: number; // milliseconds
  maxRetries?: number;
  retryBackoff?: number; // exponential backoff multiplier
}

/**
 * WebhookService handles publishing webhook events and managing deliveries
 */
export class WebhookService {
  private defaultConfig: WebhookDeliveryConfig = {
    timeout: 10000, // 10 seconds
    maxRetries: 5,
    retryBackoff: 2,
  };

  /**
   * Publish a webhook event
   * Creates the event and queues it for delivery to subscribed endpoints
   */
  async publishWebhookEvent(input: PublishWebhookEventInput) {
    const correlationId = uuidv4();

    try {
      // Create the webhook event
      const event = await WebhookRepository.createWebhookEvent({
        ...input,
        correlationId,
      });

      logger.info("Webhook event created", {
        eventId: event._id,
        eventType: input.eventType,
        clientId: input.clientId,
        correlationId,
      });

      // Queue the event for delivery
      await QueueService.addJob("webhooks", "deliver-webhook-event", {
        eventId: event._id,
      });

      return event;
    } catch (error) {
      logger.error("Failed to publish webhook event", {
        eventType: input.eventType,
        clientId: input.clientId.toString(),
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Process webhook event delivery
   * Sends the event to all subscribed endpoints
   */
  async processWebhookEventDelivery(eventId: mongoose.Types.ObjectId) {
    try {
      const event = await WebhookRepository.getWebhookEventById(eventId);
      if (!event) {
        logger.warn("Webhook event not found", { eventId });
        return;
      }

      // Update event status to processing
      await WebhookRepository.updateEventStatus(eventId, "processing");

      // Get all subscribed endpoints for this event
      const endpoints = await WebhookRepository.getSubscribedEndpoints(
        event.clientId,
        event.eventType,
      );

      if (endpoints.length === 0) {
        logger.info("No subscribed endpoints for event", {
          eventId,
          eventType: event.eventType,
        });
        await WebhookRepository.updateEventStatus(eventId, "delivered");
        return;
      }

      // Prepare the payload
      const payload = {
        id: event._id,
        eventType: event.eventType,
        timestamp: new Date().toISOString(),
        data: event.data,
        entityType: event.entityType,
        entityId: event.entityId,
        correlationId: event.correlationId,
      };

      let allDelivered = true;

      // Deliver to each endpoint
      for (const endpoint of endpoints) {
        try {
          await this.deliverToEndpoint(event._id, endpoint, payload);
        } catch (error) {
          logger.error("Failed to deliver webhook to endpoint", {
            eventId: eventId.toString(),
            endpointId: endpoint._id.toString(),
            error: (error as Error).message,
          });
          allDelivered = false;
        }
      }

      // Update event status
      const finalStatus = allDelivered ? "delivered" : "failed";
      await WebhookRepository.updateEventStatus(eventId, finalStatus);

      logger.info("Webhook event processing completed", {
        eventId,
        endpointCount: endpoints.length,
        status: finalStatus,
      });
    } catch (error) {
      logger.error("Error processing webhook event delivery", {
        eventId: eventId.toString(),
        error: (error as Error).message,
      });
      await WebhookRepository.updateEventStatus(
        eventId,
        "failed",
        (error as Error).message,
      );
    }
  }

  /**
   * Deliver webhook to a specific endpoint
   */
  private async deliverToEndpoint(
    eventId: mongoose.Types.ObjectId,
    endpoint: any,
    payload: Record<string, any>,
  ) {
    const attemptNumber = 1; // First attempt

    // Get endpoint secret (fetch with select: false)
    const endpointWithSecret = await endpoint.constructor
      .findById(endpoint._id)
      .select("+secret");
    if (!endpointWithSecret) {
      throw new Error("Endpoint secret not found");
    }

    // Generate signature
    const signature = this.generateSignature(
      payload,
      endpointWithSecret.secret,
    );

    // Create delivery record
    const delivery = await WebhookRepository.createWebhookDelivery({
      webhookEventId: eventId,
      webhookEndpointId: endpoint._id,
      clientId: endpoint.clientId,
      attemptNumber,
      requestPayload: payload,
      signature,
    });

    try {
      // Prepare request headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Signature": `sha256=${signature}`,
        "X-Webhook-Event": payload.eventType,
        "X-Webhook-ID": payload.id,
        "X-Webhook-Timestamp": payload.timestamp,
        "User-Agent": "GST-Compliance-Webhooks/1.0",
      };

      // Add custom headers if configured
      if (endpoint.headers) {
        Object.assign(headers, endpoint.headers);
      }

      // Deliver the webhook
      const startTime = Date.now();
      const response = await axios.post(endpoint.url, payload, {
        headers,
        timeout: this.defaultConfig.timeout,
      });
      const responseTime = Date.now() - startTime;

      // Update delivery as successful
      await WebhookRepository.updateDeliveryResponse(delivery._id, "success", {
        httpStatusCode: response.status,
        responseTime,
        responsePayload: response.data,
      });

      // Update endpoint stats
      await WebhookRepository.updateEndpointStats(endpoint._id, true);

      logger.info("Webhook delivered successfully", {
        eventId,
        endpointId: endpoint._id,
        statusCode: response.status,
        responseTime,
      });
    } catch (error) {
      const axiosError = error as AxiosError;
      let deliveryStatus: "failed" | "timeout" | "invalid_url" = "failed";
      let errorMessage = (error as Error).message;

      if (
        axiosError.code === "ECONNABORTED" ||
        axiosError.code === "ETIMEDOUT"
      ) {
        deliveryStatus = "timeout";
      } else if (
        axiosError.code === "ENOTFOUND" ||
        axiosError.code === "ECONNREFUSED"
      ) {
        deliveryStatus = "invalid_url";
      }

      const willRetry = attemptNumber < (endpoint.retryPolicy?.maxRetries || 5);

      let nextRetryAt: Date | undefined;
      if (willRetry) {
        const backoffMs =
          (endpoint.retryPolicy?.initialBackoffMs || 2000) *
          Math.pow(
            endpoint.retryPolicy?.initialBackoffMs || 2,
            attemptNumber - 1,
          );
        nextRetryAt = new Date(Date.now() + backoffMs);
      }

      // Update delivery as failed
      await WebhookRepository.updateDeliveryResponse(
        delivery._id,
        deliveryStatus,
        {
          httpStatusCode: axiosError.response?.status,
          responsePayload: axiosError.response?.data as
            | Record<string, any>
            | undefined,
          errorMessage,
          errorStack: axiosError.stack,
          nextRetryAt,
          willRetry,
        },
      );

      // Update endpoint stats
      await WebhookRepository.updateEndpointStats(endpoint._id, false);

      if (!willRetry) {
        // Queue retry job if needed
        await QueueService.addJob("webhooks", "retry-webhook-delivery", {
          deliveryId: delivery._id,
        });
      }

      logger.warn("Webhook delivery failed", {
        eventId,
        endpointId: endpoint._id,
        deliveryStatus,
        errorMessage,
        willRetry,
      });
    }
  }

  /**
   * Retry failed webhook delivery
   */
  async retryWebhookDelivery(deliveryId: mongoose.Types.ObjectId) {
    try {
      const delivery =
        await WebhookRepository.getWebhookDeliveryById(deliveryId);
      if (!delivery) {
        logger.warn("Webhook delivery not found", { deliveryId });
        return;
      }

      const event = await WebhookRepository.getWebhookEventById(
        delivery.webhookEventId,
      );
      const endpoint = await WebhookRepository.getWebhookEndpointById(
        delivery.webhookEndpointId,
      );

      if (!event || !endpoint) {
        logger.warn("Webhook event or endpoint not found for retry", {
          deliveryId,
        });
        return;
      }

      const newAttemptNumber = delivery.attemptNumber + 1;

      // Get endpoint secret
      const endpointWithSecret = await endpoint.constructor
        .findById(endpoint._id)
        .select("+secret");

      // Prepare payload
      const payload = {
        id: event._id,
        eventType: event.eventType,
        timestamp: new Date().toISOString(),
        data: event.data,
        entityType: event.entityType,
        entityId: event.entityId,
        correlationId: event.correlationId,
      };

      // Generate signature
      const signature = this.generateSignature(
        payload,
        endpointWithSecret.secret,
      );

      // Create new delivery record
      const newDelivery = await WebhookRepository.createWebhookDelivery({
        webhookEventId: event._id,
        webhookEndpointId: endpoint._id,
        clientId: endpoint.clientId,
        attemptNumber: newAttemptNumber,
        requestPayload: payload,
        signature,
      });

      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-Webhook-Signature": `sha256=${signature}`,
          "X-Webhook-Event": payload.eventType,
          "X-Webhook-ID": payload.id,
          "X-Webhook-Timestamp": payload.timestamp,
          "X-Webhook-Attempt": newAttemptNumber.toString(),
          "User-Agent": "GST-Compliance-Webhooks/1.0",
        };

        if (endpoint.headers) {
          Object.assign(headers, endpoint.headers);
        }

        const startTime = Date.now();
        const response = await axios.post(endpoint.url, payload, {
          headers,
          timeout: this.defaultConfig.timeout,
        });
        const responseTime = Date.now() - startTime;

        await WebhookRepository.updateDeliveryResponse(
          newDelivery._id,
          "success",
          {
            httpStatusCode: response.status,
            responseTime,
            responsePayload: response.data,
          },
        );

        await WebhookRepository.updateEndpointStats(endpoint._id, true);

        logger.info("Webhook delivery retry successful", {
          deliveryId,
          newDeliveryId: newDelivery._id,
          attemptNumber: newAttemptNumber,
        });
      } catch (error) {
        const axiosError = error as AxiosError;
        let deliveryStatus: "failed" | "timeout" | "invalid_url" = "failed";

        if (
          axiosError.code === "ECONNABORTED" ||
          axiosError.code === "ETIMEDOUT"
        ) {
          deliveryStatus = "timeout";
        } else if (
          axiosError.code === "ENOTFOUND" ||
          axiosError.code === "ECONNREFUSED"
        ) {
          deliveryStatus = "invalid_url";
        }

        const willRetry =
          newAttemptNumber < (endpoint.retryPolicy?.maxRetries || 5);

        let nextRetryAt: Date | undefined;
        if (willRetry) {
          const backoffMs =
            (endpoint.retryPolicy?.initialBackoffMs || 2000) *
            Math.pow(
              endpoint.retryPolicy?.initialBackoffMs || 2,
              newAttemptNumber - 1,
            );
          nextRetryAt = new Date(Date.now() + backoffMs);
        }

        await WebhookRepository.updateDeliveryResponse(
          newDelivery._id,
          deliveryStatus,
          {
            httpStatusCode: axiosError.response?.status,
            responsePayload: axiosError.response?.data as
              | Record<string, any>
              | undefined,
            errorMessage: (error as Error).message,
            nextRetryAt,
            willRetry,
          },
        );

        await WebhookRepository.updateEndpointStats(endpoint._id, false);

        if (willRetry) {
          const backoffMs =
            (endpoint.retryPolicy?.initialBackoffMs || 2000) *
            Math.pow(
              endpoint.retryPolicy?.initialBackoffMs || 2,
              newAttemptNumber - 1,
            );
          await QueueService.addJob(
            "webhooks",
            "retry-webhook-delivery",
            { deliveryId: newDelivery._id },
            { delay: backoffMs },
          );
        }

        logger.warn("Webhook delivery retry failed", {
          deliveryId,
          newDeliveryId: newDelivery._id,
          attemptNumber: newAttemptNumber,
          deliveryStatus,
        });
      }
    } catch (error) {
      logger.error("Error retrying webhook delivery", {
        deliveryId: deliveryId.toString(),
        error: (error as Error).message,
      });
    }
  }

  /**
   * Generate HMAC-SHA256 signature for webhook payload
   */
  private generateSignature(
    payload: Record<string, any>,
    secret: string,
  ): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac("sha256", secret)
      .update(payloadString)
      .digest("hex");
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Test webhook delivery
   */
  async testWebhookEndpoint(endpointId: mongoose.Types.ObjectId) {
    const endpoint = await WebhookRepository.getWebhookEndpointById(endpointId);
    if (!endpoint) {
      throw new Error("Webhook endpoint not found");
    }

    const testPayload = {
      id: "test-" + uuidv4(),
      eventType: "*",
      timestamp: new Date().toISOString(),
      data: {
        message: "This is a test webhook from GST Compliance platform",
        testMode: true,
      },
      entityType: "client",
      entityId: endpoint.clientId,
      correlationId: uuidv4(),
    };

    // Get endpoint secret
    const endpointWithSecret = await endpoint.constructor
      .findById(endpoint._id)
      .select("+secret");

    const signature = this.generateSignature(
      testPayload,
      endpointWithSecret.secret,
    );

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Signature": `sha256=${signature}`,
        "X-Webhook-Event": "test",
        "X-Webhook-ID": testPayload.id,
        "X-Webhook-Timestamp": testPayload.timestamp,
        "User-Agent": "GST-Compliance-Webhooks/1.0",
      };

      if (endpoint.headers) {
        Object.assign(headers, endpoint.headers);
      }

      const startTime = Date.now();
      const response = await axios.post(endpoint.url, testPayload, {
        headers,
        timeout: this.defaultConfig.timeout,
      });
      const responseTime = Date.now() - startTime;

      logger.info("Test webhook successful", {
        endpointId,
        statusCode: response.status,
        responseTime,
      });

      return {
        success: true,
        statusCode: response.status,
        responseTime,
        message: "Webhook endpoint is working correctly",
      };
    } catch (error) {
      logger.error("Test webhook failed", {
        endpointId: endpointId.toString(),
        error: (error as Error).message,
      });

      return {
        success: false,
        error: (error as Error).message,
        message: "Failed to deliver test webhook",
      };
    }
  }
}

export const webhookService = new WebhookService();
