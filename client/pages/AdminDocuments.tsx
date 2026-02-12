import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Download, Eye, FileText, Check, X, Clock, MoreVertical } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";

interface Document {
  id: string;
  fileName: string;
  uploadedBy: string;
  userEmail: string;
  applicationId: string;
  service: string;
  fileSize: number;
  uploadDate: string;
  status: "approved" | "verifying" | "uploaded" | "rejected";
  type: string;
}

export default function AdminDocuments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | string>("all");
  const [documents] = useState<Document[]>([
    {
      id: "doc_1",
      fileName: "PAN_Card.pdf",
      uploadedBy: "Demo User",
      userEmail: "demo@example.com",
      applicationId: "app_1",
      service: "GST Registration",
      fileSize: 2048,
      uploadDate: "2024-02-10",
      status: "approved",
      type: "pdf",
    },
    {
      id: "doc_2",
      fileName: "Aadhar_Front.jpg",
      uploadedBy: "Rajesh Kumar",
      userEmail: "rajesh@example.com",
      applicationId: "app_2",
      service: "Company Registration",
      fileSize: 3072,
      uploadDate: "2024-02-10",
      status: "verifying",
      type: "image",
    },
    {
      id: "doc_3",
      fileName: "Bank_Statement.pdf",
      uploadedBy: "Priya Singh",
      userEmail: "priya@example.com",
      applicationId: "app_3",
      service: "PAN Registration",
      fileSize: 5120,
      uploadDate: "2024-02-09",
      status: "approved",
      type: "pdf",
    },
    {
      id: "doc_4",
      fileName: "Company_Stamp.png",
      uploadedBy: "Amit Patel",
      userEmail: "amit@example.com",
      applicationId: "app_4",
      service: "Trademark Registration",
      fileSize: 1024,
      uploadDate: "2024-02-09",
      status: "uploaded",
      type: "image",
    },
    {
      id: "doc_5",
      fileName: "Trademark_Logo.pdf",
      uploadedBy: "Neha Sharma",
      userEmail: "neha@example.com",
      applicationId: "app_5",
      service: "Trademark Registration",
      fileSize: 4096,
      uploadDate: "2024-02-08",
      status: "rejected",
      type: "pdf",
    },
    {
      id: "doc_6",
      fileName: "Business_License.pdf",
      uploadedBy: "Demo User",
      userEmail: "demo@example.com",
      applicationId: "app_1",
      service: "GST Registration",
      fileSize: 2560,
      uploadDate: "2024-02-08",
      status: "approved",
      type: "pdf",
    },
  ]);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border border-green-200";
      case "verifying":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "uploaded":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "rejected":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <Check className="w-4 h-4" />;
      case "verifying":
        return <Clock className="w-4 h-4" />;
      case "uploaded":
        return <FileText className="w-4 h-4" />;
      case "rejected":
        return <X className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const approvedCount = documents.filter(d => d.status === "approved").length;
  const verifyingCount = documents.filter(d => d.status === "verifying").length;
  const uploadedCount = documents.filter(d => d.status === "uploaded").length;
  const rejectedCount = documents.filter(d => d.status === "rejected").length;
  const totalSize = documents.reduce((sum, d) => sum + d.fileSize, 0);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Documents Management</h1>
            <p className="text-muted-foreground mt-1">Review and manage uploaded documents</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Approved</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{approvedCount}</p>
                </div>
                <Check className="w-10 h-10 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">Verifying</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-1">{verifyingCount}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Uploaded</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{uploadedCount}</p>
                </div>
                <FileText className="w-10 h-10 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Rejected</p>
                  <p className="text-3xl font-bold text-red-900 mt-1">{rejectedCount}</p>
                </div>
                <X className="w-10 h-10 text-red-400 opacity-50" />
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
                  placeholder="Search by file name, uploader, or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="verifying">Verifying</option>
                  <option value="uploaded">Uploaded</option>
                  <option value="rejected">Rejected</option>
                </select>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
            <CardTitle className="text-lg">All Documents</CardTitle>
            <CardDescription>{filteredDocuments.length} documents - Total size: {formatFileSize(totalSize)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-200 bg-purple-50">
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">File Name</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Uploaded By</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Service</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Size</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Upload Date</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-sm text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-200 hover:bg-purple-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-foreground">{doc.fileName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-foreground">{doc.uploadedBy}</p>
                          <p className="text-xs text-muted-foreground">{doc.userEmail}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{doc.service}</td>
                      <td className="py-3 px-4 text-sm">{formatFileSize(doc.fileSize)}</td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(doc.status)}`}>
                          {getStatusIcon(doc.status)}
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" title="View Document">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" title="Download Document">
                            <Download className="w-4 h-4" />
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

              {filteredDocuments.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No documents found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
