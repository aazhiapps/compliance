import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import {
  AlertCircle,
  Eye,
  RotateCcw,
  Trash2,
  Copy as CopyIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

interface WebhookEndpoint {
  id: string;
  url: string;
  description?: string;
  events: string[];
  subscribeToAll: boolean;
  isActive: boolean;
  isTestMode: boolean;
  successCount: number;
  failureCount: number;
  lastTriggeredAt?: string;
  lastSuccessfulDeliveryAt?: string;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  eventId: string;
  attemptNumber: number;
  status: "success" | "failed" | "pending" | "timeout" | "invalid_url";
  httpStatusCode?: number;
  responseTime?: number;
  errorMessage?: string;
  sentAt: string;
  respondedAt?: string;
  willRetry: boolean;
  nextRetryAt?: string;
}

interface WebhookEvent {
  id: string;
  eventType: string;
  status: "pending" | "processing" | "delivered" | "failed";
  entityType: string;
  entityId: string;
  createdAt: string;
}

interface WebhookStats {
  totalDeliveries: number;
  successCount: number;
  failedCount: number;
  timeoutCount: number;
  avgResponseTime: number;
  successRate: number;
  lastDelivery?: string;
}

type WebhookEventType =
  | "filing.created"
  | "filing.status_changed"
  | "filing.locked"
  | "filing.amended"
  | "document.uploaded"
  | "document.processed"
  | "document.rejected"
  | "itc.reconciliation_completed"
  | "itc.discrepancy_detected"
  | "payment.received"
  | "payment.failed"
  | "compliance.alert"
  | "*";

const AVAILABLE_EVENTS: { value: WebhookEventType; label: string }[] = [
  { value: "filing.created", label: "Filing Created" },
  { value: "filing.status_changed", label: "Filing Status Changed" },
  { value: "filing.locked", label: "Filing Locked" },
  { value: "filing.amended", label: "Filing Amended" },
  { value: "document.uploaded", label: "Document Uploaded" },
  { value: "document.processed", label: "Document Processed" },
  { value: "document.rejected", label: "Document Rejected" },
  { value: "itc.reconciliation_completed", label: "ITC Reconciliation Completed" },
  { value: "itc.discrepancy_detected", label: "ITC Discrepancy Detected" },
  { value: "payment.received", label: "Payment Received" },
  { value: "payment.failed", label: "Payment Failed" },
  { value: "compliance.alert", label: "Compliance Alert" },
  { value: "*", label: "All Events" },
];

export function WebhookManager() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeliveriesDialog, setShowDeliveriesDialog] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<WebhookEndpoint | null>(null);
  const [selectedEndpointStats, setSelectedEndpointStats] = useState<WebhookStats | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [newEndpoint, setNewEndpoint] = useState({
    url: "",
    description: "",
    events: [] as string[],
  });
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/webhooks/endpoints");
      if (!response.ok) throw new Error("Failed to fetch endpoints");
      const data = await response.json();
      setEndpoints(data.endpoints);
    } catch (error) {
      toast.error("Failed to load webhook endpoints");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEndpointStats = async (endpointId: string) => {
    try {
      const response = await fetch(`/api/webhooks/endpoints/${endpointId}/stats`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setSelectedEndpointStats(data.stats);
    } catch (error) {
      toast.error("Failed to load endpoint statistics");
      console.error(error);
    }
  };

  const fetchDeliveries = async (endpointId: string) => {
    try {
      const response = await fetch(`/api/webhooks/endpoints/${endpointId}/deliveries`);
      if (!response.ok) throw new Error("Failed to fetch deliveries");
      const data = await response.json();
      setDeliveries(data.deliveries);
    } catch (error) {
      toast.error("Failed to load deliveries");
      console.error(error);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newEndpoint.url || newEndpoint.events.length === 0) {
      toast.error("URL and at least one event is required");
      return;
    }

    try {
      const response = await fetch("/api/webhooks/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEndpoint),
      });

      if (!response.ok) throw new Error("Failed to create webhook");

      const data = await response.json();
      toast.success("Webhook created successfully");

      // Show secret to user with copy button
      showSecretDialog(data.secret);

      setNewEndpoint({ url: "", description: "", events: [] });
      setShowCreateDialog(false);
      fetchEndpoints();
    } catch (error) {
      toast.error("Failed to create webhook");
      console.error(error);
    }
  };

  const handleToggleEvent = (event: string) => {
    setNewEndpoint({
      ...newEndpoint,
      events: newEndpoint.events.includes(event)
        ? newEndpoint.events.filter((e) => e !== event)
        : [...newEndpoint.events, event],
    });
  };

  const handleDeleteEndpoint = async (endpointId: string) => {
    if (!confirm("Are you sure you want to delete this webhook endpoint?")) return;

    try {
      const response = await fetch(`/api/webhooks/endpoints/${endpointId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete endpoint");

      toast.success("Webhook deleted");
      fetchEndpoints();
    } catch (error) {
      toast.error("Failed to delete webhook");
      console.error(error);
    }
  };

  const handleTestWebhook = async (endpointId: string) => {
    try {
      setTestingEndpoint(endpointId);
      const response = await fetch(`/api/webhooks/endpoints/${endpointId}/test`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to test webhook");

      const result = await response.json();
      setTestResult(result);

      if (result.success) {
        toast.success("Test webhook sent successfully");
      } else {
        toast.error("Test webhook failed: " + result.error);
      }
    } catch (error) {
      toast.error("Failed to test webhook");
      console.error(error);
    } finally {
      setTestingEndpoint(null);
    }
  };

  const handleViewDeliveries = async (endpoint: WebhookEndpoint) => {
    setSelectedEndpoint(endpoint);
    setShowDeliveriesDialog(true);
    fetchDeliveries(endpoint.id);
    fetchEndpointStats(endpoint.id);
  };

  const showSecretDialog = (secret: string) => {
    toast(
      <div className="flex items-center gap-2">
        <code className="flex-1 text-sm">{secret.substring(0, 20)}...</code>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            navigator.clipboard.writeText(secret);
            toast.success("Secret copied!");
          }}
        >
          <CopyIcon className="w-4 h-4" />
        </Button>
      </div>,
      {
        description: "Save this secret securely. It will not be shown again.",
        duration: 10000,
      }
    );
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "failed":
      case "timeout":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return <div>Loading webhook endpoints...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Webhook Management</h2>
          <p className="text-gray-600">Configure webhooks to receive real-time updates</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>+ New Webhook</Button>
      </div>

      {/* Endpoints List */}
      {endpoints.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No webhook endpoints configured</p>
              <p className="text-sm">Create your first webhook to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {endpoints.map((endpoint) => (
            <Card key={endpoint.id.toString()}>
              <CardHeader
                className="pb-3 cursor-pointer hover:bg-gray-50"
                onClick={() =>
                  setExpandedEndpoint(
                    expandedEndpoint === endpoint.id.toString()
                      ? null
                      : endpoint.id.toString()
                  )
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{endpoint.url}</CardTitle>
                      <Badge variant={endpoint.isActive ? "default" : "secondary"}>
                        {endpoint.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {endpoint.isTestMode && <Badge variant="outline">Test Mode</Badge>}
                    </div>
                    {endpoint.description && (
                      <CardDescription>{endpoint.description}</CardDescription>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <span>
                        Success: <strong>{endpoint.successCount}</strong>
                      </span>
                      <span>
                        Failed: <strong>{endpoint.failureCount}</strong>
                      </span>
                      {endpoint.lastSuccessfulDeliveryAt && (
                        <span>
                          Last Success:{" "}
                          <strong>
                            {new Date(endpoint.lastSuccessfulDeliveryAt).toLocaleDateString()}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    {expandedEndpoint === endpoint.id.toString() ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedEndpoint === endpoint.id.toString() && (
                <CardContent className="border-t pt-4 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Subscribed Events:</h4>
                    <div className="flex flex-wrap gap-2">
                      {endpoint.events.map((event) => (
                        <Badge key={event} variant="secondary">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDeliveries(endpoint)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Deliveries
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestWebhook(endpoint.id)}
                      disabled={testingEndpoint === endpoint.id.toString()}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      {testingEndpoint === endpoint.id.toString() ? "Testing..." : "Test"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteEndpoint(endpoint.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>

                  {testResult && (
                    <div className={`p-3 rounded ${testResult.success ? "bg-green-50" : "bg-red-50"}`}>
                      <p className={testResult.success ? "text-green-800" : "text-red-800"}>
                        {testResult.message}
                      </p>
                      {testResult.responseTime && (
                        <p className="text-sm text-gray-600">
                          Response time: {testResult.responseTime}ms
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Webhook Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Webhook Endpoint</DialogTitle>
            <DialogDescription>
              Register a new webhook endpoint to receive real-time events
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Webhook URL *</label>
              <Input
                type="url"
                placeholder="https://example.com/webhooks"
                value={newEndpoint.url}
                onChange={(e) => setNewEndpoint({ ...newEndpoint, url: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                placeholder="Optional description for this webhook"
                value={newEndpoint.description}
                onChange={(e) => setNewEndpoint({ ...newEndpoint, description: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Events *</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                {AVAILABLE_EVENTS.map((event) => (
                  <label key={event.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEndpoint.events.includes(event.value)}
                      onChange={() => handleToggleEvent(event.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWebhook}>Create Webhook</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deliveries Dialog */}
      <Dialog open={showDeliveriesDialog} onOpenChange={setShowDeliveriesDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Webhook Deliveries</DialogTitle>
            <DialogDescription>{selectedEndpoint?.url}</DialogDescription>
          </DialogHeader>

          {selectedEndpointStats && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-gray-600 text-sm">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedEndpointStats.successRate}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-gray-600 text-sm">Avg Response Time</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedEndpointStats.avgResponseTime?.toFixed(0) || 0}ms
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-gray-600 text-sm">Total Deliveries</p>
                  <p className="text-2xl font-bold">{selectedEndpointStats.totalDeliveries}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>HTTP Code</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow key={delivery.id.toString()}>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(delivery.status)}>
                        {delivery.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{delivery.httpStatusCode || "-"}</TableCell>
                    <TableCell>{delivery.responseTime ? `${delivery.responseTime}ms` : "-"}</TableCell>
                    <TableCell>{new Date(delivery.sentAt).toLocaleString()}</TableCell>
                    <TableCell>
                      {delivery.status === "failed" && delivery.willRetry && (
                        <span className="text-sm text-gray-600">
                          Retry at {new Date(delivery.nextRetryAt!).toLocaleString()}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default WebhookManager;
