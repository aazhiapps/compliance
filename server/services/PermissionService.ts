import { RolePermissionModel, RoleType, ResourceType, ActionType, PermissionCondition } from "../models/RolePermission";
import { UserModel } from "../models/User";
import { StaffAssignmentModel } from "../models/StaffAssignment";

/**
 * Permission Service
 * PHASE 1: Fine-Grained RBAC Implementation
 */

/**
 * Role hierarchy (higher roles inherit permissions from lower roles)
 */
const ROLE_HIERARCHY: Record<RoleType, number> = {
  super_admin: 100,
  admin: 80,
  compliance_manager: 60,
  auditor: 50,
  staff: 30,
  client: 10,
  viewer: 5,
};

/**
 * Check if user has permission to perform action on resource
 */
export async function checkPermission(
  userId: string,
  role: RoleType,
  resource: ResourceType,
  action: ActionType,
  resourceData?: any
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    // Super admin has all permissions
    if (role === "super_admin") {
      return { allowed: true };
    }
    
    // Find permission for this role-resource-action combination
    const permission = await RolePermissionModel.findOne({
      role,
      resource,
      action,
      isActive: true,
      revokedAt: { $exists: false },
    });
    
    if (!permission) {
      // Check if any higher role has this permission (inheritance)
      const hasInheritedPermission = await checkInheritedPermission(
        role,
        resource,
        action
      );
      
      if (!hasInheritedPermission) {
        return {
          allowed: false,
          reason: `Role '${role}' does not have permission to '${action}' on '${resource}'`,
        };
      }
    }
    
    // Check conditions if present
    if (permission?.conditions && resourceData) {
      const conditionsMet = await evaluateConditions(
        permission.conditions,
        userId,
        resourceData
      );
      
      if (!conditionsMet) {
        return {
          allowed: false,
          reason: "Permission conditions not met",
        };
      }
    }
    
    return { allowed: true };
  } catch (error) {
    console.error("Error checking permission:", error);
    return {
      allowed: false,
      reason: "Error checking permission",
    };
  }
}

/**
 * Check if user has permission through role inheritance
 */
async function checkInheritedPermission(
  role: RoleType,
  resource: ResourceType,
  action: ActionType
): Promise<boolean> {
  try {
    const currentRoleLevel = ROLE_HIERARCHY[role];
    
    // Find all permissions for this resource-action from higher roles
    const higherRolePermissions = await RolePermissionModel.find({
      resource,
      action,
      isActive: true,
      revokedAt: { $exists: false },
    });
    
    for (const permission of higherRolePermissions) {
      const permissionRoleLevel = ROLE_HIERARCHY[permission.role];
      
      // If permission is from a lower role (higher level), inherit it
      if (permissionRoleLevel < currentRoleLevel) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error checking inherited permission:", error);
    return false;
  }
}

/**
 * Evaluate permission conditions
 */
async function evaluateConditions(
  conditions: PermissionCondition,
  userId: string,
  resourceData: any
): Promise<boolean> {
  try {
    // Check ownedByUser condition
    if (conditions.ownedByUser) {
      if (resourceData.userId !== userId && resourceData.createdBy !== userId) {
        return false;
      }
    }
    
    // Check assignedToUser condition
    if (conditions.assignedToUser) {
      if (resourceData.assignedStaff !== userId && resourceData.assignedTo !== userId) {
        // Also check staff assignments
        const assignment = await StaffAssignmentModel.findOne({
          staffId: userId,
          clientId: resourceData.clientId || resourceData.id,
          isActive: true,
        });
        
        if (!assignment) {
          return false;
        }
      }
    }
    
    // Check statusIn condition
    if (conditions.statusIn && conditions.statusIn.length > 0) {
      if (!conditions.statusIn.includes(resourceData.status)) {
        return false;
      }
    }
    
    // Check field-based conditions
    if (conditions.field && conditions.operator && conditions.value !== undefined) {
      const fieldValue = resourceData[conditions.field];
      
      switch (conditions.operator) {
        case "equals":
          if (fieldValue !== conditions.value) {
            return false;
          }
          break;
        case "in":
          if (!Array.isArray(conditions.value) || !conditions.value.includes(fieldValue)) {
            return false;
          }
          break;
        case "not_in":
          if (Array.isArray(conditions.value) && conditions.value.includes(fieldValue)) {
            return false;
          }
          break;
        case "greater_than":
          if (fieldValue <= conditions.value) {
            return false;
          }
          break;
        case "less_than":
          if (fieldValue >= conditions.value) {
            return false;
          }
          break;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error evaluating conditions:", error);
    return false;
  }
}

/**
 * Get all permissions for a role
 */
export async function getRolePermissions(role: RoleType) {
  try {
    const permissions = await RolePermissionModel.find({
      role,
      isActive: true,
      revokedAt: { $exists: false },
    });
    
    return permissions;
  } catch (error) {
    console.error("Error getting role permissions:", error);
    return [];
  }
}

/**
 * Grant permission to a role
 */
export async function grantPermission(
  role: RoleType,
  resource: ResourceType,
  action: ActionType,
  grantedBy: string,
  conditions?: PermissionCondition,
  description?: string
): Promise<boolean> {
  try {
    // Check if permission already exists
    const existing = await RolePermissionModel.findOne({
      role,
      resource,
      action,
      isActive: true,
      revokedAt: { $exists: false },
    });
    
    if (existing) {
      // Update existing permission
      existing.conditions = conditions;
      existing.description = description;
      existing.grantedBy = grantedBy;
      existing.grantedAt = new Date();
      await existing.save();
      return true;
    }
    
    // Create new permission
    await RolePermissionModel.create({
      role,
      resource,
      action,
      conditions,
      description,
      isActive: true,
      grantedBy,
      grantedAt: new Date(),
    });
    
    return true;
  } catch (error) {
    console.error("Error granting permission:", error);
    return false;
  }
}

/**
 * Revoke permission from a role
 */
export async function revokePermission(
  role: RoleType,
  resource: ResourceType,
  action: ActionType,
  revokedBy: string,
  reason?: string
): Promise<boolean> {
  try {
    const permission = await RolePermissionModel.findOne({
      role,
      resource,
      action,
      isActive: true,
      revokedAt: { $exists: false },
    });
    
    if (!permission) {
      return false;
    }
    
    permission.isActive = false;
    permission.revokedAt = new Date();
    permission.revokedBy = revokedBy;
    permission.revokedReason = reason;
    await permission.save();
    
    return true;
  } catch (error) {
    console.error("Error revoking permission:", error);
    return false;
  }
}

/**
 * Initialize default permissions for all roles
 */
export async function initializeDefaultPermissions() {
  const defaultPermissions = [
    // Super Admin - All permissions
    { role: "super_admin" as RoleType, resource: "user" as ResourceType, action: "create" as ActionType },
    { role: "super_admin" as RoleType, resource: "user" as ResourceType, action: "read" as ActionType },
    { role: "super_admin" as RoleType, resource: "user" as ResourceType, action: "update" as ActionType },
    { role: "super_admin" as RoleType, resource: "user" as ResourceType, action: "delete" as ActionType },
    
    // Admin - Most permissions
    { role: "admin" as RoleType, resource: "client" as ResourceType, action: "create" as ActionType },
    { role: "admin" as RoleType, resource: "client" as ResourceType, action: "read" as ActionType },
    { role: "admin" as RoleType, resource: "client" as ResourceType, action: "update" as ActionType },
    { role: "admin" as RoleType, resource: "application" as ResourceType, action: "read" as ActionType },
    { role: "admin" as RoleType, resource: "application" as ResourceType, action: "approve" as ActionType },
    { role: "admin" as RoleType, resource: "application" as ResourceType, action: "reject" as ActionType },
    { role: "admin" as RoleType, resource: "payment" as ResourceType, action: "read" as ActionType },
    { role: "admin" as RoleType, resource: "payment" as ResourceType, action: "verify" as ActionType },
    
    // Compliance Manager
    { role: "compliance_manager" as RoleType, resource: "compliance_event" as ResourceType, action: "create" as ActionType },
    { role: "compliance_manager" as RoleType, resource: "compliance_event" as ResourceType, action: "read" as ActionType },
    { role: "compliance_manager" as RoleType, resource: "compliance_event" as ResourceType, action: "update" as ActionType },
    { role: "compliance_manager" as RoleType, resource: "report" as ResourceType, action: "read" as ActionType },
    { role: "compliance_manager" as RoleType, resource: "report" as ResourceType, action: "export" as ActionType },
    
    // Auditor - Read-only access
    { role: "auditor" as RoleType, resource: "audit_log" as ResourceType, action: "read" as ActionType },
    { role: "auditor" as RoleType, resource: "client" as ResourceType, action: "read" as ActionType },
    { role: "auditor" as RoleType, resource: "application" as ResourceType, action: "read" as ActionType },
    { role: "auditor" as RoleType, resource: "payment" as ResourceType, action: "read" as ActionType },
    { role: "auditor" as RoleType, resource: "report" as ResourceType, action: "read" as ActionType },
    
    // Staff - Limited permissions with conditions
    { role: "staff" as RoleType, resource: "application" as ResourceType, action: "read" as ActionType },
    { role: "staff" as RoleType, resource: "application" as ResourceType, action: "update" as ActionType },
    { role: "staff" as RoleType, resource: "document" as ResourceType, action: "read" as ActionType },
    { role: "staff" as RoleType, resource: "document" as ResourceType, action: "verify" as ActionType },
    
    // Client - Own data only
    { role: "client" as RoleType, resource: "application" as ResourceType, action: "create" as ActionType },
    { role: "client" as RoleType, resource: "application" as ResourceType, action: "read" as ActionType },
    { role: "client" as RoleType, resource: "document" as ResourceType, action: "create" as ActionType },
    { role: "client" as RoleType, resource: "document" as ResourceType, action: "read" as ActionType },
    { role: "client" as RoleType, resource: "payment" as ResourceType, action: "read" as ActionType },
    
    // Viewer - Read-only
    { role: "viewer" as RoleType, resource: "client" as ResourceType, action: "read" as ActionType },
    { role: "viewer" as RoleType, resource: "application" as ResourceType, action: "read" as ActionType },
    { role: "viewer" as RoleType, resource: "report" as ResourceType, action: "read" as ActionType },
  ];
  
  try {
    for (const perm of defaultPermissions) {
      await grantPermission(
        perm.role,
        perm.resource,
        perm.action,
        "system",
        undefined,
        "Default permission"
      );
    }
    
    console.log("Default permissions initialized");
    return true;
  } catch (error) {
    console.error("Error initializing default permissions:", error);
    return false;
  }
}

export default {
  checkPermission,
  getRolePermissions,
  grantPermission,
  revokePermission,
  initializeDefaultPermissions,
};
