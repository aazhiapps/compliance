import { Report, ReportFilters, ExportLog } from "@shared/api";
import { ReportModel } from "../models/Report";

/**
 * Report repository - abstracts report data storage using MongoDB
 */
class ReportRepository {
  /**
   * Find reports with optional filters
   */
  async findAll(filters?: ReportFilters): Promise<Report[]> {
    // Build query
    const query: any = {};
    
    if (filters?.clientId) {
      query.clientId = filters.clientId;
    }
    if (filters?.financialYear) {
      query.financialYear = filters.financialYear;
    }
    if (filters?.reportType) {
      query.reportType = filters.reportType;
    }
    if (filters?.status) {
      query.status = filters.status;
    }

    // Apply pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    // Execute query with sorting and pagination
    const reports = await ReportModel.find(query)
      .sort({ generatedOn: -1 })
      .skip(skip)
      .limit(limit);

    return reports.map((report) => report.toJSON() as Report);
  }

  /**
   * Count total reports with optional filters
   */
  async count(filters?: ReportFilters): Promise<number> {
    // Build query
    const query: any = {};
    
    if (filters?.clientId) {
      query.clientId = filters.clientId;
    }
    if (filters?.financialYear) {
      query.financialYear = filters.financialYear;
    }
    if (filters?.reportType) {
      query.reportType = filters.reportType;
    }
    if (filters?.status) {
      query.status = filters.status;
    }

    return await ReportModel.countDocuments(query);
  }

  /**
   * Find a report by ID
   */
  async findById(id: string): Promise<Report | undefined> {
    const report = await ReportModel.findById(id);
    return report ? (report.toJSON() as Report) : undefined;
  }

  /**
   * Create a new report
   */
  async create(report: Omit<Report, "id" | "exportLogs">): Promise<Report> {
    const newReport = await ReportModel.create({
      ...report,
      exportLogs: [],
    });
    return newReport.toJSON() as Report;
  }

  /**
   * Update a report
   */
  async update(id: string, updates: Partial<Report>): Promise<Report | undefined> {
    const report = await ReportModel.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );
    return report ? (report.toJSON() as Report) : undefined;
  }

  /**
   * Log an export action
   */
  async logExport(reportId: string, log: ExportLog): Promise<Report | undefined> {
    const report = await ReportModel.findByIdAndUpdate(
      reportId,
      { $push: { exportLogs: log } },
      { new: true }
    );
    return report ? (report.toJSON() as Report) : undefined;
  }

  /**
   * Get all export logs for a report
   */
  async getExportLogs(reportId: string): Promise<ExportLog[]> {
    const report = await ReportModel.findById(reportId);
    return report?.exportLogs || [];
  }

  /**
   * Get all unique client IDs
   */
  async getUniqueClients(): Promise<Array<{ id: string; name: string }>> {
    const clients = await ReportModel.aggregate([
      {
        $group: {
          _id: "$clientId",
          name: { $first: "$clientName" }
        }
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: 1
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);

    return clients;
  }

  /**
   * Get all unique financial years
   */
  async getUniqueFinancialYears(): Promise<string[]> {
    const years = await ReportModel.distinct("financialYear");
    return years.sort();
  }
}

// Export singleton instance
export const reportRepository = new ReportRepository();
