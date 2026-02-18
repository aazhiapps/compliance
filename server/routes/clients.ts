import { RequestHandler } from "express";
import { clientRepository } from "../repositories/clientRepository";
import { applicationRepository } from "../repositories/applicationRepository";
import { paymentRepository } from "../repositories/paymentRepository";
import { auditLogService } from "../services/AuditLogService";
import { AuthRequest } from "../middleware/auth";
import { HTTP_STATUS } from "../utils/constants";
import {
  CreateClientRequest,
  UpdateClientRequest,
  ClientWithServices,
  ServiceSummary,
} from "@shared/client";

/**
 * Get all clients for authenticated user
 * GET /api/clients
 */
export const handleGetClients: RequestHandler = async (req, res) => {
  const userId = (req as AuthRequest).userId;

  if (!userId) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const clients = await clientRepository.findByUserId(userId);
    res.json({
      success: true,
      clients,
      total: clients.length,
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch clients",
    });
  }
};

/**
 * Get client by ID with service details
 * GET /api/clients/:id
 */
export const handleGetClientById: RequestHandler = async (req, res) => {
  const userId = (req as AuthRequest).userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const client = await clientRepository.findById(id);

    if (!client) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Client not found",
      });
    }

    // Verify ownership
    if (client.userId !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      client,
    });
  } catch (error) {
    console.error("Error fetching client:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch client",
    });
  }
};

/**
 * Get client with all services
 * GET /api/clients/:id/services
 */
export const handleGetClientWithServices: RequestHandler = async (req, res) => {
  const userId = (req as AuthRequest).userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const client = await clientRepository.findById(id);

    if (!client) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Client not found",
      });
    }

    // Verify ownership
    if (client.userId !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get all applications for this client
    const applications = await applicationRepository.findByClientId(id);

    // Build service summary
    const services: ServiceSummary[] = applications.map((app) => ({
      serviceId: app.serviceId,
      serviceName: app.serviceName,
      applicationId: app.id,
      status: app.status,
      createdAt: app.createdAt,
      paymentStatus: app.paymentStatus,
    }));

    // Get payment summaries
    const allPayments = await Promise.all(
      applications.map((app) => paymentRepository.findByApplicationId(app.id))
    );
    const payments = allPayments.flat();

    const clientWithServices: ClientWithServices = {
      ...client,
      services,
      totalApplications: applications.length,
      activeApplications: applications.filter(
        (app) =>
          app.status !== "approved" &&
          app.status !== "rejected" &&
          app.status !== "completed"
      ).length,
      completedApplications: applications.filter(
        (app) => app.status === "approved" || app.status === "completed"
      ).length,
      totalPayments: payments.reduce((sum, p) => sum + p.amount, 0),
      pendingDocuments: applications.reduce(
        (sum, app) =>
          sum +
          app.documents.filter((d) => d.status === "uploaded").length,
        0
      ),
    };

    res.json({
      success: true,
      client: clientWithServices,
    });
  } catch (error) {
    console.error("Error fetching client with services:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch client details",
    });
  }
};

/**
 * Create a new client
 * POST /api/clients
 */
export const handleCreateClient: RequestHandler = async (req, res) => {
  const userId = (req as AuthRequest).userId;

  if (!userId) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const clientData: CreateClientRequest = req.body;

    // Validate required fields
    if (!clientData.clientName || !clientData.clientType || !clientData.email || !clientData.phone) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Check if PAN already exists
    if (clientData.panNumber) {
      const existingClient = await clientRepository.findByPan(clientData.panNumber);
      if (existingClient && existingClient.status === "active") {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "A client with this PAN already exists",
        });
      }
    }

    const client = await clientRepository.create({
      ...clientData,
      userId,
      createdBy: userId,
    });

    // Log client creation
    await auditLogService.logClientCreated(client.id, clientData, userId, req);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "Client created successfully",
      client,
    });
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to create client",
    });
  }
};

/**
 * Update a client
 * PATCH /api/clients/:id
 */
export const handleUpdateClient: RequestHandler = async (req, res) => {
  const userId = (req as AuthRequest).userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const existingClient = await clientRepository.findById(id);

    if (!existingClient) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Client not found",
      });
    }

    // Verify ownership
    if (existingClient.userId !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Access denied",
      });
    }

    const updates: UpdateClientRequest = req.body;

    const client = await clientRepository.update(id, {
      ...updates,
      lastModifiedBy: userId,
    });

    // Log client update
    await auditLogService.logClientUpdated(
      id,
      existingClient,
      updates,
      userId,
      req
    );

    res.json({
      success: true,
      message: "Client updated successfully",
      client,
    });
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to update client",
    });
  }
};

/**
 * Check if client profile exists for user
 * GET /api/clients/check
 */
export const handleCheckClientExists: RequestHandler = async (req, res) => {
  const userId = (req as AuthRequest).userId;

  if (!userId) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const client = await clientRepository.getActiveClientForUser(userId);

    res.json({
      success: true,
      exists: !!client,
      client: client || undefined,
    });
  } catch (error) {
    console.error("Error checking client existence:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to check client existence",
    });
  }
};

/**
 * Get client documents
 * GET /api/clients/:id/documents
 */
export const handleGetClientDocuments: RequestHandler = async (req, res) => {
  const userId = (req as AuthRequest).userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required",
    });
  }

  try {
    const client = await clientRepository.findById(id);

    if (!client) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Client not found",
      });
    }

    // Verify ownership
    if (client.userId !== userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get all applications for this client
    const applications = await applicationRepository.findByClientId(id);

    // Collect all documents from all applications
    const allDocuments = applications.flatMap((app) =>
      app.documents.map((doc) => ({
        ...doc,
        serviceName: app.serviceName,
        applicationId: app.id,
      }))
    );

    res.json({
      success: true,
      documents: allDocuments,
      total: allDocuments.length,
    });
  } catch (error) {
    console.error("Error fetching client documents:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch documents",
    });
  }
};
