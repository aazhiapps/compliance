import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GSTClient, CreateGSTClientRequest } from "@shared/gst";
import { toast } from "sonner";

interface ClientFormProps {
  onClose: () => void;
  onSuccess: (client: GSTClient) => void;
}

export default function ClientForm({ onClose, onSuccess }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateGSTClientRequest>({
    clientName: "",
    gstin: "",
    businessName: "",
    filingFrequency: "monthly",
    financialYearStart: new Date().getFullYear() + "-04-01",
    panNumber: "",
    address: "",
    state: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate GSTIN format (15 characters)
    if (formData.gstin.length !== 15) {
      toast.error("GSTIN must be 15 characters long");
      return;
    }

    // Validate PAN format (10 characters)
    if (formData.panNumber.length !== 10) {
      toast.error("PAN must be 10 characters long");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/gst/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("GST client created successfully");
        onSuccess(data.client);
      } else {
        toast.error(data.message || "Failed to create client");
      }
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("An error occurred while creating the client");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateGSTClientRequest, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New GST Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => handleChange("clientName", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gstin">GSTIN (15 characters) *</Label>
              <Input
                id="gstin"
                value={formData.gstin}
                onChange={(e) =>
                  handleChange("gstin", e.target.value.toUpperCase())
                }
                maxLength={15}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="panNumber">PAN Number (10 characters) *</Label>
              <Input
                id="panNumber"
                value={formData.panNumber}
                onChange={(e) =>
                  handleChange("panNumber", e.target.value.toUpperCase())
                }
                maxLength={10}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filingFrequency">Filing Frequency *</Label>
              <Select
                value={formData.filingFrequency}
                onValueChange={(value: "monthly" | "quarterly" | "annual") =>
                  handleChange("filingFrequency", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="financialYearStart">Financial Year Start *</Label>
              <Input
                id="financialYearStart"
                type="date"
                value={formData.financialYearStart}
                onChange={(e) =>
                  handleChange("financialYearStart", e.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange("state", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person *</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleChange("contactPerson", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleChange("contactEmail", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone *</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => handleChange("contactPhone", e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
