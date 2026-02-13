import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  FileText,
  TrendingUp,
  CheckCircle2,
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
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | string>("all");
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [applications, setApplications] = useState<Application[]>([
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
  ]);


  const handleBulkApprove = () => {
    setApplications((prev) =>
      prev.map((app) =>
        selectedApps.has(app.id) ? { ...app, status: "approved" as const } : app
      )
    );
    setSelectedApps(new Set());
  };

  const handleBulkReject = () => {
    setApplications((prev) =>
      prev.map((app) =>
        selectedApps.has(app.id) ? { ...app, status: "rejected" as const } : app
      )
    );
    setSelectedApps(new Set());
  };

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
        return "bg-green-100 text-green-700 border border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border border-red-200";
      case "under_review":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "submitted":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
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

  const approvedCount = applications.filter((a) => a.status === "approved").length;
  const underReviewCount = applications.filter((a) => a.status === "under_review").length;
  const totalRevenue = applications
    .filter((a) => a.paymentStatus === "paid")
    .reduce((sum, a) => sum + a.amount, 0);
  const recentApps = applications.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()).slice(0, 3);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Application Management</h1>
          <p className="text-muted-foreground mt-1">Review and manage all service applications</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Applications</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{applications.length}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Approved</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{approvedCount}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Under Review</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-1">{underReviewCount}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">₹{(totalRevenue / 100).toFixed(0)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Section - Recent Applications */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Recent Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recentApps.map((app) => (
                <div key={app.id} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{app.service}</p>
                      <p className="text-xs text-muted-foreground">{app.userName}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(app.status)}`}>
                      {app.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="text-sm font-medium">₹{app.amount}</span>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/admin/applications/${app.id}`)}>
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-3 flex-col md:flex-row">
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
                  More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">All Applications</CardTitle>
                <CardDescription>
                  {selectedApps.size > 0 ? `${selectedApps.size} selected` : `${filteredApps.length} total applications`}
                </CardDescription>
              </div>
              {selectedApps.size > 0 && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-success hover:bg-success/90 text-white"
                    onClick={handleBulkApprove}
                  >
                    Approve ({selectedApps.size})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleBulkReject}
                  >
                    Reject ({selectedApps.size})
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-purple-200 bg-purple-50">
                    <th className="text-left py-4 px-4">
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
                    <th className="text-left py-4 px-4 font-semibold text-foreground">User</th>
                    <th className="text-left py-4 px-4 font-semibold text-foreground">Service</th>
                    <th className="text-left py-4 px-4 font-semibold text-foreground">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-foreground">Amount</th>
                    <th className="text-left py-4 px-4 font-semibold text-foreground">Payment</th>
                    <th className="text-left py-4 px-4 font-semibold text-foreground">Assigned To</th>
                    <th className="text-left py-4 px-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="border-b border-gray-200 hover:bg-purple-50 transition-colors">
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
                            onClick={() => navigate(`/admin/applications/${app.id}`)}
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
