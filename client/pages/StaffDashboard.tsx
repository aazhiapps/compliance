import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, CheckCircle, XCircle, Search, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Application {
  id: string;
  userId: string;
  serviceId: number;
  serviceName: string;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  assignedStaff?: string;
  assignedStaffName?: string;
  paymentStatus: string;
  paymentAmount: number;
  internalNotes?: string;
}

interface StaffStats {
  totalAssigned: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
}

export default function StaffDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<StaffStats>({
    totalAssigned: 0,
    pending: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [internalNotes, setInternalNotes] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch applications
      const appsResponse = await fetch("/api/staff/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const appsData = await appsResponse.json();

      if (appsData.success) {
        setApplications(appsData.applications);
      }

      // Fetch stats
      const statsResponse = await fetch("/api/staff/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error("Error fetching staff data:", error);
    }
  };

  const handleUpdateStatus = async (appId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/staff/applications/${appId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          internalNotes: internalNotes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchStaffData();
        setSelectedApp(null);
        setInternalNotes("");
      }
    } catch (error) {
      console.error("Error updating application:", error);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || app.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border border-red-200";
      case "under_review":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "submitted":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Staff Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName}! Manage assigned applications and customer requests
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Assigned</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{stats.totalAssigned}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Pending</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.pending}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Under Review</p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">{stats.underReview}</p>
                </div>
                <Users className="w-10 h-10 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Approved</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{stats.approved}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Rejected</p>
                  <p className="text-3xl font-bold text-red-900 mt-1">{stats.rejected}</p>
                </div>
                <XCircle className="w-10 h-10 text-red-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex gap-3 flex-col md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by service name or application ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <CardTitle className="text-lg">Assigned Applications</CardTitle>
            <CardDescription>{filteredApplications.length} applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-blue-200 bg-blue-50">
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Application ID
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Service
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Status
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Created
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Amount
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr
                      key={app.id}
                      className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-mono">{app.id}</td>
                      <td className="py-3 px-4 text-sm font-medium">{app.serviceName}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                            app.status
                          )}`}
                        >
                          {app.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        ₹{app.paymentAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedApp(app);
                            setInternalNotes(app.internalNotes || "");
                          }}
                        >
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredApplications.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No applications found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Application Management Modal */}
        {selectedApp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl m-4">
              <CardHeader>
                <CardTitle>Manage Application</CardTitle>
                <CardDescription>
                  {selectedApp.serviceName} - {selectedApp.id}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Status</label>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                      selectedApp.status
                    )}`}
                  >
                    {selectedApp.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Internal Notes</label>
                  <textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Add internal notes (not visible to customer)..."
                    className="w-full p-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Update Status</label>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedApp.id, "under_review")}
                      className="bg-blue-50 hover:bg-blue-100"
                    >
                      Mark Under Review
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedApp.id, "approved")}
                      className="bg-green-50 hover:bg-green-100 text-green-700"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateStatus(selectedApp.id, "rejected")}
                      className="bg-red-50 hover:bg-red-100 text-red-700"
                    >
                      Reject
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedApp(null);
                      setInternalNotes("");
                    }}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
