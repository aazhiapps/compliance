/**
 * Service management types
 */

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  turnaround: string;
  category: string;
  documentsRequired: string[];
  active: boolean;
  applicationsCount?: number;
  revenue?: number;
  features: string[];
  requirements: string[];
  faqs: Array<{ question: string; answer: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequest {
  name: string;
  description: string;
  price: number;
  turnaround: string;
  category: string;
  documentsRequired: string[];
  active: boolean;
  features: string[];
  requirements: string[];
  faqs: Array<{ question: string; answer: string }>;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  price?: number;
  turnaround?: string;
  category?: string;
  documentsRequired?: string[];
  active?: boolean;
  features?: string[];
  requirements?: string[];
  faqs?: Array<{ question: string; answer: string }>;
}

export interface ServiceResponse {
  success: boolean;
  message?: string;
  service?: Service;
  services?: Service[];
}
