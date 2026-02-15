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

/**
 * Hierarchical document organization types for admin view
 * Supports Users -> Services -> Year/Month -> Documents flow
 */
export interface MonthlyDocuments {
  month: number; // 1-12
  monthName: string; // e.g., "January"
  documents: Document[];
}

export interface YearlyDocuments {
  year: number; // e.g., 2024
  months: MonthlyDocuments[];
}

export interface ServiceDocumentsHierarchical {
  serviceId: number;
  serviceName: string;
  years: YearlyDocuments[];
}

export interface UserDocumentsHierarchical {
  userId: string;
  userName: string;
  userEmail: string;
  services: ServiceDocumentsHierarchical[];
}

export interface AdminDocumentsResponse {
  success: boolean;
  message?: string;
  users: UserDocumentsHierarchical[];
}

/**
 * Payment Management types
 */
export interface PaymentRecord {
  id: string;
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  service: string;
  amount: number;
  status: "pending" | "completed" | "failed" | "refunded";
  method: "razorpay" | "bank_transfer" | "cash" | "cheque" | "manual";
  transactionId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  date: string;
  notes?: string;
  recordedBy?: string; // User ID who recorded the payment (for manual entries)
  recordedAt?: string; // Timestamp when payment was recorded
}

export interface RecordPaymentRequest {
  applicationId: string;
  amount: number;
  method: "razorpay" | "bank_transfer" | "cash" | "cheque" | "manual";
  transactionId: string;
  notes?: string;
  date?: string; // Optional, defaults to now
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  payment?: PaymentRecord;
}

export interface PaymentsListResponse {
  success: boolean;
  message?: string;
  payments: PaymentRecord[];
  total: number;
}

/**
 * Compliance Management types
 */
export interface CustomerCompliance {
  customerId: string;
  customerName: string;
  customerEmail: string;
  complianceStatus: "compliant" | "pending" | "at_risk" | "non_compliant";
  process: string;
  lastUpdated: string;
  applicationId?: string;
}

/**
 * Reports Management types
 */
export type ReportType =
  | "Financial Statements"
  | "Income Tax Computation"
  | "GST Summary"
  | "Tax Audit Summary"
  | "ROC Filing Summary";

export type ReportStatus = "draft" | "final" | "filed";

export type ExportFormat = "csv" | "pdf";

export interface ExportLog {
  exportedBy: string; // User ID
  exportedByName?: string; // User name for display
  format: ExportFormat;
  exportedAt: string;
}

export interface Report {
  id: string;
  clientId: string;
  clientName: string;
  financialYear: string; // e.g., "2023-24" (April to March)
  reportType: ReportType;
  status: ReportStatus;
  preparedBy: string; // User ID
  preparedByName?: string; // User name for display
  generatedOn: string;
  data: Record<string, any>; // Flexible data structure for report content
  exportLogs: ExportLog[];
}

export interface ReportFilters {
  clientId?: string;
  financialYear?: string;
  reportType?: ReportType;
  status?: ReportStatus;
  page?: number;
  limit?: number;
}

export interface ReportResponse {
  success: boolean;
  message?: string;
  report?: Report;
}

export interface ReportsListResponse {
  success: boolean;
  message?: string;
  reports: Report[];
  total: number;
  page: number;
  limit: number;
}

export interface ExportResponse {
  success: boolean;
  message?: string;
  data?: string | Buffer; // CSV as string, PDF as Buffer
  filename?: string;
}
