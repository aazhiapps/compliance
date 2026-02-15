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

/**
 * GST Repository - abstracts GST data storage
 * In a real application, this would interact with a database
 */
class GSTRepository {
  private clients: Map<string, GSTClient>;
  private purchaseInvoices: Map<string, PurchaseInvoice>;
  private salesInvoices: Map<string, SalesInvoice>;
  private filings: Map<string, GSTReturnFiling>;
  private auditLogs: GSTAuditLog[];
  private staffAssignments: Map<string, StaffAssignment>;

  constructor() {
    this.clients = new Map();
    this.purchaseInvoices = new Map();
    this.salesInvoices = new Map();
    this.filings = new Map();
    this.auditLogs = [];
    this.staffAssignments = new Map();
  }

  // ============ CLIENT OPERATIONS ============

  /**
   * Create a new GST client
   */
  createClient(client: GSTClient): GSTClient {
    // Set default status if not provided
    if (!client.status) {
      client.status = "active";
    }
    this.clients.set(client.id, client);
    return client;
  }

  /**
   * Find a client by ID
   */
  findClientById(id: string): GSTClient | undefined {
    return this.clients.get(id);
  }

  /**
   * Find all clients for a user
   */
  findClientsByUserId(userId: string): GSTClient[] {
    return Array.from(this.clients.values()).filter(
      (client) => client.userId === userId
    );
  }

  /**
   * Find client by GSTIN
   */
  findClientByGSTIN(gstin: string): GSTClient | undefined {
    return Array.from(this.clients.values()).find(
      (client) => client.gstin === gstin
    );
  }

  /**
   * Get all clients (admin only)
   */
  findAllClients(): GSTClient[] {
    return Array.from(this.clients.values());
  }

  /**
   * Update a client
   */
  updateClient(id: string, updates: Partial<GSTClient>): GSTClient | undefined {
    const client = this.clients.get(id);
    if (!client) {
      return undefined;
    }
    const updated = { ...client, ...updates, updatedAt: new Date().toISOString() };
    this.clients.set(id, updated);
    return updated;
  }

  /**
   * Delete a client
   */
  deleteClient(id: string): boolean {
    return this.clients.delete(id);
  }

  // ============ PURCHASE INVOICE OPERATIONS ============

  /**
   * Create a purchase invoice
   */
  createPurchaseInvoice(invoice: PurchaseInvoice): PurchaseInvoice {
    this.purchaseInvoices.set(invoice.id, invoice);
    return invoice;
  }

  /**
   * Find purchase invoice by ID
   */
  findPurchaseInvoiceById(id: string): PurchaseInvoice | undefined {
    return this.purchaseInvoices.get(id);
  }

  /**
   * Find all purchase invoices for a client
   */
  findPurchaseInvoicesByClientId(clientId: string): PurchaseInvoice[] {
    return Array.from(this.purchaseInvoices.values()).filter(
      (invoice) => invoice.clientId === clientId
    );
  }

  /**
   * Find purchase invoices by client and month
   */
  findPurchaseInvoicesByMonth(
    clientId: string,
    month: string
  ): PurchaseInvoice[] {
    return Array.from(this.purchaseInvoices.values()).filter(
      (invoice) => invoice.clientId === clientId && invoice.month === month
    );
  }

  /**
   * Update a purchase invoice
   */
  updatePurchaseInvoice(
    id: string,
    updates: Partial<PurchaseInvoice>
  ): PurchaseInvoice | undefined {
    const invoice = this.purchaseInvoices.get(id);
    if (!invoice) {
      return undefined;
    }
    const updated = { ...invoice, ...updates, updatedAt: new Date().toISOString() };
    this.purchaseInvoices.set(id, updated);
    return updated;
  }

  /**
   * Delete a purchase invoice
   */
  deletePurchaseInvoice(id: string): boolean {
    return this.purchaseInvoices.delete(id);
  }

  // ============ SALES INVOICE OPERATIONS ============

  /**
   * Create a sales invoice
   */
  createSalesInvoice(invoice: SalesInvoice): SalesInvoice {
    this.salesInvoices.set(invoice.id, invoice);
    return invoice;
  }

  /**
   * Find sales invoice by ID
   */
  findSalesInvoiceById(id: string): SalesInvoice | undefined {
    return this.salesInvoices.get(id);
  }

  /**
   * Find all sales invoices for a client
   */
  findSalesInvoicesByClientId(clientId: string): SalesInvoice[] {
    return Array.from(this.salesInvoices.values()).filter(
      (invoice) => invoice.clientId === clientId
    );
  }

  /**
   * Find sales invoices by client and month
   */
  findSalesInvoicesByMonth(clientId: string, month: string): SalesInvoice[] {
    return Array.from(this.salesInvoices.values()).filter(
      (invoice) => invoice.clientId === clientId && invoice.month === month
    );
  }

  /**
   * Update a sales invoice
   */
  updateSalesInvoice(
    id: string,
    updates: Partial<SalesInvoice>
  ): SalesInvoice | undefined {
    const invoice = this.salesInvoices.get(id);
    if (!invoice) {
      return undefined;
    }
    const updated = { ...invoice, ...updates, updatedAt: new Date().toISOString() };
    this.salesInvoices.set(id, updated);
    return updated;
  }

  /**
   * Delete a sales invoice
   */
  deleteSalesInvoice(id: string): boolean {
    return this.salesInvoices.delete(id);
  }

  // ============ GST FILING OPERATIONS ============

  /**
   * Create or update GST filing record
   */
  upsertGSTFiling(filing: GSTReturnFiling): GSTReturnFiling {
    const existing = Array.from(this.filings.values()).find(
      (f) => f.clientId === filing.clientId && f.month === filing.month
    );
    
    if (existing) {
      // Update existing
      const updated = { ...existing, ...filing, updatedAt: new Date().toISOString() };
      this.filings.set(updated.id, updated);
      return updated;
    } else {
      // Create new
      this.filings.set(filing.id, filing);
      return filing;
    }
  }

  /**
   * Find GST filing by client and month
   */
  findGSTFilingByMonth(
    clientId: string,
    month: string
  ): GSTReturnFiling | undefined {
    return Array.from(this.filings.values()).find(
      (filing) => filing.clientId === clientId && filing.month === month
    );
  }

  /**
   * Find all GST filings for a client
   */
  findGSTFilingsByClientId(clientId: string): GSTReturnFiling[] {
    return Array.from(this.filings.values()).filter(
      (filing) => filing.clientId === clientId
    );
  }

  /**
   * Find GST filings by financial year
   */
  findGSTFilingsByYear(
    clientId: string,
    financialYear: string
  ): GSTReturnFiling[] {
    return Array.from(this.filings.values()).filter(
      (filing) =>
        filing.clientId === clientId && filing.financialYear === financialYear
    );
  }

  // ============ AUDIT LOG OPERATIONS ============

  /**
   * Add an audit log entry
   */
  addAuditLog(log: GSTAuditLog): void {
    this.auditLogs.push(log);
  }

  /**
   * Get audit logs for an entity
   */
  getAuditLogs(entityType: string, entityId: string): GSTAuditLog[] {
    return this.auditLogs.filter(
      (log) => log.entityType === entityType && log.entityId === entityId
    );
  }

  /**
   * Get recent audit logs
   */
  getRecentAuditLogs(limit: number = 100): GSTAuditLog[] {
    return this.auditLogs.slice(-limit);
  }

  // ============ ADDITIONAL OPERATIONS FOR ENHANCED FEATURES ============

  /**
   * Find active clients only
   */
  findActiveClients(): GSTClient[] {
    return Array.from(this.clients.values()).filter(
      (client) => client.status === "active"
    );
  }

  /**
   * Find active clients for a user
   */
  findActiveClientsByUserId(userId: string): GSTClient[] {
    return Array.from(this.clients.values()).filter(
      (client) => client.userId === userId && client.status === "active"
    );
  }

  /**
   * Deactivate a client
   */
  deactivateClient(clientId: string, userId: string): GSTClient | undefined {
    const client = this.clients.get(clientId);
    if (!client) {
      return undefined;
    }
    client.status = "inactive";
    client.deactivatedAt = new Date().toISOString();
    client.updatedAt = new Date().toISOString();
    this.clients.set(clientId, client);
    return client;
  }

  /**
   * Reactivate a client
   */
  reactivateClient(clientId: string): GSTClient | undefined {
    const client = this.clients.get(clientId);
    if (!client) {
      return undefined;
    }
    client.status = "active";
    client.deactivatedAt = undefined;
    client.updatedAt = new Date().toISOString();
    this.clients.set(clientId, client);
    return client;
  }

  /**
   * Check if month is locked for a client
   */
  isMonthLocked(clientId: string, month: string): boolean {
    const filing = this.findFilingByClientAndMonth(clientId, month);
    return filing?.isLocked || false;
  }

  /**
   * Lock a month to prevent further edits
   */
  lockMonth(clientId: string, month: string, userId: string): GSTReturnFiling | undefined {
    const filing = this.findFilingByClientAndMonth(clientId, month);
    if (!filing) {
      return undefined;
    }
    filing.isLocked = true;
    filing.lockedAt = new Date().toISOString();
    filing.lockedBy = userId;
    filing.updatedAt = new Date().toISOString();
    this.filings.set(filing.id, filing);
    return filing;
  }

  /**
   * Unlock a month to allow edits (admin only, for amendments)
   */
  unlockMonth(clientId: string, month: string): GSTReturnFiling | undefined {
    const filing = this.findFilingByClientAndMonth(clientId, month);
    if (!filing) {
      return undefined;
    }
    filing.isLocked = false;
    filing.lockedAt = undefined;
    filing.lockedBy = undefined;
    filing.updatedAt = new Date().toISOString();
    this.filings.set(filing.id, filing);
    return filing;
  }

  /**
   * Assign staff to a client
   */
  assignStaffToClient(clientId: string, staffUserId: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }
    if (!client.assignedStaff) {
      client.assignedStaff = [];
    }
    if (!client.assignedStaff.includes(staffUserId)) {
      client.assignedStaff.push(staffUserId);
      client.updatedAt = new Date().toISOString();
      this.clients.set(clientId, client);
    }
    return true;
  }

  /**
   * Remove staff assignment from a client
   */
  removeStaffFromClient(clientId: string, staffUserId: string): boolean {
    const client = this.clients.get(clientId);
    if (!client || !client.assignedStaff) {
      return false;
    }
    client.assignedStaff = client.assignedStaff.filter(id => id !== staffUserId);
    client.updatedAt = new Date().toISOString();
    this.clients.set(clientId, client);
    return true;
  }

  /**
   * Get clients assigned to a staff member
   */
  findClientsByStaffUserId(staffUserId: string): GSTClient[] {
    return Array.from(this.clients.values()).filter(
      (client) => client.assignedStaff?.includes(staffUserId)
    );
  }

  /**
   * Get all staff assignments
   */
  getAllStaffAssignments(): StaffAssignment[] {
    return Array.from(this.staffAssignments.values());
  }

  /**
   * Create a staff assignment record
   */
  createStaffAssignment(assignment: StaffAssignment): StaffAssignment {
    this.staffAssignments.set(assignment.id, assignment);
    return assignment;
  }

  /**
   * Find staff assignment by ID
   */
  findStaffAssignmentById(id: string): StaffAssignment | undefined {
    return this.staffAssignments.get(id);
  }

  /**
   * Find staff assignment by staff user ID
   */
  findStaffAssignmentByUserId(staffUserId: string): StaffAssignment | undefined {
    return Array.from(this.staffAssignments.values()).find(
      (assignment) => assignment.staffUserId === staffUserId
    );
  }

  /**
   * Update staff assignment
   */
  updateStaffAssignment(id: string, updates: Partial<StaffAssignment>): StaffAssignment | undefined {
    const assignment = this.staffAssignments.get(id);
    if (!assignment) {
      return undefined;
    }
    const updated = { ...assignment, ...updates };
    this.staffAssignments.set(id, updated);
    return updated;
  }

  /**
   * Delete staff assignment
   */
  deleteStaffAssignment(id: string): boolean {
    return this.staffAssignments.delete(id);
  }

  /**
   * Get client filing status report
   */
  getClientFilingStatusReport(clientId: string): ClientFilingStatusReport | undefined {
    const client = this.clients.get(clientId);
    if (!client) {
      return undefined;
    }

    const filings = Array.from(this.filings.values()).filter(
      f => f.clientId === clientId
    );

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
  getAnnualComplianceSummary(clientId: string, financialYear: string): AnnualComplianceSummary | undefined {
    const client = this.clients.get(clientId);
    if (!client) {
      return undefined;
    }

    const filings = Array.from(this.filings.values()).filter(
      f => f.clientId === clientId && f.financialYear === financialYear
    );

    const purchases = Array.from(this.purchaseInvoices.values()).filter(
      p => p.clientId === clientId && p.financialYear === financialYear
    );

    const sales = Array.from(this.salesInvoices.values()).filter(
      s => s.clientId === clientId && s.financialYear === financialYear
    );

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
   * Get all filings map (for notification service)
   */
  getAllFilingsMap(): Map<string, GSTReturnFiling> {
    return this.filings;
  }
}

export const gstRepository = new GSTRepository();
