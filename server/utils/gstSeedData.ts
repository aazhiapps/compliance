import {
  GSTClient,
  PurchaseInvoice,
  SalesInvoice,
  GSTReturnFiling,
} from "@shared/gst";
import { gstRepository } from "../repositories/gstRepository";

/**
 * Seed demo GST data for development/testing
 * WARNING: This should only run in development/testing environments
 * The server/index.ts file includes a check to prevent running in production
 */

/**
 * Seed demo GST clients
 */
export const seedGSTClients = async () => {
  const demoClients: GSTClient[] = [
    {
      id: "gst_client_1",
      userId: "user_demo_1", // Demo user
      clientName: "Tech Solutions Pvt Ltd",
      gstin: "29AABCT1234C1Z5",
      businessName: "Tech Solutions Private Limited",
      filingFrequency: "monthly",
      financialYearStart: "2024-04-01",
      panNumber: "AABCT1234C",
      address: "123 MG Road, Bangalore",
      state: "Karnataka",
      contactPerson: "Amit Kumar",
      contactEmail: "amit@techsolutions.com",
      contactPhone: "+91 98765 43210",
      createdAt: "2024-04-01T10:00:00Z",
      updatedAt: "2024-04-01T10:00:00Z",
    },
    {
      id: "gst_client_2",
      userId: "user_demo_2", // Rajesh's client
      clientName: "Retail Mart India",
      gstin: "27AACCP1234B1Z0",
      businessName: "Retail Mart India Private Limited",
      filingFrequency: "quarterly",
      financialYearStart: "2024-04-01",
      panNumber: "AACCP1234B",
      address: "45 Andheri East, Mumbai",
      state: "Maharashtra",
      contactPerson: "Priya Sharma",
      contactEmail: "priya@retailmart.com",
      contactPhone: "+91 98765 43211",
      createdAt: "2024-04-15T09:30:00Z",
      updatedAt: "2024-04-15T09:30:00Z",
    },
    {
      id: "gst_client_3",
      userId: "admin_demo_1", // Admin's client for testing
      clientName: "Manufacturing Industries Ltd",
      gstin: "07AACCM5678D1Z3",
      businessName: "Manufacturing Industries Limited",
      filingFrequency: "monthly",
      financialYearStart: "2024-04-01",
      panNumber: "AACCM5678D",
      address: "Sector 58, Industrial Area, Delhi",
      state: "Delhi",
      contactPerson: "Rajesh Gupta",
      contactEmail: "rajesh@manufind.com",
      contactPhone: "+91 98765 43212",
      createdAt: "2024-04-10T11:00:00Z",
      updatedAt: "2024-04-10T11:00:00Z",
    },
  ];

  for (const client of demoClients) {
    await gstRepository.upsertClient(client);
  }

  console.log(`✓ Seeded ${demoClients.length} GST demo clients`);
};

/**
 * Seed demo purchase invoices with data across multiple months
 */
export const seedPurchaseInvoices = async () => {
  const demoPurchases: PurchaseInvoice[] = [
    // Tech Solutions - April 2024
    {
      id: "purchase_1",
      clientId: "gst_client_1",
      invoiceNumber: "PI/2024/001",
      vendorName: "Office Supplies Corp",
      vendorGSTIN: "29AABCO1234E1Z6",
      invoiceDate: "2024-04-05",
      taxableAmount: 50000,
      cgst: 4500,
      sgst: 4500,
      igst: 0,
      totalAmount: 59000,
      documents: [],
      month: "2024-04",
      financialYear: "2024-25",
      createdAt: "2024-04-05T10:00:00Z",
      updatedAt: "2024-04-05T10:00:00Z",
      createdBy: "user_demo_1",
    },
    {
      id: "purchase_2",
      clientId: "gst_client_1",
      invoiceNumber: "PI/2024/002",
      vendorName: "Computer Hardware Ltd",
      vendorGSTIN: "29AABCH5678F1Z7",
      invoiceDate: "2024-04-15",
      taxableAmount: 150000,
      cgst: 13500,
      sgst: 13500,
      igst: 0,
      totalAmount: 177000,
      documents: [],
      month: "2024-04",
      financialYear: "2024-25",
      createdAt: "2024-04-15T11:30:00Z",
      updatedAt: "2024-04-15T11:30:00Z",
      createdBy: "user_demo_1",
    },
    // Tech Solutions - May 2024
    {
      id: "purchase_3",
      clientId: "gst_client_1",
      invoiceNumber: "PI/2024/003",
      vendorName: "Software Services Inc",
      vendorGSTIN: "27AABSS1234G1Z8",
      invoiceDate: "2024-05-10",
      taxableAmount: 200000,
      cgst: 0,
      sgst: 0,
      igst: 36000,
      totalAmount: 236000,
      documents: [],
      month: "2024-05",
      financialYear: "2024-25",
      createdAt: "2024-05-10T09:00:00Z",
      updatedAt: "2024-05-10T09:00:00Z",
      createdBy: "user_demo_1",
    },
    {
      id: "purchase_4",
      clientId: "gst_client_1",
      invoiceNumber: "PI/2024/004",
      vendorName: "Telecom Solutions",
      vendorGSTIN: "29AABTS7890H1Z9",
      invoiceDate: "2024-05-20",
      taxableAmount: 25000,
      cgst: 2250,
      sgst: 2250,
      igst: 0,
      totalAmount: 29500,
      documents: [],
      month: "2024-05",
      financialYear: "2024-25",
      createdAt: "2024-05-20T14:00:00Z",
      updatedAt: "2024-05-20T14:00:00Z",
      createdBy: "user_demo_1",
    },
    // Retail Mart - April 2024 (Quarterly filer)
    {
      id: "purchase_5",
      clientId: "gst_client_2",
      invoiceNumber: "RM/PI/001",
      vendorName: "Wholesale Traders",
      vendorGSTIN: "27AABWT1234I1Z1",
      invoiceDate: "2024-04-08",
      taxableAmount: 500000,
      cgst: 45000,
      sgst: 45000,
      igst: 0,
      totalAmount: 590000,
      documents: [],
      month: "2024-04",
      financialYear: "2024-25",
      createdAt: "2024-04-08T10:30:00Z",
      updatedAt: "2024-04-08T10:30:00Z",
      createdBy: "user_demo_2",
    },
    {
      id: "purchase_6",
      clientId: "gst_client_2",
      invoiceNumber: "RM/PI/002",
      vendorName: "FMCG Distributors",
      vendorGSTIN: "27AABFG5678J1Z2",
      invoiceDate: "2024-04-22",
      taxableAmount: 300000,
      cgst: 27000,
      sgst: 27000,
      igst: 0,
      totalAmount: 354000,
      documents: [],
      month: "2024-04",
      financialYear: "2024-25",
      createdAt: "2024-04-22T15:00:00Z",
      updatedAt: "2024-04-22T15:00:00Z",
      createdBy: "user_demo_2",
    },
    // Manufacturing Industries - April 2024
    {
      id: "purchase_7",
      clientId: "gst_client_3",
      invoiceNumber: "MI/P/2024/001",
      vendorName: "Raw Materials Supplier",
      vendorGSTIN: "07AABRM1234K1Z3",
      invoiceDate: "2024-04-12",
      taxableAmount: 800000,
      cgst: 72000,
      sgst: 72000,
      igst: 0,
      totalAmount: 944000,
      documents: [],
      month: "2024-04",
      financialYear: "2024-25",
      createdAt: "2024-04-12T11:00:00Z",
      updatedAt: "2024-04-12T11:00:00Z",
      createdBy: "admin_demo_1",
    },
    {
      id: "purchase_8",
      clientId: "gst_client_3",
      invoiceNumber: "MI/P/2024/002",
      vendorName: "Machinery Parts Ltd",
      vendorGSTIN: "29AABMP7890L1Z4",
      invoiceDate: "2024-04-25",
      taxableAmount: 450000,
      cgst: 0,
      sgst: 0,
      igst: 81000,
      totalAmount: 531000,
      documents: [],
      month: "2024-04",
      financialYear: "2024-25",
      createdAt: "2024-04-25T13:30:00Z",
      updatedAt: "2024-04-25T13:30:00Z",
      createdBy: "admin_demo_1",
    },
    // Manufacturing Industries - May 2024
    {
      id: "purchase_9",
      clientId: "gst_client_3",
      invoiceNumber: "MI/P/2024/003",
      vendorName: "Packaging Materials Co",
      vendorGSTIN: "07AABPM1234M1Z5",
      invoiceDate: "2024-05-08",
      taxableAmount: 120000,
      cgst: 10800,
      sgst: 10800,
      igst: 0,
      totalAmount: 141600,
      documents: [],
      month: "2024-05",
      financialYear: "2024-25",
      createdAt: "2024-05-08T10:00:00Z",
      updatedAt: "2024-05-08T10:00:00Z",
      createdBy: "admin_demo_1",
    },
  ];

  for (const purchase of demoPurchases) {
    await gstRepository.upsertPurchaseInvoice(purchase);
  }

  console.log(`✓ Seeded ${demoPurchases.length} demo purchase invoices`);
};

/**
 * Seed demo sales invoices with data across multiple months
 */
export const seedSalesInvoices = async () => {
  const demoSales: SalesInvoice[] = [
    // Tech Solutions - April 2024
    {
      id: "sales_1",
      clientId: "gst_client_1",
      invoiceNumber: "SI/2024/001",
      customerName: "Enterprise Solutions Ltd",
      customerGSTIN: "29AACES1234N1Z6",
      invoiceDate: "2024-04-10",
      taxableAmount: 300000,
      cgst: 27000,
      sgst: 27000,
      igst: 0,
      totalAmount: 354000,
      documents: [],
      month: "2024-04",
      financialYear: "2024-25",
      createdAt: "2024-04-10T12:00:00Z",
      updatedAt: "2024-04-10T12:00:00Z",
      createdBy: "user_demo_1",
    },
    {
      id: "sales_2",
      clientId: "gst_client_1",
      invoiceNumber: "SI/2024/002",
      customerName: "Digital Services Corp",
      customerGSTIN: "27AACDS5678O1Z7",
      invoiceDate: "2024-04-18",
      taxableAmount: 450000,
      cgst: 0,
      sgst: 0,
      igst: 81000,
      totalAmount: 531000,
      documents: [],
      month: "2024-04",
      financialYear: "2024-25",
      createdAt: "2024-04-18T14:30:00Z",
      updatedAt: "2024-04-18T14:30:00Z",
      createdBy: "user_demo_1",
    },
    {
      id: "sales_3",
      clientId: "gst_client_1",
      invoiceNumber: "SI/2024/003",
      customerName: "Tech Startups Inc",
      customerGSTIN: "29AACTS7890P1Z8",
      invoiceDate: "2024-04-28",
      taxableAmount: 180000,
      cgst: 16200,
      sgst: 16200,
      igst: 0,
      totalAmount: 212400,
      documents: [],
      month: "2024-04",
      financialYear: "2024-25",
      createdAt: "2024-04-28T16:00:00Z",
      updatedAt: "2024-04-28T16:00:00Z",
      createdBy: "user_demo_1",
    },
    // Tech Solutions - May 2024
    {
      id: "sales_4",
      clientId: "gst_client_1",
      invoiceNumber: "SI/2024/004",
      customerName: "Cloud Computing Ltd",
      customerGSTIN: "29AACCC1234Q1Z9",
      invoiceDate: "2024-05-12",
      taxableAmount: 520000,
      cgst: 46800,
      sgst: 46800,
      igst: 0,
      totalAmount: 613600,
      documents: [],
      month: "2024-05",
      financialYear: "2024-25",
      createdAt: "2024-05-12T11:00:00Z",
      updatedAt: "2024-05-12T11:00:00Z",
      createdBy: "user_demo_1",
    },
    {
      id: "sales_5",
      clientId: "gst_client_1",
      invoiceNumber: "SI/2024/005",
      customerName: "IT Consulting Group",
      customerGSTIN: "27AACIT5678R1Z1",
      invoiceDate: "2024-05-25",
      taxableAmount: 350000,
      cgst: 0,
      sgst: 0,
      igst: 63000,
      totalAmount: 413000,
      documents: [],
      month: "2024-05",
      financialYear: "2024-25",
      createdAt: "2024-05-25T13:00:00Z",
      updatedAt: "2024-05-25T13:00:00Z",
      createdBy: "user_demo_1",
    },
    // Retail Mart - April 2024
    {
      id: "sales_6",
      clientId: "gst_client_2",
      invoiceNumber: "RM/SI/001",
      customerName: "Retail Chain Stores",
      customerGSTIN: "27AACRC1234S1Z2",
      invoiceDate: "2024-04-10",
      taxableAmount: 800000,
      cgst: 72000,
      sgst: 72000,
      igst: 0,
      totalAmount: 944000,
      documents: [],
      month: "2024-04",
      financialYear: "2024-25",
      createdAt: "2024-04-10T12:00:00Z",
      updatedAt: "2024-04-10T12:00:00Z",
      createdBy: "user_demo_2",
    },
    {
      id: "sales_7",
      clientId: "gst_client_2",
      invoiceNumber: "RM/SI/002",
      customerName: "Online Marketplace Pvt Ltd",
      customerGSTIN: "27AACOM7890T1Z3",
      invoiceDate: "2024-04-25",
      taxableAmount: 650000,
      cgst: 58500,
      sgst: 58500,
      igst: 0,
      totalAmount: 767000,
      documents: [],
      month: "2024-04",
      financialYear: "2024-25",
      createdAt: "2024-04-25T15:30:00Z",
      updatedAt: "2024-04-25T15:30:00Z",
      createdBy: "user_demo_2",
    },
    // Manufacturing Industries - April 2024
    {
      id: "sales_8",
      clientId: "gst_client_3",
      invoiceNumber: "MI/S/2024/001",
      customerName: "Industrial Supplies Co",
      customerGSTIN: "07AACIS1234U1Z4",
      invoiceDate: "2024-04-15",
      taxableAmount: 1200000,
      cgst: 108000,
      sgst: 108000,
      igst: 0,
      totalAmount: 1416000,
      documents: [],
      month: "2024-04",
      financialYear: "2024-25",
      createdAt: "2024-04-15T14:00:00Z",
      updatedAt: "2024-04-15T14:00:00Z",
      createdBy: "admin_demo_1",
    },
    {
      id: "sales_9",
      clientId: "gst_client_3",
      invoiceNumber: "MI/S/2024/002",
      customerName: "Export Trading House",
      customerGSTIN: "29AACET5678V1Z5",
      invoiceDate: "2024-04-28",
      taxableAmount: 950000,
      cgst: 0,
      sgst: 0,
      igst: 171000,
      totalAmount: 1121000,
      documents: [],
      month: "2024-04",
      financialYear: "2024-25",
      createdAt: "2024-04-28T16:00:00Z",
      updatedAt: "2024-04-28T16:00:00Z",
      createdBy: "admin_demo_1",
    },
    // Manufacturing Industries - May 2024
    {
      id: "sales_10",
      clientId: "gst_client_3",
      invoiceNumber: "MI/S/2024/003",
      customerName: "Automotive Components Ltd",
      customerGSTIN: "07AACAC1234W1Z6",
      invoiceDate: "2024-05-10",
      taxableAmount: 850000,
      cgst: 76500,
      sgst: 76500,
      igst: 0,
      totalAmount: 1003000,
      documents: [],
      month: "2024-05",
      financialYear: "2024-25",
      createdAt: "2024-05-10T11:30:00Z",
      updatedAt: "2024-05-10T11:30:00Z",
      createdBy: "admin_demo_1",
    },
  ];

  for (const sale of demoSales) {
    await gstRepository.upsertSalesInvoice(sale);
  }

  console.log(`✓ Seeded ${demoSales.length} demo sales invoices`);
};

/**
 * Seed demo GST return filings
 */
export const seedGSTFilings = async () => {
  const demoFilings: GSTReturnFiling[] = [
    // Tech Solutions - April 2024 (Filed)
    {
      id: "filing_1",
      clientId: "gst_client_1",
      month: "2024-04",
      financialYear: "2024-25",
      gstr1Filed: true,
      gstr1FiledDate: "2024-05-11",
      gstr1ARN: "AA290520241234567",
      gstr3bFiled: true,
      gstr3bFiledDate: "2024-05-20",
      gstr3bARN: "AB290520241234568",
      taxPaid: 129600, // Net tax payable from April
      lateFee: 0,
      interest: 0,
      filingStatus: "filed",
      returnDocuments: [],
      challanDocuments: [],
      workingSheets: [],
      createdAt: "2024-05-01T10:00:00Z",
      updatedAt: "2024-05-20T16:00:00Z",
      updatedBy: "user_demo_1",
    },
    // Tech Solutions - May 2024 (Pending)
    {
      id: "filing_2",
      clientId: "gst_client_1",
      month: "2024-05",
      financialYear: "2024-25",
      gstr1Filed: false,
      gstr3bFiled: false,
      taxPaid: 0,
      lateFee: 0,
      interest: 0,
      filingStatus: "pending",
      returnDocuments: [],
      challanDocuments: [],
      workingSheets: [],
      createdAt: "2024-06-01T10:00:00Z",
      updatedAt: "2024-06-01T10:00:00Z",
      updatedBy: "user_demo_1",
    },
    // Retail Mart - April 2024 (Late filing - quarterly)
    {
      id: "filing_3",
      clientId: "gst_client_2",
      month: "2024-04",
      financialYear: "2024-25",
      gstr1Filed: true,
      gstr1FiledDate: "2024-05-25",
      gstr1ARN: "AA270520241234569",
      gstr3bFiled: true,
      gstr3bFiledDate: "2024-05-28",
      gstr3bARN: "AB270520241234570",
      taxPaid: 282000, // Net tax from April
      lateFee: 200,
      interest: 150,
      filingStatus: "late",
      returnDocuments: [],
      challanDocuments: [],
      workingSheets: [],
      createdAt: "2024-05-01T10:00:00Z",
      updatedAt: "2024-05-28T17:00:00Z",
      updatedBy: "user_demo_2",
    },
    // Manufacturing Industries - April 2024 (Filed)
    {
      id: "filing_4",
      clientId: "gst_client_3",
      month: "2024-04",
      financialYear: "2024-25",
      gstr1Filed: true,
      gstr1FiledDate: "2024-05-10",
      gstr1ARN: "AA070520241234571",
      gstr3bFiled: true,
      gstr3bFiledDate: "2024-05-18",
      gstr3bARN: "AB070520241234572",
      taxPaid: 252000, // Net tax from April
      lateFee: 0,
      interest: 0,
      filingStatus: "filed",
      returnDocuments: [],
      challanDocuments: [],
      workingSheets: [],
      createdAt: "2024-05-01T10:00:00Z",
      updatedAt: "2024-05-18T15:00:00Z",
      updatedBy: "admin_demo_1",
    },
    // Manufacturing Industries - May 2024 (Pending)
    {
      id: "filing_5",
      clientId: "gst_client_3",
      month: "2024-05",
      financialYear: "2024-25",
      gstr1Filed: false,
      gstr3bFiled: false,
      taxPaid: 0,
      lateFee: 0,
      interest: 0,
      filingStatus: "pending",
      returnDocuments: [],
      challanDocuments: [],
      workingSheets: [],
      createdAt: "2024-06-01T10:00:00Z",
      updatedAt: "2024-06-01T10:00:00Z",
      updatedBy: "admin_demo_1",
    },
  ];

  for (const filing of demoFilings) {
    await gstRepository.upsertGSTFiling(filing);
  }

  console.log(`✓ Seeded ${demoFilings.length} demo GST return filings`);
};

/**
 * Master function to seed all GST demo data
 */
export const seedGSTData = async () => {
  console.log("Seeding GST demo data...");
  await seedGSTClients();
  await seedPurchaseInvoices();
  await seedSalesInvoices();
  await seedGSTFilings();
  console.log("✓ All GST demo data seeded successfully");
};
