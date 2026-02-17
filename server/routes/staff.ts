import { RequestHandler } from "express";
import { AuthRequest } from "../middleware/auth";
import { applicationRepository } from "../repositories/applicationRepository";
import { userRepository } from "../repositories/userRepository";
import { HTTP_STATUS } from "../utils/constants";

/**
 * Get all applications for staff member
 * Staff can see all applications (or only assigned ones if needed)
 */
export const getStaffApplications: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const user = await userRepository.findById(userId);

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "User not found",
      });
    }

    // Get all applications
    const allApplications = await applicationRepository.findAll();

    // Filter by staff member if they're not admin
    const applications =
      user.role === "admin"
        ? allApplications
        : allApplications.filter(
            (app) => app.assignedStaff === userId || !app.assignedStaff,
          );

    return res.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Error fetching staff applications:", error);
    return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
};

/**
 * Update application status (staff can update status and add notes)
 */
export const updateApplicationStatus: RequestHandler = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, internalNotes } = req.body;

    const application = await applicationRepository.findById(
      applicationId as string,
    );

    if (!application) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Application not found",
      });
    }

    // Update application
    const updatedApplication = {
      ...application,
      ...(status && { status }),
      ...(internalNotes !== undefined && { internalNotes }),
      updatedAt: new Date().toISOString(),
    };

    await applicationRepository.update(
      applicationId as string,
      updatedApplication,
    );

    return res.json({
      success: true,
      message: "Application updated successfully",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Error updating application:", error);
    return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: "Failed to update application",
    });
  }
};

/**
 * Assign application to staff member
 */
export const assignApplicationToStaff: RequestHandler = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { staffId } = req.body;

    const application = await applicationRepository.findById(
      applicationId as string,
    );

    if (!application) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Application not found",
      });
    }

    const staff = await userRepository.findById(staffId as string);

    if (!staff || (staff.role !== "staff" && staff.role !== "admin")) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid staff member",
      });
    }

    // Update application with assigned staff
    const updatedApplication = {
      ...application,
      assignedStaff: staffId,
      assignedStaffName: `${staff.firstName} ${staff.lastName}`,
      updatedAt: new Date().toISOString(),
    };

    await applicationRepository.update(
      applicationId as string,
      updatedApplication,
    );

    return res.json({
      success: true,
      message: "Application assigned successfully",
      application: updatedApplication,
    });
  } catch (error) {
    console.error("Error assigning application:", error);
    return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: "Failed to assign application",
    });
  }
};

/**
 * Get staff statistics
 */
export const getStaffStats: RequestHandler = async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const allApplications = await applicationRepository.findAll();

    // Get applications assigned to this staff member
    const myApplications = allApplications.filter(
      (app) => app.assignedStaff === userId,
    );

    const stats = {
      totalAssigned: myApplications.length,
      pending: myApplications.filter((app) => app.status === "submitted")
        .length,
      underReview: myApplications.filter((app) => app.status === "under_review")
        .length,
      approved: myApplications.filter((app) => app.status === "approved")
        .length,
      rejected: myApplications.filter((app) => app.status === "rejected")
        .length,
    };

    return res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching staff stats:", error);
    return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
};

/**
 * Get all staff members (for admin to view and assign)
 */
export const getAllStaff: RequestHandler = async (_req, res) => {
  try {
    const allUsers = await userRepository.findAll();
    const staffMembers = allUsers.filter(
      (user) => user.role === "staff" || user.role === "admin",
    );

    return res.json({
      success: true,
      staff: staffMembers,
    });
  } catch (error) {
    console.error("Error fetching staff members:", error);
    return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      message: "Failed to fetch staff members",
    });
  }
};
