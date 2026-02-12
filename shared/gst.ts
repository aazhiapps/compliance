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
  gstr3bFiled: boolean;
  gstr3bFiledDate?: string; // YYYY-MM-DD
  gstr3bARN?: string;
  taxPaid: number;
  lateFee: number;
  interest: number;
  filingStatus: "pending" | "filed" | "late";
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
