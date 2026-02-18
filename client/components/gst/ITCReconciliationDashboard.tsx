import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  AlertCircle,
  TrendingDown,
  CheckCircle2,
  RefreshCw,
  FileText,
  Loader2,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * ITCReconciliationDashboard - UI component for ITC reconciliation management
 * Features: View discrepancies, sync portal data, analyze differences, resolve issues
 */

interface ReconciliationRecord {
  id: string;
  month: string;
  financialYear: string;
  claimedITC: number;
  claimedInvoiceCount: number;
  availableITCFromGST?: number;
  discrepancy?: number;
  discrepancyPercentage?: number;
  discrepancyReason?: string;
  hasDiscrepancy: boolean;
  needsReview: boolean;
  createdAt: string;
}

interface DiscrepancyAnalysis {
  month: string;
  claimed: number;
  available: number;
  pending: number;
  rejected: number;
  discrepancy: number;
  discrepancyPercentage: number;
  reason: string;
  invoiceBreakdown: {
    totalInvoices: number;
    totalAmount: number;
    breakdown: {
      sgst: number;
      cgst: number;
      igst: number;
    };
  };
  recommendations: string[];
}

interface Report {
  totalMonths: number;
  monthsWithDiscrepancy: number;
  totalClaimed: number;
  totalAvailable: number;
  totalDiscrepancy: number;
  averageDiscrepancyPercentage: number;
  discrepancyByReason: Record<string, number>;
  flaggedForReview: number;
  resolved: number;
}

interface ITCReconciliationDashboardProps {
  clientId: string;
}

export const ITCReconciliationDashboard: React.FC<
  ITCReconciliationDashboardProps
> = ({ clientId }) => {
  // State
  const [records, setRecords] = useState<ReconciliationRecord[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [selectedRecord, setSelectedRecord] =
    useState<ReconciliationRecord | null>(null);
  const [analysis, setAnalysis] = useState<DiscrepancyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterDiscrepancies, setFilterDiscrepancies] = useState(false);
  const [filterNeedsReview, setFilterNeedsReview] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolutionText, setResolutionText] = useState("");
  const [resolving, setResolving] = useState(false);
  const { toast } = useToast();

  // Fetch reconciliation records and report
  useEffect(() => {
    fetchReconciliations();
    fetchReport();
  }, [clientId]);

  const fetchReconciliations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/itc-reconciliation/${clientId}`);
      if (!response.ok) throw new Error("Failed to fetch reconciliations");

      const data: ReconciliationRecord[] = await response.json();
      setRecords(
        data.sort(
          (a, b) =>
            new Date(b.month + "-01").getTime() -
            new Date(a.month + "-01").getTime(),
        ),
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch reconciliation records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      const response = await fetch(
        `/api/itc-reconciliation/${clientId}/report`,
      );
      if (!response.ok) throw new Error("Failed to fetch report");

      const data: Report = await response.json();
      setReport(data);
    } catch (error) {
      console.error("Failed to fetch report", error);
    }
  };

  const handleAnalyzeMonth = async (month: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/itc-reconciliation/${clientId}/${month}/analysis`,
      );
      if (!response.ok) throw new Error("Failed to fetch analysis");

      const data: DiscrepancyAnalysis = await response.json();
      setAnalysis(data);
      setShowAnalysisDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch analysis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDiscrepancy = async () => {
    if (!selectedRecord || !resolutionText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a resolution",
        variant: "destructive",
      });
      return;
    }

    try {
      setResolving(true);
      const response = await fetch(
        `/api/itc-reconciliation/${clientId}/${selectedRecord.month}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolution: resolutionText }),
        },
      );

      if (!response.ok) throw new Error("Failed to resolve");

      toast({
        title: "Success",
        description: "Discrepancy resolved successfully",
      });

      setShowResolveDialog(false);
      setResolutionText("");
      fetchReconciliations();
      fetchReport();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve discrepancy",
        variant: "destructive",
      });
    } finally {
      setResolving(false);
    }
  };

  // Filter records
  const filteredRecords = records.filter((record) => {
    if (filterDiscrepancies && !record.hasDiscrepancy) return false;
    if (filterNeedsReview && !record.needsReview) return false;
    return true;
  });

  // Prepare chart data
  const chartData = filteredRecords.map((record) => ({
    month: record.month,
    claimed: record.claimedITC,
    available: record.availableITCFromGST || 0,
    discrepancy: record.discrepancy || 0,
  }));

  return (
    <div className="w-full space-y-6">
      {/* Header with Stats */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-600">Total Months</div>
            <div className="text-2xl font-bold">{report.totalMonths}</div>
            <div className="text-xs text-gray-500 mt-2">
              {report.monthsWithDiscrepancy} with discrepancies
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-600">Total Claimed</div>
            <div className="text-2xl font-bold">
              ₹{(report.totalClaimed / 100000).toFixed(2)}L
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Available: ₹{(report.totalAvailable / 100000).toFixed(2)}L
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-600">Total Discrepancy</div>
            <div
              className={`text-2xl font-bold ${report.totalDiscrepancy > 0 ? "text-red-600" : "text-green-600"}`}
            >
              ₹{(Math.abs(report.totalDiscrepancy) / 100000).toFixed(2)}L
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Avg: {report.averageDiscrepancyPercentage.toFixed(2)}%
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-600">Pending Review</div>
            <div className="text-2xl font-bold text-amber-600">
              {report.flaggedForReview}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {report.resolved} resolved
            </div>
          </Card>
        </div>
      )}

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Line Chart - Claimed vs Available */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Claimed vs Available ITC</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="claimed" stroke="#3b82f6" />
                <Line type="monotone" dataKey="available" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Bar Chart - Discrepancy Trend */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Discrepancy Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Bar dataKey="discrepancy" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterDiscrepancies ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterDiscrepancies(!filterDiscrepancies)}
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          With Discrepancies
        </Button>

        <Button
          variant={filterNeedsReview ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterNeedsReview(!filterNeedsReview)}
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Needs Review
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchReconciliations}
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Records List */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Reconciliation Records</h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No reconciliation records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-2 font-semibold">Month</th>
                  <th className="pb-2 font-semibold">FY</th>
                  <th className="pb-2 font-semibold">Claimed</th>
                  <th className="pb-2 font-semibold">Available</th>
                  <th className="pb-2 font-semibold">Discrepancy</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      {record.month}
                    </td>
                    <td className="py-3">{record.financialYear}</td>
                    <td className="py-3">
                      ₹{(record.claimedITC / 100000).toFixed(2)}L
                    </td>
                    <td className="py-3">
                      {record.availableITCFromGST
                        ? `₹${(record.availableITCFromGST / 100000).toFixed(2)}L`
                        : "-"}
                    </td>
                    <td className="py-3">
                      {record.discrepancy ? (
                        <span
                          className={
                            record.discrepancy > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          {record.discrepancy > 0 ? "+" : ""}₹
                          {(Math.abs(record.discrepancy) / 100000).toFixed(2)}L
                          {record.discrepancyPercentage && (
                            <span className="text-xs ml-1">
                              ({record.discrepancyPercentage.toFixed(1)}%)
                            </span>
                          )}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        {record.hasDiscrepancy && (
                          <Badge variant="destructive" className="text-xs">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Discrepancy
                          </Badge>
                        )}
                        {record.needsReview && (
                          <Badge variant="outline" className="text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Review
                          </Badge>
                        )}
                        {!record.hasDiscrepancy && !record.needsReview && (
                          <Badge
                            variant="outline"
                            className="text-xs text-green-700"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            OK
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(record);
                            handleAnalyzeMonth(record.month);
                          }}
                        >
                          Analyze
                        </Button>
                        {record.hasDiscrepancy && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowResolveDialog(true);
                            }}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Analysis Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Discrepancy Analysis - {analysis?.month}</DialogTitle>
          </DialogHeader>

          {analysis && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Claimed ITC</div>
                  <div className="text-xl font-bold">
                    ₹{(analysis.claimed / 100000).toFixed(2)}L
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">
                    Available from Portal
                  </div>
                  <div className="text-xl font-bold">
                    ₹{(analysis.available / 100000).toFixed(2)}L
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">
                    Pending Acceptance
                  </div>
                  <div className="text-xl font-bold text-amber-600">
                    ₹{(analysis.pending / 100000).toFixed(2)}L
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Rejected</div>
                  <div className="text-xl font-bold text-red-600">
                    ₹{(analysis.rejected / 100000).toFixed(2)}L
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                <div className="font-semibold">
                  Reason: {analysis.reason.replace(/_/g, " ").toUpperCase()}
                </div>
                <div className="text-sm mt-1">
                  Discrepancy: {analysis.discrepancy > 0 ? "+" : ""}₹
                  {(Math.abs(analysis.discrepancy) / 100000).toFixed(2)}L (
                  {analysis.discrepancyPercentage.toFixed(1)}%)
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Invoice Breakdown</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    Total Invoices: {analysis.invoiceBreakdown.totalInvoices}
                  </div>
                  <div>
                    Total Amount: ₹
                    {(analysis.invoiceBreakdown.totalAmount / 100000).toFixed(
                      2,
                    )}
                    L
                  </div>
                  <div>
                    SGST: ₹
                    {(
                      analysis.invoiceBreakdown.breakdown.sgst / 100000
                    ).toFixed(2)}
                    L
                  </div>
                  <div>
                    CGST: ₹
                    {(
                      analysis.invoiceBreakdown.breakdown.cgst / 100000
                    ).toFixed(2)}
                    L
                  </div>
                  <div className="col-span-2">
                    IGST: ₹
                    {(
                      analysis.invoiceBreakdown.breakdown.igst / 100000
                    ).toFixed(2)}
                    L
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm flex gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Discrepancy</DialogTitle>
            <DialogDescription>
              Month: {selectedRecord?.month} | Discrepancy: ₹
              {(Math.abs(selectedRecord?.discrepancy || 0) / 100000).toFixed(2)}
              L
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Resolution Details
              </label>
              <textarea
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="Describe how the discrepancy was resolved..."
                className="w-full border rounded p-2 text-sm"
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowResolveDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolveDiscrepancy}
                disabled={resolving || !resolutionText.trim()}
              >
                {resolving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Resolve
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ITCReconciliationDashboard;
