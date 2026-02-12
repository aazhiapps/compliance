import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Building2, FileText, TrendingUp, Calendar } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { GSTClient } from "@shared/gst";
import ClientSelector from "@/components/gst/ClientSelector";
import ClientForm from "@/components/gst/ClientForm";
import PurchaseInvoices from "@/components/gst/PurchaseInvoices";
import SalesInvoices from "@/components/gst/SalesInvoices";
import FilingStatus from "@/components/gst/FilingStatus";
import MonthlySummary from "@/components/gst/MonthlySummary";

export default function AdminGST() {
  const [selectedClient, setSelectedClient] = useState<GSTClient | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [showClientForm, setShowClientForm] = useState(false);
  const [clients, setClients] = useState<GSTClient[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize with current month
  useEffect(() => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(month);
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/gst/clients", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClientCreated = (client: GSTClient) => {
    setClients([...clients, client]);
    setSelectedClient(client);
    setShowClientForm(false);
  };

  const handleClientSelected = (client: GSTClient) => {
    setSelectedClient(client);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">GST Filing Tracking</h1>
            <p className="text-muted-foreground mt-1">
              Manage GST clients, track purchases, sales, and filing status
            </p>
          </div>
          <Button onClick={() => setShowClientForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add GST Client
          </Button>
        </div>

        {/* Client Form Dialog */}
        {showClientForm && (
          <ClientForm
            onClose={() => setShowClientForm(false)}
            onSuccess={handleClientCreated}
          />
        )}

        {/* Client Selection */}
        <ClientSelector
          clients={clients}
          selectedClient={selectedClient}
          onSelectClient={handleClientSelected}
          loading={loading}
        />

        {/* Content Area */}
        {!selectedClient ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Client Selected</h3>
              <p className="text-muted-foreground mb-4">
                Select a client from the dropdown above or create a new GST client to get started.
              </p>
              <Button onClick={() => setShowClientForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create GST Client
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Client Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>{selectedClient.clientName}</CardTitle>
                <CardDescription>
                  GSTIN: {selectedClient.gstin} | PAN: {selectedClient.panNumber} | 
                  Filing Frequency: {selectedClient.filingFrequency}
                </CardDescription>
              </CardHeader>
            </Card>

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

            {/* Monthly Summary */}
            {selectedMonth && (
              <MonthlySummary
                clientId={selectedClient.id}
                month={selectedMonth}
              />
            )}

            {/* Tabs for different sections */}
            <Tabs defaultValue="purchases" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="purchases">
                  <FileText className="w-4 h-4 mr-2" />
                  Purchases
                </TabsTrigger>
                <TabsTrigger value="sales">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Sales
                </TabsTrigger>
                <TabsTrigger value="filing">
                  <Building2 className="w-4 h-4 mr-2" />
                  Filing Status
                </TabsTrigger>
              </TabsList>

              <TabsContent value="purchases" className="space-y-4">
                <PurchaseInvoices
                  clientId={selectedClient.id}
                  clientName={selectedClient.clientName}
                  month={selectedMonth}
                  financialYear={selectedClient.financialYearStart.substring(0, 4)}
                />
              </TabsContent>

              <TabsContent value="sales" className="space-y-4">
                <SalesInvoices
                  clientId={selectedClient.id}
                  clientName={selectedClient.clientName}
                  month={selectedMonth}
                  financialYear={selectedClient.financialYearStart.substring(0, 4)}
                />
              </TabsContent>

              <TabsContent value="filing" className="space-y-4">
                <FilingStatus
                  clientId={selectedClient.id}
                  month={selectedMonth}
                  financialYear={selectedClient.financialYearStart.substring(0, 4)}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
