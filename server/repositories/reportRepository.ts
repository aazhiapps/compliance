import { Report, ReportFilters, ExportLog } from "@shared/api";
import crypto from "crypto";

/**
 * Report repository - abstracts report data storage
 * In a real application, this would interact with a database (MongoDB)
 * This implements a MongoDB-like schema structure in memory
 */
class ReportRepository {
  private reports: Map<string, Report>;

  constructor() {
    this.reports = new Map();
    this.seedInitialData();
  }

  /**
   * Seed some initial reports for demo purposes
   */
  private seedInitialData() {
    const demoReports: Report[] = [
      {
        id: this.generateId(),
        clientId: "client-1",
        clientName: "ABC Enterprises Pvt Ltd",
        financialYear: "2023-24",
        reportType: "Financial Statements",
        status: "final",
        preparedBy: "admin-1",
        preparedByName: "Admin User",
        generatedOn: new Date("2024-03-15").toISOString(),
        data: {
          revenue: 5000000,
          expenses: 3500000,
          profit: 1500000,
          assets: 10000000,
          liabilities: 4000000,
        },
        exportLogs: [],
      },
      {
        id: this.generateId(),
        clientId: "client-2",
        clientName: "XYZ Solutions Ltd",
        financialYear: "2023-24",
        reportType: "GST Summary",
        status: "final",
        preparedBy: "admin-1",
        preparedByName: "Admin User",
        generatedOn: new Date("2024-03-20").toISOString(),
        data: {
          totalSales: 8000000,
          totalPurchases: 5000000,
          outputGST: 1440000,
          inputGST: 900000,
          netGST: 540000,
        },
        exportLogs: [],
      },
      {
        id: this.generateId(),
        clientId: "client-1",
        clientName: "ABC Enterprises Pvt Ltd",
        financialYear: "2023-24",
        reportType: "Income Tax Computation",
        status: "draft",
        preparedBy: "admin-1",
        preparedByName: "Admin User",
        generatedOn: new Date("2024-03-25").toISOString(),
        data: {
          grossIncome: 5000000,
          deductions: 500000,
          taxableIncome: 4500000,
          taxAmount: 1350000,
        },
        exportLogs: [],
      },
      {
        id: this.generateId(),
        clientId: "client-3",
        clientName: "PQR Industries",
        financialYear: "2024-25",
        reportType: "Tax Audit Summary",
        status: "final",
        preparedBy: "admin-1",
        preparedByName: "Admin User",
        generatedOn: new Date("2024-09-30").toISOString(),
        data: {
          turnover: 15000000,
          taxableProfit: 3000000,
          taxPaid: 900000,
          auditObservations: ["All records maintained properly"],
        },
        exportLogs: [],
      },
      {
        id: this.generateId(),
        clientId: "client-2",
        clientName: "XYZ Solutions Ltd",
        financialYear: "2024-25",
        reportType: "ROC Filing Summary",
        status: "filed",
        preparedBy: "admin-1",
        preparedByName: "Admin User",
        generatedOn: new Date("2024-11-15").toISOString(),
        data: {
          formsFiled: ["AOC-4", "MGT-7", "ADT-1"],
          filingDate: "2024-11-15",
          acknowledgments: ["SRN-ABC123", "SRN-XYZ456"],
        },
        exportLogs: [],
      },
    ];

    demoReports.forEach((report) => {
      this.reports.set(report.id, report);
    });
  }

  /**
   * Generate a unique ID for a report
   */
  private generateId(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  /**
   * Find reports with optional filters
   */
  findAll(filters?: ReportFilters): Report[] {
    let results = Array.from(this.reports.values());

    // Apply filters
    if (filters?.clientId) {
      results = results.filter((r) => r.clientId === filters.clientId);
    }
    if (filters?.financialYear) {
      results = results.filter((r) => r.financialYear === filters.financialYear);
    }
    if (filters?.reportType) {
      results = results.filter((r) => r.reportType === filters.reportType);
    }
    if (filters?.status) {
      results = results.filter((r) => r.status === filters.status);
    }

    // Sort by generated date (newest first)
    results.sort(
      (a, b) =>
        new Date(b.generatedOn).getTime() - new Date(a.generatedOn).getTime()
    );

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return results.slice(startIndex, endIndex);
  }

  /**
   * Count total reports with optional filters
   */
  count(filters?: ReportFilters): number {
    let results = Array.from(this.reports.values());

    // Apply filters
    if (filters?.clientId) {
      results = results.filter((r) => r.clientId === filters.clientId);
    }
    if (filters?.financialYear) {
      results = results.filter((r) => r.financialYear === filters.financialYear);
    }
    if (filters?.reportType) {
      results = results.filter((r) => r.reportType === filters.reportType);
    }
    if (filters?.status) {
      results = results.filter((r) => r.status === filters.status);
    }

    return results.length;
  }

  /**
   * Find a report by ID
   */
  findById(id: string): Report | undefined {
    return this.reports.get(id);
  }

  /**
   * Create a new report
   */
  create(report: Omit<Report, "id" | "exportLogs">): Report {
    const newReport: Report = {
      ...report,
      id: this.generateId(),
      exportLogs: [],
    };
    this.reports.set(newReport.id, newReport);
    return newReport;
  }

  /**
   * Update a report
   */
  update(id: string, updates: Partial<Report>): Report | undefined {
    const report = this.reports.get(id);
    if (!report) {
      return undefined;
    }

    const updatedReport = {
      ...report,
      ...updates,
      id: report.id, // Ensure ID doesn't change
      exportLogs: report.exportLogs, // Preserve export logs unless explicitly updated
    };

    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  /**
   * Log an export action
   */
  logExport(reportId: string, log: ExportLog): Report | undefined {
    const report = this.reports.get(reportId);
    if (!report) {
      return undefined;
    }

    report.exportLogs.push(log);
    this.reports.set(reportId, report);
    return report;
  }

  /**
   * Get all export logs for a report
   */
  getExportLogs(reportId: string): ExportLog[] {
    const report = this.reports.get(reportId);
    return report?.exportLogs || [];
  }

  /**
   * Get all unique client IDs
   */
  getUniqueClients(): Array<{ id: string; name: string }> {
    const clientMap = new Map<string, string>();

    for (const report of this.reports.values()) {
      if (!clientMap.has(report.clientId)) {
        clientMap.set(report.clientId, report.clientName);
      }
    }

    return Array.from(clientMap.entries()).map(([id, name]) => ({ id, name }));
  }

  /**
   * Get all unique financial years
   */
  getUniqueFinancialYears(): string[] {
    const years = new Set<string>();

    for (const report of this.reports.values()) {
      years.add(report.financialYear);
    }

    return Array.from(years).sort();
  }
}

// Export singleton instance
export const reportRepository = new ReportRepository();
