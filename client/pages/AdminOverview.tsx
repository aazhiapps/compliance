import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  Users,
  FileText,
  CheckCircle,
  Clock,
  ChevronRight,
  Package,
  CheckCircle2,
  File,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";

interface AdminStats {
  totalUsers: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  recentApplications: Array<{
    id: string;
    userId: string;
    serviceName: string;
    serviceType: string;
    status: string;
    paymentAmount: number;
    createdAt: string;
  }>;
}

// Helper function to generate monthly data from recent applications
function generateMonthlyData(applications: AdminStats["recentApplications"]) {
  // Get last 6 months
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: date.toLocaleDateString("en-US", { month: "short" }),
      applications: 0,
      approved: 0,
      pending: 0,
    });
  }

  // Count applications by month
  applications.forEach((app) => {
    const appDate = new Date(app.createdAt);
    const monthIndex = months.findIndex((m) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - months.indexOf(m)), 1);
      return appDate.getMonth() === monthDate.getMonth() && appDate.getFullYear() === monthDate.getFullYear();
    });
    if (monthIndex >= 0) {
      months[monthIndex].applications++;
      if (app.status === "approved") {
        months[monthIndex].approved++;
      } else if (app.status === "under_review" || app.status === "submitted") {
        months[monthIndex].pending++;
      }
    }
  });

  return months;
}

export default function AdminOverview() {
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        throw new Error("Failed to fetch stats");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load admin statistics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading statistics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = stats
    ? [
        {
          label: "Total Users",
          value: stats.totalUsers.toString(),
          change: "+12%",
          icon: <Users className="w-6 h-6 text-primary" />,
        },
        {
          label: "Active Applications",
          value: stats.totalApplications.toString(),
          change: "+23%",
          icon: <FileText className="w-6 h-6 text-blue-600" />,
        },
        {
          label: "Pending Review",
          value: stats.pendingApplications.toString(),
          change: "+5%",
          icon: <Clock className="w-6 h-6 text-yellow-600" />,
        },
        {
          label: "Approved",
          value: stats.approvedApplications.toString(),
          change: "+2.1%",
          icon: <CheckCircle className="w-6 h-6 text-success" />,
        },
      ]
    : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success/10 text-success";
      case "under_review":
        return "bg-yellow-50 text-yellow-700";
      default:
        return "bg-blue-50 text-blue-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "under_review":
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to the admin panel
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statCards.map((stat, idx) => (
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

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Services Card */}
          <Link to="/admin/services">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Services</h3>
                  <Package className="w-5 h-5 text-orange-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Active Services
                    </span>
                    <span className="font-bold">5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Revenue
                    </span>
                    <span className="font-bold">₹2.46L</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-3">
                    Manage Services <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Compliance Card */}
          <Link to="/admin/compliance">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Compliance</h3>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Compliant
                    </span>
                    <span className="font-bold text-green-600">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      At Risk
                    </span>
                    <span className="font-bold text-orange-600">2</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-3">
                    View Compliance <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Documents Card */}
          <Link to="/admin/documents">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Documents</h3>
                  <File className="w-5 h-5 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Docs
                    </span>
                    <span className="font-bold">156</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Pending Review
                    </span>
                    <span className="font-bold text-yellow-600">18</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-3">
                    View Documents <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Applications */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Recent Applications</CardTitle>
                    <CardDescription>Latest submissions</CardDescription>
                  </div>
                  <Link to="/admin/applications">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      View All
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats && stats.recentApplications.length > 0 ? (
                    stats.recentApplications.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {app.serviceName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              app.status,
                            )}`}
                          >
                            {getStatusIcon(app.status)}
                            {app.status.replace(/_/g, " ")}
                          </span>
                          <span className="text-sm font-medium text-muted-foreground">
                            ₹{app.paymentAmount}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No recent applications
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/admin/users">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Users
                  </Button>
                </Link>
                <Link to="/admin/applications">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Review Applications
                  </Button>
                </Link>
                <Link to="/admin/documents">
                  <Button variant="outline" className="w-full justify-start">
                    <File className="w-4 h-4 mr-2" />
                    Review Documents
                  </Button>
                </Link>
                <Link to="/admin/compliance">
                  <Button variant="outline" className="w-full justify-start">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Compliance Status
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Database
                  </span>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    API Server
                  </span>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    Running
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Payment Gateway
                  </span>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    Connected
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Applications Over Time</CardTitle>
            <CardDescription>Monthly application submissions and approvals</CardDescription>
          </CardHeader>
          <CardContent>
            {stats && stats.recentApplications.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={generateMonthlyData(stats.recentApplications)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#888888"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#888888"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Total Applications"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="approved"
                    stroke="hsl(142.1 76.2% 36.3%)"
                    strokeWidth={2}
                    name="Approved"
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    stroke="hsl(47.9 95.8% 53.1%)"
                    strokeWidth={2}
                    name="Pending"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-border">
                <p className="text-muted-foreground">
                  No data available for chart visualization
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
