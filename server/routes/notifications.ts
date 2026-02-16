import { Router, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { authenticateToken } from "../middleware/auth";
import NotificationService from "../services/NotificationService";
import { logger } from "../utils/logger";

const router = Router();

/**
 * GET /api/notifications
 * Get user notifications with filtering options
 * Requires: Authentication
 */
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { limit = 50, skip = 0, unreadOnly = false, type } = req.query;

    const notifications = await NotificationService.getUserNotifications(
      new ObjectId(userId),
      {
        limit: Math.min(parseInt(limit as string), 100),
        skip: parseInt(skip as string),
        unreadOnly: unreadOnly === "true",
        type: type as any,
      }
    );

    res.json({
      total: notifications.length,
      notifications,
    });
  } catch (error) {
    logger.error("Failed to fetch notifications:", { error });
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

/**
 * GET /api/notifications/unread/count
 * Get unread notification count
 * Requires: Authentication
 */
router.get("/unread/count", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const unreadCount = await NotificationService.getUnreadCount(
      new ObjectId(userId)
    );

    res.json({ unreadCount });
  } catch (error) {
    logger.error("Failed to get unread count:", { error });
    res.status(500).json({ error: "Failed to get unread count" });
  }
});

/**
 * GET /api/notifications/stats
 * Get notification statistics
 * Requires: Authentication
 */
router.get("/stats", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const stats = await NotificationService.getNotificationStats(
      new ObjectId(userId)
    );

    res.json(stats);
  } catch (error) {
    logger.error("Failed to get notification stats:", { error });
    res.status(500).json({ error: "Failed to get stats" });
  }
});

/**
 * PATCH /api/notifications/:notificationId/read
 * Mark a notification as read
 * Requires: Authentication
 */
router.patch(
  "/:notificationId/read",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { notificationId } = req.params;

      const notification = await NotificationService.markAsRead(
        new ObjectId(notificationId)
      );

      res.json(notification);
    } catch (error) {
      logger.error("Failed to mark notification as read:", { error });
      res.status(500).json({ error: "Failed to mark as read" });
    }
  }
);

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 * Requires: Authentication
 */
router.patch("/read-all", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const modifiedCount = await NotificationService.markAllAsRead(
      new ObjectId(userId)
    );

    res.json({
      message: "All notifications marked as read",
      count: modifiedCount,
    });
  } catch (error) {
    logger.error("Failed to mark all notifications as read:", { error });
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

/**
 * DELETE /api/notifications/:notificationId
 * Delete a notification
 * Requires: Authentication
 */
router.delete(
  "/:notificationId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { notificationId } = req.params;

      await NotificationService.deleteNotification(new ObjectId(notificationId));

      res.json({ message: "Notification deleted" });
    } catch (error) {
      logger.error("Failed to delete notification:", { error });
      res.status(500).json({ error: "Failed to delete notification" });
    }
  }
);

export default router;
