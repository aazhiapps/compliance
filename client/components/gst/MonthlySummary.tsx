import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlyGSTSummary } from "@shared/gst";
import { TrendingUp, TrendingDown, DollarSign, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MonthlySummaryProps {
  clientId: string;
  month: string;
}

export default function MonthlySummary({ clientId, month }: MonthlySummaryProps) {
  const [summary, setSummary] = useState<MonthlyGSTSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientId && month) {
      loadSummary();
    }
  }, [clientId, month]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/gst/summary/${clientId}/${month}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Error loading summary:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading summary...</div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getFilingStatusBadge = () => {
    switch (summary.filingStatus) {
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Monthly GST Summary - {month}</CardTitle>
            {getFilingStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Purchases */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm">Total Purchases</span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalPurchases)}</div>
            </div>

            {/* Total Sales */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Total Sales</span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalSales)}</div>
            </div>

            {/* ITC Available */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">ITC Available</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.itcAvailable)}
              </div>
            </div>

            {/* Output Tax */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Output Tax</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary.outputTax)}
              </div>
            </div>

            {/* Net Tax Payable */}
            <div className="p-4 border rounded-lg bg-primary/5">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Net Tax Payable</span>
              </div>
              <div className={`text-2xl font-bold ${summary.netTaxPayable > 0 ? "text-red-600" : "text-green-600"}`}>
                {formatCurrency(summary.netTaxPayable)}
              </div>
            </div>
          </div>

          {/* Filing Status */}
          <div className="mt-6 flex gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">GSTR-1:</span>
              {summary.gstr1Filed ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Filed
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Pending
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">GSTR-3B:</span>
              {summary.gstr3bFiled ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Filed
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Pending
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
