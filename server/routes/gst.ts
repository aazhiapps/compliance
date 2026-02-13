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

/**
 * Create a new GST client
 */
export const handleCreateGSTClient: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    
    const data = req.body as CreateGSTClientRequest;

    // Check if GSTIN already exists
    const existing = gstRepository.findClientByGSTIN(data.gstin);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A client with this GSTIN already exists",
      });
    }

    // Create new client
    const client: GSTClient = {
      id: `gst_client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const created = gstRepository.createClient(client);

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
    gstRepository.addAuditLog(auditLog);

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
    const user = userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    
    let clients: GSTClient[];
    if (user.role === "admin") {
      clients = gstRepository.findAllClients();
    } else {
      clients = gstRepository.findClientsByUserId(user.id);
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
    const user = userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const client = gstRepository.findClientById(id);
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
    const user = userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }
    const updates = req.body;

    const client = gstRepository.findClientById(id);
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

    const updated = gstRepository.updateClient(id, updates);

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
    gstRepository.addAuditLog(auditLog);

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
    const user = userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const data = req.body as CreatePurchaseInvoiceRequest;

    // Verify client exists and user has access
    const client = gstRepository.findClientById(data.clientId);
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

    const created = gstRepository.createPurchaseInvoice(invoice);

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
    gstRepository.addAuditLog(auditLog);

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
    const user = userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { clientId } = req.params;
    if (!clientId || Array.isArray(clientId)) {
      return res.status(400).json({ success: false, message: "Invalid client ID" });
    }
    const monthParam = req.query.month;
    const month = typeof monthParam === "string" ? monthParam : undefined;

    const client = gstRepository.findClientById(clientId);
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
      invoices = gstRepository.findPurchaseInvoicesByMonth(clientId, month);
    } else {
      invoices = gstRepository.findPurchaseInvoicesByClientId(clientId);
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
    const user = userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }
    const updates = req.body;

    const invoice = gstRepository.findPurchaseInvoiceById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const client = gstRepository.findClientById(invoice.clientId);
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

    const updated = gstRepository.updatePurchaseInvoice(id, updates);

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
    gstRepository.addAuditLog(auditLog);

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
    const user = userRepository.findById(userId);
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

    const invoice = gstRepository.findPurchaseInvoiceById(id);
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

    gstRepository.deletePurchaseInvoice(id);

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
    gstRepository.addAuditLog(auditLog);

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
    const user = userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const data = req.body as CreateSalesInvoiceRequest;

    const client = gstRepository.findClientById(data.clientId);
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

    const created = gstRepository.createSalesInvoice(invoice);

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
    gstRepository.addAuditLog(auditLog);

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
    const user = userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { clientId } = req.params;
    if (!clientId || Array.isArray(clientId)) {
      return res.status(400).json({ success: false, message: "Invalid client ID" });
    }
    const monthParam = req.query.month;
    const month = typeof monthParam === "string" ? monthParam : undefined;

    const client = gstRepository.findClientById(clientId);
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
      invoices = gstRepository.findSalesInvoicesByMonth(clientId, month);
    } else {
      invoices = gstRepository.findSalesInvoicesByClientId(clientId);
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
    const user = userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { id } = req.params;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }
    const updates = req.body;

    const invoice = gstRepository.findSalesInvoiceById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const client = gstRepository.findClientById(invoice.clientId);
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

    const updated = gstRepository.updateSalesInvoice(id, updates);

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
    gstRepository.addAuditLog(auditLog);

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
    const user = userRepository.findById(userId);
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

    const invoice = gstRepository.findSalesInvoiceById(id);
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

    gstRepository.deleteSalesInvoice(id);

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
    gstRepository.addAuditLog(auditLog);

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
    const user = userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const data = req.body as UpdateGSTFilingRequest;

    const client = gstRepository.findClientById(data.clientId);
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
    let filing = gstRepository.findGSTFilingByMonth(
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

    const updated = gstRepository.upsertGSTFiling({ ...filing, ...updates });

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
    gstRepository.addAuditLog(auditLog);

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
    const user = userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { clientId } = req.params;
    if (!clientId || Array.isArray(clientId)) {
      return res.status(400).json({ success: false, message: "Invalid client ID" });
    }
    const fyParam = req.query.financialYear;
    const financialYear = typeof fyParam === "string" ? fyParam : undefined;

    const client = gstRepository.findClientById(clientId);
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
      filings = gstRepository.findGSTFilingsByYear(clientId, financialYear);
    } else {
      filings = gstRepository.findGSTFilingsByClientId(clientId);
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
    const user = userRepository.findById(userId);
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

    const client = gstRepository.findClientById(clientId);
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
    const purchases = gstRepository.findPurchaseInvoicesByMonth(clientId, month);
    const totalPurchases = purchases.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const itcAvailable = purchases.reduce(
      (sum, inv) => sum + inv.cgst + inv.sgst + inv.igst,
      0
    );

    // Get sales for the month
    const sales = gstRepository.findSalesInvoicesByMonth(clientId, month);
    const totalSales = sales.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const outputTax = sales.reduce(
      (sum, inv) => sum + inv.cgst + inv.sgst + inv.igst,
      0
    );

    // Calculate net tax payable
    const netTaxPayable = outputTax - itcAvailable;

    // Get filing status
    const filing = gstRepository.findGSTFilingByMonth(clientId, month);

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
    const user = userRepository.findById(userId);
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
      clients = gstRepository.findAllClients();
    } else {
      clients = gstRepository.findClientsByUserId(user.id);
    }

    // Calculate summary for each client
    const summaries: MonthlyGSTSummary[] = [];
    for (const client of clients) {
      // Get purchases for the month
      const purchases = gstRepository.findPurchaseInvoicesByMonth(client.id, month);
      const totalPurchases = purchases.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const itcAvailable = purchases.reduce(
        (sum, inv) => sum + inv.cgst + inv.sgst + inv.igst,
        0
      );

      // Get sales for the month
      const sales = gstRepository.findSalesInvoicesByMonth(client.id, month);
      const totalSales = sales.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const outputTax = sales.reduce(
        (sum, inv) => sum + inv.cgst + inv.sgst + inv.igst,
        0
      );

      // Calculate net tax payable
      const netTaxPayable = outputTax - itcAvailable;

      // Get filing status
      const filing = gstRepository.findGSTFilingByMonth(client.id, month);

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

      summaries.push(summary);
    }

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
    const user = userRepository.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const { type, entityId } = req.body;
    const file = req.body.fileData; // Base64 encoded file

    if (!file || !type || !entityId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // TODO: Implement actual file upload handling
    // This is a placeholder for the file upload logic
    
    res.json({
      success: true,
      message: "Document uploaded successfully",
      filePath: `uploads/${entityId}_${Date.now()}.pdf`,
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload document",
    });
  }
};
