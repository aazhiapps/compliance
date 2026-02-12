/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Document types for service-based document management
 */
export interface Document {
  id: string;
  applicationId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  status: "uploaded" | "verifying" | "approved" | "rejected";
  uploadedAt: string;
}

export interface ServiceDocuments {
  serviceId: number;
  serviceName: string;
  documents: Document[];
  applicationIds: string[];
}

export interface UserDocumentsResponse {
  success: boolean;
  message?: string;
  services: ServiceDocuments[];
}
