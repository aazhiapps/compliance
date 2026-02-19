import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Loader2, FileText, Download, AlertCircle } from "lucide-react";
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CSVImportButtonProps {
  endpoint: string;
  templateEndpoint: string;
  entityType: string;
  label?: string;
  onImportSuccess?: () => void;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  errors?: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
  note?: string;
}

export function CSVImportButton({
  endpoint,
  templateEndpoint,
  entityType,
  label = "Import CSV",
  onImportSuccess,
  variant = "outline",
  size = "default",
  className,
}: CSVImportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        toast({
          title: "Invalid File",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!token) return;

    try {
      const response = await fetch(templateEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download template");
      }

      const csvContent = await response.text();
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `${entityType}_template.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Template downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading template:", error);
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !token) return;

    try {
      setIsUploading(true);
      setImportResult(null);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result: ImportResult = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to import data");
      }

      setImportResult(result);

      if (result.success && result.summary.failed === 0) {
        toast({
          title: "Success",
          description: result.message,
        });
        onImportSuccess?.();
      } else if (result.success && result.summary.failed > 0) {
        toast({
          title: "Partial Success",
          description: `${result.summary.successful} records valid, ${result.summary.failed} failed`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error importing data:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to import data",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Upload className="w-4 h-4 mr-2" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import {entityType}</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import {entityType.toLowerCase()} data. Download
            the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Need a template?</p>
                <p className="text-xs text-muted-foreground">
                  Download a CSV template with sample data
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select CSV File</label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
              />
            </div>
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Import Result */}
          {importResult && (
            <div className="space-y-3">
              <Alert
                variant={
                  importResult.summary.failed === 0 ? "default" : "destructive"
                }
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">{importResult.message}</p>
                    <div className="text-sm space-y-1">
                      <p>Total Records: {importResult.summary.total}</p>
                      <p className="text-green-600">
                        Valid: {importResult.summary.successful}
                      </p>
                      <p className="text-red-600">
                        Invalid: {importResult.summary.failed}
                      </p>
                    </div>
                    {importResult.note && (
                      <p className="text-xs mt-2 text-yellow-600">
                        Note: {importResult.note}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Error Details */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="max-h-48 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  <p className="text-sm font-medium mb-2">
                    Validation Errors (showing first 20):
                  </p>
                  <ul className="text-xs space-y-1">
                    {importResult.errors.slice(0, 20).map((error, idx) => (
                      <li key={idx} className="text-red-600">
                        Row {error.row}: {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
