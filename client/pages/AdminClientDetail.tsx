import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Shield,
  Loader2,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Client } from "@shared/client";
import { Application } from "@shared/auth";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BackButton } from "@/components/BackButton";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useErrorHandler } from "@/utils/errorHandling";

interface ClientDetailResponse {
  client: Client;
  applications: Application[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  } | null;
}

export default function AdminClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();

  const [data, setData] = useState<ClientDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch client details
  const fetchClientDetails = useCallback(async () => {
    if (!id || !token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/clients/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch client details");
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.message || "Failed to load client details");
      }

      setData(result.data);
    } catch (err) {
      console.error("Error fetching client details:", err);
      setError(err instanceof Error ? err.message : "Failed to load client");
      handleError(err, "Fetching client details");
    } finally {
      setLoading(false);
    }
  }, [id, token, handleError]);

  useEffect(() => {
    fetchClientDetails();
  }, [fetchClientDetails]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <BackButton to="/admin/clients" label="Back to Clients" />
          <LoadingSpinner size="lg" message="Loading client details..." />
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Error Loading Client</h2>
            <p className="text-muted-foreground mb-4">{error || "Client not found"}</p>
            <Button onClick={() => navigate("/admin/clients")}>Back to Clients</Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { client, applications, user } = data;

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "inactive":
        return "bg-gray-100 text-gray-700";
      case "suspended":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getRiskBadgeClasses = (riskLevel?: string) => {
    switch (riskLevel) {
      case "LOW":
        return "bg-green-100 text-green-700";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700";
      case "HIGH":
        return "bg-orange-100 text-orange-700";
      case "CRITICAL":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getApplicationStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: JSX.Element }> = {
      approved: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: <CheckCircle className="w-3 h-3" />,
      },
      submitted: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        icon: <Clock className="w-3 h-3" />,
      },
      under_review: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        icon: <Clock className="w-3 h-3" />,
      },
      rejected: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: <AlertTriangle className="w-3 h-3" />,
      },
      completed: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: <CheckCircle className="w-3 h-3" />,
      },
    };

    const config = statusConfig[status] || {
      bg: "bg-gray-100",
      text: "text-gray-700",
      icon: <Clock className="w-3 h-3" />,
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} flex items-center gap-1 w-fit`}>
        {config.icon}
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Clients", href: "/admin/clients" },
            { label: data.data.client.businessName },
          ]}
        />

        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <BackButton to="/admin/clients" label="Back to Clients" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">
              {data.data.client.businessName}
            </h1>
            <p className="text-muted-foreground mt-1">Client Details & Information</p>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{data.data.client.businessName}</h1>
            <p className="text-muted-foreground capitalize">{data.data.client.businessType} Client</p>
          </div>
          <div className="flex gap-2">
            <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getStatusBadgeClasses(data.data.client.status)}`}>
              {data.data.client.status}
            </span>
            {data.data.client.riskLevel && (
              <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getRiskBadgeClasses(data.data.client.riskLevel)}`}>
                Risk: {data.data.client.riskLevel}
              </span>
            )}
          </div>
        </div>

        {/* Client Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{data.client.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{data.client.phone}</p>
                </div>
              </div>
              {data.client.alternatePhone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm font-medium">Alternate Phone</p>
                    <p className="text-sm text-muted-foreground">{data.client.alternatePhone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">
                    {data.client.address}, {data.client.city}, {data.client.state} - {data.client.pincode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.client.panNumber && (
                <div>
                  <p className="text-sm font-medium">PAN Number</p>
                  <p className="text-sm text-muted-foreground">{data.client.panNumber}</p>
                </div>
              )}
              {data.client.gstin && (
                <div>
                  <p className="text-sm font-medium">GSTIN</p>
                  <p className="text-sm text-muted-foreground">{data.client.gstin}</p>
                </div>
              )}
              {data.client.businessName && (
                <div>
                  <p className="text-sm font-medium">Business Name</p>
                  <p className="text-sm text-muted-foreground">{data.client.businessName}</p>
                </div>
              )}
              {data.client.cin && (
                <div>
                  <p className="text-sm font-medium">CIN</p>
                  <p className="text-sm text-muted-foreground">{data.client.cin}</p>
                </div>
              )}
              {data.client.incorporationDate && (
                <div>
                  <p className="text-sm font-medium">Incorporation Date</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(data.client.incorporationDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">KYC Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                    data.client.kycStatus === "verified"
                      ? "bg-green-100 text-green-700"
                      : data.client.kycStatus === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {data.client.kycStatus}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Associated User */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Associated User Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-sm text-muted-foreground">{user.phone}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/admin/users`)}
                >
                  View User Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Risk & Compliance Metrics */}
        {(data.client.riskScore || data.client.missedComplianceCount !== undefined) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Risk & Compliance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.client.riskScore !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Risk Score</p>
                    <p className="text-2xl font-bold">{data.client.riskScore}/100</p>
                  </div>
                )}
                {data.client.missedComplianceCount !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Missed Compliance</p>
                    <p className="text-2xl font-bold text-orange-600">{data.client.missedComplianceCount}</p>
                  </div>
                )}
                {data.client.rejectedApplicationsCount !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Rejected Apps</p>
                    <p className="text-2xl font-bold text-red-600">{data.client.rejectedApplicationsCount}</p>
                  </div>
                )}
                {data.client.pendingQueriesCount !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pending Queries</p>
                    <p className="text-2xl font-bold text-yellow-600">{data.client.pendingQueriesCount}</p>
                  </div>
                )}
              </div>
              {data.client.riskFactors && data.client.riskFactors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Risk Factors</p>
                  <div className="flex flex-wrap gap-2">
                    {data.client.riskFactors.map((factor, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs bg-orange-100 text-orange-700"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Applications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Service Applications ({applications.length})
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => navigate("/admin/applications")}
              >
                View All Applications
              </Button>
            </div>
            <CardDescription>All service applications for this client</CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No applications found for this client
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-sm">Application ID</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Service</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Payment</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Submitted</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className="border-b border-border hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-mono text-xs">{app.id}</td>
                        <td className="py-3 px-4 text-sm">{app.serviceName}</td>
                        <td className="py-3 px-4 text-sm">{getApplicationStatusBadge(app.status)}</td>
                        <td className="py-3 px-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              app.paymentStatus === "paid"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {app.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/applications/${app.id}`)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created At</p>
                <p className="font-medium">{new Date(data.client.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">{new Date(data.client.updatedAt).toLocaleString()}</p>
              </div>
              {data.client.lastRiskAssessment && (
                <div>
                  <p className="text-muted-foreground">Last Risk Assessment</p>
                  <p className="font-medium">{new Date(data.client.lastRiskAssessment).toLocaleString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
