import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  BarChart3,
  Zap,
  DollarSign,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Application {
  id: string;
  serviceId: number;
  serviceName: string;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected";
  paymentStatus: "pending" | "paid" | "refunded";
  paymentAmount?: number;
  createdAt: string;
  eta: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasGSTAccess, setHasGSTAccess] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const apps = data.applications || [];
        setApplications(apps);
        
        // Check if user has approved GST Registration application
        const gstApproved = apps.some(
          (app: Application) => app.serviceId === 1 && app.status === "approved"
        );
        setHasGSTAccess(gstApproved);
      } else {
        throw new Error("Failed to fetch applications");
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      toast({
        title: "Error",
        description: "Failed to load your applications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
        return <FileText className="w-4 h-4" />;
    }
  };

  const stats = [
    {
      label: "Total Applications",
      value: applications.length,
      icon: <BarChart3 className="w-6 h-6 text-primary" />,
    },
    {
      label: "Approved",
      value: applications.filter((a) => a.status === "approved").length,
      icon: <CheckCircle className="w-6 h-6 text-success" />,
    },
    {
      label: "Under Review",
      value: applications.filter((a) => a.status === "under_review").length,
      icon: <Clock className="w-6 h-6 text-yellow-600" />,
    },
    {
      label: "Total Paid",
      value: `₹${applications
        .filter((a) => a.paymentStatus === "paid")
        .reduce((sum, a) => sum + (a.paymentAmount || 0), 0)}`,
      icon: <DollarSign className="w-6 h-6 text-green-600" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-muted-foreground">
              Manage and track all your service applications
            </p>
          </div>
          <Link to="/">
            <Button size="lg" className="bg-primary hover:bg-primary/90 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Application
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  {stat.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Applications Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">My Applications</h2>
              <p className="text-muted-foreground mt-1">
                {applications.length} application{applications.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading applications...</p>
              </CardContent>
            </Card>
          ) : applications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No applications yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start your first application for any of our services
                </p>
                <Link to="/">
                  <Button className="bg-primary hover:bg-primary/90">
                    Browse Services
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <Card key={app.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {app.serviceName}
                          </h3>
                          <span
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              app.status
                            )}`}
                          >
                            {getStatusIcon(app.status)}
                            {app.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Application ID: <span className="font-mono">{app.id}</span>
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Created</p>
                            <p className="text-sm font-medium">
                              {new Date(app.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Expected Date</p>
                            <p className="text-sm font-medium flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(app.eta).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Payment</p>
                            <p
                              className={`text-sm font-medium ${
                                app.paymentStatus === "paid" ? "text-success" : "text-yellow-600"
                              }`}
                            >
                              {app.paymentStatus === "paid" ? "✓ Paid" : "⏱ Pending"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Action</p>
                            <Link to={`/application/${app.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-2"
                              >
                                View Details
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className={`grid grid-cols-1 md:grid-cols-${hasGSTAccess ? '4' : '3'} gap-6`}>
          {hasGSTAccess && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  GST Filing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage your GST invoices and filings
                </p>
                <Link to="/gst-filing">
                  <Button variant="outline" className="w-full">
                    Go to GST Filing
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Need help getting started with a new service?
              </p>
              <Link to="/">
                <Button variant="outline" className="w-full">
                  Browse All Services
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Upload and manage your documents here
              </p>
              <Link to="/documents">
                <Button variant="outline" className="w-full">
                  Manage Documents
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View and manage your payments
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/admin/payments">View Payments</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
