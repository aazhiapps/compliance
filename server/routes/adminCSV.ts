import { RequestHandler } from "express";
import { userRepository } from "../repositories/userRepository";
import { clientRepository } from "../repositories/clientRepository";
import { applicationRepository } from "../repositories/applicationRepository";
import {
  exportToCSV,
  importFromCSV,
  formatDate,
  formatBoolean,
  parseBoolean,
} from "../services/csvService";
import multer from "multer";
import { User } from "@shared/auth";
import { Client } from "@shared/client";
import { Application } from "@shared/api";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

export const uploadCSV = upload.single("file");

/**
 * Export users to CSV
 * GET /api/admin/csv/users/export
 */
export const handleExportUsers: RequestHandler = async (_req, res) => {
  try {
    const users = await userRepository.findAll();

    // Map users to CSV format (exclude sensitive data like passwords)
    const csvData = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      businessType: user.businessType,
      language: user.language,
      isEmailVerified: formatBoolean(user.isEmailVerified),
      createdAt: formatDate(user.createdAt),
    }));

    const csv = exportToCSV(csvData, {
      fields: [
        "id",
        "firstName",
        "lastName",
        "email",
        "phone",
        "role",
        "businessType",
        "language",
        "isEmailVerified",
        "createdAt",
      ],
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="users.csv"');
    res.send(csv);
  } catch (error) {
    console.error("Error exporting users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export users",
    });
  }
};

/**
 * Import users from CSV
 * POST /api/admin/csv/users/import
 */
export const handleImportUsers: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const csvContent = req.file.buffer.toString("utf-8");

    // Validator function for user data
    const validator = (row: any, _index: number) => {
      const errors: string[] = [];

      // Required fields validation
      if (!row.firstName?.trim()) {
        errors.push("firstName is required");
      }
      if (!row.lastName?.trim()) {
        errors.push("lastName is required");
      }
      if (!row.email?.trim()) {
        errors.push("email is required");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push("Invalid email format");
      }
      if (!row.phone?.trim()) {
        errors.push("phone is required");
      }

      // Role validation
      const validRoles = ["user", "admin"];
      if (row.role && !validRoles.includes(row.role)) {
        errors.push("role must be 'user' or 'admin'");
      }

      // Business type validation
      const validBusinessTypes = [
        "individual",
        "startup",
        "company",
        "partnership",
        "other",
      ];
      if (row.businessType && !validBusinessTypes.includes(row.businessType)) {
        errors.push(
          "businessType must be one of: individual, startup, company, partnership, other"
        );
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    };

    const result = importFromCSV<Partial<User>>(csvContent, validator);

    // For import, we'll just return the validation results
    // Actual database insertion should be done carefully with proper password handling
    res.json({
      success: true,
      message: `Import validated: ${result.summary.successful} valid, ${result.summary.failed} invalid`,
      summary: result.summary,
      errors: result.errors.slice(0, 100), // Limit errors to first 100
      note: "User import requires additional setup (password, verification). Please review data before proceeding.",
    });
  } catch (error) {
    console.error("Error importing users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to import users",
    });
  }
};

/**
 * Export clients to CSV
 * GET /api/admin/csv/clients/export
 */
export const handleExportClients: RequestHandler = async (_req, res) => {
  try {
    const clients = await clientRepository.findAll();

    const csvData = clients.map((client) => ({
      id: client.id,
      userId: client.userId,
      clientName: client.clientName,
      clientType: client.clientType,
      email: client.email,
      phone: client.phone,
      panNumber: client.panNumber || "",
      gstin: client.gstin || "",
      address: client.address || "",
      city: client.city || "",
      state: client.state || "",
      pincode: client.pincode || "",
      status: client.status,
      kycStatus: client.kycStatus,
      riskLevel: client.riskLevel || "",
      createdAt: formatDate(client.createdAt),
      updatedAt: formatDate(client.updatedAt),
    }));

    const csv = exportToCSV(csvData);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="clients.csv"');
    res.send(csv);
  } catch (error) {
    console.error("Error exporting clients:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export clients",
    });
  }
};

/**
 * Import clients from CSV
 * POST /api/admin/csv/clients/import
 */
export const handleImportClients: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const csvContent = req.file.buffer.toString("utf-8");

    const validator = (row: any, _index: number) => {
      const errors: string[] = [];

      // Required fields
      if (!row.clientName?.trim()) {
        errors.push("clientName is required");
      }
      if (!row.clientType?.trim()) {
        errors.push("clientType is required");
      } else if (
        !["individual", "company", "partnership"].includes(row.clientType)
      ) {
        errors.push(
          "clientType must be one of: individual, company, partnership"
        );
      }
      if (!row.email?.trim()) {
        errors.push("email is required");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push("Invalid email format");
      }

      // Status validation
      const validStatuses = ["active", "inactive", "suspended"];
      if (row.status && !validStatuses.includes(row.status)) {
        errors.push("status must be one of: active, inactive, suspended");
      }

      // KYC status validation
      const validKycStatuses = ["pending", "verified", "rejected"];
      if (row.kycStatus && !validKycStatuses.includes(row.kycStatus)) {
        errors.push("kycStatus must be one of: pending, verified, rejected");
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    };

    const result = importFromCSV<Partial<Client>>(csvContent, validator);

    res.json({
      success: true,
      message: `Import validated: ${result.summary.successful} valid, ${result.summary.failed} invalid`,
      summary: result.summary,
      errors: result.errors.slice(0, 100),
      note: "Client import validated. Review data before proceeding with database insertion.",
    });
  } catch (error) {
    console.error("Error importing clients:", error);
    res.status(500).json({
      success: false,
      message: "Failed to import clients",
    });
  }
};

/**
 * Export applications to CSV
 * GET /api/admin/csv/applications/export
 */
export const handleExportApplications: RequestHandler = async (_req, res) => {
  try {
    const applications = await applicationRepository.findAll();

    const csvData = applications.map((app) => ({
      id: app.id,
      userId: app.userId,
      serviceId: app.serviceId,
      serviceName: app.serviceName,
      status: app.status,
      notes: app.notes || "",
      createdAt: formatDate(app.createdAt),
      updatedAt: formatDate(app.updatedAt),
    }));

    const csv = exportToCSV(csvData);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="applications.csv"'
    );
    res.send(csv);
  } catch (error) {
    console.error("Error exporting applications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export applications",
    });
  }
};

/**
 * Import applications from CSV
 * POST /api/admin/csv/applications/import
 */
export const handleImportApplications: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const csvContent = req.file.buffer.toString("utf-8");

    const validator = (row: any, _index: number) => {
      const errors: string[] = [];

      // Required fields
      if (!row.userId?.trim()) {
        errors.push("userId is required");
      }
      if (!row.serviceId) {
        errors.push("serviceId is required");
      }
      if (!row.serviceName?.trim()) {
        errors.push("serviceName is required");
      }

      // Status validation
      const validStatuses = [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "completed",
      ];
      if (row.status && !validStatuses.includes(row.status)) {
        errors.push(
          "status must be one of: draft, submitted, under_review, approved, rejected, completed"
        );
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    };

    const result = importFromCSV<Partial<Application>>(csvContent, validator);

    res.json({
      success: true,
      message: `Import validated: ${result.summary.successful} valid, ${result.summary.failed} invalid`,
      summary: result.summary,
      errors: result.errors.slice(0, 100),
      note: "Application import validated. Review data before proceeding with database insertion.",
    });
  } catch (error) {
    console.error("Error importing applications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to import applications",
    });
  }
};

/**
 * Get CSV template for a specific entity type
 * GET /api/admin/csv/template/:entityType
 */
export const handleGetCSVTemplate: RequestHandler = async (req, res) => {
  try {
    const entityType = req.params.entityType;

    let csv = "";
    let filename = "";

    switch (entityType) {
      case "users":
        csv = exportToCSV(
          [
            {
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
              phone: "+91-9876543210",
              role: "user",
              businessType: "individual",
              language: "en",
            },
          ],
          {
            fields: [
              "firstName",
              "lastName",
              "email",
              "phone",
              "role",
              "businessType",
              "language",
            ],
          }
        );
        filename = "users_template.csv";
        break;

      case "clients":
        csv = exportToCSV(
          [
            {
              clientName: "Example Client",
              clientType: "individual",
              email: "client@example.com",
              phone: "+91-9876543210",
              panNumber: "ABCDE1234F",
              gstin: "29ABCDE1234F1Z5",
              address: "123 Main Street",
              city: "Mumbai",
              state: "Maharashtra",
              pincode: "400001",
              status: "active",
              kycStatus: "pending",
            },
          ],
          {
            fields: [
              "clientName",
              "clientType",
              "email",
              "phone",
              "panNumber",
              "gstin",
              "address",
              "city",
              "state",
              "pincode",
              "status",
              "kycStatus",
            ],
          }
        );
        filename = "clients_template.csv";
        break;

      case "applications":
        csv = exportToCSV(
          [
            {
              userId: "user_123",
              serviceId: 1,
              serviceName: "GST Registration",
              status: "submitted",
              notes: "Pending documents",
            },
          ],
          {
            fields: ["userId", "serviceId", "serviceName", "status", "notes"],
          }
        );
        filename = "applications_template.csv";
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid entity type",
        });
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error("Error generating CSV template:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate CSV template",
    });
  }
};

/**
 * Export payments to CSV
 * GET /api/admin/csv/payments/export
 */
export const handleExportPayments: RequestHandler = async (_req, res) => {
  try {
    // Import paymentRepository here to avoid circular dependencies
    const { paymentRepository } = await import("../repositories/paymentRepository");
    const payments = await paymentRepository.findAll();

    const csvData = payments.map((payment) => ({
      id: payment.id,
      applicationId: payment.applicationId,
      userId: payment.userId,
      amount: payment.amount.toFixed(2),
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
      transactionId: payment.transactionId || "",
      paymentDate: formatDate(payment.paymentDate),
      createdAt: formatDate(payment.createdAt),
    }));

    const csv = exportToCSV(csvData, {
      fields: [
        "id",
        "applicationId",
        "userId",
        "amount",
        "paymentMethod",
        "paymentStatus",
        "transactionId",
        "paymentDate",
        "createdAt",
      ],
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="payments.csv"');
    res.send(csv);
  } catch (error) {
    console.error("Error exporting payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export payments",
    });
  }
};
