import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  FileText,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  TrendingUp,
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "customers" | "applications" | "payments"
  >("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const stats = [
    {
      label: "Total Customers",
      value: "1,243",
      change: "+12%",
      icon: <Users className="w-6 h-6 text-primary" />,
    },
    {
      label: "Active Applications",
      value: "456",
      change: "+23%",
      icon: <FileText className="w-6 h-6 text-blue-600" />,
    },
    {
      label: "Total Revenue",
      value: "₹24,50,000",
      change: "+18%",
      icon: <DollarSign className="w-6 h-6 text-green-600" />,
    },
    {
      label: "Approval Rate",
      value: "94.2%",
      change: "+2.1%",
      icon: <CheckCircle className="w-6 h-6 text-success" />,
    },
  ];

  const recentUsers = [
    {
      id: "user_123",
      name: "Rajesh Kumar",
      email: "rajesh@example.com",
      businessType: "startup",
      joinedDate: "2024-02-08",
      status: "active",
    },
    {
      id: "user_124",
      name: "Priya Singh",
      email: "priya@example.com",
      businessType: "company",
      joinedDate: "2024-02-07",
      status: "active",
    },
    {
      id: "user_125",
      name: "Amit Patel",
      email: "amit@example.com",
      businessType: "individual",
      joinedDate: "2024-02-06",
      status: "inactive",
    },
  ];

  const recentApplications = [
    {
      id: "app_001",
      userName: "Rajesh Kumar",
      service: "GST Registration",
      status: "approved",
      submittedDate: "2024-02-05",
      amount: "₹499",
    },
    {
      id: "app_002",
      userName: "Priya Singh",
      service: "Company Registration",
      status: "under_review",
      submittedDate: "2024-02-04",
      amount: "₹2,999",
    },
    {
      id: "app_003",
      userName: "Amit Patel",
      service: "PAN Registration",
      status: "pending",
      submittedDate: "2024-02-03",
      amount: "₹299",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage customers, applications, and monitor platform performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {stat.change}
                    </p>
                  </div>
                  {stat.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-border">
          {(["overview", "customers", "applications", "payments"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ),
          )}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Customers</CardTitle>
                <CardDescription>Latest customer registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-sm">
                          Name
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-sm">
                          Email
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-sm">
                          Type
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-sm">
                          Joined
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-sm">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-border hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-sm">{user.name}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {user.email}
                          </td>
                          <td className="py-3 px-4 text-sm capitalize">
                            {user.businessType}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {new Date(user.joinedDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                user.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {user.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Latest service applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-sm">
                          User
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-sm">
                          Service
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-sm">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-sm">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-sm">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentApplications.map((app) => (
                        <tr
                          key={app.id}
                          className="border-b border-border hover:bg-gray-50"
                        >
                          <td className="py-3 px-4 text-sm">{app.userName}</td>
                          <td className="py-3 px-4 text-sm">{app.service}</td>
                          <td className="py-3 px-4 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                                app.status === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : app.status === "under_review"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {app.status === "approved" ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <AlertCircle className="w-3 h-3" />
                              )}
                              {app.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-medium">
                            {app.amount}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {new Date(app.submittedDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === "customers" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Customers</CardTitle>
                  <CardDescription>
                    Manage customer accounts and permissions
                  </CardDescription>
                </div>
                <Button className="bg-primary hover:bg-primary/90">
                  Add Customer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Joined
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-border hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-sm">{user.name}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {user.email}
                        </td>
                        <td className="py-3 px-4 text-sm capitalize">
                          {user.businessType}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(user.joinedDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <button className="text-muted-foreground hover:text-foreground">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <Card>
            <CardHeader>
              <CardTitle>All Applications</CardTitle>
              <CardDescription>
                Review and manage service applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        ID
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        User
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Service
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-sm">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApplications.map((app) => (
                      <tr
                        key={app.id}
                        className="border-b border-border hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-sm font-mono text-muted-foreground">
                          {app.id}
                        </td>
                        <td className="py-3 px-4 text-sm">{app.userName}</td>
                        <td className="py-3 px-4 text-sm">{app.service}</td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              app.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : app.status === "under_review"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {app.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">
                          {app.amount}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Management</CardTitle>
              <CardDescription>Track and manage all payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Payment details coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
