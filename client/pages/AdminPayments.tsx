import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Download, Eye, MoreVertical, DollarSign, CheckCircle2, AlertCircle } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

interface Payment {
  id: string;
  applicationId: string;
  applicantName: string;
  email: string;
  service: string;
  amount: number;
  status: "completed" | "pending" | "failed" | "refunded";
  method: "razorpay" | "bank_transfer";
  date: string;
  transactionId: string;
}

export default function AdminPayments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending" | "failed" | "refunded">("all");

  // Mock payment data
  const payments: Payment[] = [
    {
      id: "pay_1",
      applicationId: "app_1",
      applicantName: "Demo User",
      email: "demo@example.com",
      service: "GST Registration",
      amount: 2999,
      status: "completed",
      method: "razorpay",
      date: "2024-02-10",
      transactionId: "TXN_001_DEMO",
    },
    {
      id: "pay_2",
      applicationId: "app_2",
      applicantName: "Rajesh Kumar",
      email: "rajesh@example.com",
      service: "Company Registration",
      amount: 4999,
      status: "completed",
      method: "razorpay",
      date: "2024-02-09",
      transactionId: "TXN_002_DEMO",
    },
    {
      id: "pay_3",
      applicationId: "app_3",
      applicantName: "Priya Singh",
      email: "priya@example.com",
      service: "PAN Registration",
      amount: 799,
      status: "pending",
      method: "bank_transfer",
      date: "2024-02-08",
      transactionId: "TXN_003_DEMO",
    },
    {
      id: "pay_4",
      applicationId: "app_4",
      applicantName: "Neha Sharma",
      email: "neha@example.com",
      service: "Import Export Code",
      amount: 3499,
      status: "completed",
      method: "razorpay",
      date: "2024-02-07",
      transactionId: "TXN_004_DEMO",
    },
  ];

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || payment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success/10 text-success";
      case "pending":
        return "bg-yellow-50 text-yellow-700";
      case "failed":
        return "bg-red-50 text-red-700";
      case "refunded":
        return "bg-blue-50 text-blue-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const totalRevenue = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const completedPayments = payments.filter((p) => p.status === "completed").length;
  const pendingPayments = payments.filter((p) => p.status === "pending").length;
  const failedPayments = payments.filter((p) => p.status === "failed").length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payment Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage all payments</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">₹{(totalRevenue / 100).toFixed(0)}</p>
                </div>
                <DollarSign className="w-10 h-10 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Completed</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{completedPayments}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Pending</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-1">{pendingPayments}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-yellow-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Failed</p>
                  <p className="text-3xl font-bold text-red-900 mt-1">{failedPayments}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-red-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-3 flex-col md:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, email, or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
            <CardTitle className="text-lg">Payment Transactions</CardTitle>
            <CardDescription>{filteredPayments.length} total transactions - Complete history of all payments received</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-200 bg-purple-50">
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Transaction ID</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Applicant</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Service</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Amount</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Method</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Date</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-gray-200 hover:bg-purple-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-sm text-muted-foreground">
                        {payment.transactionId}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-foreground">{payment.applicantName}</p>
                          <p className="text-xs text-muted-foreground">{payment.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{payment.service}</td>
                      <td className="py-3 px-4 text-sm font-semibold">₹{(payment.amount / 100).toFixed(0)}</td>
                      <td className="py-3 px-4">
                        <span className="text-sm capitalize">
                          {payment.method === "razorpay" ? "Razorpay" : "Bank Transfer"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <button className="p-2 hover:bg-gray-100 rounded transition-colors">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredPayments.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No payments found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
