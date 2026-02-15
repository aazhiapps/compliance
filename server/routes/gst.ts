import { RequestHandler } from "express";
import { gstRepository } from "../repositories/gstRepository";
import { AuthRequest } from "../middleware/auth";
import {
  GSTClient,
  PurchaseInvoice,
  SalesInvoice,
  GSTReturnFiling,
  GSTAuditLog,
  MonthlyGSTSummary,
  CreateGSTClientRequest,
  CreatePurchaseInvoiceRequest,
  CreateSalesInvoiceRequest,
  UpdateGSTFilingRequest,
} from "@shared/gst";
import { userRepository } from "../repositories/userRepository";
import { deleteGSTFile } from "../utils/fileStorage";
import { 
  validateGSTIN, 
  validatePAN, 
  validateARN,
  calculateDueDates,
  calculateLateFee,
  calculateInterest,
  getFilingStatus,
  validateGSTINState
} from "../utils/gstValidation";
import { gstNotificationService } from "../services/gstNotificationService";

/**
 * Create a new GST client
 */
export const handleCreateGSTClient: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    
    const data = req.body as CreateGSTClientRequest;

    // Validate GSTIN
    const gstinValidation = validateGSTIN(data.gstin);
    if (!gstinValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid GSTIN",
        errors: gstinValidation.errors,
        warnings: gstinValidation.warnings,
      });
    }

    // Validate PAN
    const panValidation = validatePAN(data.panNumber);
    if (!panValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid PAN",
        errors: panValidation.errors,
      });
    }

    // Validate GSTIN state matches provided state
    if (!validateGSTINState(data.gstin, data.state)) {
      return res.status(400).json({
        success: false,
        message: "GSTIN state code does not match the provided state",
      });
    }

    // Check if GSTIN already exists
    const existing = await gstRepository.findClientByGSTIN(data.gstin);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A client with this GSTIN already exists",
      });
    }

    // Create new client with default status
    const client: GSTClient = {
      id: `gst_client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      status: data.status || "active",
      assignedStaff: data.assignedStaff || [],
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = await gstRepository.createClient(client);

    // Add audit log
    const auditLog: GSTAuditLog = {
      id: `audit_${Date.now()}`,
      entityType: "client",
      entityId: created.id,
      action: "create",
      changes: { created: client },
      performedBy: user.id,
      performedAt: new Date().toISOString(),
    };
    await gstRepository.addAuditLog(auditLog);

    res.json({
      success: true,
      message: "GST client created successfully",
      client: created,
    });
  } catch (error) {
    console.error("Error creating GST client:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create GST client",
    });
  }
};

/**
 * Get all GST clients for the current user
 */
export const handleGetGSTClients: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    
    let clients: GSTClient[];
    if (user.role === "admin") {
      clients = await gstRepository.findAllClients();
    } else {
      clients = await gstRepository.findClientsByUserId(user.id);
    }

    res.json({
      success: true,
      clients,
    });
  } catch (error) {
    console.error("Error fetching GST clients:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch GST clients",
    });
  }
};

/**
 * Get a specific GST client
 */
export const handleGetGSTClient: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const client = await gstRepository.findClientById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Check permissions
    if (user.role !== "admin" && client.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      client,
    });
  } catch (error) {
    console.error("Error fetching GST client:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch GST client",
    });
  }
};

/**
 * Update a GST client
 */
export const handleUpdateGSTClient: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }
    const updates = req.body;

    const client = await gstRepository.findClientById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Check permissions
    if (user.role !== "admin" && client.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const updated = await gstRepository.updateClient(id, updates);

    // Add audit log
    const auditLog: GSTAuditLog = {
      id: `audit_${Date.now()}`,
      entityType: "client",
      entityId: id,
      action: "update",
      changes: { updates },
      performedBy: user.id,
      performedAt: new Date().toISOString(),
    };
    await gstRepository.addAuditLog(auditLog);

    res.json({
      success: true,
      message: "Client updated successfully",
      client: updated,
    });
  } catch (error) {
    console.error("Error updating GST client:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update GST client",
    });
  }
};

/**
 * Create a purchase invoice
 */
export const handleCreatePurchaseInvoice: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const data = req.body as CreatePurchaseInvoiceRequest;

    // Verify client exists and user has access
    const client = await gstRepository.findClientById(data.clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    if (user.role !== "admin" && client.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if the month is locked
    const isLocked = await gstRepository.isMonthLocked(data.clientId, data.month);
    if (isLocked) {
      return res.status(403).json({
        success: false,
        message: "This month is locked. Cannot add invoices after filing is completed.",
      });
    }

    // Calculate total amount
    const totalAmount = data.taxableAmount + data.cgst + data.sgst + data.igst;

    const invoice: PurchaseInvoice = {
      id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      totalAmount,
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.id,
    };

    const created = await gstRepository.createPurchaseInvoice(invoice);

    // Add audit log
    const auditLog: GSTAuditLog = {
      id: `audit_${Date.now()}`,
      entityType: "purchase",
      entityId: created.id,
      action: "create",
      changes: { created: invoice },
      performedBy: user.id,
      performedAt: new Date().toISOString(),
    };
    await gstRepository.addAuditLog(auditLog);

    res.json({
      success: true,
      message: "Purchase invoice created successfully",
      invoice: created,
    });
  } catch (error) {
    console.error("Error creating purchase invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create purchase invoice",
    });
  }
};

/**
 * Get purchase invoices for a client
 */
export const handleGetPurchaseInvoices: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { clientId } = req.params;
    if (!clientId || Array.isArray(clientId)) {
      return res.status(400).json({ success: false, message: "Invalid client ID" });
    }
    const monthParam = req.query.month;
    const month = typeof monthParam === "string" ? monthParam : undefined;

    const client = await gstRepository.findClientById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    if (user.role !== "admin" && client.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    let invoices: PurchaseInvoice[];
    if (month && !Array.isArray(month)) {
      invoices = await gstRepository.findPurchaseInvoicesByMonth(clientId, month);
    } else {
      invoices = await gstRepository.findPurchaseInvoicesByClientId(clientId);
    }

    res.json({
      success: true,
      invoices,
    });
  } catch (error) {
    console.error("Error fetching purchase invoices:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch purchase invoices",
    });
  }
};

/**
 * Update a purchase invoice
 */
export const handleUpdatePurchaseInvoice: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }
    const updates = req.body;

    const invoice = await gstRepository.findPurchaseInvoiceById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const client = await gstRepository.findClientById(invoice.clientId);
    if (!client || (user.role !== "admin" && client.userId !== user.id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Recalculate total if tax amounts changed
    if (updates.taxableAmount || updates.cgst || updates.sgst || updates.igst) {
      const taxableAmount = updates.taxableAmount ?? invoice.taxableAmount;
      const cgst = updates.cgst ?? invoice.cgst;
      const sgst = updates.sgst ?? invoice.sgst;
      const igst = updates.igst ?? invoice.igst;
      updates.totalAmount = taxableAmount + cgst + sgst + igst;
    }

    const updated = await gstRepository.updatePurchaseInvoice(id, updates);

    // Add audit log
    const auditLog: GSTAuditLog = {
      id: `audit_${Date.now()}`,
      entityType: "purchase",
      entityId: id,
      action: "update",
      changes: { updates },
      performedBy: user.id,
      performedAt: new Date().toISOString(),
    };
    await gstRepository.addAuditLog(auditLog);

    res.json({
      success: true,
      message: "Purchase invoice updated successfully",
      invoice: updated,
    });
  } catch (error) {
    console.error("Error updating purchase invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update purchase invoice",
    });
  }
};

/**
 * Delete a purchase invoice
 */
export const handleDeletePurchaseInvoice: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    // Only admin can delete
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can delete invoices",
      });
    }

    const invoice = await gstRepository.findPurchaseInvoiceById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Delete associated files
    for (const filePath of invoice.documents) {
      try {
        await deleteGSTFile(filePath);
      } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
      }
    }

    await gstRepository.deletePurchaseInvoice(id);

    // Add audit log
    const auditLog: GSTAuditLog = {
      id: `audit_${Date.now()}`,
      entityType: "purchase",
      entityId: id,
      action: "delete",
      changes: { deleted: invoice },
      performedBy: user.id,
      performedAt: new Date().toISOString(),
    };
    await gstRepository.addAuditLog(auditLog);

    res.json({
      success: true,
      message: "Purchase invoice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting purchase invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete purchase invoice",
    });
  }
};

/**
 * Create a sales invoice
 */
export const handleCreateSalesInvoice: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const data = req.body as CreateSalesInvoiceRequest;

    const client = await gstRepository.findClientById(data.clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    if (user.role !== "admin" && client.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const totalAmount = data.taxableAmount + data.cgst + data.sgst + data.igst;

    const invoice: SalesInvoice = {
      id: `sales_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      totalAmount,
      documents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user.id,
    };

    const created = await gstRepository.createSalesInvoice(invoice);

    // Add audit log
    const auditLog: GSTAuditLog = {
      id: `audit_${Date.now()}`,
      entityType: "sales",
      entityId: created.id,
      action: "create",
      changes: { created: invoice },
      performedBy: user.id,
      performedAt: new Date().toISOString(),
    };
    await gstRepository.addAuditLog(auditLog);

    res.json({
      success: true,
      message: "Sales invoice created successfully",
      invoice: created,
    });
  } catch (error) {
    console.error("Error creating sales invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create sales invoice",
    });
  }
};

/**
 * Get sales invoices for a client
 */
export const handleGetSalesInvoices: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { clientId } = req.params;
    if (!clientId || Array.isArray(clientId)) {
      return res.status(400).json({ success: false, message: "Invalid client ID" });
    }
    const monthParam = req.query.month;
    const month = typeof monthParam === "string" ? monthParam : undefined;

    const client = await gstRepository.findClientById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    if (user.role !== "admin" && client.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    let invoices: SalesInvoice[];
    if (month && !Array.isArray(month)) {
      invoices = await gstRepository.findSalesInvoicesByMonth(clientId, month);
    } else {
      invoices = await gstRepository.findSalesInvoicesByClientId(clientId);
    }

    res.json({
      success: true,
      invoices,
    });
  } catch (error) {
    console.error("Error fetching sales invoices:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sales invoices",
    });
  }
};

/**
 * Update a sales invoice
 */
export const handleUpdateSalesInvoice: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }
    const updates = req.body;

    const invoice = await gstRepository.findSalesInvoiceById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const client = await gstRepository.findClientById(invoice.clientId);
    if (!client || (user.role !== "admin" && client.userId !== user.id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Recalculate total if tax amounts changed
    if (updates.taxableAmount || updates.cgst || updates.sgst || updates.igst) {
      const taxableAmount = updates.taxableAmount ?? invoice.taxableAmount;
      const cgst = updates.cgst ?? invoice.cgst;
      const sgst = updates.sgst ?? invoice.sgst;
      const igst = updates.igst ?? invoice.igst;
      updates.totalAmount = taxableAmount + cgst + sgst + igst;
    }

    const updated = await gstRepository.updateSalesInvoice(id, updates);

    // Add audit log
    const auditLog: GSTAuditLog = {
      id: `audit_${Date.now()}`,
      entityType: "sales",
      entityId: id,
      action: "update",
      changes: { updates },
      performedBy: user.id,
      performedAt: new Date().toISOString(),
    };
    await gstRepository.addAuditLog(auditLog);

    res.json({
      success: true,
      message: "Sales invoice updated successfully",
      invoice: updated,
    });
  } catch (error) {
    console.error("Error updating sales invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update sales invoice",
    });
  }
};

/**
 * Delete a sales invoice
 */
export const handleDeleteSalesInvoice: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can delete invoices",
      });
    }

    const invoice = await gstRepository.findSalesInvoiceById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Delete associated files
    for (const filePath of invoice.documents) {
      try {
        await deleteGSTFile(filePath);
      } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
      }
    }

    await gstRepository.deleteSalesInvoice(id);

    // Add audit log
    const auditLog: GSTAuditLog = {
      id: `audit_${Date.now()}`,
      entityType: "sales",
      entityId: id,
      action: "delete",
      changes: { deleted: invoice },
      performedBy: user.id,
      performedAt: new Date().toISOString(),
    };
    await gstRepository.addAuditLog(auditLog);

    res.json({
      success: true,
      message: "Sales invoice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting sales invoice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete sales invoice",
    });
  }
};

/**
 * Update GST filing status
 */
export const handleUpdateGSTFiling: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const data = req.body as UpdateGSTFilingRequest;

    const client = await gstRepository.findClientById(data.clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    if (user.role !== "admin" && client.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get or create filing record
    let filing = await gstRepository.findGSTFilingByMonth(
      data.clientId,
      data.month
    );

    if (!filing) {
      filing = {
        id: `filing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        clientId: data.clientId,
        month: data.month,
        financialYear: data.financialYear,
        gstr1Filed: false,
        gstr3bFiled: false,
        taxPaid: 0,
        lateFee: 0,
        interest: 0,
        filingStatus: "pending",
        returnDocuments: [],
        challanDocuments: [],
        workingSheets: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedBy: user.id,
      };
    }

    // Update filing data
    const updates = {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
    };

    const updated = await gstRepository.upsertGSTFiling({ ...filing, ...updates });

    // Add audit log
    const auditLog: GSTAuditLog = {
      id: `audit_${Date.now()}`,
      entityType: "filing",
      entityId: updated.id,
      action: filing.id === updated.id ? "update" : "create",
      changes: { updates },
      performedBy: user.id,
      performedAt: new Date().toISOString(),
    };
    await gstRepository.addAuditLog(auditLog);

    res.json({
      success: true,
      message: "GST filing updated successfully",
      filing: updated,
    });
  } catch (error) {
    console.error("Error updating GST filing:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update GST filing",
    });
  }
};

/**
 * Get GST filings for a client
 */
export const handleGetGSTFilings: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { clientId } = req.params;
    if (!clientId || Array.isArray(clientId)) {
      return res.status(400).json({ success: false, message: "Invalid client ID" });
    }
    const fyParam = req.query.financialYear;
    const financialYear = typeof fyParam === "string" ? fyParam : undefined;

    const client = await gstRepository.findClientById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    if (user.role !== "admin" && client.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    let filings: GSTReturnFiling[];
    if (financialYear && !Array.isArray(financialYear)) {
      filings = await gstRepository.findGSTFilingsByYear(clientId, financialYear);
    } else {
      filings = await gstRepository.findGSTFilingsByClientId(clientId);
    }

    res.json({
      success: true,
      filings,
    });
  } catch (error) {
    console.error("Error fetching GST filings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch GST filings",
    });
  }
};

/**
 * Get monthly summary for a client
 */
export const handleGetMonthlySummary: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { clientId, month } = req.params;
    if (!clientId || Array.isArray(clientId)) {
      return res.status(400).json({ success: false, message: "Invalid client ID" });
    }
    if (!month || Array.isArray(month)) {
      return res.status(400).json({ success: false, message: "Invalid month" });
    }

    const client = await gstRepository.findClientById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    if (user.role !== "admin" && client.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get purchases for the month
    const purchases = await gstRepository.findPurchaseInvoicesByMonth(clientId, month);
    const totalPurchases = purchases.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const itcAvailable = purchases.reduce(
      (sum, inv) => sum + inv.cgst + inv.sgst + inv.igst,
      0
    );

    // Get sales for the month
    const sales = await gstRepository.findSalesInvoicesByMonth(clientId, month);
    const totalSales = sales.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const outputTax = sales.reduce(
      (sum, inv) => sum + inv.cgst + inv.sgst + inv.igst,
      0
    );

    // Calculate net tax payable
    const netTaxPayable = outputTax - itcAvailable;

    // Get filing status
    const filing = await gstRepository.findGSTFilingByMonth(clientId, month);

    const summary: MonthlyGSTSummary = {
      clientId,
      clientName: client.clientName,
      month,
      financialYear: purchases[0]?.financialYear || sales[0]?.financialYear || "",
      totalPurchases,
      totalSales,
      itcAvailable,
      outputTax,
      netTaxPayable,
      filingStatus: filing?.filingStatus || "pending",
      gstr1Filed: filing?.gstr1Filed || false,
      gstr3bFiled: filing?.gstr3bFiled || false,
    };

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Error calculating monthly summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate monthly summary",
    });
  }
};

/**
 * Get summary of all clients for a specific month
 */
export const handleGetAllClientsSummary: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { month } = req.params;
    if (!month || Array.isArray(month)) {
      return res.status(400).json({ success: false, message: "Invalid month" });
    }

    // Get all clients based on user role
    let clients: GSTClient[];
    if (user.role === "admin") {
      clients = await gstRepository.findAllClients();
    } else {
      clients = await gstRepository.findClientsByUserId(user.id);
    }

    // Calculate summary for each client (in parallel)
    // Note: For large numbers of clients (>50), consider batching to avoid overwhelming the database
    const summaries: MonthlyGSTSummary[] = await Promise.all(
      clients.map(async (client) => {
        // Get purchases for the month
        const purchases = await gstRepository.findPurchaseInvoicesByMonth(client.id, month);
        const totalPurchases = purchases.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const itcAvailable = purchases.reduce(
          (sum, inv) => sum + inv.cgst + inv.sgst + inv.igst,
          0
        );

        // Get sales for the month
        const sales = await gstRepository.findSalesInvoicesByMonth(client.id, month);
        const totalSales = sales.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const outputTax = sales.reduce(
          (sum, inv) => sum + inv.cgst + inv.sgst + inv.igst,
          0
        );

        // Calculate net tax payable
        const netTaxPayable = outputTax - itcAvailable;

        // Get filing status
        const filing = await gstRepository.findGSTFilingByMonth(client.id, month);

        // Derive financial year from month if not available from invoices
        let financialYear = purchases[0]?.financialYear || sales[0]?.financialYear;
        if (!financialYear) {
          const [year, monthNum] = month.split('-').map(Number);
          // Financial year starts in April (month 4)
          const fyStartYear = monthNum >= 4 ? year : year - 1;
          financialYear = `${fyStartYear}-${(fyStartYear + 1).toString().slice(-2)}`;
        }

        const summary: MonthlyGSTSummary = {
          clientId: client.id,
          clientName: client.clientName,
          month,
          financialYear,
          totalPurchases,
          totalSales,
          itcAvailable,
          outputTax,
          netTaxPayable,
          filingStatus: filing?.filingStatus || "pending",
          gstr1Filed: filing?.gstr1Filed || false,
          gstr3bFiled: filing?.gstr3bFiled || false,
        };

        return summary;
      })
    );

    res.json({
      success: true,
      summaries,
    });
  } catch (error) {
    console.error("Error calculating all clients summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate all clients summary",
    });
  }
};

/**
 * Upload document for invoice or filing
 */
export const handleUploadGSTDocument: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { type, entityId, clientId, fileData, fileName } = req.body;

    if (!fileData || !type || !entityId || !clientId || !fileName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Verify access to client
    const client = await gstRepository.findClientById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    if (user.role !== "admin" && client.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get invoice/filing to determine folder structure
    let invoice: PurchaseInvoice | SalesInvoice | undefined;
    let subfolder: "Purchases" | "Sales" | "Returns" | "Challans" = "Purchases";
    let invoiceNumber = "UNKNOWN";

    if (type === "purchase") {
      invoice = await gstRepository.findPurchaseInvoiceById(entityId);
      subfolder = "Purchases";
      if (invoice) {
        invoiceNumber = invoice.invoiceNumber;
      }
    } else if (type === "sales") {
      invoice = await gstRepository.findSalesInvoiceById(entityId);
      subfolder = "Sales";
      if (invoice) {
        invoiceNumber = invoice.invoiceNumber;
      }
    }

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: `${type} invoice not found`,
      });
    }

    // Decode base64 file
    const base64Data = fileData.replace(/^data:[^;]+;base64,/, "");
    const fileBuffer = Buffer.from(base64Data, "base64");

    // Save file using fileStorage utility
    const { saveGSTFile } = await import("../utils/fileStorage");
    const filePath = await saveGSTFile(
      client.clientName,
      invoice.financialYear,
      invoice.month,
      subfolder,
      invoiceNumber,
      "invoice",
      fileBuffer,
      fileName
    );

    // Update invoice with new document path
    const currentDocuments = invoice.documents || [];
    const updatedDocuments = [...currentDocuments, filePath];

    if (type === "purchase") {
      await gstRepository.updatePurchaseInvoice(entityId, {
        documents: updatedDocuments,
      });
    } else if (type === "sales") {
      await gstRepository.updateSalesInvoice(entityId, {
        documents: updatedDocuments,
      });
    }

    // Add audit log
    const auditLog: GSTAuditLog = {
      id: `audit_${Date.now()}`,
      entityType: type as "purchase" | "sales",
      entityId,
      action: "update",
      changes: { addedDocument: filePath },
      performedBy: user.id,
      performedAt: new Date().toISOString(),
    };
    await gstRepository.addAuditLog(auditLog);

    res.json({
      success: true,
      message: "Document uploaded successfully",
      filePath,
      fileName,
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload document",
    });
  }
};

/**
 * Download GST document
 */
export const handleDownloadGSTDocument: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const filePathParam = req.query.filePath;
    const filePath = typeof filePathParam === "string" ? filePathParam : undefined;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: "File path is required",
      });
    }

    // Verify user has access to this file by checking client ownership
    // Extract client name from file path structure: ClientName/FinancialYear/Month/Subfolder/filename
    const pathParts = filePath.split("/");
    if (pathParts.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Invalid file path",
      });
    }

    // Find all clients for this user
    let hasAccess = false;
    if (user.role === "admin") {
      hasAccess = true; // Admins can download all files
    } else {
      const userClients = await gstRepository.findClientsByUserId(user.id);
      // Check if any of user's clients match the file path
      const clientNameFromPath = pathParts[0].replace(/_/g, " "); // Sanitized names use underscores
      hasAccess = userClients.some(client => {
        const sanitizedClientName = client.clientName.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
        return sanitizedClientName === pathParts[0] || 
               client.clientName.toLowerCase() === clientNameFromPath.toLowerCase();
      });
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { readGSTFile } = await import("../utils/fileStorage");
    const fileBuffer = await readGSTFile(filePath);

    // Extract filename from path
    const fileName = filePath.split("/").pop() || "download.pdf";

    // Set appropriate content type based on file extension
    const ext = fileName.split(".").pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
    const contentType = contentTypes[ext || ""] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error("Error downloading document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download document",
    });
  }
};

/**
 * Delete GST document
 */
export const handleDeleteGSTDocument: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const { filePath, entityId, type } = req.body;

    if (!filePath || !entityId || !type) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Get invoice to verify ownership
    let invoice: PurchaseInvoice | SalesInvoice | undefined;
    
    if (type === "purchase") {
      invoice = await gstRepository.findPurchaseInvoiceById(entityId);
    } else if (type === "sales") {
      invoice = await gstRepository.findSalesInvoiceById(entityId);
    }

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: `${type} invoice not found`,
      });
    }

    const client = await gstRepository.findClientById(invoice.clientId);
    if (!client || (user.role !== "admin" && client.userId !== user.id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Delete file from storage
    const { deleteGSTFile } = await import("../utils/fileStorage");
    await deleteGSTFile(filePath);

    // Update invoice to remove document path
    const updatedDocuments = (invoice.documents || []).filter(doc => doc !== filePath);

    if (type === "purchase") {
      await gstRepository.updatePurchaseInvoice(entityId, {
        documents: updatedDocuments,
      });
    } else if (type === "sales") {
      await gstRepository.updateSalesInvoice(entityId, {
        documents: updatedDocuments,
      });
    }

    // Add audit log
    const auditLog: GSTAuditLog = {
      id: `audit_${Date.now()}`,
      entityType: type as "purchase" | "sales",
      entityId,
      action: "update",
      changes: { deletedDocument: filePath },
      performedBy: user.id,
      performedAt: new Date().toISOString(),
    };
    await gstRepository.addAuditLog(auditLog);

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete document",
    });
  }
};
