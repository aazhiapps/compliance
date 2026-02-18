import { RequestHandler } from "express";
import { ResourceType, ActionType } from "../models/RolePermission";
import { checkPermission } from "../services/PermissionService";
import { UserModel } from "../models/User";
import { AuthRequest } from "./auth";
import { HTTP_STATUS } from "../utils/constants";

/**
 * Permission Middleware
 * PHASE 1: Fine-Grained RBAC Enforcement
 */

/**
 * Middleware to check if user has permission to perform action on resource
 */
export function requirePermission(
  resource: ResourceType,
  action: ActionType
): RequestHandler {
  return async (req, res, next) => {
    try {
      const userId = (req as AuthRequest).userId;
      
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
          errorCode: "AUTH_003",
        });
      }
      
      // Get user to determine role
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "User not found",
          errorCode: "AUTH_003",
        });
      }
      
      // Map user role to RoleType
      const roleMap: Record<string, string> = {
        admin: "admin",
        staff: "staff",
        user: "client",
      };
      
      const role = roleMap[user.role] || "client";
      
      // Extract resource data from request for condition checking
      const resourceData = {
        ...req.body,
        ...req.params,
        userId: req.body.userId || req.params.userId,
        assignedStaff: req.body.assignedStaff || req.params.assignedStaff,
        status: req.body.status,
        clientId: req.body.clientId || req.params.clientId,
      };
      
      // Check permission
      const result = await checkPermission(
        userId,
        role as any,
        resource,
        action,
        resourceData
      );
      
      if (!result.allowed) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: result.reason || "Permission denied",
          errorCode: "AUTH_004",
        });
      }
      
      next();
    } catch (error) {
      console.error("Error checking permission:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error checking permission",
        errorCode: "SYS_003",
      });
    }
  };
}

/**
 * Middleware to check if user owns the resource or has permission
 */
export function requireOwnershipOrPermission(
  resource: ResourceType,
  action: ActionType,
  ownerField: string = "userId"
): RequestHandler {
  return async (req, res, next) => {
    try {
      const userId = (req as AuthRequest).userId;
      
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
          errorCode: "AUTH_003",
        });
      }
      
      // Check if user owns the resource
      const resourceUserId = req.body[ownerField] || req.params[ownerField];
      
      if (resourceUserId === userId) {
        // User owns the resource, allow access
        return next();
      }
      
      // User doesn't own the resource, check permissions
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "User not found",
          errorCode: "AUTH_003",
        });
      }
      
      const roleMap: Record<string, string> = {
        admin: "admin",
        staff: "staff",
        user: "client",
      };
      
      const role = roleMap[user.role] || "client";
      
      const resourceData = {
        ...req.body,
        ...req.params,
      };
      
      const result = await checkPermission(
        userId,
        role as any,
        resource,
        action,
        resourceData
      );
      
      if (!result.allowed) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: result.reason || "Permission denied",
          errorCode: "AUTH_004",
        });
      }
      
      next();
    } catch (error) {
      console.error("Error checking ownership or permission:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error checking permission",
        errorCode: "SYS_003",
      });
    }
  };
}

/**
 * Middleware to check multiple permissions (OR logic)
 */
export function requireAnyPermission(
  permissions: Array<{ resource: ResourceType; action: ActionType }>
): RequestHandler {
  return async (req, res, next) => {
    try {
      const userId = (req as AuthRequest).userId;
      
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required",
          errorCode: "AUTH_003",
        });
      }
      
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "User not found",
          errorCode: "AUTH_003",
        });
      }
      
      const roleMap: Record<string, string> = {
        admin: "admin",
        staff: "staff",
        user: "client",
      };
      
      const role = roleMap[user.role] || "client";
      
      const resourceData = {
        ...req.body,
        ...req.params,
      };
      
      // Check each permission
      let hasPermission = false;
      
      for (const perm of permissions) {
        const result = await checkPermission(
          userId,
          role as any,
          perm.resource,
          perm.action,
          resourceData
        );
        
        if (result.allowed) {
          hasPermission = true;
          break;
        }
      }
      
      if (!hasPermission) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "Permission denied",
          errorCode: "AUTH_004",
        });
      }
      
      next();
    } catch (error) {
      console.error("Error checking permissions:", error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Error checking permission",
        errorCode: "SYS_003",
      });
    }
  };
}
