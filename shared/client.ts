/**
 * Shared types for Client entity
 * Client is the master entity that can have multiple service applications
 */

export type ClientStatus = "active" | "inactive" | "suspended";

export type DocumentType =
  | "pan_card"
  | "aadhaar_card"
  | "gst_certificate"
  | "incorporation_certificate"
  | "address_proof"
  | "bank_statement"
  | "director_id"
  | "moa_aoa"
  | "other";

export type VerificationStatus = "pending" | "verified" | "rejected" | "expired";

/**
 * Master Client entity
 * Represents a client who can apply for multiple services
 */
export interface Client {
  id: string;
  userId: string; // Reference to User who created this client
  clientName: string; // Business/Individual name
  clientType: "individual" | "proprietorship" | "partnership" | "llp" | "company" | "trust";
  
  // KYC Information
  panNumber?: string;
  aadhaarNumber?: string;
  gstin?: string;
  
  // Contact Information
  email: string;
  phone: string;
  alternatePhone?: string;
  
  // Address
  address: string;
  city: string;
  state: string;
  pincode: string;
  
  // Business Information (for companies)
  businessName?: string;
  incorporationDate?: string;
  cin?: string; // Corporate Identification Number
  
  // Status
  status: ClientStatus;
  kycStatus: VerificationStatus;
  
  // Risk Scoring (PHASE 1)
  riskScore?: number; // 0-100
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskFactors?: string[];
  lastRiskAssessment?: string;
  
  // Compliance Metrics (PHASE 1)
  missedComplianceCount?: number;
  rejectedApplicationsCount?: number;
  pendingQueriesCount?: number;
  overdueFilingsCount?: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string; // User ID
  lastModifiedBy?: string;
}

/**
 * Reusable Document with enhanced metadata
 */
export interface ClientDocument {
  id: string;
  clientId: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  
  // Verification
  verificationStatus: VerificationStatus;
  verifiedBy?: string; // User ID of verifier
  verifiedAt?: string;
  
  // Validity
  hasExpiry: boolean;
  expiryDate?: string;
  
  // Reusability
  isReusable: boolean; // Can be used across multiple applications
  usedInApplications: string[]; // Application IDs where this document is used
  
  // Audit
  uploadedAt: string;
  uploadedBy: string; // User ID
  remarks?: string;
}

/**
 * Client creation request
 */
export interface CreateClientRequest {
  clientName: string;
  clientType: "individual" | "proprietorship" | "partnership" | "llp" | "company" | "trust";
  panNumber?: string;
  aadhaarNumber?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  businessName?: string;
  incorporationDate?: string;
  cin?: string;
}

/**
 * Client update request
 */
export interface UpdateClientRequest {
  clientName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  status?: ClientStatus;
  kycStatus?: VerificationStatus;
}

/**
 * Client with service summary
 */
export interface ClientWithServices extends Client {
  services: ServiceSummary[];
  totalApplications: number;
  activeApplications: number;
  completedApplications: number;
  totalPayments: number;
  pendingDocuments: number;
}

export interface ServiceSummary {
  serviceId: number;
  serviceName: string;
  applicationId: string;
  status: string;
  createdAt: string;
  paymentStatus: string;
}

/**
 * API Response types
 */
export interface ClientResponse {
  success: boolean;
  message?: string;
  client?: Client;
}

export interface ClientsListResponse {
  success: boolean;
  message?: string;
  clients: Client[];
  total: number;
}

export interface ClientWithServicesResponse {
  success: boolean;
  message?: string;
  client?: ClientWithServices;
}

/**
 * Client dashboard data
 */
export interface ClientDashboard {
  client: Client;
  services: ServiceApplication[];
  documents: ClientDocument[];
  payments: PaymentSummary[];
  complianceAlerts: ComplianceAlert[];
}

export interface ServiceApplication {
  applicationId: string;
  serviceId: number;
  serviceName: string;
  status: ApplicationStatus;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  eta: string;
  assignedStaff?: string;
  assignedStaffName?: string;
}

export interface PaymentSummary {
  paymentId: string;
  applicationId: string;
  serviceName: string;
  amount: number;
  status: string;
  date: string;
  method: string;
}

export interface ComplianceAlert {
  id: string;
  type: "document_expiry" | "payment_due" | "filing_due" | "verification_pending";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  dueDate?: string;
  relatedEntity?: string; // Application ID or Document ID
  createdAt: string;
}

/**
 * Application status enum with state machine support
 * PHASE 1: Enhanced with new statuses for enterprise compliance
 */
export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "query_raised"
  | "query_responded"
  | "resubmitted" // PHASE 1: After query response
  | "approved"
  | "rejected"
  | "completed"
  | "monitoring"
  | "active_monitoring" // PHASE 1: Ongoing compliance monitoring
  | "suspended"; // PHASE 1: Temporarily suspended

/**
 * Valid status transitions
 * PHASE 1: Updated state machine with new transitions
 */
export const APPLICATION_STATUS_TRANSITIONS: Record<
  ApplicationStatus,
  ApplicationStatus[]
> = {
  draft: ["submitted"],
  submitted: ["under_review", "rejected"],
  under_review: ["query_raised", "approved", "rejected"],
  query_raised: ["query_responded", "rejected"],
  query_responded: ["resubmitted", "rejected"],
  resubmitted: ["under_review", "approved", "rejected"],
  approved: ["completed", "monitoring", "active_monitoring"],
  rejected: ["resubmitted"], // Can resubmit after rejection
  completed: ["active_monitoring"],
  monitoring: ["active_monitoring", "completed", "suspended"],
  active_monitoring: ["suspended", "completed"],
  suspended: ["active_monitoring", "rejected"], // Can resume or close
};

/**
 * Validate status transition
 */
export function isValidStatusTransition(
  currentStatus: ApplicationStatus,
  newStatus: ApplicationStatus
): boolean {
  const allowedTransitions = APPLICATION_STATUS_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}
