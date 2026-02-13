import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft, CheckCircle2, Clock, AlertCircle, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { MonthlyGSTSummary } from "@shared/gst";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function GSTSummary() {
  const [summaries, setSummaries] = useState<MonthlyGSTSummary[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Initialize with current month
  useEffect(() => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(month);
  }, []);

  // Load summaries when month changes
  useEffect(() => {
    if (selectedMonth) {
      loadSummaries();
    }
  }, [selectedMonth]);

  const loadSummaries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/gst/summary/all/${selectedMonth}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSummaries(data.summaries || []);
      }
    } catch (error) {
      console.error("Error loading summaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getFilingStatusBadge = (status: string) => {
    switch (status) {
      case "filed":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Filed
          </Badge>
        );
      case "late":
        return (
          <Badge className="bg-red-500">
            <AlertCircle className="w-3 h-3 mr-1" />
            Late
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getGSTRBadge = (filed: boolean) => {
    if (filed) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Filed
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
        Pending
      </Badge>
    );
  };

  // Calculate totals
  const totals = summaries.reduce(
    (acc, summary) => ({
      totalPurchases: acc.totalPurchases + summary.totalPurchases,
      totalSales: acc.totalSales + summary.totalSales,
      itcAvailable: acc.itcAvailable + summary.itcAvailable,
      outputTax: acc.outputTax + summary.outputTax,
      netTaxPayable: acc.netTaxPayable + summary.netTaxPayable,
    }),
    {
      totalPurchases: 0,
      totalSales: 0,
      itcAvailable: 0,
      outputTax: 0,
      netTaxPayable: 0,
    }
  );

  return (
    <AppLayout>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">GST Filing Summary - All Clients</h1>
              <p className="text-muted-foreground mt-1">
                Overview of all clients' filing status and GST data for the selected month
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Month Selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <label className="font-medium">Select Month:</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <TrendingDown className="w-4 h-4" />
                  <span className="text-sm">Total Purchases</span>
                </div>
                <div className="text-2xl font-bold">{formatCurrency(totals.totalPurchases)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">Total Sales</span>
                </div>
                <div className="text-2xl font-bold">{formatCurrency(totals.totalSales)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">ITC Available</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totals.itcAvailable)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">Output Tax</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(totals.outputTax)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm font-medium">Net Tax Payable</span>
                </div>
                <div className={`text-2xl font-bold ${totals.netTaxPayable > 0 ? "text-red-600" : "text-green-600"}`}>
                  {formatCurrency(totals.netTaxPayable)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Clients Table */}
          <Card>
            <CardHeader>
              <CardTitle>Client Filing Status</CardTitle>
              <CardDescription>
                {summaries.length} client{summaries.length !== 1 ? "s" : ""} found for {selectedMonth}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading summaries...</div>
              ) : summaries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No client data found for the selected month
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client Name</TableHead>
                        <TableHead className="text-right">Purchases</TableHead>
                        <TableHead className="text-right">Sales</TableHead>
                        <TableHead className="text-right">ITC Available</TableHead>
                        <TableHead className="text-right">Output Tax</TableHead>
                        <TableHead className="text-right">Net Tax</TableHead>
                        <TableHead className="text-center">GSTR-1</TableHead>
                        <TableHead className="text-center">GSTR-3B</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summaries.map((summary) => (
                        <TableRow key={summary.clientId}>
                          <TableCell className="font-medium">{summary.clientName}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(summary.totalPurchases)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(summary.totalSales)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(summary.itcAvailable)}
                          </TableCell>
                          <TableCell className="text-right text-orange-600">
                            {formatCurrency(summary.outputTax)}
                          </TableCell>
                          <TableCell className={`text-right font-medium ${summary.netTaxPayable > 0 ? "text-red-600" : "text-green-600"}`}>
                            {formatCurrency(summary.netTaxPayable)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getGSTRBadge(summary.gstr1Filed)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getGSTRBadge(summary.gstr3bFiled)}
                          </TableCell>
                          <TableCell className="text-center">
                            {getFilingStatusBadge(summary.filingStatus)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
