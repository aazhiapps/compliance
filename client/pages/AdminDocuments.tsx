import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  Download,
  Eye,
  FileText,
  Check,
  X,
  Clock,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  User,
  Briefcase,
  Calendar,
  FolderOpen,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import {
  AdminDocumentsResponse,
  UserDocumentsHierarchical,
  Document,
} from "@shared/api";

export default function AdminDocuments() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | string>("all");
  const [usersData, setUsersData] = useState<UserDocumentsHierarchical[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [expandedServices, setExpandedServices] = useState<Set<string>>(
    new Set(),
  );
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/admin/documents", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data: AdminDocumentsResponse = await response.json();
        setUsersData(data.users || []);
      } else {
        throw new Error("Failed to fetch documents");
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      toast({
        title: "Error",
        description: "Failed to load documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const toggleService = (key: string) => {
    const newExpanded = new Set(expandedServices);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedServices(newExpanded);
  };

  const toggleYear = (key: string) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedYears(newExpanded);
  };

  const toggleMonth = (key: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedMonths(newExpanded);
  };

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

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Calculate statistics - memoized to avoid recalculation on every render
  const stats = useMemo(() => {
    let totalDocuments = 0;
    let approvedCount = 0;
    let verifyingCount = 0;
    let uploadedCount = 0;
    let rejectedCount = 0;

    usersData.forEach((user) => {
      user.services.forEach((service) => {
        service.years.forEach((year) => {
          year.months.forEach((month) => {
            month.documents.forEach((doc) => {
              totalDocuments++;
              if (doc.status === "approved") approvedCount++;
              if (doc.status === "verifying") verifyingCount++;
              if (doc.status === "uploaded") uploadedCount++;
              if (doc.status === "rejected") rejectedCount++;
            });
          });
        });
      });
    });

    return {
      totalDocuments,
      approvedCount,
      verifyingCount,
      uploadedCount,
      rejectedCount,
    };
  }, [usersData]);

  // Filter documents based on search and status - memoized callback
  const filterDocument = useCallback(
    (doc: Document): boolean => {
      const matchesStatus =
        filterStatus === "all" || doc.status === filterStatus;
      const matchesSearch =
        searchQuery === "" ||
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    },
    [filterStatus, searchQuery],
  );

  // Check if user has matching documents - memoized callback
  const hasMatchingDocuments = useCallback(
    (user: UserDocumentsHierarchical): boolean => {
      return user.services.some((service) =>
        service.years.some((year) =>
          year.months.some((month) =>
            month.documents.some((doc) => filterDocument(doc)),
          ),
        ),
      );
    },
    [filterDocument],
  );

  // Filtered users - memoized to avoid recalculation
  const filteredUsers = useMemo(
    () =>
      usersData.filter(
        (user) =>
          hasMatchingDocuments(user) ||
          user.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.userEmail.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [usersData, hasMatchingDocuments, searchQuery],
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Documents Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Hierarchical view: Users → Services → Year/Month → Documents
            </p>
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
                  <p className="text-3xl font-bold text-green-900 mt-1">
                    {stats.approvedCount}
                  </p>
                </div>
                <Check className="w-10 h-10 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600 font-medium">
                    Verifying
                  </p>
                  <p className="text-3xl font-bold text-yellow-900 mt-1">
                    {stats.verifyingCount}
                  </p>
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
                  <p className="text-3xl font-bold text-blue-900 mt-1">
                    {stats.uploadedCount}
                  </p>
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
                  <p className="text-3xl font-bold text-red-900 mt-1">
                    {stats.rejectedCount}
                  </p>
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
                  placeholder="Search by file name, user, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
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
            </div>
          </CardContent>
        </Card>

        {/* Hierarchical Documents View */}
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading documents...</p>
            </CardContent>
          </Card>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No documents found
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || filterStatus !== "all"
                  ? "Try adjusting your filters"
                  : "No users have uploaded documents yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <Card key={user.userId} className="overflow-hidden">
                {/* User Level */}
                <CardHeader
                  className="cursor-pointer hover:bg-gray-50 transition-colors bg-purple-50"
                  onClick={() => toggleUser(user.userId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-3">
                        <User className="w-5 h-5 text-purple-600" />
                        {user.userName}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {user.userEmail} • {user.services.length} service
                        {user.services.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">
                      {expandedUsers.has(user.userId) ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {expandedUsers.has(user.userId) && (
                  <CardContent className="pt-4 space-y-3">
                    {user.services.map((service) => {
                      const serviceKey = `${user.userId}-${service.serviceId}`;
                      return (
                        <div
                          key={serviceKey}
                          className="border border-border rounded-lg overflow-hidden"
                        >
                          {/* Service Level */}
                          <div
                            className="p-3 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                            onClick={() => toggleService(serviceKey)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                <Briefcase className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-foreground">
                                  {service.serviceName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({service.years.length} year
                                  {service.years.length !== 1 ? "s" : ""})
                                </span>
                              </div>
                              {expandedServices.has(serviceKey) ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>

                          {expandedServices.has(serviceKey) && (
                            <div className="p-3 space-y-2 bg-gray-50">
                              {service.years.map((year) => {
                                const yearKey = `${serviceKey}-${year.year}`;
                                return (
                                  <div
                                    key={yearKey}
                                    className="border border-border rounded-md overflow-hidden bg-white"
                                  >
                                    {/* Year Level */}
                                    <div
                                      className="p-2 bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
                                      onClick={() => toggleYear(yearKey)}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Calendar className="w-4 h-4 text-green-600" />
                                          <span className="font-medium text-sm">
                                            {year.year}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            ({year.months.length} month
                                            {year.months.length !== 1
                                              ? "s"
                                              : ""}
                                            )
                                          </span>
                                        </div>
                                        {expandedYears.has(yearKey) ? (
                                          <ChevronUp className="w-4 h-4" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4" />
                                        )}
                                      </div>
                                    </div>

                                    {expandedYears.has(yearKey) && (
                                      <div className="p-2 space-y-2">
                                        {year.months.map((month) => {
                                          const monthKey = `${yearKey}-${month.month}`;
                                          const filteredDocs =
                                            month.documents.filter(
                                              filterDocument,
                                            );

                                          if (filteredDocs.length === 0)
                                            return null;

                                          return (
                                            <div
                                              key={monthKey}
                                              className="border border-border rounded-sm overflow-hidden"
                                            >
                                              {/* Month Level */}
                                              <div
                                                className="p-2 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors"
                                                onClick={() =>
                                                  toggleMonth(monthKey)
                                                }
                                              >
                                                <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <FolderOpen className="w-3 h-3 text-orange-600" />
                                                    <span className="font-medium text-sm">
                                                      {month.monthName}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                      ({filteredDocs.length}{" "}
                                                      document
                                                      {filteredDocs.length !== 1
                                                        ? "s"
                                                        : ""}
                                                      )
                                                    </span>
                                                  </div>
                                                  {expandedMonths.has(
                                                    monthKey,
                                                  ) ? (
                                                    <ChevronUp className="w-3 h-3" />
                                                  ) : (
                                                    <ChevronDown className="w-3 h-3" />
                                                  )}
                                                </div>
                                              </div>

                                              {expandedMonths.has(monthKey) && (
                                                <div className="p-2 space-y-1 bg-white">
                                                  {/* Documents */}
                                                  {filteredDocs.map((doc) => (
                                                    <div
                                                      key={doc.id}
                                                      className="flex items-center justify-between p-2 border border-border rounded hover:shadow-sm transition-shadow text-sm"
                                                    >
                                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                          <p className="font-medium text-foreground truncate text-sm">
                                                            {doc.fileName}
                                                          </p>
                                                          <p className="text-xs text-muted-foreground">
                                                            {new Date(
                                                              doc.uploadedAt,
                                                            ).toLocaleDateString()}
                                                            {doc.fileSize &&
                                                              ` • ${formatFileSize(doc.fileSize)}`}
                                                          </p>
                                                        </div>
                                                      </div>

                                                      <div className="flex items-center gap-2">
                                                        <span
                                                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                            doc.status,
                                                          )}`}
                                                        >
                                                          {getStatusIcon(
                                                            doc.status,
                                                          )}
                                                          {doc.status}
                                                        </span>

                                                        <div className="flex gap-1">
                                                          <Button
                                                            size="sm"
                                                            variant="outline"
                                                            title="View Document"
                                                            className="h-7 w-7 p-0"
                                                          >
                                                            <Eye className="w-3 h-3" />
                                                          </Button>
                                                          <Button
                                                            size="sm"
                                                            variant="outline"
                                                            title="Download Document"
                                                            className="h-7 w-7 p-0"
                                                          >
                                                            <Download className="w-3 h-3" />
                                                          </Button>
                                                          <button
                                                            className="h-7 w-7 p-0 hover:bg-gray-100 rounded transition-colors flex items-center justify-center"
                                                            title="More actions"
                                                          >
                                                            <MoreVertical className="w-3 h-3 text-muted-foreground" />
                                                          </button>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
