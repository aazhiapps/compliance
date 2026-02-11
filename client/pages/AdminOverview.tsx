import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

export default function AdminOverview() {
  const stats = [
    {
      label: "Total Users",
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

  const recentApplications = [
    {
      id: "app_001",
      user: "Demo User",
      service: "GST Registration",
      status: "approved",
      date: "2024-02-05",
      amount: "₹499",
    },
    {
      id: "app_002",
      user: "Rajesh Kumar",
      service: "Company Registration",
      status: "under_review",
      date: "2024-02-04",
      amount: "₹2,999",
    },
    {
      id: "app_003",
      user: "Priya Singh",
      service: "PAN Registration",
      status: "submitted",
      date: "2024-02-03",
      amount: "₹299",
    },
  ];

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
          <p className="text-muted-foreground mt-1">Welcome to the admin panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
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
                    <Button size="sm" variant="outline" className="flex items-center gap-2">
                      View All
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentApplications.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{app.service}</p>
                        <p className="text-sm text-muted-foreground">{app.user}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            app.status
                          )}`}
                        >
                          {getStatusIcon(app.status)}
                          {app.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">{app.amount}</span>
                      </div>
                    </div>
                  ))}
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
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="w-4 h-4 mr-2" />
                  View Payments
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Database</span>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API Server</span>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    Running
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment Gateway</span>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    Connected
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Applications Over Time</CardTitle>
            <CardDescription>Monthly application submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-border">
              <p className="text-muted-foreground">Chart visualization coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
