import { RequestHandler } from "express";
import {
  ReportsListResponse,
  ReportResponse,
  ReportFilters,
  ExportLog,
} from "@shared/api";
import { reportRepository } from "../repositories/reportRepository";
import { generateCSV, generatePDF } from "../services/exportService";

/**
 * GET /api/reports
 * Get all reports with optional filters
 */
export const handleGetReports: RequestHandler = async (req, res) => {
  try {
    const filters: ReportFilters = {
      clientId: req.query.clientId as string | undefined,
      financialYear: req.query.financialYear as string | undefined,
      reportType: req.query.reportType as any,
      status: req.query.status as any,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    const reports = await reportRepository.findAll(filters);
    const total = await reportRepository.count(filters);

    const response: ReportsListResponse = {
      success: true,
      reports,
      total,
      page: filters.page || 1,
      limit: filters.limit || 10,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
    });
  }
};

/**
 * GET /api/reports/:id
 * Get a single report by ID
 */
export const handleGetReport: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id as string;
    const report = await reportRepository.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const response: ReportResponse = {
      success: true,
      report,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch report",
    });
  }
};

/**
 * GET /api/reports/:id/export/csv
 * Export a report as CSV
 */
export const handleExportCSV: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id as string;
    const report = await reportRepository.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Check if draft reports can be exported (optional rule)
    // For now, we allow draft exports but you can uncomment to restrict:
    // if (report.status === "draft") {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Draft reports cannot be exported",
    //   });
    // }

    // Generate CSV
    const csv = generateCSV(report);

    // Log export action
    const exportLog: ExportLog = {
      exportedBy: (req as any).userId || "unknown",
      exportedByName: "Admin User", // In real app, fetch from user repository
      format: "csv",
      exportedAt: new Date().toISOString(),
    };
    await reportRepository.logExport(id as string, exportLog);

    // Generate filename
    const filename = `${report.clientName.replace(/\s+/g, "_")}_${report.reportType.replace(/\s+/g, "_")}_${report.financialYear}.csv`;

    // Set headers and send file
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error("Error exporting CSV:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export CSV",
    });
  }
};

/**
 * GET /api/reports/:id/export/pdf
 * Export a report as PDF
 */
export const handleExportPDF: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id as string;
    const report = await reportRepository.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Check if draft reports can be exported (optional rule)
    // if (report.status === "draft") {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Draft reports cannot be exported",
    //   });
    // }

    // Generate PDF
    const pdfBuffer = await generatePDF(report);

    // Log export action
    const exportLog: ExportLog = {
      exportedBy: (req as any).userId || "unknown",
      exportedByName: "Admin User", // In real app, fetch from user repository
      format: "pdf",
      exportedAt: new Date().toISOString(),
    };
    await reportRepository.logExport(id as string, exportLog);

    // Generate filename
    const filename = `${report.clientName.replace(/\s+/g, "_")}_${report.reportType.replace(/\s+/g, "_")}_${report.financialYear}.pdf`;

    // Set headers and send file
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error exporting PDF:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export PDF",
    });
  }
};

/**
 * GET /api/reports/meta/clients
 * Get list of unique clients for filter dropdown
 */
export const handleGetReportClients: RequestHandler = async (_req, res) => {
  try {
    const clients = await reportRepository.getUniqueClients();
    res.json({
      success: true,
      clients,
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch clients",
    });
  }
};

/**
 * GET /api/reports/meta/financial-years
 * Get list of unique financial years for filter dropdown
 */
export const handleGetFinancialYears: RequestHandler = async (_req, res) => {
  try {
    const years = await reportRepository.getUniqueFinancialYears();
    res.json({
      success: true,
      years,
    });
  } catch (error) {
    console.error("Error fetching financial years:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch financial years",
    });
  }
};

/**
 * GET /api/reports/:id/export-logs
 * Get export audit logs for a report
 */
export const handleGetExportLogs: RequestHandler = async (req, res) => {
  try {
    const id = req.params.id as string;
    const logs = await reportRepository.getExportLogs(id);

    res.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error("Error fetching export logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch export logs",
    });
  }
};
