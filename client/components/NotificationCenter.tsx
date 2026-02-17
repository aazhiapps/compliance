import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Bell,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * NotificationCenter - UI component for managing user notifications
 * Features: View, filter, mark as read, delete notifications
 */

interface Notification {
  id: string;
  userId: string;
  clientId?: string;
  type: string;
  title: string;
  message: string;
  description?: string;
  channels: string[];
  status: "pending" | "sent" | "failed" | "read";
  priority: "low" | "normal" | "high" | "critical";
  readAt?: string;
  sentAt?: string;
  actionUrl?: string;
  actionText?: string;
  createdAt: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  failed: number;
  byType: Record<string, number>;
}

interface NotificationCenterProps {
  onNotificationCount?: (count: number) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onNotificationCount,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading] = useState(false);
  const [showDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [filterType, setFilterType] = useState<"all" | "unread" | "read">("unread");
  const { toast } = useToast();

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    fetchNotifications();
    fetchStats();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Notify parent of unread count
  useEffect(() => {
    onNotificationCount?.(unreadCount);
  }, [unreadCount, onNotificationCount]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?limit=100");
      if (!response.ok) throw new Error("Failed to fetch notifications");

      const data = await response.json();
      setNotifications(data.notifications);

      // Update unread count
      const unread = data.notifications.filter(
        (n: Notification) => n.status !== "read"
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/notifications/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        { method: "PATCH" }
      );

      if (!response.ok) throw new Error("Failed to mark as read");

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, status: "read" as const } : n
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));

      toast({
        title: "Marked as read",
        description: "Notification marked as read",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete notification");

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => Math.max(0, prev - 1));

      toast({
        title: "Deleted",
        description: "Notification deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      if (!response.ok) throw new Error("Failed to mark all as read");

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: "read" as const }))
      );
      setUnreadCount(0);

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive",
      });
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filterType === "unread") return n.status !== "read";
    if (filterType === "read") return n.status === "read";
    return true;
  });

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
      case "read":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-amber-600" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2">
          <Card className="p-3">
            <div className="text-xs text-gray-600">Total</div>
            <div className="text-xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-gray-600">Unread</div>
            <div className="text-xl font-bold text-amber-600">{stats.unread}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-gray-600">Read</div>
            <div className="text-xl font-bold text-green-600">{stats.read}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-gray-600">Failed</div>
            <div className="text-xl font-bold text-red-600">{stats.failed}</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filterType === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("all")}
        >
          All
        </Button>
        <Button
          variant={filterType === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("unread")}
        >
          Unread
        </Button>
        <Button
          variant={filterType === "read" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType("read")}
        >
          Read
        </Button>
      </div>

      {/* Notifications List */}
      <Card className="p-4">
        {loading ? (
          <div className="flex justify-center py-8 text-gray-500">
            Loading...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Bell className="w-8 h-8 mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded border-l-4 ${
                  notification.status === "read"
                    ? "bg-gray-50 border-gray-300"
                    : "bg-blue-50 border-blue-500"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{notification.title}</h4>
                      <Badge
                        className={`text-xs ${getPriorityColor(notification.priority)}`}
                      >
                        {notification.priority}
                      </Badge>
                      {getStatusIcon(notification.status)}
                    </div>

                    <p className="text-sm text-gray-700">{notification.message}</p>

                    {notification.description && (
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>

                      {notification.channels && (
                        <div className="flex gap-1">
                          {notification.channels.map((channel) => (
                            <span
                              key={channel}
                              className="text-xs px-2 py-0.5 bg-gray-200 rounded"
                            >
                              {channel === "in_app" && "App"}
                              {channel === "email" && <Mail className="w-3 h-3" />}
                              {channel === "sms" && "SMS"}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {notification.status !== "read" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}

                    {notification.actionUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          window.location.href = notification.actionUrl!;
                        }}
                      >
                        {notification.actionText || "View"}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Details Dialog */}
      {selectedNotification && (
        <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedNotification.title}</DialogTitle>
              <DialogDescription>{selectedNotification.message}</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold">Description</label>
                <p className="text-sm text-gray-600">
                  {selectedNotification.description || "No additional details"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Status</label>
                  <p className="font-semibold">{selectedNotification.status}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Priority</label>
                  <p className="font-semibold">{selectedNotification.priority}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Created</label>
                  <p className="text-sm">
                    {new Date(selectedNotification.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Channels</label>
                  <p className="text-sm">
                    {selectedNotification.channels.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default NotificationCenter;
