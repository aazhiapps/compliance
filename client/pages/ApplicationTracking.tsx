import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Phone,
  Mail,
  Download,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface TimelineEvent {
  id: string;
  status: "submitted" | "under_review" | "approved" | "rejected";
  title: string;
  description: string;
  timestamp: string;
  updatedBy: string;
  remarks?: string;
}

interface Document {
  id: string;
  name: string;
  status: "pending" | "uploaded" | "verifying" | "approved" | "rejected";
  uploadDate?: string;
  remarks?: string;
}

export default function ApplicationTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: _user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "documents" | "chat">("timeline");
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: "user" | "admin";
    message: string;
    timestamp: string;
  }>>([
    {
      id: "msg_1",
      sender: "admin",
      message: "Hello! I'm reviewing your application. Please let me know if you have any questions.",
      timestamp: new Date().toISOString(),
    },
  ]);

  // Mock application data
  const application = {
    id: id || "app_001",
    serviceName: "GST Registration",
    status: "under_review" as const,
    createdDate: "2024-02-01",
    expectedDate: "2024-02-05",
    paymentAmount: 499,
    paymentStatus: "paid" as const,
    assignedStaff: {
      name: "Rajesh Kumar",
      phone: "+91 98765 43210",
      email: "rajesh.kumar@complance.com",
      avatar: "RK",
    },
    documents: [
      { id: "doc_1", name: "PAN Card", status: "approved" as const, uploadDate: "2024-02-01" },
      { id: "doc_2", name: "Aadhar Card", status: "approved" as const, uploadDate: "2024-02-01" },
      { id: "doc_3", name: "Business Address Proof", status: "verifying" as const, uploadDate: "2024-02-02" },
      { id: "doc_4", name: "Bank Statement", status: "uploaded" as const, uploadDate: "2024-02-02" },
    ] as Document[],
    timeline: [
      {
        id: "1",
        status: "submitted" as const,
        title: "Application Submitted",
        description: "Your application has been submitted successfully",
        timestamp: "2024-02-01T10:00:00Z",
        updatedBy: "System",
      },
      {
        id: "2",
        status: "under_review" as const,
        title: "Under Review",
        description: "Our team is reviewing your documents",
        timestamp: "2024-02-02T14:30:00Z",
        updatedBy: "Rajesh Kumar",
        remarks: "Documents look good. Verifying bank details.",
      },
      {
        id: "3",
        status: "under_review" as const,
        title: "Documents Verified",
        description: "Initial document verification completed",
        timestamp: "2024-02-03T09:15:00Z",
        updatedBy: "Rajesh Kumar",
      },
    ] as TimelineEvent[],
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => setIsLoading(false), 500);
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success/10 text-success border-success/20";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      case "under_review":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5" />;
      case "rejected":
        return <AlertCircle className="w-5 h-5" />;
      case "under_review":
        return <Clock className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success/10 text-success";
      case "rejected":
        return "bg-red-50 text-red-700";
      case "verifying":
        return "bg-yellow-50 text-yellow-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const handleDownloadDocument = (doc: Document) => {
    try {
      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = doc.fileUrl;
      link.download = doc.fileName || doc.name || "document";
      link.target = "_blank"; // Open in new tab as fallback
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Downloading ${doc.name || doc.fileName}...`,
      });
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    const newMessage = {
      id: `msg_${Date.now()}`,
      sender: "user" as const,
      message: chatMessage,
      timestamp: new Date().toISOString(),
    };
    
    setChatMessages([...chatMessages, newMessage]);
    setChatMessage("");
    
    // Simulate admin reply after 2 seconds
    setTimeout(() => {
      const adminReply = {
        id: `msg_${Date.now()}`,
        sender: "admin" as const,
        message: "Thank you for your message. We'll get back to you shortly.",
        timestamp: new Date().toISOString(),
      };
      setChatMessages(prev => [...prev, adminReply]);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {application.serviceName}
              </h1>
              <p className="text-muted-foreground">
                Application ID: <span className="font-mono">{application.id}</span>
              </p>
            </div>

            <span
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold border ${getStatusColor(
                application.status
              )}`}
            >
              {getStatusIcon(application.status)}
              {application.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Key Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Submitted On</p>
              <p className="font-semibold">{new Date(application.createdDate).toLocaleDateString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Expected Date</p>
              <p className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {new Date(application.expectedDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
              <p className="font-semibold text-success">
                ✓ {application.paymentStatus === "paid" ? "Paid" : "Pending"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">Amount</p>
              <p className="font-semibold">₹{application.paymentAmount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-border">
              {(["timeline", "documents", "chat"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "timeline" && "Status Timeline"}
                  {tab === "documents" && "Documents"}
                  {tab === "chat" && "Messages"}
                </button>
              ))}
            </div>

            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <div className="space-y-4">
                {isLoading ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading timeline...</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="relative space-y-6">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-gray-200"></div>

                    {/* Timeline events */}
                    {application.timeline.map((event) => (
                      <div key={event.id} className="relative pl-20">
                        {/* Timeline dot */}
                        <div className="absolute -left-2.5 top-1 w-6 h-6 rounded-full border-4 border-white bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>

                        {/* Event card */}
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-foreground">{event.title}</h3>
                              <span className="text-xs text-muted-foreground">
                                {new Date(event.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                            {event.remarks && (
                              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                <p className="text-xs font-medium text-blue-900 mb-1">Remarks:</p>
                                <p className="text-sm text-blue-900">{event.remarks}</p>
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-3">
                              Updated by: <span className="font-medium">{event.updatedBy}</span>
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <div className="space-y-4">
                {application.documents.map((doc) => (
                  <Card key={doc.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <FileText className="w-10 h-10 text-muted-foreground flex-shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground mb-1">{doc.name}</h3>
                            {doc.uploadDate && (
                              <p className="text-sm text-muted-foreground">
                                Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                              </p>
                            )}
                            {doc.remarks && (
                              <p className="text-sm text-red-700 mt-2">{doc.remarks}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getDocumentStatusColor(
                              doc.status
                            )}`}
                          >
                            {doc.status === "verifying" && "Verifying"}
                            {doc.status === "approved" && "Approved"}
                            {doc.status === "rejected" && "Rejected"}
                            {doc.status === "uploaded" && "Uploaded"}
                            {doc.status === "pending" && "Pending"}
                          </span>
                          <button 
                            className="p-2 hover:bg-gray-100 rounded transition-colors"
                            onClick={() => handleDownloadDocument(doc)}
                            title="Download document"
                          >
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === "chat" && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col h-[500px]">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              msg.sender === "user"
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-foreground"
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-xs mt-1 opacity-70">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chat Input */}
                    <div className="border-t pt-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleSendMessage();
                            }
                          }}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        <Button onClick={handleSendMessage} disabled={!chatMessage.trim()}>
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            {/* Assigned Staff */}
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Your Staff</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                    {application.assignedStaff.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{application.assignedStaff.name}</h3>
                    <p className="text-xs text-muted-foreground">GST Specialist</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <a
                    href={`tel:${application.assignedStaff.phone}`}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Call</p>
                      <p className="text-sm font-medium">{application.assignedStaff.phone}</p>
                    </div>
                  </a>

                  <a
                    href={`mailto:${application.assignedStaff.email}`}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium break-all">{application.assignedStaff.email}</p>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Contact your assigned staff or our support team for any queries
                </p>
                <Button variant="outline" className="w-full">
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
