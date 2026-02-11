import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  X,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  FileText,
  DollarSign,
  Users,
} from "lucide-react";

interface ApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onAssignExecutive: (id: string, executive: string) => void;
}

const mockApplicationDetails = {
  app_1: {
    id: "app_1",
    userName: "Demo User",
    userEmail: "demo@example.com",
    userPhone: "+91 98765 43210",
    service: "GST Registration",
    status: "approved",
    submittedDate: "2024-02-01",
    amount: 499,
    paymentStatus: "paid",
    documents: [
      { id: "doc_1", name: "PAN Card", status: "approved" },
      { id: "doc_2", name: "Aadhar Card", status: "approved" },
      { id: "doc_3", name: "Business Address Proof", status: "approved" },
    ],
    remarks: "All documents verified. GST number assigned successfully.",
    executiveAssigned: "Rajesh Kumar",
  },
  app_2: {
    id: "app_2",
    userName: "Demo User",
    userEmail: "demo@example.com",
    userPhone: "+91 98765 43210",
    service: "Company Registration",
    status: "under_review",
    submittedDate: "2024-02-04",
    amount: 2999,
    paymentStatus: "paid",
    documents: [
      { id: "doc_1", name: "PAN Card", status: "approved" },
      { id: "doc_2", name: "Aadhar Card", status: "approved" },
      { id: "doc_3", name: "Business Address Proof", status: "verifying" },
      { id: "doc_4", name: "Bank Statement", status: "uploaded" },
    ],
    remarks: "Verifying business address details with municipality.",
    executiveAssigned: "Priya Singh",
  },
  app_3: {
    id: "app_3",
    userName: "Rajesh Kumar",
    userEmail: "rajesh@example.com",
    userPhone: "+91 98765 43211",
    service: "PAN Registration",
    status: "submitted",
    submittedDate: "2024-02-05",
    amount: 299,
    paymentStatus: "pending",
    documents: [
      { id: "doc_1", name: "Aadhar Card", status: "uploaded" },
      { id: "doc_2", name: "Address Proof", status: "uploaded" },
    ],
    remarks: "Pending payment before processing.",
    executiveAssigned: null,
  },
};

export default function ApplicationDetailModal({
  isOpen,
  onClose,
  applicationId,
  onApprove,
  onReject,
  onAssignExecutive,
}: ApplicationDetailModalProps) {
  const [assignedExecutive, setAssignedExecutive] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const application = mockApplicationDetails[applicationId as keyof typeof mockApplicationDetails];

  if (!isOpen || !application) return null;

  const executives = ["Rajesh Kumar", "Priya Singh", "Amit Patel", "Neha Sharma"];

  const handleAssign = () => {
    if (assignedExecutive) {
      onAssignExecutive(applicationId, assignedExecutive);
      setAssignedExecutive("");
    }
  };

  const handleReject = () => {
    onReject(applicationId);
    setRejectReason("");
    setShowRejectForm(false);
  };

  const getDocStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success/10 text-success";
      case "verifying":
        return "bg-yellow-50 text-yellow-700";
      default:
        return "bg-blue-50 text-blue-700";
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? "block" : "hidden"}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{application.service}</h2>
            <p className="text-sm text-muted-foreground">ID: {application.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${
                application.status === "approved"
                  ? "bg-success/10 text-success"
                  : application.status === "under_review"
                    ? "bg-yellow-50 text-yellow-700"
                    : "bg-blue-50 text-blue-700"
              }`}
            >
              {application.status === "approved" && <CheckCircle className="w-5 h-5" />}
              {application.status === "under_review" && <Clock className="w-5 h-5" />}
              {application.status === "submitted" && <FileText className="w-5 h-5" />}
              {application.status.replace(/_/g, " ")}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                application.paymentStatus === "paid"
                  ? "bg-success/10 text-success"
                  : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {application.paymentStatus === "paid" ? "✓ Paid" : "⏱ Pending"}
            </span>
          </div>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                <p className="font-semibold">{application.userName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Mail className="w-4 h-4" /> Email
                </p>
                <p className="font-semibold">{application.userEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Phone className="w-4 h-4" /> Phone
                </p>
                <p className="font-semibold">{application.userPhone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Service</p>
                <p className="font-semibold">{application.service}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Submitted Date</p>
                <p className="font-semibold">{new Date(application.submittedDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <DollarSign className="w-4 h-4" /> Amount
                </p>
                <p className="font-semibold">₹{application.amount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Remarks</p>
                <p className="font-semibold">{application.remarks}</p>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {application.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Executive Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.executiveAssigned ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Currently assigned to:</strong> {application.executiveAssigned}
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
                  onClick={handleAssign}
                  disabled={!assignedExecutive}
                  className="bg-primary hover:bg-primary/90"
                >
                  Assign
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {application.status !== "approved" && application.status !== "rejected" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>Approve, reject, or request changes for this application</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button
                  onClick={() => onApprove(applicationId)}
                  className="flex-1 bg-success hover:bg-success/90 flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Application
                </Button>
                <Button
                  onClick={() => setShowRejectForm(!showRejectForm)}
                  variant="outline"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Application
                </Button>
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
                    disabled={!rejectReason}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Confirm Rejection
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason("");
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
