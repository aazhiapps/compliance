import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Tag,
  Calendar,
  User,
  Version2,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * DocumentManager - UI component for managing GST documents
 * Features: Upload, download, versioning, tagging, search
 */

interface Document {
  id: string;
  documentId: string;
  fileName: string;
  fileUrl: string;
  documentType: string;
  version: number;
  fileSize: number;
  metadata?: Record<string, any>;
  tags?: string[];
  description?: string;
  createdAt: string;
  createdBy?: string;
}

interface DocumentManagerProps {
  clientId?: string;
  entityType?: "invoice_purchase" | "invoice_sales" | "filing" | "application";
  entityId?: string;
  readOnly?: boolean;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  clientId,
  entityType,
  entityId,
  readOnly = false,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [versionHistory, setVersionHistory] = useState<any>(null);
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();

  // Fetch documents
  useEffect(() => {
    fetchDocuments();
  }, [clientId, entityType, entityId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let url = "/api/documents";

      if (clientId && entityType && entityId) {
        url = `/api/documents/entity/${entityType}/${entityId}`;
      } else if (clientId) {
        url = `/api/documents/client/${clientId}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, documentType: string) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);
      if (entityType && entityId) {
        formData.append("linkedEntityType", entityType);
        formData.append("linkedEntityId", entityId);
      }
      if (clientId) {
        formData.append("clientId", clientId);
      }

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      setShowUploadDialog(false);
      fetchDocuments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const url = await fetch(`/api/documents/${document.documentId}/download-url`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      }).then((r) => r.json());

      window.open(url.url, "_blank");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (document: Document) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(`/api/documents/${document.documentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) throw new Error("Delete failed");

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      fetchDocuments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleAddTag = async (document: Document) => {
    if (!newTag.trim()) return;

    try {
      const response = await fetch(`/api/documents/${document.documentId}/tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ tags: [newTag] }),
      });

      if (!response.ok) throw new Error("Failed to add tag");

      toast({
        title: "Success",
        description: "Tag added successfully",
      });

      setNewTag("");
      fetchDocuments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add tag",
        variant: "destructive",
      });
    }
  };

  const handleViewVersions = async (document: Document) => {
    try {
      const response = await fetch(`/api/documents/${document.documentId}/versions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch versions");
      const data = await response.json();
      setVersionHistory(data);
      setShowVersionDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load version history",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Documents</h3>
        {!readOnly && (
          <Button onClick={() => setShowUploadDialog(true)} size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        )}
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No documents yet</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.documentId} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Document Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{doc.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(doc.fileSize)}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline">{doc.documentType}</Badge>
                    <Badge variant="secondary">v{doc.version}</Badge>
                    {doc.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Details */}
                  <div className="flex gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </div>
                    {doc.metadata?.amount && (
                      <div>Amount: ₹{doc.metadata.amount}</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    title="Download document"
                  >
                    <Download className="w-4 h-4" />
                  </Button>

                  {doc.version > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDocument(doc);
                        handleViewVersions(doc);
                      }}
                      title="View version history"
                    >
                      <Version2 className="w-4 h-4" />
                    </Button>
                  )}

                  {!readOnly && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(doc);
                          setShowDetailsDialog(true);
                        }}
                        title="View details"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(doc)}
                        title="Delete document"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a new document. Supported formats: PDF, images, documents
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select File</label>
              <input
                type="file"
                className="w-full border rounded-lg p-2"
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  if (file) {
                    handleFileUpload(file, "other");
                  }
                }}
                disabled={uploading}
              />
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">File Name</label>
                <p className="text-sm text-gray-600">{selectedDocument.fileName}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Type</label>
                <p className="text-sm text-gray-600">{selectedDocument.documentType}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Version</label>
                <p className="text-sm text-gray-600">v{selectedDocument.version}</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {selectedDocument.tags?.map((tag) => (
                    <Badge key={tag}>#{tag}</Badge>
                  ))}
                </div>
                {!readOnly && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add new tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="flex-1 border rounded-lg px-3 py-1 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddTag(selectedDocument)}
                    >
                      <Tag className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {selectedDocument.metadata && Object.keys(selectedDocument.metadata).length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Metadata</label>
                  <div className="text-sm space-y-1">
                    {Object.entries(selectedDocument.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              Document versions and changes
            </DialogDescription>
          </DialogHeader>

          {versionHistory && (
            <div className="space-y-3">
              <div className="text-sm mb-4">
                <p className="font-medium">Current Version: {versionHistory.currentVersion}</p>
              </div>

              {versionHistory.history && versionHistory.history.length > 0 ? (
                <div className="space-y-2">
                  {versionHistory.history.map((version: any, idx: number) => (
                    <Card key={idx} className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">
                            Version {version.versionNum}
                          </p>
                          <p className="text-sm text-gray-600">
                            {version.changes}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <p>{formatFileSize(version.fileSize)}</p>
                          <p>{new Date(version.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No version history</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentManager;
