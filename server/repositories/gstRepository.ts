import {
  GSTClient,
  PurchaseInvoice,
  SalesInvoice,
  GSTReturnFiling,
  GSTAuditLog,
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

  constructor() {
    this.clients = new Map();
    this.purchaseInvoices = new Map();
    this.salesInvoices = new Map();
    this.filings = new Map();
    this.auditLogs = [];
  }

  // ============ CLIENT OPERATIONS ============

  /**
   * Create a new GST client
   */
  createClient(client: GSTClient): GSTClient {
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
}

export const gstRepository = new GSTRepository();
