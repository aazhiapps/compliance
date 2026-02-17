import { RequestHandler } from "express";
import { serviceRepository } from "../repositories/serviceRepository";
import { CreateServiceRequest, UpdateServiceRequest } from "@shared/service";

/**
 * Get all services
 * GET /api/admin/services
 */
export const handleGetAllServices: RequestHandler = async (_req, res) => {
  try {
    const services = await serviceRepository.findAll();
    res.json({
      success: true,
      services,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch services",
    });
  }
};

/**
 * Get a single service by ID
 * GET /api/admin/services/:id
 */
export const handleGetServiceById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await serviceRepository.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    res.json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Error fetching service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service",
    });
  }
};

/**
 * Create a new service
 * POST /api/admin/services
 */
export const handleCreateService: RequestHandler = async (req, res) => {
  try {
    const serviceData: CreateServiceRequest = req.body;

    // Validate required fields
    if (!serviceData.name || !serviceData.description || !serviceData.price) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, description, and price are required",
      });
    }

    // Validate price is positive
    if (serviceData.price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than zero",
      });
    }

    const service = await serviceRepository.create(serviceData);

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      service,
    });
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create service",
    });
  }
};

/**
 * Update a service
 * PATCH /api/admin/services/:id
 */
export const handleUpdateService: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateServiceRequest = req.body;

    // Check if service exists
    const existingService = await serviceRepository.findById(id);
    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Validate price if provided
    if (updates.price !== undefined && updates.price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than zero",
      });
    }

    const service = await serviceRepository.update(id, updates);

    res.json({
      success: true,
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update service",
    });
  }
};

/**
 * Delete a service
 * DELETE /api/admin/services/:id
 */
export const handleDeleteService: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if service exists
    const existingService = await serviceRepository.findById(id);
    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const deleted = await serviceRepository.delete(id);

    if (deleted) {
      res.json({
        success: true,
        message: "Service deleted successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to delete service",
      });
    }
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete service",
    });
  }
};
