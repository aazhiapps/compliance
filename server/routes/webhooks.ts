import express, { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { requireStaff } from "../middleware/staff";
import WebhookRepository from "../repositories/WebhookRepository";
import { webhookService } from "../services/WebhookService";
import { WebhookEventType } from "../models/WebhookEndpoint";
import crypto from "crypto";
import logger from "../utils/logger";

const router = Router();

// ==================== WEBHOOK ENDPOINTS ====================

/**
 * POST /api/webhooks/endpoints
 * Create a new webhook endpoint
 */
router.post(
  "/endpoints",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const { url, description, events, headers, metadata } = req.body;
      const userId = (req as any).userId;

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      if (!events || !Array.isArray(events) || events.length === 0) {
        return res
          .status(400)
          .json({ error: "At least one event type is required" });
      }

      // Generate a secure random secret
      const secret = crypto.randomBytes(32).toString("hex");

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      const endpoint = await WebhookRepository.createWebhookEndpoint({
        clientId: (req as any).clientId,
        userId,
        url,
        description,
        events: Array.isArray(events)
          ? (events as WebhookEventType[])
          : [events as WebhookEventType],
        secret,
        headers,
        metadata,
      });

      res.status(201).json({
        id: endpoint._id,
        url: endpoint.url,
        description: endpoint.description,
        events: endpoint.events,
        isActive: endpoint.isActive,
        secret: secret, // Return secret only once at creation
        createdAt: endpoint.createdAt,
      });
    } catch (error) {
      logger.error("Failed to create webhook endpoint", {
        message: (error as Error).message,
      });
      res.status(500).json({ error: "Failed to create webhook endpoint" });
    }
  },
);

/**
 * GET /api/webhooks/endpoints
 * List all webhook endpoints for the client
 */
router.get(
  "/endpoints",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const clientId = (req as any).clientId;
      const activeOnly = req.query.active === "true";

      const endpoints = await WebhookRepository.getClientWebhookEndpoints(
        clientId,
        activeOnly,
      );

      res.json({
        endpoints: endpoints.map((ep: any) => ({
          id: ep._id,
          url: ep.url,
          description: ep.description,
          events: ep.events,
          subscribeToAll: ep.subscribeToAll,
          isActive: ep.isActive,
          isTestMode: ep.isTestMode,
          lastTriggeredAt: ep.lastTriggeredAt,
          lastSuccessfulDeliveryAt: ep.lastSuccessfulDeliveryAt,
          successCount: ep.successCount,
          failureCount: ep.failureCount,
          createdAt: ep.createdAt,
        })),
        total: endpoints.length,
      });
    } catch (error) {
      logger.error("Failed to fetch webhook endpoints", {
        message: (error as Error).message,
      });
      res.status(500).json({ error: "Failed to fetch webhook endpoints" });
    }
  },
);

/**
 * GET /api/webhooks/endpoints/:id
 * Get a specific webhook endpoint
 */
router.get(
  "/endpoints/:id",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const endpoint = await WebhookRepository.getWebhookEndpointById(
        new ObjectId(id),
      );

      if (!endpoint) {
        return res.status(404).json({ error: "Webhook endpoint not found" });
      }

      if (endpoint.clientId.toString() !== (req as any).clientId.toString()) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Get delivery statistics
      const stats = await WebhookRepository.getEndpointDeliveryStats(
        endpoint._id,
      );

      res.json({
        id: endpoint._id,
        url: endpoint.url,
        description: endpoint.description,
        events: endpoint.events,
        subscribeToAll: endpoint.subscribeToAll,
        isActive: endpoint.isActive,
        isTestMode: endpoint.isTestMode,
        lastTriggeredAt: endpoint.lastTriggeredAt,
        lastSuccessfulDeliveryAt: endpoint.lastSuccessfulDeliveryAt,
        successCount: endpoint.successCount,
        failureCount: endpoint.failureCount,
        stats,
        createdAt: endpoint.createdAt,
        updatedAt: endpoint.updatedAt,
      });
    } catch (error) {
      logger.error("Failed to fetch webhook endpoint", {
        message: (error as Error).message,
      });
      res.status(500).json({ error: "Failed to fetch webhook endpoint" });
    }
  },
);

/**
 * PATCH /api/webhooks/endpoints/:id
 * Update a webhook endpoint
 */
router.patch(
  "/endpoints/:id",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        url,
        description,
        events,
        isActive,
        isTestMode,
        headers,
        metadata,
      } = req.body;

      const endpoint = await WebhookRepository.getWebhookEndpointById(
        new ObjectId(id),
      );
      if (!endpoint) {
        return res.status(404).json({ error: "Webhook endpoint not found" });
      }

      if (endpoint.clientId.toString() !== (req as any).clientId.toString()) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Validate URL if provided
      if (url) {
        try {
          new URL(url);
        } catch {
          return res.status(400).json({ error: "Invalid URL format" });
        }
      }

      const updateInput: any = {};
      if (url) updateInput.url = url;
      if (description !== undefined) updateInput.description = description;
      if (events) {
        updateInput.events = Array.isArray(events) ? events : [events];
      }
      if (isActive !== undefined) updateInput.isActive = isActive;
      if (isTestMode !== undefined) updateInput.isTestMode = isTestMode;
      if (headers !== undefined) updateInput.headers = headers;
      if (metadata !== undefined) updateInput.metadata = metadata;

      const updated = await WebhookRepository.updateWebhookEndpoint(
        new ObjectId(id),
        updateInput,
      );

      res.json({
        id: updated._id,
        url: updated.url,
        description: updated.description,
        events: updated.events,
        isActive: updated.isActive,
        isTestMode: updated.isTestMode,
        successCount: updated.successCount,
        failureCount: updated.failureCount,
        updatedAt: updated.updatedAt,
      });
    } catch (error) {
      logger.error("Failed to update webhook endpoint", {
        message: (error as Error).message,
      });
      res.status(500).json({ error: "Failed to update webhook endpoint" });
    }
  },
);

/**
 * DELETE /api/webhooks/endpoints/:id
 * Delete a webhook endpoint
 */
router.delete(
  "/endpoints/:id",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const endpoint = await WebhookRepository.getWebhookEndpointById(
        new ObjectId(id),
      );

      if (!endpoint) {
        return res.status(404).json({ error: "Webhook endpoint not found" });
      }

      if (endpoint.clientId.toString() !== (req as any).clientId.toString()) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await WebhookRepository.deleteWebhookEndpoint(new ObjectId(id));
      res.json({ message: "Webhook endpoint deleted" });
    } catch (error) {
      logger.error("Failed to delete webhook endpoint", {
        message: (error as Error).message,
      });
      res.status(500).json({ error: "Failed to delete webhook endpoint" });
    }
  },
);

/**
 * POST /api/webhooks/endpoints/:id/test
 * Test webhook endpoint
 */
router.post(
  "/endpoints/:id/test",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const endpoint = await WebhookRepository.getWebhookEndpointById(
        new ObjectId(id),
      );

      if (!endpoint) {
        return res.status(404).json({ error: "Webhook endpoint not found" });
      }

      if (endpoint.clientId.toString() !== (req as any).clientId.toString()) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const result = await webhookService.testWebhookEndpoint(endpoint._id);
      res.json(result);
    } catch (error) {
      logger.error("Failed to test webhook endpoint", {
        message: (error as Error).message,
      });
      res.status(500).json({ error: "Failed to test webhook endpoint" });
    }
  },
);

// ==================== WEBHOOK EVENTS ====================

/**
 * GET /api/webhooks/events
 * List webhook events
 */
router.get(
  "/events",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const clientId = (req as any).clientId;
      const { status, eventType, limit = 50, skip = 0 } = req.query;

      const events = await WebhookRepository.getClientWebhookEvents(clientId, {
        status: status as any,
        eventType: eventType as WebhookEventType,
        limit: parseInt(limit as string),
        skip: parseInt(skip as string),
      });

      const counts = await WebhookRepository.countEventsByStatus(clientId);

      res.json({
        events: events.map((evt: any) => ({
          id: evt._id,
          eventType: evt.eventType,
          status: evt.status,
          entityType: evt.entityType,
          entityId: evt.entityId,
          source: evt.source,
          attemptCount: evt.attemptCount,
          createdAt: evt.createdAt,
        })),
        counts,
        total: events.length,
      });
    } catch (error) {
      logger.error("Failed to fetch webhook events", {
        message: (error as Error).message,
      });
      res.status(500).json({ error: "Failed to fetch webhook events" });
    }
  },
);

// ==================== WEBHOOK DELIVERIES ====================

/**
 * GET /api/webhooks/endpoints/:id/deliveries
 * Get deliveries for a webhook endpoint
 */
router.get(
  "/endpoints/:id/deliveries",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, limit = 50, skip = 0 } = req.query;

      const endpoint = await WebhookRepository.getWebhookEndpointById(
        new ObjectId(id),
      );
      if (!endpoint) {
        return res.status(404).json({ error: "Webhook endpoint not found" });
      }

      if (endpoint.clientId.toString() !== (req as any).clientId.toString()) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const deliveries = await WebhookRepository.getEndpointDeliveries(
        endpoint._id,
        {
          status: status as any,
          limit: parseInt(limit as string),
          skip: parseInt(skip as string),
        },
      );

      const counts = await WebhookRepository.countDeliveriesByStatus(
        (req as any).clientId,
      );

      res.json({
        deliveries: deliveries.map((d: any) => ({
          id: d._id,
          eventId: d.webhookEventId,
          attemptNumber: d.attemptNumber,
          status: d.deliveryStatus,
          httpStatusCode: d.httpStatusCode,
          responseTime: d.responseTime,
          errorMessage: d.errorMessage,
          sentAt: d.sentAt,
          respondedAt: d.respondedAt,
          willRetry: d.willRetry,
          nextRetryAt: d.nextRetryAt,
        })),
        counts,
        total: deliveries.length,
      });
    } catch (error) {
      logger.error("Failed to fetch webhook deliveries", {
        message: (error as Error).message,
      });
      res.status(500).json({ error: "Failed to fetch webhook deliveries" });
    }
  },
);

/**
 * GET /api/webhooks/endpoints/:id/deliveries/:deliveryId
 * Get a specific delivery
 */
router.get(
  "/endpoints/:id/deliveries/:deliveryId",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const { deliveryId } = req.params;
      const delivery = await WebhookRepository.getWebhookDeliveryById(
        new ObjectId(deliveryId),
      );

      if (!delivery) {
        return res.status(404).json({ error: "Delivery not found" });
      }

      if (delivery.clientId.toString() !== (req as any).clientId.toString()) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      res.json({
        id: delivery._id,
        eventId: delivery.webhookEventId,
        attemptNumber: delivery.attemptNumber,
        status: delivery.deliveryStatus,
        httpStatusCode: delivery.httpStatusCode,
        responseTime: delivery.responseTime,
        requestPayload: delivery.requestPayload,
        responsePayload: delivery.responsePayload,
        errorMessage: delivery.errorMessage,
        errorStack: delivery.errorStack,
        sentAt: delivery.sentAt,
        respondedAt: delivery.respondedAt,
        willRetry: delivery.willRetry,
        nextRetryAt: delivery.nextRetryAt,
      });
    } catch (error) {
      logger.error("Failed to fetch delivery", {
        message: (error as Error).message,
      });
      res.status(500).json({ error: "Failed to fetch delivery" });
    }
  },
);

/**
 * POST /api/webhooks/deliveries/:deliveryId/retry
 * Retry a failed delivery
 */
router.post(
  "/deliveries/:deliveryId/retry",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const { deliveryId } = req.params;
      const delivery = await WebhookRepository.getWebhookDeliveryById(
        new ObjectId(deliveryId),
      );

      if (!delivery) {
        return res.status(404).json({ error: "Delivery not found" });
      }

      if (delivery.clientId.toString() !== (req as any).clientId.toString()) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (delivery.deliveryStatus === "success") {
        return res
          .status(400)
          .json({ error: "Cannot retry successful delivery" });
      }

      await webhookService.retryWebhookDelivery(delivery._id);

      res.json({ message: "Retry queued for delivery" });
    } catch (error) {
      logger.error("Failed to retry webhook delivery", {
        message: (error as Error).message,
      });
      res.status(500).json({ error: "Failed to retry webhook delivery" });
    }
  },
);

/**
 * GET /api/webhooks/endpoints/:id/stats
 * Get delivery statistics for an endpoint
 */
router.get(
  "/endpoints/:id/stats",
  authenticateToken,
  requireStaff,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const endpoint = await WebhookRepository.getWebhookEndpointById(
        new ObjectId(id),
      );

      if (!endpoint) {
        return res.status(404).json({ error: "Webhook endpoint not found" });
      }

      if (endpoint.clientId.toString() !== (req as any).clientId.toString()) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const stats = await WebhookRepository.getEndpointDeliveryStats(
        endpoint._id,
      );
      const recentDeliveries = await WebhookRepository.getRecentDeliveries(
        endpoint._id,
        24,
      );

      res.json({
        stats,
        recentDeliveries: recentDeliveries.map((d: any) => ({
          id: d._id,
          status: d.deliveryStatus,
          httpStatusCode: d.httpStatusCode,
          responseTime: d.responseTime,
          createdAt: d.createdAt,
        })),
      });
    } catch (error) {
      logger.error("Failed to fetch endpoint statistics", {
        message: (error as Error).message,
      });
      res.status(500).json({ error: "Failed to fetch endpoint statistics" });
    }
  },
);

export default router;
