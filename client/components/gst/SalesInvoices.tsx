import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { SalesInvoice } from "@shared/gst";
import { toast } from "sonner";
import InvoiceForm from "./InvoiceForm";

interface SalesInvoicesProps {
  clientId: string;
  clientName: string;
  month: string;
  financialYear: string;
}

export default function SalesInvoices({
  clientId,
  
  month,
  financialYear,
}: SalesInvoicesProps) {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(null);

  useEffect(() => {
    if (clientId && month) {
      loadInvoices();
    }
  }, [clientId, month]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/gst/sales/${clientId}?month=${month}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error("Error loading invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/gst/sales/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Invoice deleted successfully");
        loadInvoices();
      } else {
        toast.error(data.message || "Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("An error occurred while deleting the invoice");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalTax = invoices.reduce((sum, inv) => sum + inv.cgst + inv.sgst + inv.igst, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Sales Invoices</CardTitle>
            <Button onClick={() => { setEditingInvoice(null); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Sale
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sales invoices for this month
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{invoice.customerName}</div>
                      <div className="text-sm text-muted-foreground">
                        Invoice: {invoice.invoiceNumber} | Date: {invoice.invoiceDate} | 
                        GSTIN: {invoice.customerGSTIN}
                      </div>
                      <div className="text-sm mt-1">
                        Taxable: {formatCurrency(invoice.taxableAmount)} | 
                        CGST: {formatCurrency(invoice.cgst)} | 
                        SGST: {formatCurrency(invoice.sgst)} | 
                        IGST: {formatCurrency(invoice.igst)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-4">
                        <div className="font-bold">{formatCurrency(invoice.totalAmount)}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEditingInvoice(invoice); setShowForm(true); }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(invoice.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Sales:</span>
                  <span className="font-bold text-lg">{formatCurrency(totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium">Total Output Tax:</span>
                  <span className="font-bold text-lg text-orange-600">
                    {formatCurrency(totalTax)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <InvoiceForm
          type="sales"
          clientId={clientId}
          month={month}
          financialYear={financialYear}
          invoice={editingInvoice}
          onClose={() => { setShowForm(false); setEditingInvoice(null); }}
          onSuccess={() => { setShowForm(false); setEditingInvoice(null); loadInvoices(); }}
        />
      )}
    </div>
  );
}
