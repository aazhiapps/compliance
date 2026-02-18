export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: "user" | "admin" | "staff";
  businessType: "individual" | "startup" | "company" | "nonprofit";
  language: "en" | "hi";
  createdAt: string;
  isEmailVerified: boolean;
}

// Helper type aliases for clarity
export type Customer = User & { role: "user" };
export type StaffUser = User & { role: "staff"; department?: string };
export type AdminUser = User & { role: "admin" };

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  businessType: "individual" | "startup" | "company" | "nonprofit";
  language: "en" | "hi";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Application {
  id: string;
  userId: string;
  clientId?: string; // Reference to Client entity
  serviceId: number;
  serviceName: string;
  status:
    | "draft"
    | "submitted"
    | "under_review"
    | "query_raised"
    | "query_responded"
    | "approved"
    | "rejected"
    | "completed"
    | "monitoring";
  documents: Document[];
  createdAt: string;
  updatedAt: string;
  assignedStaff?: string;
  assignedStaffName?: string;
  paymentStatus: "pending" | "paid" | "refunded";
  paymentAmount: number;
  eta: string;
  internalNotes?: string;
}

export interface Document {
  id: string;
  applicationId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  status: "uploaded" | "verifying" | "approved" | "rejected";
  uploadedAt: string;
  remarks?: string;
}

export interface PaymentRequest {
  applicationId: string;
  amount: number;
  currency: string;
}

export interface PaymentResponse {
  orderId: string;
  amount: number;
  currency: string;
}
