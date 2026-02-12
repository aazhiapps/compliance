import { RequestHandler } from "express";
import { AuthRequest } from "./auth";
import { userRepository } from "../repositories/userRepository";

/**
 * Middleware to verify admin role
 * Must be used after authenticateToken middleware
 * @throws 403 if user is not an admin
 */
export const requireAdmin: RequestHandler = (req, res, next) => {
  const userId = (req as AuthRequest).userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const user = userRepository.findById(userId);

  if (!user || user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};
