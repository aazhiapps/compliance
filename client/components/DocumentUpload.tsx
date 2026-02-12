import { useState, useRef } from "react";
import { Upload, X, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  status: "uploading" | "success" | "error";
  error?: string;
}

interface DocumentUploadProps {
  onDocumentsChange?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  acceptedFormats?: string[];
  maxFileSize?: number; // in MB
  applicationId?: string; // Optional: if provided, will upload to server immediately
}

export default function DocumentUpload({
  onDocumentsChange,
  maxFiles = 5,
  acceptedFormats = ["pdf", "jpg", "jpeg", "png"],
  maxFileSize = 10,
  applicationId,
}: DocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFileToServer = async (uploadedFile: UploadedFile, appId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const fileUrl = reader.result as string;
        
        const response = await fetch(`/api/applications/${appId}/documents`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            applicationId: appId,
            fileName: uploadedFile.file.name,
            fileType: uploadedFile.file.type,
            fileUrl: fileUrl,
          }),
        });

        if (response.ok) {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === uploadedFile.id ? { ...f, status: "success" } : f
            )
          );
        } else {
          throw new Error("Upload failed");
        }
      };
      
      reader.onerror = () => {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? { ...f, status: "error", error: "Failed to read file" }
              : f
          )
        );
      };
      
      reader.readAsDataURL(uploadedFile.file);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? { ...f, status: "error", error: "Upload failed" }
            : f
        )
      );
    }
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return {
        valid: false,
        error: `File size exceeds ${maxFileSize}MB limit`,
      };
    }

    // Check file format
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!fileExtension || !acceptedFormats.includes(fileExtension)) {
      return {
        valid: false,
        error: `File format not supported. Accepted: ${acceptedFormats.join(", ")}`,
      };
    }

    return { valid: true };
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateFile(file);

      if (uploadedFiles.length + newFiles.length >= maxFiles) {
        break;
      }

      const uploadedFile: UploadedFile = {
        id: `file_${Date.now()}_${i}`,
        file,
        status: "uploading",
      };

      if (!validation.valid) {
        uploadedFile.status = "error";
        uploadedFile.error = validation.error;
      } else {
        // Create preview for images
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const fileToUpdate = newFiles.find((f) => f.id === uploadedFile.id);
            if (fileToUpdate && e.target?.result) {
              fileToUpdate.preview = e.target.result as string;
            }
          };
          reader.readAsDataURL(file);
        }

        // Upload to server if applicationId is provided
        if (applicationId) {
          uploadFileToServer(uploadedFile, applicationId);
        } else {
          // Just simulate success for local preview
          setTimeout(() => {
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id ? { ...f, status: "success" } : f
              )
            );
          }, 1500);
        }
      }

      newFiles.push(uploadedFile);
    }

    const updatedFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(updatedFiles);
    onDocumentsChange?.(updatedFiles);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string) => {
    const updated = uploadedFiles.filter((f) => f.id !== id);
    setUploadedFiles(updated);
    onDocumentsChange?.(updated);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-gray-50 hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">Drop your documents here</h3>
          <p className="text-muted-foreground text-sm mb-4">
            or{" "}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-primary hover:text-primary/80 font-medium"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-muted-foreground">
            Supported formats: {acceptedFormats.join(", ").toUpperCase()} • Max size: {maxFileSize}MB
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFormats.map((f) => `.${f}`).join(",")}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Uploaded Files ({uploadedFiles.length}/{maxFiles})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uploadedFiles.map((uploadedFile) => (
              <Card key={uploadedFile.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Preview */}
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {uploadedFile.preview ? (
                        <img
                          src={uploadedFile.preview}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>

                      {/* Status */}
                      <div className="mt-2 flex items-center gap-2">
                        {uploadedFile.status === "uploading" && (
                          <>
                            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-primary">Uploading...</span>
                          </>
                        )}
                        {uploadedFile.status === "success" && (
                          <>
                            <CheckCircle className="w-4 h-4 text-success" />
                            <span className="text-xs text-success">Uploaded</span>
                          </>
                        )}
                        {uploadedFile.status === "error" && (
                          <>
                            <AlertCircle className="w-4 h-4 text-destructive" />
                            <span className="text-xs text-destructive">
                              {uploadedFile.error || "Failed"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFile(uploadedFile.id)}
                      className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Remove file"
                    >
                      <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {uploadedFiles.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            ✓ {uploadedFiles.filter((f) => f.status === "success").length} file
            {uploadedFiles.filter((f) => f.status === "success").length !== 1 ? "s" : ""} uploaded successfully
          </p>
        </div>
      )}
    </div>
  );
}
