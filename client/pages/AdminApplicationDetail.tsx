import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

interface Document {
  id: string;
  name: string;
  status: "approved" | "verifying" | "uploaded" | "pending";
}

interface ApplicationDetail {
  id: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  service: string;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected";
  submittedDate: string;
  amount: number;
  paymentStatus: "pending" | "paid";
  documents: Document[];
  remarks: string;
  executiveAssigned: string | null;
}

// Mock data - in a real app, this would come from an API
const mockApplicationDetails: Record<string, ApplicationDetail> = {
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
  app_4: {
    id: "app_4",
    userName: "Priya Singh",
    userEmail: "priya@example.com",
    userPhone: "+91 98765 43212",
    service: "Trademark Registration",
    status: "draft",
    submittedDate: "2024-02-06",
    amount: 5999,
    paymentStatus: "pending",
    documents: [
      { id: "doc_1", name: "Business Name", status: "pending" },
      { id: "doc_2", name: "Logo Design", status: "pending" },
    ],
    remarks: "Draft application - awaiting completion.",
    executiveAssigned: null,
  },
  app_5: {
    id: "app_5",
    userName: "Rajesh Kumar",
    userEmail: "rajesh@example.com",
    userPhone: "+91 98765 43211",
    service: "Compliance Audit",
    status: "under_review",
    submittedDate: "2024-02-07",
    amount: 3999,
    paymentStatus: "paid",
    documents: [
      { id: "doc_1", name: "Financial Statements", status: "approved" },
      { id: "doc_2", name: "Tax Returns", status: "verifying" },
      { id: "doc_3", name: "Business License", status: "approved" },
    ],
    remarks: "Financial statements verified. Tax returns under review.",
    executiveAssigned: "Amit Patel",
  },
};

const executives = ["Rajesh Kumar", "Priya Singh", "Amit Patel", "Neha Sharma"];

export default function AdminApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<ApplicationDetail | null>(
    id ? mockApplicationDetails[id] : null
  );
  const [assignedExecutive, setAssignedExecutive] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!application) {
    return (
      <AdminLayout>
        <div className="p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg text-muted-foreground mb-4">Application not found</p>
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

  const handleApprove = () => {
    setApplication({ ...application, status: "approved" });
  };

  const handleReject = () => {
    if (rejectReason) {
      setApplication({ ...application, status: "rejected" });
      setRejectReason("");
      setShowRejectForm(false);
    }
  };

  const handleAssignExecutive = () => {
    if (assignedExecutive) {
      setApplication({ ...application, executiveAssigned: assignedExecutive });
      setAssignedExecutive("");
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
            <h1 className="text-3xl font-bold text-foreground">{application.service}</h1>
            <p className="text-muted-foreground mt-1">Application ID: {application.id}</p>
          </div>
        </div>

        {/* Status and Payment Badges */}
        <div className="flex items-center gap-3">
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
                      {new Date(application.submittedDate).toLocaleDateString("en-US", {
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
                        : application.status === "rejected"
                          ? "bg-gray-300 text-gray-600"
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
                <p className="font-semibold text-lg">{application.service}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Submitted Date
                </p>
                <p className="font-semibold text-lg">
                  {new Date(application.submittedDate).toLocaleDateString("en-US", {
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
                <p className="font-semibold text-lg">₹{application.amount}</p>
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
              <p className="font-medium">{application.remarks}</p>
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
                      <p className="font-medium text-foreground">{doc.name}</p>
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
                onClick={handleAssignExecutive}
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
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b">
              <CardTitle>Actions</CardTitle>
              <CardDescription>Approve, reject, or request changes for this application</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Button
                  onClick={handleApprove}
                  className="flex-1 bg-success hover:bg-success/90 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Application
                </Button>
                <Button
                  onClick={() => setShowRejectForm(!showRejectForm)}
                  variant="outline"
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
    </AdminLayout>
  );
}
