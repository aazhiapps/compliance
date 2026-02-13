import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PurchaseInvoice, SalesInvoice } from "@shared/gst";
import { toast } from "sonner";
import { X } from "lucide-react";

interface InvoiceFormProps {
  type: "purchase" | "sales";
  clientId: string;
  month: string;
  financialYear: string;
  invoice?: PurchaseInvoice | SalesInvoice | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InvoiceForm({
  type,
  clientId,
  month,
  financialYear,
  invoice,
  onClose,
  onSuccess,
}: InvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    partyName: "",
    partyGSTIN: "",
    invoiceDate: "",
    taxableAmount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
  });
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);

  useEffect(() => {
    if (invoice) {
      if (type === "purchase") {
        const p = invoice as PurchaseInvoice;
        setFormData({
          invoiceNumber: p.invoiceNumber,
          partyName: p.vendorName,
          partyGSTIN: p.vendorGSTIN,
          invoiceDate: p.invoiceDate,
          taxableAmount: p.taxableAmount,
          cgst: p.cgst,
          sgst: p.sgst,
          igst: p.igst,
        });
        setAttachedFiles(p.documents || []);
      } else {
        const s = invoice as SalesInvoice;
        setFormData({
          invoiceNumber: s.invoiceNumber,
          partyName: s.customerName,
          partyGSTIN: s.customerGSTIN,
          invoiceDate: s.invoiceDate,
          taxableAmount: s.taxableAmount,
          cgst: s.cgst,
          sgst: s.sgst,
          igst: s.igst,
        });
        setAttachedFiles(s.documents || []);
      }
    }
  }, [invoice, type]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !invoice) {
      if (!invoice) {
        toast.error("Please save the invoice first before uploading attachments");
      }
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    try {
      setUploadingFile(true);

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileData = event.target?.result;
        if (!fileData) return;

        const token = localStorage.getItem("authToken");
        const response = await fetch("/api/gst/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type,
            entityId: invoice.id,
            clientId,
            fileData,
            fileName: file.name,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setAttachedFiles([...attachedFiles, data.filePath]);
          toast.success("File uploaded successfully");
        } else {
          toast.error(data.message || "Failed to upload file");
        }
        setUploadingFile(false);
      };

      reader.onerror = () => {
        toast.error("Failed to read file");
        setUploadingFile(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("An error occurred while uploading the file");
      setUploadingFile(false);
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    if (!invoice || !confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/gst/documents", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filePath,
          entityId: invoice.id,
          type,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAttachedFiles(attachedFiles.filter((f) => f !== filePath));
        toast.success("File deleted successfully");
      } else {
        toast.error(data.message || "Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("An error occurred while deleting the file");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const apiData =
      type === "purchase"
        ? {
            clientId,
            invoiceNumber: formData.invoiceNumber,
            vendorName: formData.partyName,
            vendorGSTIN: formData.partyGSTIN,
            invoiceDate: formData.invoiceDate,
            taxableAmount: formData.taxableAmount,
            cgst: formData.cgst,
            sgst: formData.sgst,
            igst: formData.igst,
            month,
            financialYear,
          }
        : {
            clientId,
            invoiceNumber: formData.invoiceNumber,
            customerName: formData.partyName,
            customerGSTIN: formData.partyGSTIN,
            invoiceDate: formData.invoiceDate,
            taxableAmount: formData.taxableAmount,
            cgst: formData.cgst,
            sgst: formData.sgst,
            igst: formData.igst,
            month,
            financialYear,
          };

    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const endpoint = invoice
        ? `/api/gst/${type === "purchase" ? "purchases" : "sales"}/${invoice.id}`
        : `/api/gst/${type === "purchase" ? "purchases" : "sales"}`;
      
      const response = await fetch(endpoint, {
        method: invoice ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(
          `${type === "purchase" ? "Purchase" : "Sales"} invoice ${invoice ? "updated" : "created"} successfully`
        );
        onSuccess();
      } else {
        toast.error(data.message || "Failed to save invoice");
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("An error occurred while saving the invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  const calculateTotal = () => {
    return (
      formData.taxableAmount +
      formData.cgst +
      formData.sgst +
      formData.igst
    );
  };

  const getFileName = (filePath: string) => {
    return filePath.split("/").pop() || filePath;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {invoice ? "Edit" : "Add"} {type === "purchase" ? "Purchase" : "Sales"} Invoice
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number *</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => handleChange("invoiceNumber", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Invoice Date *</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => handleChange("invoiceDate", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="partyName">
                {type === "purchase" ? "Vendor" : "Customer"} Name *
              </Label>
              <Input
                id="partyName"
                value={formData.partyName}
                onChange={(e) => handleChange("partyName", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="partyGSTIN">
                {type === "purchase" ? "Vendor" : "Customer"} GSTIN *
              </Label>
              <Input
                id="partyGSTIN"
                value={formData.partyGSTIN}
                onChange={(e) =>
                  handleChange("partyGSTIN", e.target.value.toUpperCase())
                }
                maxLength={15}
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="taxableAmount">Taxable Amount (₹) *</Label>
              <Input
                id="taxableAmount"
                type="number"
                step="0.01"
                value={formData.taxableAmount}
                onChange={(e) =>
                  handleChange("taxableAmount", parseFloat(e.target.value) || 0)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cgst">CGST (₹)</Label>
              <Input
                id="cgst"
                type="number"
                step="0.01"
                value={formData.cgst}
                onChange={(e) =>
                  handleChange("cgst", parseFloat(e.target.value) || 0)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sgst">SGST (₹)</Label>
              <Input
                id="sgst"
                type="number"
                step="0.01"
                value={formData.sgst}
                onChange={(e) =>
                  handleChange("sgst", parseFloat(e.target.value) || 0)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="igst">IGST (₹)</Label>
              <Input
                id="igst"
                type="number"
                step="0.01"
                value={formData.igst}
                onChange={(e) =>
                  handleChange("igst", parseFloat(e.target.value) || 0)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Total Amount</Label>
              <div className="text-2xl font-bold">
                ₹{calculateTotal().toFixed(2)}
              </div>
            </div>
          </div>

          {/* File Attachments Section */}
          <div className="space-y-2 border-t pt-4">
            <Label>Attachments</Label>
            {invoice ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    className="flex-1"
                  />
                  {uploadingFile && (
                    <span className="text-sm text-muted-foreground">Uploading...</span>
                  )}
                </div>
                {attachedFiles.length > 0 && (
                  <div className="space-y-1">
                    {attachedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                      >
                        <span className="truncate flex-1">{getFileName(file)}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteFile(file)}
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Save the invoice first to upload attachments
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : invoice ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
