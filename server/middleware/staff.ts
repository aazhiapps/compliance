import { RequestHandler } from "express";
import { AuthRequest } from "./auth";
import { userRepository } from "../repositories/userRepository";

/**
 * Middleware to verify staff role (includes both staff and admin)
 * Must be used after authenticateToken middleware
 * @throws 403 if user is not staff or admin
 */
export const requireStaff: RequestHandler = (req, res, next) => {
  const userId = (req as AuthRequest).userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const user = userRepository.findById(userId);

  if (!user || (user.role !== "staff" && user.role !== "admin")) {
    return res.status(403).json({
      success: false,
      message: "Staff access required",
    });
  }

  next();
};

/**
 * Middleware to verify staff role only (not admin)
 * Must be used after authenticateToken middleware
 * @throws 403 if user is not staff
 */
export const requireStaffOnly: RequestHandler = (req, res, next) => {
  const userId = (req as AuthRequest).userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const user = userRepository.findById(userId);

  if (!user || user.role !== "staff") {
    return res.status(403).json({
      success: false,
      message: "Staff access required",
    });
  }

  next();
};
