import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Download,
  Eye,
  MoreVertical,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { PaymentRecord, RecordPaymentRequest } from "@shared/api";
import { Application } from "@shared/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CSVExportButton } from "@/components/CSVExportButton";

export default function AdminPayments() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "completed" | "pending" | "failed" | "refunded"
  >("all");
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Form state for recording payment
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<RecordPaymentRequest["method"]>("manual");
  const [transactionId, setTransactionId] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Fetch payments and applications
  useEffect(() => {
    fetchPayments();
    fetchApplications();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/payments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPayments(data.payments || []);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/admin/applications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.applications) {
        // Filter to only show applications without payments
        const appsWithoutPayment = data.applications.filter(
          (app: Application) => app.paymentStatus === "pending",
        );
        setApplications(appsWithoutPayment);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedApplicationId || !paymentAmount || !transactionId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setRecordingPayment(true);
    try {
      const paymentData: RecordPaymentRequest = {
        applicationId: selectedApplicationId,
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        transactionId: transactionId,
        notes: paymentNotes || undefined,
      };

      const response = await fetch("/api/payments/record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Payment recorded successfully",
        });

        // Reset form
        setSelectedApplicationId("");
        setPaymentAmount("");
        setTransactionId("");
        setPaymentNotes("");
        setShowRecordDialog(false);

        // Refresh data
        fetchPayments();
        fetchApplications();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to record payment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    } finally {
      setRecordingPayment(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.applicantEmail
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      payment.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || payment.status === filterStatus;
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

  const totalRevenue = filteredPayments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const completedPayments = filteredPayments.filter(
    (p) => p.status === "completed",
  ).length;
  const pendingPayments = filteredPayments.filter(
    (p) => p.status === "pending",
  ).length;
  const failedPayments = filteredPayments.filter(
    (p) => p.status === "failed",
  ).length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading payments...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Payment Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and manage all payments
            </p>
          </div>
          <div className="flex gap-2">
            <CSVExportButton
              endpoint="/api/admin/csv/payments/export"
              filename="payments.csv"
              label="Export"
              variant="outline"
            />
            <Button
              onClick={() => setShowRecordDialog(true)}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Record Payment
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">
                    Total Revenue
                  </p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">
                    ₹{totalRevenue.toFixed(0)}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">
                    Completed
                  </p>
                  <p className="text-3xl font-bold text-green-900 mt-1">
                    {completedPayments}
                  </p>
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
                  <p className="text-3xl font-bold text-yellow-900 mt-1">
                    {pendingPayments}
                  </p>
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
                  <p className="text-3xl font-bold text-red-900 mt-1">
                    {failedPayments}
                  </p>
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
            <CardDescription>
              {filteredPayments.length} total transactions - Complete history of
              all payments received
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-200 bg-purple-50">
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Transaction ID
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Applicant
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Service
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Amount
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Method
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Date
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Status
                    </th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">
                      Actions
                    </th>
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
                          <p className="font-medium text-foreground">
                            {payment.applicantName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.applicantEmail}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{payment.service}</td>
                      <td className="py-3 px-4 text-sm font-semibold">
                        ₹{payment.amount.toFixed(0)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm capitalize">
                          {payment.method === "razorpay"
                            ? "Razorpay"
                            : payment.method === "bank_transfer"
                              ? "Bank Transfer"
                              : payment.method === "cash"
                                ? "Cash"
                                : payment.method === "cheque"
                                  ? "Cheque"
                                  : "Manual"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                            payment.status,
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                          >
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

        {/* Record Payment Dialog */}
        <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Record Payment Manually</DialogTitle>
              <DialogDescription>
                Record a payment that was received outside the system (cash,
                bank transfer, etc.)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Application Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Application *</label>
                <select
                  value={selectedApplicationId}
                  onChange={(e) => {
                    setSelectedApplicationId(e.target.value);
                    // Auto-fill amount from application
                    const app = applications.find(
                      (a) => a.id === e.target.value,
                    );
                    if (app && app.paymentAmount) {
                      setPaymentAmount(app.paymentAmount.toString());
                    }
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={recordingPayment}
                >
                  <option value="">Select Application</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.id} - {app.serviceName} (₹{app.paymentAmount})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (₹) *</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={recordingPayment}
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value as RecordPaymentRequest["method"],
                    )
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={recordingPayment}
                >
                  <option value="manual">Manual Entry</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="razorpay">Razorpay (Manual)</option>
                </select>
              </div>

              {/* Transaction ID */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Transaction ID / Reference *
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID or reference number"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={recordingPayment}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (Optional)</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add any additional notes about this payment"
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={recordingPayment}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRecordDialog(false)}
                disabled={recordingPayment}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecordPayment}
                disabled={
                  recordingPayment ||
                  !selectedApplicationId ||
                  !paymentAmount ||
                  !transactionId
                }
                className="bg-primary hover:bg-primary/90"
              >
                {recordingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Recording...
                  </>
                ) : (
                  "Record Payment"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
