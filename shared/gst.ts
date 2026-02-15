/**
 * GST Filing Tracking Module Types
 * Shared types between client and server for GST management
 */

// Client information with GST details
export interface GSTClient {
  id: string;
  userId: string;
  clientName: string;
  gstin: string;
  businessName: string;
  filingFrequency: "monthly" | "quarterly" | "annual";
  financialYearStart: string; // YYYY-MM-DD
  panNumber: string;
  address: string;
  state: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  status: "active" | "inactive"; // Client status for filtering reminders
  deactivatedAt?: string; // When client was deactivated
  assignedStaff?: string[]; // Staff user IDs assigned to this client
  createdAt: string;
  updatedAt: string;
}

// Purchase invoice details
export interface PurchaseInvoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  vendorName: string;
  vendorGSTIN: string;
  invoiceDate: string; // YYYY-MM-DD
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  documents: string[]; // File paths
  month: string; // YYYY-MM
  financialYear: string; // e.g., "2024-25"
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Sales invoice details
export interface SalesInvoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  customerName: string;
  customerGSTIN: string;
  invoiceDate: string; // YYYY-MM-DD
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  documents: string[]; // File paths
  month: string; // YYYY-MM
  financialYear: string; // e.g., "2024-25"
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// GST Return Filing details
export interface GSTReturnFiling {
  id: string;
  clientId: string;
  month: string; // YYYY-MM
  financialYear: string; // e.g., "2024-25"
  gstr1Filed: boolean;
  gstr1FiledDate?: string; // YYYY-MM-DD
  gstr1ARN?: string;
  gstr1DueDate?: string; // YYYY-MM-DD (calculated based on filing frequency)
  gstr3bFiled: boolean;
  gstr3bFiledDate?: string; // YYYY-MM-DD
  gstr3bARN?: string;
  gstr3bDueDate?: string; // YYYY-MM-DD (calculated based on filing frequency)
  taxPaid: number;
  lateFee: number;
  lateFeeCalculated: boolean; // Whether late fee was auto-calculated
  interest: number;
  interestCalculated: boolean; // Whether interest was auto-calculated
  filingStatus: "pending" | "filed" | "late" | "overdue";
  isLocked: boolean; // Prevents editing invoices after filing
  lockedAt?: string; // When the month was locked
  lockedBy?: string; // User who locked the month
  returnDocuments: string[]; // Filed return PDFs
  challanDocuments: string[]; // Challan copies
  workingSheets: string[]; // Working sheets
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

// Monthly GST summary
export interface MonthlyGSTSummary {
  clientId: string;
  clientName: string;
  month: string; // YYYY-MM
  financialYear: string;
  totalPurchases: number;
  totalSales: number;
  itcAvailable: number;
  outputTax: number;
  netTaxPayable: number;
  filingStatus: "pending" | "filed" | "late";
  gstr1Filed: boolean;
  gstr3bFiled: boolean;
}

// API Request/Response types
export interface CreateGSTClientRequest {
  clientName: string;
  gstin: string;
  businessName: string;
  filingFrequency: "monthly" | "quarterly" | "annual";
  financialYearStart: string;
  panNumber: string;
  address: string;
  state: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  status?: "active" | "inactive"; // Optional, defaults to active
  assignedStaff?: string[]; // Optional staff assignment
}

export interface CreatePurchaseInvoiceRequest {
  clientId: string;
  invoiceNumber: string;
  vendorName: string;
  vendorGSTIN: string;
  invoiceDate: string;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  month: string;
  financialYear: string;
}

export interface CreateSalesInvoiceRequest {
  clientId: string;
  invoiceNumber: string;
  customerName: string;
  customerGSTIN: string;
  invoiceDate: string;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  month: string;
  financialYear: string;
}

export interface UpdateGSTFilingRequest {
  clientId: string;
  month: string;
  financialYear: string;
  gstr1Filed?: boolean;
  gstr1FiledDate?: string;
  gstr1ARN?: string;
  gstr3bFiled?: boolean;
  gstr3bFiledDate?: string;
  gstr3bARN?: string;
  taxPaid?: number;
  lateFee?: number;
  interest?: number;
  filingStatus?: "pending" | "filed" | "late";
}

export interface GSTClientResponse {
  success: boolean;
  message?: string;
  client?: GSTClient;
  clients?: GSTClient[];
}

export interface PurchaseInvoiceResponse {
  success: boolean;
  message?: string;
  invoice?: PurchaseInvoice;
  invoices?: PurchaseInvoice[];
}

export interface SalesInvoiceResponse {
  success: boolean;
  message?: string;
  invoice?: SalesInvoice;
  invoices?: SalesInvoice[];
}

export interface GSTFilingResponse {
  success: boolean;
  message?: string;
  filing?: GSTReturnFiling;
  filings?: GSTReturnFiling[];
}

export interface MonthlySummaryResponse {
  success: boolean;
  message?: string;
  summary?: MonthlyGSTSummary;
  summaries?: MonthlyGSTSummary[];
}

export interface FileUploadResponse {
  success: boolean;
  message?: string;
  filePath?: string;
  fileName?: string;
}

// Audit log for tracking changes
export interface GSTAuditLog {
  id: string;
  entityType: "client" | "purchase" | "sales" | "filing";
  entityId: string;
  action: "create" | "update" | "delete" | "status_change";
  changes: Record<string, any>;
  performedBy: string;
  performedAt: string;
  ipAddress?: string;
}

// GST Filing Reminder/Notification
export interface GSTReminder {
  id: string;
  clientId: string;
  clientName: string;
  month: string; // YYYY-MM
  returnType: "GSTR-1" | "GSTR-3B" | "GSTR-9";
  dueDate: string; // YYYY-MM-DD
  reminderDate: string; // YYYY-MM-DD (typically 5 days before)
  status: "pending" | "sent" | "overdue";
  notificationChannels: ("email" | "sms" | "dashboard")[];
  sentAt?: string;
  createdAt: string;
}

// Notification record
export interface GSTNotification {
  id: string;
  clientId: string;
  userId: string;
  type: "due_date_reminder" | "overdue_alert" | "filing_success" | "escalation";
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  isRead: boolean;
  readAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Client-wise filing status report
export interface ClientFilingStatusReport {
  clientId: string;
  clientName: string;
  gstin: string;
  status: "active" | "inactive";
  filingFrequency: "monthly" | "quarterly" | "annual";
  currentPeriod: string; // Current month/quarter/year being tracked
  lastFiledMonth?: string; // Last successfully filed month
  pendingMonths: string[]; // Months with pending filings
  overdueMonths: string[]; // Months past due date
  totalPendingAmount: number; // Total tax + late fees + interest
  complianceScore: number; // 0-100, based on timely filings
}

// Annual compliance summary
export interface AnnualComplianceSummary {
  clientId: string;
  clientName: string;
  financialYear: string; // e.g., "2024-25"
  totalMonthsTracked: number;
  monthsFiled: number;
  monthsPending: number;
  monthsLate: number;
  totalSales: number;
  totalPurchases: number;
  totalTaxPaid: number;
  totalLateFees: number;
  totalInterest: number;
  complianceRate: number; // Percentage of on-time filings
  gstr9Filed: boolean; // Annual return
  gstr9FiledDate?: string;
  gstr9ARN?: string;
}

// Validation utilities
export interface GSTValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Due date calculation result
export interface DueDateInfo {
  month: string; // YYYY-MM
  filingFrequency: "monthly" | "quarterly" | "annual";
  gstr1DueDate: string; // YYYY-MM-DD
  gstr3bDueDate: string; // YYYY-MM-DD
  gstr9DueDate?: string; // For annual returns
  isQuarterEnd: boolean;
  quarterEndMonth?: string;
  reminderDate: string; // 5 days before GSTR-3B due
}

// Staff assignment
export interface StaffAssignment {
  id: string;
  staffUserId: string;
  staffName: string;
  clientIds: string[];
  assignedAt: string;
  assignedBy: string;
  permissions: ("view" | "edit" | "file" | "upload")[];
}

// Report filters
export interface GSTReportFilter {
  clientIds?: string[];
  startMonth?: string; // YYYY-MM
  endMonth?: string; // YYYY-MM
  financialYear?: string;
  status?: ("pending" | "filed" | "late" | "overdue")[];
  filingFrequency?: ("monthly" | "quarterly" | "annual")[];
}
