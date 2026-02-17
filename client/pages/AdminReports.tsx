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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/AdminLayout";
import {
  FileText,
  Download,
  Filter,
  Search,
  FileSpreadsheet,
  FileDown,
  Clock,
  Eye,
} from "lucide-react";
import { Report, ReportType, ReportStatus } from "@shared/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Client {
  id: string;
  name: string;
}

interface ExportLog {
  exportedBy: string;
  exportedByName?: string;
  format: "csv" | "pdf";
  exportedAt: string;
}

const REPORT_TYPES: ReportType[] = [
  "Financial Statements",
  "Income Tax Computation",
  "GST Summary",
  "Tax Audit Summary",
  "ROC Filing Summary",
];

const STATUS_OPTIONS: ReportStatus[] = ["draft", "final", "filed"];

export default function AdminReports() {
  const { toast } = useToast();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [financialYears, setFinancialYears] = useState<string[]>([]);
  const [exportLogs, setExportLogs] = useState<Record<string, ExportLog[]>>(
    {}
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [selectedFY, setSelectedFY] = useState<string>("all");
  const [selectedReportType, setSelectedReportType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const itemsPerPage = 10;

  // Loading states for exports
  const [exportingCSV, setExportingCSV] = useState<Record<string, boolean>>({});
  const [exportingPDF, setExportingPDF] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchMetadata();
    fetchReports();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [
    currentPage,
    selectedClient,
    selectedFY,
    selectedReportType,
    selectedStatus,
  ]);

  useEffect(() => {
    applyFilters();
  }, [reports, searchQuery]);

  const fetchMetadata = async () => {
    try {
      const [clientsRes, yearsRes] = await Promise.all([
        fetch("/api/reports/meta/clients", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/reports/meta/financial-years", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data.clients || []);
      }

      if (yearsRes.ok) {
        const data = await yearsRes.json();
        setFinancialYears(data.years || []);
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (selectedClient !== "all") params.append("clientId", selectedClient);
      if (selectedFY !== "all") params.append("financialYear", selectedFY);
      if (selectedReportType !== "all")
        params.append("reportType", selectedReportType);
      if (selectedStatus !== "all") params.append("status", selectedStatus);

      const response = await fetch(`/api/reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }

      const data = await response.json();
      setReports(data.reports || []);
      setTotalReports(data.total || 0);
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Failed to fetch reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!searchQuery.trim()) {
      setFilteredReports(reports);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = reports.filter(
      (report) =>
        report.clientName.toLowerCase().includes(query) ||
        report.reportType.toLowerCase().includes(query) ||
        report.id.toLowerCase().includes(query)
    );
    setFilteredReports(filtered);
  };

  const handleExportCSV = async (reportId: string) => {
    try {
      setExportingCSV({ ...exportingCSV, [reportId]: true });

      toast({
        title: "CSV Download Started",
        description: "Preparing your CSV file...",
      });

      const response = await fetch(`/api/reports/${reportId}/export/csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to export CSV");
      }

      // Get filename from headers or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "report.csv";
      if (contentDisposition) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "CSV Generated Successfully",
        description: `Downloaded ${filename}`,
      });

      // Refresh reports to update export logs
      fetchReports();
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export CSV file",
        variant: "destructive",
      });
    } finally {
      setExportingCSV({ ...exportingCSV, [reportId]: false });
    }
  };

  const handleExportPDF = async (reportId: string) => {
    try {
      setExportingPDF({ ...exportingPDF, [reportId]: true });

      toast({
        title: "PDF Download Started",
        description: "Generating your PDF file...",
      });

      const response = await fetch(`/api/reports/${reportId}/export/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to export PDF");
      }

      // Get filename from headers or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "report.pdf";
      if (contentDisposition) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "PDF Generated Successfully",
        description: `Downloaded ${filename}`,
      });

      // Refresh reports to update export logs
      fetchReports();
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export PDF file",
        variant: "destructive",
      });
    } finally {
      setExportingPDF({ ...exportingPDF, [reportId]: false });
    }
  };

  const fetchExportLogs = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/export-logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setExportLogs({ ...exportLogs, [reportId]: data.logs || [] });
      }
    } catch (error) {
      console.error("Error fetching export logs:", error);
    }
  };

  const getStatusBadgeVariant = (status: ReportStatus) => {
    switch (status) {
      case "draft":
        return "secondary";
      case "final":
        return "default";
      case "filed":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case "draft":
        return "text-gray-500";
      case "final":
        return "text-green-600";
      case "filed":
        return "text-blue-600";
      default:
        return "text-gray-500";
    }
  };

  const handleResetFilters = () => {
    setSelectedClient("all");
    setSelectedFY("all");
    setSelectedReportType("all");
    setSelectedStatus("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const isExportDisabled = () => {
    // Optional rule: disable export for draft reports
    // Uncomment to enable this restriction:
    // return report.status === "draft";
    return false;
  };

  if (loading && reports.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Compliance Reports
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and export compliance reports for your clients
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {totalReports} Total Reports
            </span>
          </div>
        </div>

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter reports by client, financial year, type, and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Client Filter */}
              <div>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Financial Year Filter */}
              <div>
                <Select value={selectedFY} onValueChange={setSelectedFY}>
                  <SelectTrigger>
                    <SelectValue placeholder="Financial Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {financialYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        FY {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Report Type Filter */}
              <div>
                <Select
                  value={selectedReportType}
                  onValueChange={setSelectedReportType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Report Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {REPORT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
            <CardDescription>
              View and export compliance reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || selectedClient !== "all" || selectedFY !== "all" || selectedReportType !== "all" || selectedStatus !== "all"
                    ? "Try adjusting your filters"
                    : "No reports available yet"}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Report ID</TableHead>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Report Type</TableHead>
                        <TableHead>Financial Year</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Generated Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-mono text-xs">
                            {report.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="font-medium">
                            {report.clientName}
                          </TableCell>
                          <TableCell>{report.reportType}</TableCell>
                          <TableCell>FY {report.financialYear}</TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusBadgeVariant(report.status)}
                              className={getStatusColor(report.status)}
                            >
                              {report.status.charAt(0).toUpperCase() +
                                report.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(report.generatedOn).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Export CSV Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExportCSV(report.id)}
                                disabled={
                                  isExportDisabled() ||
                                  exportingCSV[report.id]
                                }
                                className="gap-1"
                              >
                                {exportingCSV[report.id] ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span>Exporting...</span>
                                  </>
                                ) : (
                                  <>
                                    <FileSpreadsheet className="w-4 h-4" />
                                    <span>CSV</span>
                                  </>
                                )}
                              </Button>

                              {/* Export PDF Button */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExportPDF(report.id)}
                                disabled={
                                  isExportDisabled() ||
                                  exportingPDF[report.id]
                                }
                                className="gap-1"
                              >
                                {exportingPDF[report.id] ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span>Generating...</span>
                                  </>
                                ) : (
                                  <>
                                    <FileDown className="w-4 h-4" />
                                    <span>PDF</span>
                                  </>
                                )}
                              </Button>

                              {/* View Export Logs */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fetchExportLogs(report.id)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Export Audit Logs</DialogTitle>
                                    <DialogDescription>
                                      View export history for {report.clientName} -{" "}
                                      {report.reportType}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    {exportLogs[report.id] &&
                                    exportLogs[report.id].length > 0 ? (
                                      exportLogs[report.id].map((log, index) => (
                                        <div
                                          key={index}
                                          className="flex items-start gap-3 p-3 border rounded-lg"
                                        >
                                          <div className="flex-shrink-0 mt-1">
                                            {log.format === "csv" ? (
                                              <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                            ) : (
                                              <FileDown className="w-4 h-4 text-red-600" />
                                            )}
                                          </div>
                                          <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                              <span className="font-medium">
                                                {log.format.toUpperCase()} Export
                                              </span>
                                              <Badge variant="outline">
                                                {new Date(
                                                  log.exportedAt
                                                ).toLocaleDateString()}
                                              </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                              Exported by:{" "}
                                              {log.exportedByName || "Unknown"}
                                            </p>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                              <Clock className="w-3 h-3" />
                                              {new Date(
                                                log.exportedAt
                                              ).toLocaleTimeString()}
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-center py-8 text-muted-foreground">
                                        <Download className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No export history yet</p>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, totalReports)} of{" "}
                      {totalReports} reports
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
