import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/AdminLayout";
import {
  DollarSign,
  FileText,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Calendar,
  CreditCard,
  BarChart3,
} from "lucide-react";

interface Application {
  id: string;
  userId: string;
  serviceId: number;
  serviceName: string;
  status: string;
  paymentAmount: number;
  paymentStatus: string;
  createdAt: string;
}

interface Payment {
  id: string;
  applicationId: string;
  amount: number;
  status: string;
  method: string;
  date: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  businessType: string;
  role: string;
  createdAt: string;
}

interface ReportStats {
  totalRevenue: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalApplications: number;
  approvedApplications: number;
  pendingApplications: number;
  rejectedApplications: number;
  totalUsers: number;
  revenueByService: Record<string, { count: number; revenue: number }>;
  revenueByMethod: Record<string, { count: number; amount: number }>;
  applicationsByStatus: Record<string, number>;
  usersByBusinessType: Record<string, number>;
}

export default function AdminReports() {
  const { toast } = useToast();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (applications.length > 0 && payments.length > 0 && users.length > 0) {
      calculateStats();
    }
  }, [applications, payments, users, dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [applicationsRes, paymentsRes, usersRes] = await Promise.all([
        fetch("/api/admin/applications", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/payments", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [applicationsData, paymentsData, usersData] = await Promise.all([
        applicationsRes.json(),
        paymentsRes.json(),
        usersRes.json(),
      ]);

      if (applicationsData.success) {
        setApplications(
          applicationsData.data || applicationsData.applications || [],
        );
      }
      if (paymentsData.success) {
        setPayments(paymentsData.payments || []);
      }
      if (usersData.success) {
        setUsers(usersData.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterByDateRange = (date: string): boolean => {
    if (dateRange === "all") return true;

    const itemDate = new Date(date);
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    switch (dateRange) {
      case "today":
        return daysDiff === 0;
      case "week":
        return daysDiff <= 7;
      case "month":
        return daysDiff <= 30;
      case "quarter":
        return daysDiff <= 90;
      case "year":
        return daysDiff <= 365;
      default:
        return true;
    }
  };

  const calculateStats = () => {
    const filteredApplications = applications.filter((app) =>
      filterByDateRange(app.createdAt),
    );
    const filteredPayments = payments.filter((payment) =>
      filterByDateRange(payment.date),
    );
    const filteredUsers = users.filter((user) =>
      filterByDateRange(user.createdAt),
    );

    // Revenue stats
    const completedPayments = filteredPayments.filter(
      (p) => p.status === "completed",
    );
    const totalRevenue = completedPayments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );
    const pendingPayments = filteredPayments.filter(
      (p) => p.status === "pending",
    ).length;
    const failedPayments = filteredPayments.filter(
      (p) => p.status === "failed",
    ).length;

    // Application stats
    const approvedApplications = filteredApplications.filter(
      (a) => a.status === "approved",
    ).length;
    const pendingApplications = filteredApplications.filter(
      (a) =>
        a.status === "pending" ||
        a.status === "submitted" ||
        a.status === "under_review",
    ).length;
    const rejectedApplications = filteredApplications.filter(
      (a) => a.status === "rejected",
    ).length;

    // Revenue by service
    const revenueByService: Record<string, { count: number; revenue: number }> =
      {};
    filteredApplications.forEach((app) => {
      if (app.paymentStatus === "paid") {
        const serviceName = app.serviceName || `Service ${app.serviceId}`;
        if (!revenueByService[serviceName]) {
          revenueByService[serviceName] = { count: 0, revenue: 0 };
        }
        revenueByService[serviceName].count++;
        revenueByService[serviceName].revenue += app.paymentAmount || 0;
      }
    });

    // Revenue by payment method
    const revenueByMethod: Record<string, { count: number; amount: number }> =
      {};
    completedPayments.forEach((payment) => {
      const method = payment.method || "unknown";
      if (!revenueByMethod[method]) {
        revenueByMethod[method] = { count: 0, amount: 0 };
      }
      revenueByMethod[method].count++;
      revenueByMethod[method].amount += payment.amount;
    });

    // Applications by status
    const applicationsByStatus: Record<string, number> = {};
    filteredApplications.forEach((app) => {
      const status = app.status || "unknown";
      applicationsByStatus[status] = (applicationsByStatus[status] || 0) + 1;
    });

    // Users by business type
    const usersByBusinessType: Record<string, number> = {};
    filteredUsers.forEach((user) => {
      const type = user.businessType || "unknown";
      usersByBusinessType[type] = (usersByBusinessType[type] || 0) + 1;
    });

    setStats({
      totalRevenue,
      completedPayments: completedPayments.length,
      pendingPayments,
      failedPayments,
      totalApplications: filteredApplications.length,
      approvedApplications,
      pendingApplications,
      rejectedApplications,
      totalUsers: filteredUsers.length,
      revenueByService,
      revenueByMethod,
      applicationsByStatus,
      usersByBusinessType,
    });
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `${filename} exported successfully`,
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive analytics and reports for your compliance platform
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="quarter">Last 90 Days</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats?.totalRevenue.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.completedPayments || 0} completed payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Applications
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalApplications || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.approvedApplications || 0} approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Approval Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats && stats.totalApplications > 0
                  ? Math.round(
                      (stats.approvedApplications / stats.totalApplications) *
                        100,
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                Application approval rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="revenue">
              <DollarSign className="w-4 h-4 mr-2" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="applications">
              <FileText className="w-4 h-4 mr-2" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="w-4 h-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Application Status Breakdown</CardTitle>
                  <CardDescription>
                    Distribution of applications by status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats &&
                    Object.entries(stats.applicationsByStatus).map(
                      ([status, count]) => (
                        <div
                          key={status}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {status === "approved" && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                            {(status === "pending" ||
                              status === "submitted" ||
                              status === "under_review") && (
                              <Clock className="w-4 h-4 text-yellow-600" />
                            )}
                            {status === "rejected" && (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="capitalize">
                              {status.replace(/_/g, " ")}
                            </span>
                          </div>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ),
                    )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Status</CardTitle>
                  <CardDescription>Current payment statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Completed</span>
                    </div>
                    <span className="font-semibold">
                      {stats?.completedPayments || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span>Pending</span>
                    </div>
                    <span className="font-semibold">
                      {stats?.pendingPayments || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span>Failed</span>
                    </div>
                    <span className="font-semibold">
                      {stats?.failedPayments || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Revenue by Service</CardTitle>
                    <CardDescription>
                      Total revenue breakdown by service type
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (stats?.revenueByService) {
                        const data = Object.entries(stats.revenueByService).map(
                          ([service, info]) => ({
                            Service: service,
                            Applications: info.count,
                            Revenue: info.revenue,
                          }),
                        );
                        exportToCSV(data, "revenue_by_service");
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats &&
                  Object.entries(stats.revenueByService).length > 0 ? (
                    Object.entries(stats.revenueByService)
                      .sort((a, b) => b[1].revenue - a[1].revenue)
                      .map(([service, info]) => (
                        <div key={service} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{service}</span>
                            <span className="font-semibold">
                              ₹{info.revenue.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{info.count} applications</span>
                            <span>
                              ₹
                              {Math.round(
                                info.revenue / info.count,
                              ).toLocaleString()}{" "}
                              avg
                            </span>
                          </div>
                          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full"
                              style={{
                                width: `${(info.revenue / stats.totalRevenue) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No revenue data available
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Revenue by Payment Method</CardTitle>
                    <CardDescription>
                      Payment method distribution
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (stats?.revenueByMethod) {
                        const data = Object.entries(stats.revenueByMethod).map(
                          ([method, info]) => ({
                            Method: method,
                            Transactions: info.count,
                            Amount: info.amount,
                          }),
                        );
                        exportToCSV(data, "revenue_by_payment_method");
                      }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats && Object.entries(stats.revenueByMethod).length > 0 ? (
                    Object.entries(stats.revenueByMethod)
                      .sort((a, b) => b[1].amount - a[1].amount)
                      .map(([method, info]) => (
                        <div key={method} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize">
                              {method.replace(/_/g, " ")}
                            </span>
                            <span className="font-semibold">
                              ₹{info.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{info.count} transactions</span>
                            <span>
                              ₹
                              {Math.round(
                                info.amount / info.count,
                              ).toLocaleString()}{" "}
                              avg
                            </span>
                          </div>
                          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full"
                              style={{
                                width: `${(info.amount / stats.totalRevenue) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No payment data available
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Application Analytics</CardTitle>
                  <CardDescription>
                    Detailed application statistics and trends
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const filteredApps = applications.filter((app) =>
                      filterByDateRange(app.createdAt),
                    );
                    const data = filteredApps.map((app) => ({
                      ID: app.id,
                      Service: app.serviceName,
                      Status: app.status,
                      Amount: app.paymentAmount,
                      PaymentStatus: app.paymentStatus,
                      Date: new Date(app.createdAt).toLocaleDateString(),
                    }));
                    exportToCSV(data, "applications_report");
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Approved</span>
                    </div>
                    <p className="text-3xl font-bold">
                      {stats?.approvedApplications || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stats && stats.totalApplications > 0
                        ? Math.round(
                            (stats.approvedApplications /
                              stats.totalApplications) *
                              100,
                          )
                        : 0}
                      % of total
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">Pending Review</span>
                    </div>
                    <p className="text-3xl font-bold">
                      {stats?.pendingApplications || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stats && stats.totalApplications > 0
                        ? Math.round(
                            (stats.pendingApplications /
                              stats.totalApplications) *
                              100,
                          )
                        : 0}
                      % of total
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">Rejected</span>
                    </div>
                    <p className="text-3xl font-bold">
                      {stats?.rejectedApplications || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stats && stats.totalApplications > 0
                        ? Math.round(
                            (stats.rejectedApplications /
                              stats.totalApplications) *
                              100,
                          )
                        : 0}
                      % of total
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Payment Reports</CardTitle>
                  <CardDescription>
                    Comprehensive payment analytics
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const filteredPayments = payments.filter((payment) =>
                      filterByDateRange(payment.date),
                    );
                    const data = filteredPayments.map((payment) => ({
                      ID: payment.id,
                      Amount: payment.amount,
                      Status: payment.status,
                      Method: payment.method,
                      Date: new Date(payment.date).toLocaleDateString(),
                    }));
                    exportToCSV(data, "payments_report");
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Payment Summary</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium">Completed</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {stats?.completedPayments || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ₹{stats?.totalRevenue.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-yellow-600" />
                          <span className="font-medium">Pending</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {stats?.pendingPayments || 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                          <span className="font-medium">Failed</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {stats?.failedPayments || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Success Rate</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Completion Rate</span>
                        <span className="font-bold">
                          {stats &&
                          stats.completedPayments +
                            stats.pendingPayments +
                            stats.failedPayments >
                            0
                            ? Math.round(
                                (stats.completedPayments /
                                  (stats.completedPayments +
                                    stats.pendingPayments +
                                    stats.failedPayments)) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-secondary h-4 rounded-full overflow-hidden">
                        <div
                          className="bg-green-600 h-full"
                          style={{
                            width: `${
                              stats &&
                              stats.completedPayments +
                                stats.pendingPayments +
                                stats.failedPayments >
                                0
                                ? (stats.completedPayments /
                                    (stats.completedPayments +
                                      stats.pendingPayments +
                                      stats.failedPayments)) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>User Analytics</CardTitle>
                  <CardDescription>
                    User registration and distribution analytics
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const filteredUsers = users.filter((user) =>
                      filterByDateRange(user.createdAt),
                    );
                    const data = filteredUsers.map((user) => ({
                      ID: user.id,
                      Name: `${user.firstName} ${user.lastName}`,
                      Email: user.email,
                      BusinessType: user.businessType,
                      Role: user.role,
                      RegistrationDate: new Date(
                        user.createdAt,
                      ).toLocaleDateString(),
                    }));
                    exportToCSV(data, "users_report");
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Users by Business Type</h3>
                  <div className="space-y-4">
                    {stats &&
                    Object.entries(stats.usersByBusinessType).length > 0 ? (
                      Object.entries(stats.usersByBusinessType)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => (
                          <div key={type} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium capitalize">
                                {type.replace(/_/g, " ")}
                              </span>
                              <span className="font-semibold">
                                {count} users
                              </span>
                            </div>
                            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-primary h-full"
                                style={{
                                  width: `${stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {stats.totalUsers > 0
                                ? Math.round((count / stats.totalUsers) * 100)
                                : 0}
                              % of total users
                            </p>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No user data available
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Registered Users
                      </p>
                      <p className="text-3xl font-bold mt-1">
                        {stats?.totalUsers || 0}
                      </p>
                    </div>
                    <Users className="w-12 h-12 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
