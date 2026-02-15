import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  DollarSign,
  Users,
  Calendar,
  BadgeCheck,
  Plus,
  Loader2,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { RecordPaymentRequest } from "@shared/api";
import { Application, User as UserType } from "@shared/auth";

// Helper interface to combine application and user data for display
interface ApplicationWithUserDetails extends Application {
  userName: string;
  userEmail: string;
  userPhone: string;
}

const executives = ["Rajesh Kumar", "Priya Singh", "Amit Patel", "Neha Sharma"];

export default function AdminApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [application, setApplication] = useState<ApplicationWithUserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [assignedExecutive, setAssignedExecutive] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showRecordPaymentDialog, setShowRecordPaymentDialog] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<RecordPaymentRequest["method"]>("manual");
  const [transactionId, setTransactionId] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Fetch application and user details
  useEffect(() => {
    if (!id || !token) return;

    const fetchApplicationDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch application
        const appResponse = await fetch(`/api/admin/applications/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!appResponse.ok) {
          throw new Error("Failed to fetch application");
        }

        const appData = await appResponse.json();
        if (!appData.success || !appData.data) {
          throw new Error(appData.message || "Failed to load application");
        }

        const app: Application = appData.data;

        // Fetch user details
        const userResponse = await fetch(`/api/admin/users/${app.userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user details");
        }

        const userData = await userResponse.json();
        if (!userData.success || !userData.data) {
          throw new Error(userData.message || "Failed to load user details");
        }

        const user: UserType = userData.data;

        // Combine application and user data
        const appWithUser: ApplicationWithUserDetails = {
          ...app,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          userPhone: user.phone || "N/A",
        };

        setApplication(appWithUser);
      } catch (err) {
        console.error("Error fetching application details:", err);
        setError(err instanceof Error ? err.message : "Failed to load application");
        toast({
          title: "Error",
          description: "Failed to load application details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationDetails();
  }, [id, token, toast]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading application details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !application) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-lg text-muted-foreground mb-4">
                {error || "Application not found"}
              </p>
              <Button onClick={() => navigate("/admin/applications")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Applications
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const handleApprove = async () => {
    if (!application || !token) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/applications/${application.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "approved" }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve application");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to approve application");
      }

      setApplication({ ...application, status: "approved" });
      toast({
        title: "Success",
        description: "Application approved successfully",
      });
    } catch (err) {
      console.error("Error approving application:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to approve application",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!application || !token || !rejectReason) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/applications/${application.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: "rejected",
          notes: rejectReason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject application");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to reject application");
      }

      setApplication({ ...application, status: "rejected", internalNotes: rejectReason });
      setRejectReason("");
      setShowRejectForm(false);
      toast({
        title: "Success",
        description: "Application rejected successfully",
      });
    } catch (err) {
      console.error("Error rejecting application:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to reject application",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignExecutive = async () => {
    if (!application || !token || !assignedExecutive) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/applications/${application.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          assignedStaffName: assignedExecutive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign executive");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to assign executive");
      }

      setApplication({ ...application, assignedStaffName: assignedExecutive });
      setAssignedExecutive("");
      toast({
        title: "Success",
        description: "Executive assigned successfully",
      });
    } catch (err) {
      console.error("Error assigning executive:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to assign executive",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!application || !paymentAmount || !transactionId) {
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
        applicationId: application.id,
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
        
        // Update local application state
        setApplication({ ...application, paymentStatus: "paid" });
        
        // Reset form
        setPaymentAmount("");
        setTransactionId("");
        setPaymentNotes("");
        setShowRecordPaymentDialog(false);
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

  const getDocStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success/10 text-success";
      case "verifying":
        return "bg-yellow-50 text-yellow-700";
      case "uploaded":
        return "bg-blue-50 text-blue-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5" />;
      case "rejected":
        return <XCircle className="w-5 h-5" />;
      case "under_review":
        return <Clock className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/applications")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">{application.serviceName}</h1>
            <p className="text-muted-foreground mt-1">Application ID: {application.id}</p>
          </div>
        </div>

        {/* Status and Payment Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${getStatusColor(
              application.status
            )}`}
          >
            {getStatusIcon(application.status)}
            {application.status.replace(/_/g, " ").toUpperCase()}
          </span>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              application.paymentStatus === "paid"
                ? "bg-success/10 text-success"
                : "bg-yellow-50 text-yellow-700"
            }`}
          >
            {application.paymentStatus === "paid" ? "✓ Paid" : "⏱ Pending Payment"}
          </span>
          {application.paymentStatus === "pending" && (
            <Button
              size="sm"
              onClick={() => {
                setPaymentAmount(application.paymentAmount.toString());
                setShowRecordPaymentDialog(true);
              }}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Record Payment
            </Button>
          )}
        </div>

        {/* Status Tracking Timeline */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-primary" />
              Status Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="space-y-4">
                {/* Draft */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      application.status === "draft" ||
                      application.status === "submitted" ||
                      application.status === "under_review" ||
                      application.status === "approved"
                        ? "bg-primary text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-semibold text-foreground">Draft Created</p>
                    <p className="text-sm text-muted-foreground">Application initiated</p>
                  </div>
                </div>

                {/* Submitted */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      application.status === "submitted" ||
                      application.status === "under_review" ||
                      application.status === "approved"
                        ? "bg-primary text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-semibold text-foreground">Submitted</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(application.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Under Review */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      application.status === "under_review" || application.status === "approved"
                        ? "bg-primary text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-semibold text-foreground">Under Review</p>
                    <p className="text-sm text-muted-foreground">
                      {application.status === "under_review" || application.status === "approved"
                        ? "Documents being verified"
                        : "Pending review"}
                    </p>
                  </div>
                </div>

                {/* Approved/Rejected */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      application.status === "approved"
                        ? "bg-success text-white"
                        : application.status === "rejected"
                          ? "bg-red-500 text-white"
                          : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    {application.status === "approved" ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : application.status === "rejected" ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-semibold text-foreground">
                      {application.status === "approved"
                        ? "Approved"
                        : application.status === "rejected"
                          ? "Rejected"
                          : "Final Decision Pending"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {application.status === "approved"
                        ? "Application completed successfully"
                        : application.status === "rejected"
                          ? "Application has been rejected"
                          : "Awaiting final approval"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applicant Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Applicant Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                <p className="font-semibold text-lg">{application.userName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Mail className="w-4 h-4" /> Email
                </p>
                <p className="font-semibold text-lg">{application.userEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Phone className="w-4 h-4" /> Phone
                </p>
                <p className="font-semibold text-lg">{application.userPhone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Details */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Application Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Service</p>
                <p className="font-semibold text-lg">{application.serviceName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Submitted Date
                </p>
                <p className="font-semibold text-lg">
                  {new Date(application.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" /> Amount
                </p>
                <p className="font-semibold text-lg">₹{application.paymentAmount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-semibold ${getStatusColor(
                    application.status
                  )}`}
                >
                  {getStatusIcon(application.status)}
                  {application.status.replace(/_/g, " ").toUpperCase()}
                </span>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm text-muted-foreground mb-1">Remarks</p>
              <p className="font-medium">{application.internalNotes || "No notes available"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-b">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Documents ({application.documents.length})
            </CardTitle>
            <CardDescription>Required and attached documents with verification status</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {application.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground">ID: {doc.id}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getDocStatusColor(
                      doc.status
                    )}`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Executive Assignment */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Executive Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {application.assignedStaffName ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Currently assigned to:</strong> {application.assignedStaffName}
                </p>
              </div>
            ) : (
              <p className="text-sm text-yellow-700 bg-yellow-50 p-4 rounded-lg">
                ⚠️ No executive assigned yet
              </p>
            )}
            <div className="flex gap-2">
              <select
                value={assignedExecutive}
                onChange={(e) => setAssignedExecutive(e.target.value)}
                className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select Executive</option>
                {executives.map((exec) => (
                  <option key={exec} value={exec}>
                    {exec}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleAssignExecutive}
                disabled={!assignedExecutive || updating}
                className="bg-primary hover:bg-primary/90"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {application.status !== "approved" && application.status !== "rejected" && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
              <CardTitle>Actions</CardTitle>
              <CardDescription>Approve, reject, or request changes for this application</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Button
                  onClick={handleApprove}
                  disabled={updating}
                  className="flex-1 bg-success hover:bg-success/90 flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Approve Application
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowRejectForm(!showRejectForm)}
                  variant="outline"
                  disabled={updating}
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Application
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reject Form */}
        {showRejectForm && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Reject Application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Reason for Rejection</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide a detailed reason for rejection..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleReject}
                  disabled={!rejectReason || updating}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    "Confirm Rejection"
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectReason("");
                  }}
                  variant="outline"
                  disabled={updating}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Record Payment Dialog */}
        <Dialog open={showRecordPaymentDialog} onOpenChange={setShowRecordPaymentDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Record Payment for {application.serviceName}</DialogTitle>
              <DialogDescription>
                Record a payment that was received for this application
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
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
                  onChange={(e) => setPaymentMethod(e.target.value as RecordPaymentRequest["method"])}
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
                <label className="text-sm font-medium">Transaction ID / Reference *</label>
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
                onClick={() => setShowRecordPaymentDialog(false)}
                disabled={recordingPayment}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecordPayment}
                disabled={recordingPayment || !paymentAmount || !transactionId}
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
