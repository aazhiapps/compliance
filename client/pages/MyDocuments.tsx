import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  FolderOpen,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ServiceDocuments, UserDocumentsResponse } from "@shared/api";

export default function MyDocuments() {
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceDocuments[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedServices, setExpandedServices] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/documents", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data: UserDocumentsResponse = await response.json();
        setServices(data.services || []);
        // Auto-expand services with documents
        const servicesWithDocs = new Set(
          data.services.filter(s => s.documents.length > 0).map(s => s.serviceId)
        );
        setExpandedServices(servicesWithDocs);
      } else {
        throw new Error("Failed to fetch documents");
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      toast({
        title: "Error",
        description: "Failed to load your documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = (serviceId: number) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(serviceId)) {
      newExpanded.delete(serviceId);
    } else {
      newExpanded.add(serviceId);
    }
    setExpandedServices(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success/10 text-success border-success/20";
      case "verifying":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "uploaded":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "verifying":
        return <Clock className="w-4 h-4" />;
      case "uploaded":
        return <FileText className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const totalDocuments = services.reduce((sum, s) => sum + s.documents.length, 0);
  const approvedDocuments = services.reduce(
    (sum, s) => sum + s.documents.filter(d => d.status === "approved").length,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Documents</h1>
          <p className="text-muted-foreground">
            View and manage all your documents organized by service
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Documents</p>
                  <p className="text-3xl font-bold text-foreground">{totalDocuments}</p>
                </div>
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Approved</p>
                  <p className="text-3xl font-bold text-success">{approvedDocuments}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Services</p>
                  <p className="text-3xl font-bold text-foreground">{services.length}</p>
                </div>
                <FolderOpen className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents by Service */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading documents...</p>
              </CardContent>
            </Card>
          ) : services.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No documents yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start an application to upload documents
                </p>
                <Link to="/">
                  <Button className="bg-primary hover:bg-primary/90">
                    Browse Services
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            services.map((service) => (
              <Card key={service.serviceId} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleService(service.serviceId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3">
                        <FolderOpen className="w-5 h-5 text-primary" />
                        {service.serviceName}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {service.documents.length} document{service.documents.length !== 1 ? 's' : ''} • 
                        {' '}{service.applicationIds.length} application{service.applicationIds.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">
                      {expandedServices.has(service.serviceId) ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {expandedServices.has(service.serviceId) && (
                  <CardContent className="pt-0">
                    {service.documents.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No documents uploaded for this service yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {service.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                <FileText className="w-8 h-8 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">
                                  {doc.fileName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                                  {doc.fileSize && ` • ${formatFileSize(doc.fileSize)}`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                  doc.status
                                )}`}
                              >
                                {getStatusIcon(doc.status)}
                                {doc.status}
                              </span>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  title="Download Document"
                                  onClick={() => {
                                    toast({
                                      title: "Download Started",
                                      description: `Downloading ${doc.fileName}`,
                                    });
                                  }}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions */}
        {!isLoading && services.length > 0 && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Need to upload more documents?</h3>
                  <p className="text-sm text-muted-foreground">
                    Go to your dashboard to manage applications and upload documents
                  </p>
                </div>
                <Link to="/dashboard">
                  <Button variant="outline">Go to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
