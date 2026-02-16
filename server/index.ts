import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import filingRoutes from "./routes/filings";
import {
  handleSignup,
  handleLogin,
  handleGetProfile,
  handleLogout,
  handleGetApplications,
  handleCreateApplication,
  handleUploadDocument,
  handleGetUserDocuments,
} from "./routes/auth";
import {
  handleGetAllUsers,
  handleGetAllApplications,
  handleUpdateApplicationStatus,
  handleGetApplicationById,
  handleGetUserById,
  handleGetAdminStats,
  handleGetAllDocuments,
} from "./routes/admin";
import {
  getStaffApplications,
  updateApplicationStatus,
  assignApplicationToStaff,
  getStaffStats,
  getAllStaff,
} from "./routes/staff";
import {
  handleCreateGSTClient,
  handleGetGSTClients,
  handleGetGSTClient,
  handleUpdateGSTClient,
  handleCreatePurchaseInvoice,
  handleGetPurchaseInvoices,
  handleUpdatePurchaseInvoice,
  handleDeletePurchaseInvoice,
  handleCreateSalesInvoice,
  handleGetSalesInvoices,
  handleUpdateSalesInvoice,
  handleDeleteSalesInvoice,
  handleUpdateGSTFiling,
  handleGetGSTFilings,
  handleGetMonthlySummary,
  handleGetAllClientsSummary,
  handleUploadGSTDocument,
  handleDownloadGSTDocument,
  handleDeleteGSTDocument,
} from "./routes/gst";
import {
  handleGetAllServices,
  handleGetServiceById,
  handleCreateService,
  handleUpdateService,
  handleDeleteService,
} from "./routes/service";
import {
  handleRecordPayment,
  handleGetPayments,
  handleGetPaymentById,
  handleGetPaymentByApplicationId,
  handleUpdatePaymentStatus,
} from "./routes/payments";
import {
  handleGetReports,
  handleGetReport,
  handleExportCSV,
  handleExportPDF,
  handleGetClients,
  handleGetFinancialYears,
  handleGetExportLogs,
} from "./routes/reports";
import { authenticateToken } from "./middleware/auth";
import { requireAdmin } from "./middleware/admin";
import { requireStaff } from "./middleware/staff";
import { validateRequest, schemas } from "./middleware/validation";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/logging";
import {
  apiLimiter,
  authLimiter,
  fileLimiter,
} from "./middleware/rateLimiter";

export function createServer() {
  const app = express();

  // Global middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Apply rate limiting to all API routes
  app.use("/api/", apiLimiter);

  // Health check endpoint
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Public auth routes with validation and rate limiting
  app.post(
    "/api/auth/signup",
    authLimiter,
    validateRequest(schemas.signup),
    handleSignup,
  );
  app.post(
    "/api/auth/login",
    authLimiter,
    validateRequest(schemas.login),
    handleLogin,
  );
  app.post("/api/auth/logout", handleLogout);

  // Protected auth routes
  app.get("/api/auth/profile", authenticateToken, handleGetProfile);

  // Protected application routes
  app.get("/api/applications", authenticateToken, handleGetApplications);
  app.post(
    "/api/applications",
    authenticateToken,
    validateRequest(schemas.createApplication),
    handleCreateApplication,
  );
  app.post(
    "/api/applications/:id/documents",
    authenticateToken,
    fileLimiter,
    validateRequest(schemas.uploadDocument),
    handleUploadDocument,
  );

  // Protected document routes
  app.get("/api/documents", authenticateToken, handleGetUserDocuments);

  // Admin routes (protected by admin role)
  app.get("/api/admin/stats", authenticateToken, requireAdmin, handleGetAdminStats);
  app.get("/api/admin/users", authenticateToken, requireAdmin, handleGetAllUsers);
  app.get("/api/admin/users/:id", authenticateToken, requireAdmin, handleGetUserById);
  app.get("/api/admin/applications", authenticateToken, requireAdmin, handleGetAllApplications);
  app.get("/api/admin/applications/:id", authenticateToken, requireAdmin, handleGetApplicationById);
  app.patch("/api/admin/applications/:id", authenticateToken, requireAdmin, handleUpdateApplicationStatus);
  app.get("/api/admin/documents", authenticateToken, requireAdmin, handleGetAllDocuments);

  // Service Management Routes (admin only)
  app.get("/api/admin/services", authenticateToken, requireAdmin, handleGetAllServices);
  app.get("/api/admin/services/:id", authenticateToken, requireAdmin, handleGetServiceById);
  app.post("/api/admin/services", authenticateToken, requireAdmin, handleCreateService);
  app.patch("/api/admin/services/:id", authenticateToken, requireAdmin, handleUpdateService);
  app.delete("/api/admin/services/:id", authenticateToken, requireAdmin, handleDeleteService);
  // Staff routes (protected by staff role - includes both staff and admin)
  app.get("/api/staff/applications", authenticateToken, requireStaff, getStaffApplications);
  app.patch("/api/staff/applications/:applicationId", authenticateToken, requireStaff, updateApplicationStatus);
  app.get("/api/staff/stats", authenticateToken, requireStaff, getStaffStats);
  app.get("/api/staff/members", authenticateToken, requireAdmin, getAllStaff);
  app.post("/api/staff/assign/:applicationId", authenticateToken, requireAdmin, assignApplicationToStaff);

  // Filing Workflow Routes (Phase 1)
  app.use("/api/filings", filingRoutes);

  // GST Management Routes (protected)
  // Client management
  app.post("/api/gst/clients", authenticateToken, handleCreateGSTClient);
  app.get("/api/gst/clients", authenticateToken, handleGetGSTClients);
  app.get("/api/gst/clients/:id", authenticateToken, handleGetGSTClient);
  app.patch("/api/gst/clients/:id", authenticateToken, handleUpdateGSTClient);

  // Purchase invoices
  app.post("/api/gst/purchases", authenticateToken, handleCreatePurchaseInvoice);
  app.get("/api/gst/purchases/:clientId", authenticateToken, handleGetPurchaseInvoices);
  app.patch("/api/gst/purchases/:id", authenticateToken, handleUpdatePurchaseInvoice);
  app.delete("/api/gst/purchases/:id", authenticateToken, requireAdmin, handleDeletePurchaseInvoice);

  // Sales invoices
  app.post("/api/gst/sales", authenticateToken, handleCreateSalesInvoice);
  app.get("/api/gst/sales/:clientId", authenticateToken, handleGetSalesInvoices);
  app.patch("/api/gst/sales/:id", authenticateToken, handleUpdateSalesInvoice);
  app.delete("/api/gst/sales/:id", authenticateToken, requireAdmin, handleDeleteSalesInvoice);

  // GST filing status
  app.post("/api/gst/filings", authenticateToken, handleUpdateGSTFiling);
  app.get("/api/gst/filings/:clientId", authenticateToken, handleGetGSTFilings);

  // Monthly summary
  app.get("/api/gst/summary/:clientId/:month", authenticateToken, handleGetMonthlySummary);
  app.get("/api/gst/summary/all/:month", authenticateToken, handleGetAllClientsSummary);

  // Document management
  app.post("/api/gst/documents", authenticateToken, fileLimiter, handleUploadGSTDocument);
  app.get("/api/gst/documents/download", authenticateToken, handleDownloadGSTDocument);
  app.delete("/api/gst/documents", authenticateToken, handleDeleteGSTDocument);

  // Payment Management Routes (admin/staff only)
  app.post("/api/payments/record", authenticateToken, requireAdmin, handleRecordPayment);
  app.get("/api/payments", authenticateToken, requireStaff, handleGetPayments);
  app.get("/api/payments/:id", authenticateToken, requireStaff, handleGetPaymentById);
  app.get("/api/payments/application/:applicationId", authenticateToken, requireStaff, handleGetPaymentByApplicationId);
  app.patch("/api/payments/:id/status", authenticateToken, requireAdmin, handleUpdatePaymentStatus);

  // Reports Management Routes (admin only)
  app.get("/api/reports", authenticateToken, requireAdmin, handleGetReports);
  app.get("/api/reports/meta/clients", authenticateToken, requireAdmin, handleGetClients);
  app.get("/api/reports/meta/financial-years", authenticateToken, requireAdmin, handleGetFinancialYears);
  app.get("/api/reports/:id", authenticateToken, requireAdmin, handleGetReport);
  app.get("/api/reports/:id/export/csv", authenticateToken, requireAdmin, handleExportCSV);
  app.get("/api/reports/:id/export/pdf", authenticateToken, requireAdmin, handleExportPDF);
  app.get("/api/reports/:id/export-logs", authenticateToken, requireAdmin, handleGetExportLogs);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
