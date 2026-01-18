"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { rolesService } from "@/services/roles";
import { extractErrorMessage } from "@/utils/error-handler";

// Query keys for roles
export const roleKeys = {
  all: ["roles"],
  lists: () => [...roleKeys.all, "list"],
  list: (params) => [...roleKeys.lists(), params],
  details: () => [...roleKeys.all, "detail"],
  detail: (id) => [...roleKeys.details(), id],
  permissions: () => [...roleKeys.all, "permissions"],
  permissionsList: (params) => [...roleKeys.permissions(), "list", params],
  permissionDetail: (id) => [...roleKeys.permissions(), "detail", id],
  rolePermissions: (id) => [...roleKeys.all, "role-permissions", id],
  userRoles: (userId) => [...roleKeys.all, "user-roles", userId],
  roleUsers: (roleId) => [...roleKeys.all, "role-users", roleId],
};

// Get all roles query
export const useRoles = (params = {}, options = {}) => {
  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: async () => {
      const response = await rolesService.getRoles(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get single role query
export const useRole = (slug) => {
  return useQuery({
    queryKey: roleKeys.detail(slug),
    queryFn: async () => {
      const response = await rolesService.getRole(slug);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get all permissions query
export const usePermissions = (params = {}) => {
  return useQuery({
    queryKey: roleKeys.permissionsList(params),
    queryFn: async () => {
      const response = await rolesService.getPermissions(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single permission query
export const usePermission = (slug) => {
  return useQuery({
    queryKey: roleKeys.permissionDetail(slug),
    queryFn: async () => {
      const response = await rolesService.getPermission(slug);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get role permissions query
export const useRolePermissions = (roleSlug) => {
  return useQuery({
    queryKey: roleKeys.rolePermissions(roleSlug),
    queryFn: async () => {
      const response = await rolesService.getRolePermissions(roleSlug);
      return response.data;
    },
    enabled: !!roleSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get user roles query
export const useUserRoles = (userSlug) => {
  return useQuery({
    queryKey: roleKeys.userRoles(userSlug),
    queryFn: async () => {
      const response = await rolesService.getUserRoles(userSlug);
      return response.data;
    },
    enabled: !!userSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get role users query
export const useRoleUsers = (roleSlug) => {
  return useQuery({
    queryKey: roleKeys.roleUsers(roleSlug),
    queryFn: async () => {
      const response = await rolesService.getRoleUsers(roleSlug);
      return response.data;
    },
    enabled: !!roleSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create role mutation
export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleData) => {
      const response = await rolesService.createRole(roleData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });

      // Check if this is a shift role and show auto-assignment notification
      const autoAssignedCount = data?.details?.auto_assigned_to_users ||
        data?.data?.details?.auto_assigned_to_users || 0;
      const roleType = data?.role_type || data?.data?.role_type;

      if (roleType === "shift_role" && autoAssignedCount > 0) {
        toast.success("Shift role created successfully", {
          description: `Shift role created and automatically assigned to ${autoAssignedCount} user(s) who have the parent job role.`,
        });
      } else {
        toast.success("Role created successfully", {
          description: "The role has been created.",
        });
      }
    },
    onError: (error) => {
      console.error("Create role error:", error);
      const errorMessage = extractErrorMessage(error, "Failed to create role");
      toast.error("Failed to create role", {
        description: errorMessage,
      });
    },
  });
};

// Update role mutation
export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, roleData }) => {
      const response = await rolesService.updateRole(slug, roleData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: roleKeys.detail(variables.slug),
      });
      toast.success("Role updated successfully", {
        description: "The role has been updated.",
      });
    },
    onError: (error) => {
      console.error("Update role error:", error);
      const errorMessage = extractErrorMessage(error, "Failed to update role");
      toast.error("Failed to update role", {
        description: errorMessage,
      });
    },
  });
};

// Delete role mutation
export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      const response = await rolesService.deleteRole(slug);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(variables) });

      // Check if shift roles were automatically removed
      const removedShiftRoles = data?.details?.auto_removed_shift_roles ||
        data?.data?.details?.auto_removed_shift_roles || [];

      if (removedShiftRoles.length > 0) {
        toast.success("Job role removed successfully", {
          description: `${removedShiftRoles.length} shift role(s) were automatically removed: ${removedShiftRoles.join(", ")}`,
        });
      } else {
        toast.success("Role deleted successfully", {
          description: "The role has been deleted.",
        });
      }
    },
    onError: (error) => {
      console.error("Delete role error:", error);
      const errorMessage = extractErrorMessage(error, "Failed to delete role");
      toast.error("Failed to delete role", {
        description: errorMessage,
      });
    },
  });
};

// Create permission mutation
export const useCreatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (permissionData) => {
      const response = await rolesService.createPermission(permissionData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.permissions() });
      toast.success("Permission created successfully", {
        description: "The permission has been created.",
      });
    },
    onError: (error) => {
      console.error("Create permission error:", error);
      const errorMessage = extractErrorMessage(error, "Failed to create permission");
      toast.error("Failed to create permission", {
        description: errorMessage,
      });
    },
  });
};

// Assign permissions to role mutation
export const useAssignPermissionsToRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleSlug, permissionIds }) => {
      const response = await rolesService.assignPermissions(
        roleSlug,
        permissionIds
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: roleKeys.detail(variables.roleSlug),
      });
      queryClient.invalidateQueries({
        queryKey: roleKeys.rolePermissions(variables.roleSlug),
      });
      toast.success("Permissions assigned successfully", {
        description: "The permissions have been assigned to the role.",
      });
    },
    onError: (error) => {
      console.error("Assign permissions error:", error);
      const errorMessage = extractErrorMessage(error, "Failed to assign permissions");
      toast.error("Failed to assign permissions", {
        description: errorMessage,
      });
    },
  });
};

// Remove permissions from role mutation
export const useRemovePermissionsFromRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roleSlug, permissionIds }) => {
      const response = await rolesService.removePermissions(
        roleSlug,
        permissionIds
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: roleKeys.detail(variables.roleSlug),
      });
      queryClient.invalidateQueries({
        queryKey: roleKeys.rolePermissions(variables.roleSlug),
      });
      toast.success("Permissions removed successfully", {
        description: "The permissions have been removed from the role.",
      });
    },
    onError: (error) => {
      console.error("Remove permissions error:", error);
      const errorMessage = extractErrorMessage(error, "Failed to remove permissions");
      toast.error("Failed to remove permissions", {
        description: errorMessage,
      });
    },
  });
};

// Utility functions for data transformation
export const roleUtils = {
  // Transform API role data to display format
  transformRole: (apiRole) => {
    return {
      id: apiRole.id,
      name: apiRole.display_name || apiRole.name,
      slug: apiRole.slug || apiRole.name,
      description: apiRole.description || "No description available",
      priority: apiRole.priority || 0,
      userCount: apiRole.user_count || 0,
      permissionCount: apiRole.permissions_count || 0,
      isSystem: apiRole.is_system || false,
      isDefault: apiRole.is_default || false,
      maxUsers: apiRole.max_users || null,
      expiresAfterDays: apiRole.expires_after_days || null,
      createdAt: apiRole.created_at
        ? new Date(apiRole.created_at).toLocaleString()
        : "Unknown",
      updatedAt: apiRole.updated_at
        ? new Date(apiRole.updated_at).toLocaleString()
        : "Unknown",
      permissions: apiRole.permissions || [],
      // Hierarchy fields
      roleType: apiRole.role_type || "job_role",
      departmentId: apiRole.department_id || null,
      parentRoleId: apiRole.parent_role_id || null,
      department: apiRole.department || null,
      parentRole: apiRole.parent_role || null,
      shiftRoles: apiRole.shift_roles || [],
    };
  },

  // Transform API permission data to display format
  transformPermission: (apiPermission) => {
    return {
      id: apiPermission.id,
      name: apiPermission.display_name || apiPermission.name,
      slug: apiPermission.name,
      resource: apiPermission.resource || apiPermission.resource_name,
      action: apiPermission.action || apiPermission.action_name,
      description: apiPermission.description || "No description available",
      type: apiPermission.type || "custom",
      createdAt: apiPermission.created_at
        ? new Date(apiPermission.created_at).toLocaleString()
        : "Unknown",
    };
  },

  // Get role icon based on role type
  getRoleIcon: (role) => {
    if (role.isSystem) {
      if (role.slug === "superuser") return "Crown";
      if (role.slug === "doctor_contractor") return "UserCheck";
      if (role.slug === "staff") return "UserCog";
    }
    return "Shield";
  },

  // Get role color based on role type
  getRoleColor: (role) => {
    if (role.isSystem) {
      if (role.slug === "superuser") return "purple";
      if (role.slug === "doctor_contractor") return "blue";
      if (role.slug === "staff") return "green";
    }
    return "gray";
  },
};
