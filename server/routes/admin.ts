import { RequestHandler } from "express";
import { userRepository } from "../repositories/userRepository";
import { applicationRepository } from "../repositories/applicationRepository";
import { gstRepository } from "../repositories/gstRepository";
import { GSTClient } from "@shared/gst";
import crypto from "crypto";

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

    // Auto-enroll users for GST Filing when GST Registration is approved
    if (status === "approved" && application.serviceId === 1) {
      try {
        // Check if user already has a GST client
        const existingClients = gstRepository.findClientsByUserId(application.userId);
        
        if (existingClients.length === 0) {
          // Get user details
          const user = userRepository.findById(application.userId);
          
          if (user) {
            // Get current financial year (April to March in India)
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1; // 1-12
            const fyStartYear = currentMonth >= 4 ? currentYear : currentYear - 1;
            
            // Create a default GST client for the user
            // Note: businessName left empty for non-individual types - will be filled by user during setup
            const gstClient: GSTClient = {
              id: `gst_${crypto.randomBytes(8).toString("hex")}`,
              userId: application.userId,
              clientName: `${user.firstName} ${user.lastName}`,
              gstin: "", // To be filled by user
              businessName: user.businessType === "individual" ? `${user.firstName} ${user.lastName}` : "",
              panNumber: "", // To be filled by user
              filingFrequency: "monthly",
              financialYearStart: `${fyStartYear}-04-01`,
              address: "",
              state: "",
              contactPerson: `${user.firstName} ${user.lastName}`,
              contactEmail: user.email,
              contactPhone: user.phone,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            gstRepository.createClient(gstClient);
            console.log(`✓ Auto-created GST client for user ${user.email} (Application: ${application.id})`);
          } else {
            console.warn(`⚠ User not found for GST auto-enrollment (Application: ${application.id})`);
          }
        }
      } catch (gstError) {
        // Log the error but don't fail the application approval
        console.error(`✗ Failed to auto-create GST client for application ${application.id}:`, gstError);
        // The application is still approved, user can create GST client manually
      }
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
