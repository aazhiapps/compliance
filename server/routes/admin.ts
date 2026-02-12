import { RequestHandler } from "express";
import { userRepository } from "../repositories/userRepository";
import { applicationRepository } from "../repositories/applicationRepository";
import { gstRepository } from "../repositories/gstRepository";
import { GSTClient } from "@shared/gst";
import crypto from "crypto";
import { UserDocumentsHierarchical } from "@shared/api";

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

/**
 * Get all documents with hierarchical structure (admin only)
 * GET /api/admin/documents
 * Returns: Users -> Services -> Year/Month -> Documents
 */
export const handleGetAllDocuments: RequestHandler = (_req, res) => {
  try {
    const users = userRepository.findAll();
    const applications = applicationRepository.findAll();

    // Helper function to get month name
    const getMonthName = (month: number): string => {
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      return monthNames[month - 1] || "Unknown";
    };

    // Build hierarchical structure
    const userDocumentsMap = new Map<string, UserDocumentsHierarchical>();

    applications.forEach((app) => {
      // Get user information
      const user = users.find(u => u.id === app.userId);
      if (!user) return;

      // Initialize user entry if not exists
      if (!userDocumentsMap.has(user.id)) {
        userDocumentsMap.set(user.id, {
          userId: user.id,
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          services: [],
        });
      }

      const userDocs = userDocumentsMap.get(user.id)!;

      // Process each document in the application
      if (app.documents && app.documents.length > 0) {
        app.documents.forEach((doc) => {
          // Find or create service entry
          let service = userDocs.services.find(s => s.serviceId === app.serviceId);
          if (!service) {
            service = {
              serviceId: app.serviceId,
              serviceName: app.serviceName,
              years: [],
            };
            userDocs.services.push(service);
          }

          // Parse upload date
          const uploadDate = new Date(doc.uploadedAt);
          const year = uploadDate.getFullYear();
          const month = uploadDate.getMonth() + 1; // 1-12

          // Find or create year entry
          let yearEntry = service.years.find(y => y.year === year);
          if (!yearEntry) {
            yearEntry = {
              year,
              months: [],
            };
            service.years.push(yearEntry);
          }

          // Find or create month entry
          let monthEntry = yearEntry.months.find(m => m.month === month);
          if (!monthEntry) {
            monthEntry = {
              month,
              monthName: getMonthName(month),
              documents: [],
            };
            yearEntry.months.push(monthEntry);
          }

          // Add document to month
          monthEntry.documents.push(doc);
        });
      }
    });

    // Sort the hierarchy
    const usersHierarchy = Array.from(userDocumentsMap.values());
    usersHierarchy.forEach(user => {
      // Sort services by name
      user.services.sort((a, b) => a.serviceName.localeCompare(b.serviceName));
      
      user.services.forEach(service => {
        // Sort years descending (newest first)
        service.years.sort((a, b) => b.year - a.year);
        
        service.years.forEach(year => {
          // Sort months descending (newest first)
          year.months.sort((a, b) => b.month - a.month);
          
          year.months.forEach(monthEntry => {
            // Sort documents by upload date descending (newest first)
            monthEntry.documents.sort((a, b) => 
              new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
            );
          });
        });
      });
    });

    // Sort users by name
    usersHierarchy.sort((a, b) => a.userName.localeCompare(b.userName));

    res.json({
      success: true,
      users: usersHierarchy,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch documents",
    });
  }
};
