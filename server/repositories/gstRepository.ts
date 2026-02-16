import {
  GSTClient,
  PurchaseInvoice,
  SalesInvoice,
  GSTReturnFiling,
  GSTAuditLog,
  StaffAssignment,
  ClientFilingStatusReport,
  AnnualComplianceSummary,
} from "@shared/gst";
import { GSTClientModel } from "../models/GSTClient";
import { PurchaseInvoiceModel } from "../models/PurchaseInvoice";
import { SalesInvoiceModel } from "../models/SalesInvoice";
import { GSTReturnFilingModel } from "../models/GSTReturnFiling";
import { GSTAuditLogModel } from "../models/GSTAuditLog";
import { StaffAssignmentModel } from "../models/StaffAssignment";

/**
 * GST Repository - abstracts GST data storage using MongoDB
 */
class GSTRepository {
  // ============ CLIENT OPERATIONS ============

  /**
   * Create a new GST client
   */
  async createClient(client: GSTClient): Promise<GSTClient> {
    // Set default status if not provided
    if (!client.status) {
      client.status = "active";
    }
    const newClient = await GSTClientModel.create(client);
    const json = newClient.toJSON();
    return json as unknown as GSTClient;
  }

  /**
   * Upsert a GST client (create or update based on ID)
   */
  async upsertClient(client: GSTClient): Promise<GSTClient> {
    // Set default status if not provided
    if (!client.status) {
      client.status = "active";
    }
    
    // Use findOneAndUpdate with upsert option for atomic operation
    const result = await GSTClientModel.findOneAndUpdate(
      { _id: client.id },
      { ...client, updatedAt: new Date().toISOString() },
      { new: true, upsert: true }
    );
    
    return result.toJSON() as unknown as GSTClient;
  }

  /**
   * Find a client by ID
   */
  async findClientById(id: string): Promise<GSTClient | undefined> {
    const client = await GSTClientModel.findById(id);
    if (!client) return undefined;
    const json = client.toJSON();
    return json as unknown as GSTClient;
  }

  /**
   * Find all clients for a user
   */
  async findClientsByUserId(userId: string): Promise<GSTClient[]> {
    const clients = await GSTClientModel.find({ userId });
    return clients.map((client) => client.toJSON() as unknown as GSTClient);
  }

  /**
   * Find client by GSTIN
   */
  async findClientByGSTIN(gstin: string): Promise<GSTClient | undefined> {
    const client = await GSTClientModel.findOne({ gstin: gstin.toUpperCase() });
    if (!client) return undefined;
    const json = client.toJSON();
    return json as unknown as GSTClient;
  }

  /**
   * Get all clients (admin only)
   */
  async findAllClients(): Promise<GSTClient[]> {
    const clients = await GSTClientModel.find();
    return clients.map((client) => client.toJSON() as unknown as GSTClient);
  }

  /**
   * Update a client
   */
  async updateClient(id: string, updates: Partial<GSTClient>): Promise<GSTClient | undefined> {
    const client = await GSTClientModel.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date().toISOString() },
      { new: true }
    );
    if (!client) return undefined;
    const json = client.toJSON();
    return json as unknown as GSTClient;
  }

  /**
   * Delete a client
   */
  async deleteClient(id: string): Promise<boolean> {
    const result = await GSTClientModel.findByIdAndDelete(id);
    return result !== null;
  }

  // ============ PURCHASE INVOICE OPERATIONS ============

  /**
   * Create a purchase invoice
   */
  async createPurchaseInvoice(invoice: PurchaseInvoice): Promise<PurchaseInvoice> {
    const newInvoice = await PurchaseInvoiceModel.create(invoice);
    return newInvoice.toJSON() as PurchaseInvoice;
  }

  /**
   * Upsert a purchase invoice (create or update based on ID)
   */
  async upsertPurchaseInvoice(invoice: PurchaseInvoice): Promise<PurchaseInvoice> {
    // Use findOneAndUpdate with upsert option for atomic operation
    const result = await PurchaseInvoiceModel.findOneAndUpdate(
      { _id: invoice.id },
      { ...invoice, updatedAt: new Date().toISOString() },
      { new: true, upsert: true }
    );
    
    return result.toJSON() as PurchaseInvoice;
  }

  /**
   * Find purchase invoice by ID
   */
  async findPurchaseInvoiceById(id: string): Promise<PurchaseInvoice | undefined> {
    const invoice = await PurchaseInvoiceModel.findById(id);
    return invoice ? (invoice.toJSON() as PurchaseInvoice) : undefined;
  }

  /**
   * Find all purchase invoices for a client
   */
  async findPurchaseInvoicesByClientId(clientId: string): Promise<PurchaseInvoice[]> {
    const invoices = await PurchaseInvoiceModel.find({ clientId }).sort({ invoiceDate: -1 });
    return invoices.map((invoice) => invoice.toJSON() as PurchaseInvoice);
  }

  /**
   * Find purchase invoices by client and month
   */
  async findPurchaseInvoicesByMonth(
    clientId: string,
    month: string
  ): Promise<PurchaseInvoice[]> {
    const invoices = await PurchaseInvoiceModel.find({ clientId, month });
    return invoices.map((invoice) => invoice.toJSON() as PurchaseInvoice);
  }

  /**
   * Update a purchase invoice
   */
  async updatePurchaseInvoice(
    id: string,
    updates: Partial<PurchaseInvoice>
  ): Promise<PurchaseInvoice | undefined> {
    const invoice = await PurchaseInvoiceModel.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date().toISOString() },
      { new: true }
    );
    return invoice ? (invoice.toJSON() as PurchaseInvoice) : undefined;
  }

  /**
   * Delete a purchase invoice
   */
  async deletePurchaseInvoice(id: string): Promise<boolean> {
    const result = await PurchaseInvoiceModel.findByIdAndDelete(id);
    return result !== null;
  }

  // ============ SALES INVOICE OPERATIONS ============

  /**
   * Create a sales invoice
   */
  async createSalesInvoice(invoice: SalesInvoice): Promise<SalesInvoice> {
    const newInvoice = await SalesInvoiceModel.create(invoice);
    return newInvoice.toJSON() as SalesInvoice;
  }

  /**
   * Upsert a sales invoice (create or update based on ID)
   */
  async upsertSalesInvoice(invoice: SalesInvoice): Promise<SalesInvoice> {
    // Use findOneAndUpdate with upsert option for atomic operation
    const result = await SalesInvoiceModel.findOneAndUpdate(
      { _id: invoice.id },
      { ...invoice, updatedAt: new Date().toISOString() },
      { new: true, upsert: true }
    );
    
    return result.toJSON() as SalesInvoice;
  }

  /**
   * Find sales invoice by ID
   */
  async findSalesInvoiceById(id: string): Promise<SalesInvoice | undefined> {
    const invoice = await SalesInvoiceModel.findById(id);
    return invoice ? (invoice.toJSON() as SalesInvoice) : undefined;
  }

  /**
   * Find all sales invoices for a client
   */
  async findSalesInvoicesByClientId(clientId: string): Promise<SalesInvoice[]> {
    const invoices = await SalesInvoiceModel.find({ clientId }).sort({ invoiceDate: -1 });
    return invoices.map((invoice) => invoice.toJSON() as SalesInvoice);
  }

  /**
   * Find sales invoices by client and month
   */
  async findSalesInvoicesByMonth(clientId: string, month: string): Promise<SalesInvoice[]> {
    const invoices = await SalesInvoiceModel.find({ clientId, month });
    return invoices.map((invoice) => invoice.toJSON() as SalesInvoice);
  }

  /**
   * Update a sales invoice
   */
  async updateSalesInvoice(
    id: string,
    updates: Partial<SalesInvoice>
  ): Promise<SalesInvoice | undefined> {
    const invoice = await SalesInvoiceModel.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date().toISOString() },
      { new: true }
    );
    return invoice ? (invoice.toJSON() as SalesInvoice) : undefined;
  }

  /**
   * Delete a sales invoice
   */
  async deleteSalesInvoice(id: string): Promise<boolean> {
    const result = await SalesInvoiceModel.findByIdAndDelete(id);
    return result !== null;
  }

  // ============ GST FILING OPERATIONS ============

  /**
   * Create or update GST filing record
   */
  async upsertGSTFiling(filing: GSTReturnFiling): Promise<GSTReturnFiling> {
    const existing = await GSTReturnFilingModel.findOne({
      clientId: filing.clientId,
      month: filing.month,
    });
    
    if (existing) {
      // Update existing
      const updated = await GSTReturnFilingModel.findByIdAndUpdate(
        existing._id,
        { ...filing, updatedAt: new Date().toISOString() },
        { new: true }
      );
      return updated!.toJSON() as GSTReturnFiling;
    } else {
      // Create new
      const newFiling = await GSTReturnFilingModel.create(filing);
      return newFiling.toJSON() as GSTReturnFiling;
    }
  }

  /**
   * Find GST filing by client and month
   */
  async findGSTFilingByMonth(
    clientId: string,
    month: string
  ): Promise<GSTReturnFiling | undefined> {
    const filing = await GSTReturnFilingModel.findOne({ clientId, month });
    return filing ? (filing.toJSON() as GSTReturnFiling) : undefined;
  }

  /**
   * Find all GST filings for a client
   */
  async findGSTFilingsByClientId(clientId: string): Promise<GSTReturnFiling[]> {
    const filings = await GSTReturnFilingModel.find({ clientId }).sort({ month: -1 });
    return filings.map((filing) => filing.toJSON() as GSTReturnFiling);
  }

  /**
   * Find GST filings by financial year
   */
  async findGSTFilingsByYear(
    clientId: string,
    financialYear: string
  ): Promise<GSTReturnFiling[]> {
    const filings = await GSTReturnFilingModel.find({ clientId, financialYear }).sort({ month: 1 });
    return filings.map((filing) => filing.toJSON() as GSTReturnFiling);
  }

  // ============ AUDIT LOG OPERATIONS ============

  /**
   * Add an audit log entry
   */
  async addAuditLog(log: GSTAuditLog): Promise<void> {
    await GSTAuditLogModel.create(log);
  }

  /**
   * Get audit logs for an entity
   */
  async getAuditLogs(entityType: string, entityId: string): Promise<GSTAuditLog[]> {
    const logs = await GSTAuditLogModel.find({ entityType, entityId }).sort({ performedAt: -1 });
    return logs.map((log) => log.toJSON() as GSTAuditLog);
  }

  /**
   * Get recent audit logs
   */
  async getRecentAuditLogs(limit: number = 100): Promise<GSTAuditLog[]> {
    const logs = await GSTAuditLogModel.find().sort({ performedAt: -1 }).limit(limit);
    return logs.map((log) => log.toJSON() as GSTAuditLog);
  }

  // ============ ADDITIONAL OPERATIONS FOR ENHANCED FEATURES ============

  /**
   * Find active clients only
   */
  async findActiveClients(): Promise<GSTClient[]> {
    const clients = await GSTClientModel.find({ status: "active" });
    return clients.map((client) => client.toJSON() as GSTClient);
  }

  /**
   * Find active clients for a user
   */
  async findActiveClientsByUserId(userId: string): Promise<GSTClient[]> {
    const clients = await GSTClientModel.find({ userId, status: "active" });
    return clients.map((client) => client.toJSON() as GSTClient);
  }

  /**
   * Deactivate a client
   */
  async deactivateClient(clientId: string, userId: string): Promise<GSTClient | undefined> {
    const client = await GSTClientModel.findByIdAndUpdate(
      clientId,
      {
        status: "inactive",
        deactivatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { new: true }
    );
    return client ? (client.toJSON() as GSTClient) : undefined;
  }

  /**
   * Reactivate a client
   */
  async reactivateClient(clientId: string): Promise<GSTClient | undefined> {
    const client = await GSTClientModel.findByIdAndUpdate(
      clientId,
      {
        status: "active",
        $unset: { deactivatedAt: "" },
        updatedAt: new Date().toISOString(),
      },
      { new: true }
    );
    return client ? (client.toJSON() as GSTClient) : undefined;
  }

  /**
   * Check if month is locked for a client
   */
  async isMonthLocked(clientId: string, month: string): Promise<boolean> {
    const filing = await this.findGSTFilingByMonth(clientId, month);
    return filing?.isLocked || false;
  }

  /**
   * Lock a month to prevent further edits
   */
  async lockMonth(clientId: string, month: string, userId: string): Promise<GSTReturnFiling | undefined> {
    const filing = await GSTReturnFilingModel.findOneAndUpdate(
      { clientId, month },
      {
        isLocked: true,
        lockedAt: new Date().toISOString(),
        lockedBy: userId,
        updatedAt: new Date().toISOString(),
      },
      { new: true }
    );
    return filing ? (filing.toJSON() as GSTReturnFiling) : undefined;
  }

  /**
   * Unlock a month to allow edits (admin only, for amendments)
   */
  async unlockMonth(clientId: string, month: string): Promise<GSTReturnFiling | undefined> {
    const filing = await GSTReturnFilingModel.findOneAndUpdate(
      { clientId, month },
      {
        isLocked: false,
        $unset: { lockedAt: "", lockedBy: "" },
        updatedAt: new Date().toISOString(),
      },
      { new: true }
    );
    return filing ? (filing.toJSON() as GSTReturnFiling) : undefined;
  }

  /**
   * Assign staff to a client
   */
  async assignStaffToClient(clientId: string, staffUserId: string): Promise<boolean> {
    const client = await GSTClientModel.findById(clientId);
    if (!client) {
      return false;
    }
    if (!client.assignedStaff) {
      client.assignedStaff = [];
    }
    if (!client.assignedStaff.includes(staffUserId)) {
      client.assignedStaff.push(staffUserId);
      client.updatedAt = new Date().toISOString();
      await client.save();
    }
    return true;
  }

  /**
   * Remove staff assignment from a client
   */
  async removeStaffFromClient(clientId: string, staffUserId: string): Promise<boolean> {
    const client = await GSTClientModel.findByIdAndUpdate(
      clientId,
      {
        $pull: { assignedStaff: staffUserId },
        updatedAt: new Date().toISOString(),
      },
      { new: true }
    );
    return client !== null;
  }

  /**
   * Get clients assigned to a staff member
   */
  async findClientsByStaffUserId(staffUserId: string): Promise<GSTClient[]> {
    const clients = await GSTClientModel.find({ assignedStaff: staffUserId });
    return clients.map((client) => client.toJSON() as GSTClient);
  }

  /**
   * Get all staff assignments
   */
  async getAllStaffAssignments(): Promise<StaffAssignment[]> {
    const assignments = await StaffAssignmentModel.find();
    return assignments.map((assignment) => assignment.toJSON() as StaffAssignment);
  }

  /**
   * Create a staff assignment record
   */
  async createStaffAssignment(assignment: StaffAssignment): Promise<StaffAssignment> {
    const newAssignment = await StaffAssignmentModel.create(assignment);
    return newAssignment.toJSON() as StaffAssignment;
  }

  /**
   * Find staff assignment by ID
   */
  async findStaffAssignmentById(id: string): Promise<StaffAssignment | undefined> {
    const assignment = await StaffAssignmentModel.findById(id);
    return assignment ? (assignment.toJSON() as StaffAssignment) : undefined;
  }

  /**
   * Find staff assignment by staff user ID
   */
  async findStaffAssignmentByUserId(staffUserId: string): Promise<StaffAssignment | undefined> {
    const assignment = await StaffAssignmentModel.findOne({ staffUserId });
    return assignment ? (assignment.toJSON() as StaffAssignment) : undefined;
  }

  /**
   * Update staff assignment
   */
  async updateStaffAssignment(id: string, updates: Partial<StaffAssignment>): Promise<StaffAssignment | undefined> {
    const assignment = await StaffAssignmentModel.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );
    return assignment ? (assignment.toJSON() as StaffAssignment) : undefined;
  }

  /**
   * Delete staff assignment
   */
  async deleteStaffAssignment(id: string): Promise<boolean> {
    const result = await StaffAssignmentModel.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Get client filing status report
   */
  async getClientFilingStatusReport(clientId: string): Promise<ClientFilingStatusReport | undefined> {
    const client = await this.findClientById(clientId);
    if (!client) {
      return undefined;
    }

    const filings = await this.findGSTFilingsByClientId(clientId);

    const today = new Date();
    const pendingMonths: string[] = [];
    const overdueMonths: string[] = [];
    let totalPendingAmount = 0;
    let lastFiledMonth: string | undefined;

    filings.forEach(filing => {
      // Check if fully filed
      const isFullyFiled = filing.gstr1Filed && filing.gstr3bFiled;
      
      if (isFullyFiled) {
        if (!lastFiledMonth || filing.month > lastFiledMonth) {
          lastFiledMonth = filing.month;
        }
      } else {
        pendingMonths.push(filing.month);
        
        // Check if overdue
        if (filing.gstr3bDueDate) {
          const dueDate = new Date(filing.gstr3bDueDate);
          if (today > dueDate) {
            overdueMonths.push(filing.month);
            totalPendingAmount += filing.taxPaid + filing.lateFee + filing.interest;
          }
        }
      }
    });

    // Calculate compliance score (on-time filings / total filings)
    const totalFilings = filings.length;
    const onTimeFilings = filings.filter(f => 
      f.gstr1Filed && f.gstr3bFiled && f.filingStatus === "filed"
    ).length;
    const complianceScore = totalFilings > 0 ? Math.round((onTimeFilings / totalFilings) * 100) : 0;

    // Get current period based on filing frequency
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    return {
      clientId: client.id,
      clientName: client.clientName,
      gstin: client.gstin,
      status: client.status,
      filingFrequency: client.filingFrequency,
      currentPeriod: currentMonth,
      lastFiledMonth,
      pendingMonths,
      overdueMonths,
      totalPendingAmount,
      complianceScore
    };
  }

  /**
   * Get annual compliance summary
   */
  async getAnnualComplianceSummary(clientId: string, financialYear: string): Promise<AnnualComplianceSummary | undefined> {
    const client = await this.findClientById(clientId);
    if (!client) {
      return undefined;
    }

    const filings = await this.findGSTFilingsByYear(clientId, financialYear);

    const purchases = await PurchaseInvoiceModel.find({ clientId, financialYear });
    const sales = await SalesInvoiceModel.find({ clientId, financialYear });

    const totalMonthsTracked = filings.length;
    const monthsFiled = filings.filter(f => f.gstr1Filed && f.gstr3bFiled).length;
    const monthsPending = filings.filter(f => !f.gstr1Filed || !f.gstr3bFiled).length;
    const monthsLate = filings.filter(f => f.filingStatus === "late" || f.filingStatus === "overdue").length;

    const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
    const totalTaxPaid = filings.reduce((sum, f) => sum + f.taxPaid, 0);
    const totalLateFees = filings.reduce((sum, f) => sum + f.lateFee, 0);
    const totalInterest = filings.reduce((sum, f) => sum + f.interest, 0);

    const complianceRate = totalMonthsTracked > 0 
      ? Math.round((monthsFiled / totalMonthsTracked) * 100) 
      : 0;

    // Check for GSTR-9 (annual return) - this would be a separate filing
    // For now, we'll assume it's not implemented
    const gstr9Filed = false;

    return {
      clientId: client.id,
      clientName: client.clientName,
      financialYear,
      totalMonthsTracked,
      monthsFiled,
      monthsPending,
      monthsLate,
      totalSales,
      totalPurchases,
      totalTaxPaid,
      totalLateFees,
      totalInterest,
      complianceRate,
      gstr9Filed
    };
  }

  /**
   * Get all filings (for notification service)
   */
  async getAllFilings(): Promise<GSTReturnFiling[]> {
    const filings = await GSTReturnFilingModel.find();
    return filings.map((filing) => filing.toJSON() as GSTReturnFiling);
  }
}

export const gstRepository = new GSTRepository();
