import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Trash2,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

interface Application {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  service: string;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected";
  submittedDate: string;
  amount: number;
  paymentStatus: "pending" | "paid";
  executiveAssigned?: string;
}

export default function AdminApplications() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | string>("all");
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());

  // Mock application data
  const applications: Application[] = [
    {
      id: "app_1",
      userId: "user_1",
      userName: "Demo User",
      userEmail: "demo@example.com",
      service: "GST Registration",
      status: "approved",
      submittedDate: "2024-02-01",
      amount: 499,
      paymentStatus: "paid",
      executiveAssigned: "Rajesh Kumar",
    },
    {
      id: "app_2",
      userId: "user_1",
      userName: "Demo User",
      userEmail: "demo@example.com",
      service: "Company Registration",
      status: "under_review",
      submittedDate: "2024-02-04",
      amount: 2999,
      paymentStatus: "paid",
      executiveAssigned: "Priya Singh",
    },
    {
      id: "app_3",
      userId: "user_2",
      userName: "Rajesh Kumar",
      userEmail: "rajesh@example.com",
      service: "PAN Registration",
      status: "submitted",
      submittedDate: "2024-02-05",
      amount: 299,
      paymentStatus: "pending",
    },
    {
      id: "app_4",
      userId: "user_3",
      userName: "Priya Singh",
      userEmail: "priya@example.com",
      service: "Trademark Registration",
      status: "draft",
      submittedDate: "2024-02-06",
      amount: 5999,
      paymentStatus: "pending",
    },
    {
      id: "app_5",
      userId: "user_2",
      userName: "Rajesh Kumar",
      userEmail: "rajesh@example.com",
      service: "Compliance Audit",
      status: "under_review",
      submittedDate: "2024-02-07",
      amount: 3999,
      paymentStatus: "paid",
      executiveAssigned: "Amit Patel",
    },
  ];

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const toggleAppSelect = (appId: string) => {
    const newSelected = new Set(selectedApps);
    if (newSelected.has(appId)) {
      newSelected.delete(appId);
    } else {
      newSelected.add(appId);
    }
    setSelectedApps(newSelected);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success/10 text-success border-success/20";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      case "under_review":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "submitted":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4" />;
      case "under_review":
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const stats = [
    {
      label: "Total Applications",
      value: applications.length,
      color: "text-blue-600",
    },
    {
      label: "Approved",
      value: applications.filter((a) => a.status === "approved").length,
      color: "text-success",
    },
    {
      label: "Under Review",
      value: applications.filter((a) => a.status === "under_review").length,
      color: "text-yellow-600",
    },
    {
      label: "Total Revenue",
      value: `₹${applications
        .filter((a) => a.paymentStatus === "paid")
        .reduce((sum, a) => sum + a.amount, 0)}`,
      color: "text-green-600",
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Application Management</h1>
          <p className="text-muted-foreground mt-1">Review and manage all service applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <Card key={idx}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 flex-col md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by user, email, or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Applications ({filteredApps.length})</CardTitle>
                <CardDescription>
                  {selectedApps.size > 0 && `${selectedApps.size} selected`}
                </CardDescription>
              </div>
              {selectedApps.size > 0 && (
                <div className="flex gap-2">
                  <Button size="sm" className="bg-success hover:bg-success/90">
                    Approve Selected
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200">
                    Reject Selected
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedApps(new Set(filteredApps.map((a) => a.id)));
                          } else {
                            setSelectedApps(new Set());
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-semibold">User</th>
                    <th className="text-left py-3 px-4 font-semibold">Service</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold">Payment</th>
                    <th className="text-left py-3 px-4 font-semibold">Assigned To</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedApps.has(app.id)}
                          onChange={() => toggleAppSelect(app.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-foreground">{app.userName}</p>
                          <p className="text-xs text-muted-foreground">{app.userEmail}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{app.service}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(app.submittedDate).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            app.status
                          )}`}
                        >
                          {getStatusIcon(app.status)}
                          {app.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">₹{app.amount}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            app.paymentStatus === "paid"
                              ? "bg-success/10 text-success"
                              : "bg-yellow-50 text-yellow-700"
                          }`}
                        >
                          {app.paymentStatus === "paid" ? "✓ Paid" : "⏱ Pending"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {app.executiveAssigned ? (
                          <span className="text-sm font-medium">{app.executiveAssigned}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            title="View Details"
                            className="p-2 h-auto"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <button
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredApps.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No applications found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
