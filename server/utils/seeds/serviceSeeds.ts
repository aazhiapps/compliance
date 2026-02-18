import { Service } from "@shared/service";

/**
 * Initial services for seeding the database
 */
export const initialServices: Omit<
  Service,
  "id" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "GST Registration",
    description: "Register for Goods and Services Tax",
    price: 2999,
    turnaround: "5-7 days",
    category: "Tax",
    documentsRequired: ["PAN Card", "Aadhar Card", "Business Address Proof"],
    active: true,
    applicationsCount: 45,
    revenue: 134955,
    features: [
      "Fast online registration",
      "GSTIN certificate",
      "Compliance support",
      "Expert guidance",
      "Lifetime support",
    ],
    requirements: [
      "Business PAN card",
      "Proof of business address",
      "Bank account details",
      "Authorized signatory details",
    ],
    faqs: [
      {
        question: "Is GST registration mandatory for me?",
        answer:
          "If your annual turnover exceeds ₹20 lakhs (₹10 lakhs for services), GST registration is mandatory.",
      },
      {
        question: "How long does GST registration take?",
        answer:
          "Usually 2-3 days for approval after submission of all documents.",
      },
    ],
  },
  {
    name: "Company Registration",
    description: "Register a new company with ROC",
    price: 4999,
    turnaround: "10-15 days",
    category: "Business",
    documentsRequired: [
      "Director PAN Card",
      "Director Aadhar Card",
      "Address Proof",
      "Identity Proof",
      "Residential Proof",
    ],
    active: true,
    applicationsCount: 32,
    revenue: 159968,
    features: [
      "Company registration (Pvt/Ltd)",
      "MOA & AOA preparation",
      "DIN certificate",
      "Certificate of Incorporation",
      "Director & Shareholder support",
    ],
    requirements: [
      "Director PAN card",
      "Director Aadhar card",
      "Shareholder details",
      "Registered office address",
      "Company memorandum",
    ],
    faqs: [
      {
        question: "What types of companies can I register?",
        answer:
          "Private Limited, Public Limited, One Person Company (OPC), and Limited Liability Partnership (LLP).",
      },
      {
        question: "How many directors do I need?",
        answer:
          "Minimum 1 director for private companies, minimum 2 for public companies.",
      },
    ],
  },
  {
    name: "PAN Registration",
    description: "Apply for Permanent Account Number",
    price: 799,
    turnaround: "2-3 days",
    category: "Tax",
    documentsRequired: ["Identity Proof", "Address Proof"],
    active: true,
    applicationsCount: 89,
    revenue: 71111,
    features: [
      "Fast PAN registration",
      "Instant certificate",
      "Legal compliance",
      "Expert guidance",
    ],
    requirements: [
      "Identity proof (Aadhar/Passport/Voter ID)",
      "Address proof",
      "Date of birth proof",
    ],
    faqs: [
      {
        question: "Can I apply for PAN online?",
        answer:
          "Yes, the entire process is online. We handle the filing for you.",
      },
    ],
  },
  {
    name: "Trademark Registration",
    description: "Register your brand/trademark",
    price: 5999,
    turnaround: "8-10 days",
    category: "IP",
    documentsRequired: [
      "Logo/Brand Image",
      "Business Details",
      "Trademark Description",
      "Applicant Details",
    ],
    active: true,
    applicationsCount: 18,
    revenue: 107982,
    features: [
      "Logo protection",
      "Brand name registration",
      "Complete filing",
      "Legal support",
    ],
    requirements: [
      "Logo or brand name",
      "Business entity details",
      "Goods/services description",
      "Applicant identity proof",
    ],
    faqs: [
      {
        question: "How long is trademark valid?",
        answer:
          "A trademark is valid for 10 years and can be renewed indefinitely.",
      },
    ],
  },
  {
    name: "Import Export Code",
    description: "Get IEC for international trade",
    price: 3499,
    turnaround: "7-10 days",
    category: "Trade",
    documentsRequired: ["PAN Card", "Bank Certificate", "Address Proof"],
    active: true,
    applicationsCount: 25,
    revenue: 87475,
    features: [
      "IEC registration",
      "Import/Export benefits",
      "Lifetime validity",
      "Expert support",
    ],
    requirements: [
      "PAN of business",
      "Bank account certificate",
      "Business address proof",
    ],
    faqs: [
      {
        question: "Is IEC required for all imports/exports?",
        answer:
          "Yes, IEC is mandatory for most import/export transactions except for specific exemptions.",
      },
    ],
  },
];
