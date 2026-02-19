import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CSVExportButtonProps {
  endpoint: string;
  filename: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function CSVExportButton({
  endpoint,
  filename,
  label = "Export CSV",
  variant = "outline",
  size = "default",
  className,
}: CSVExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  const handleExport = async () => {
    if (!token) {
      toast({
        title: "Error",
        description: "You must be logged in to export data",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExporting(true);

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      // Get the CSV content
      const csvContent = await response.text();

      // Create a blob and download it
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Data exported successfully",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant={variant}
      size={size}
      className={className}
    >
      {isExporting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      {isExporting ? "Exporting..." : label}
    </Button>
  );
}
