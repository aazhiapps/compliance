import { RequestHandler } from "express";
import { userRepository } from "../repositories/userRepository";
import { applicationRepository } from "../repositories/applicationRepository";

/**
 * Get all users (admin only)
 * GET /api/admin/users
 */
export const handleGetAllUsers: RequestHandler = (_req, res) => {
  try {
    const users = userRepository.findAll();
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

/**
 * Get all applications (admin only)
 * GET /api/admin/applications
 */
export const handleGetAllApplications: RequestHandler = (_req, res) => {
  try {
    const applications = applicationRepository.findAll();
    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
};

/**
 * Update application status (admin only)
 * PATCH /api/admin/applications/:id
 */
export const handleUpdateApplicationStatus: RequestHandler = (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const application = applicationRepository.update(id, { 
      status, 
      ...(notes && { notes }),
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.json({
      success: true,
      data: application,
      message: "Application status updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update application",
    });
  }
};

/**
 * Get application by ID (admin only)
 * GET /api/admin/applications/:id
 */
export const handleGetApplicationById: RequestHandler = (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const application = applicationRepository.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch application",
    });
  }
};

/**
 * Get user by ID (admin only)
 * GET /api/admin/users/:id
 */
export const handleGetUserById: RequestHandler = (req, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = userRepository.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

/**
 * Get admin dashboard statistics
 * GET /api/admin/stats
 */
export const handleGetAdminStats: RequestHandler = (_req, res) => {
  try {
    const users = userRepository.findAll();
    const applications = applicationRepository.findAll();

    const stats = {
      totalUsers: users.length,
      totalApplications: applications.length,
      pendingApplications: applications.filter(app => app.status === "submitted" || app.status === "under_review").length,
      approvedApplications: applications.filter(app => app.status === "approved").length,
      rejectedApplications: applications.filter(app => app.status === "rejected").length,
      recentApplications: applications
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};
