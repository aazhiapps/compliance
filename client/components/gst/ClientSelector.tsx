import { GSTClient } from "@shared/gst";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";

interface ClientSelectorProps {
  clients: GSTClient[];
  selectedClient: GSTClient | null;
  onSelectClient: (client: GSTClient) => void;
  loading: boolean;
}

export default function ClientSelector({
  clients,
  selectedClient,
  onSelectClient,
  loading,
}: ClientSelectorProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-muted-foreground animate-pulse" />
            <span className="text-muted-foreground">Loading clients...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (clients.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Building2 className="w-5 h-5 text-muted-foreground" />
          <label className="font-medium whitespace-nowrap">Select Client:</label>
          <Select
            value={selectedClient?.id}
            onValueChange={(value) => {
              const client = clients.find((c) => c.id === value);
              if (client) onSelectClient(client);
            }}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Choose a GST client..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.clientName} ({client.gstin})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
