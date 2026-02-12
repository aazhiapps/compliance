import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GSTReturnFiling, UpdateGSTFilingRequest } from "@shared/gst";
import { toast } from "sonner";
import { Save, CheckCircle2, XCircle } from "lucide-react";

interface FilingStatusProps {
  clientId: string;
  month: string;
  financialYear: string;
}

export default function FilingStatus({
  clientId,
  month,
  financialYear,
}: FilingStatusProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateGSTFilingRequest>({
    clientId,
    month,
    financialYear,
    gstr1Filed: false,
    gstr1FiledDate: "",
    gstr1ARN: "",
    gstr3bFiled: false,
    gstr3bFiledDate: "",
    gstr3bARN: "",
    taxPaid: 0,
    lateFee: 0,
    interest: 0,
    filingStatus: "pending",
  });

  useEffect(() => {
    if (clientId && month) {
      loadFiling();
    }
  }, [clientId, month]);

  const loadFiling = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `/api/gst/filings/${clientId}?financialYear=${financialYear}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        const monthFiling = data.filings?.find((f: GSTReturnFiling) => f.month === month);
        if (monthFiling) {
          setFormData({
            clientId,
            month,
            financialYear,
            gstr1Filed: monthFiling.gstr1Filed,
            gstr1FiledDate: monthFiling.gstr1FiledDate || "",
            gstr1ARN: monthFiling.gstr1ARN || "",
            gstr3bFiled: monthFiling.gstr3bFiled,
            gstr3bFiledDate: monthFiling.gstr3bFiledDate || "",
            gstr3bARN: monthFiling.gstr3bARN || "",
            taxPaid: monthFiling.taxPaid,
            lateFee: monthFiling.lateFee,
            interest: monthFiling.interest,
            filingStatus: monthFiling.filingStatus,
          });
        }
      }
    } catch (error) {
      console.error("Error loading filing:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/gst/filings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("Filing status updated successfully");
      } else {
        toast.error(data.message || "Failed to update filing status");
      }
    } catch (error) {
      console.error("Error saving filing:", error);
      toast.error("An error occurred while saving the filing status");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof UpdateGSTFilingRequest, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading filing status...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>GST Filing Status</CardTitle>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* GSTR-1 Section */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">GSTR-1 (Outward Supplies)</h3>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="gstr1Filed"
                  checked={formData.gstr1Filed}
                  onCheckedChange={(checked) => handleChange("gstr1Filed", checked)}
                />
                <Label htmlFor="gstr1Filed">Filed</Label>
              </div>
            </div>

            {formData.gstr1Filed && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstr1FiledDate">Filing Date</Label>
                  <Input
                    id="gstr1FiledDate"
                    type="date"
                    value={formData.gstr1FiledDate}
                    onChange={(e) => handleChange("gstr1FiledDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstr1ARN">ARN Number</Label>
                  <Input
                    id="gstr1ARN"
                    value={formData.gstr1ARN}
                    onChange={(e) => handleChange("gstr1ARN", e.target.value)}
                    placeholder="Enter ARN"
                  />
                </div>
              </div>
            )}
          </div>

          {/* GSTR-3B Section */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">GSTR-3B (Summary Return)</h3>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="gstr3bFiled"
                  checked={formData.gstr3bFiled}
                  onCheckedChange={(checked) => handleChange("gstr3bFiled", checked)}
                />
                <Label htmlFor="gstr3bFiled">Filed</Label>
              </div>
            </div>

            {formData.gstr3bFiled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gstr3bFiledDate">Filing Date</Label>
                  <Input
                    id="gstr3bFiledDate"
                    type="date"
                    value={formData.gstr3bFiledDate}
                    onChange={(e) => handleChange("gstr3bFiledDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstr3bARN">ARN Number</Label>
                  <Input
                    id="gstr3bARN"
                    value={formData.gstr3bARN}
                    onChange={(e) => handleChange("gstr3bARN", e.target.value)}
                    placeholder="Enter ARN"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold">Payment Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxPaid">Tax Paid (₹)</Label>
                <Input
                  id="taxPaid"
                  type="number"
                  step="0.01"
                  value={formData.taxPaid}
                  onChange={(e) => handleChange("taxPaid", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lateFee">Late Fee (₹)</Label>
                <Input
                  id="lateFee"
                  type="number"
                  step="0.01"
                  value={formData.lateFee}
                  onChange={(e) => handleChange("lateFee", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interest">Interest (₹)</Label>
                <Input
                  id="interest"
                  type="number"
                  step="0.01"
                  value={formData.interest}
                  onChange={(e) => handleChange("interest", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Filing Status Summary */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Overall Filing Status:</span>
              <div className="flex items-center gap-2">
                {formData.gstr1Filed && formData.gstr3bFiled ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-600">Completed</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-600">Pending</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
