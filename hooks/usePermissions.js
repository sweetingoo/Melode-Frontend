"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { permissionsService } from "@/services/permissions";
import { parseUTCDate } from "@/utils/time";

// Query keys for permissions
export const permissionKeys = {
  all: ["permissions"],
  lists: () => [...permissionKeys.all, "list"],
  list: (params) => [...permissionKeys.lists(), params],
  details: () => [...permissionKeys.all, "detail"],
  detail: (id) => [...permissionKeys.details(), id],
  resources: () => [...permissionKeys.all, "resources"],
  actions: () => [...permissionKeys.all, "actions"],
  rolesWithPermission: (id) => [
    ...permissionKeys.all,
    "roles-with-permission",
    id,
  ],
  userPermissions: (userId) => [
    ...permissionKeys.all,
    "user-permissions",
    userId,
  ],
};

// Get all permissions query
export const usePermissions = (params = {}) => {
  return useQuery({
    queryKey: permissionKeys.list(params),
    queryFn: async () => {
      try {
        const response = await permissionsService.getPermissions(params);
        // Handle new paginated response structure: { permissions: [], total: 96, page: 1, per_page: 50, total_pages: 2 }
        if (response && typeof response === 'object' && 'permissions' in response) {
          return response; // Return full paginated response
        }
        // Handle legacy array response or wrapped response
        return Array.isArray(response) ? { permissions: response, total: response.length } : { permissions: response.data || [], total: (response.data || []).length };
      } catch (error) {
        // If validation error (422), return empty result instead of failing
        if (error?.response?.status === 422) {
          console.warn("Permissions endpoint returned validation error, returning empty result:", error.response?.data);
          return { permissions: [], total: 0 };
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 422 validation errors
      if (error?.response?.status === 422) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Get permissions with pagination
export const usePermissionsPaginated = (params = {}) => {
  const defaultParams = {
    page: 1,
    per_page: 50,
    ...params,
  };

  return useQuery({
    queryKey: permissionKeys.list(defaultParams),
    queryFn: async () => {
      const response = await permissionsService.getPermissions(defaultParams);
      // Handle new paginated response structure: { permissions: [], total: 96, page: 1, per_page: 50, total_pages: 2 }
      if (response && typeof response === 'object' && 'permissions' in response) {
        return response; // Return full paginated response
      }
      // Handle legacy array response or wrapped response
      return Array.isArray(response) ? { permissions: response, total: response.length } : { permissions: response.data || [], total: (response.data || []).length };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single permission query
export const usePermission = (id) => {
  return useQuery({
    queryKey: permissionKeys.detail(id),
    queryFn: async () => {
      const response = await permissionsService.getPermission(id);
      // Handle both direct object response and wrapped response
      return response.data || response;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get available resources query
export const useResources = () => {
  return useQuery({
    queryKey: permissionKeys.resources(),
    queryFn: async () => {
      try {
        const response = await permissionsService.getResources();
        // Handle both direct array response and wrapped response
        return Array.isArray(response) ? response : response.data;
      } catch (error) {
        // If validation error (422), return empty array instead of failing
        if (error?.response?.status === 422) {
          console.warn("Resources endpoint returned validation error, returning empty array:", error.response?.data);
          return [];
        }
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - resources don't change often
    retry: (failureCount, error) => {
      // Don't retry on 422 validation errors
      if (error?.response?.status === 422) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Get available actions query
export const useActions = () => {
  return useQuery({
    queryKey: permissionKeys.actions(),
    queryFn: async () => {
      try {
        const response = await permissionsService.getActions();
        // Handle both direct array response and wrapped response
        return Array.isArray(response) ? response : response.data;
      } catch (error) {
        // If validation error (422), return empty array instead of failing
        if (error?.response?.status === 422) {
          console.warn("Actions endpoint returned validation error, returning empty array:", error.response?.data);
          return [];
        }
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - actions don't change often
    retry: (failureCount, error) => {
      // Don't retry on 422 validation errors
      if (error?.response?.status === 422) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Get roles with specific permission query
export const useRolesWithPermission = (permissionId) => {
  return useQuery({
    queryKey: permissionKeys.rolesWithPermission(permissionId),
    queryFn: async () => {
      const response = await permissionsService.getRolesWithPermission(
        permissionId
      );
      return response.data;
    },
    enabled: !!permissionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Check user permissions query
export const useUserPermissions = (userId) => {
  return useQuery({
    queryKey: permissionKeys.userPermissions(userId),
    queryFn: async () => {
      const response = await permissionsService.checkUserPermissions(userId);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create permission mutation
export const useCreatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (permissionData) => {
      const response = await permissionsService.createPermission(
        permissionData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.lists() });
      toast.success("Permission created successfully", {
        description: "The permission has been created.",
      });
    },
    onError: (error) => {
      console.error("Create permission error:", error);

      if (error.response?.status === 422) {
        // Handle validation errors
        const errorData = error.response.data;
        if (errorData?.detail && Array.isArray(errorData.detail)) {
          // Show first validation error
          const firstError = errorData.detail[0];
          const fieldName = firstError.loc && firstError.loc.length > 1 ? firstError.loc[1] : 'field';
          toast.error(`Validation Error: ${fieldName}`, {
            description: firstError.msg || "Please check your input",
          });
        } else {
          toast.error("Validation Error", {
            description: errorData?.message || "Please check your input",
          });
        }
      } else {
        const errorMessage =
          error?.response?.data?.message || "Failed to create permission";
        toast.error("Failed to create permission", {
          description: errorMessage,
        });
      }
    },
  });
};

// Update permission mutation
export const useUpdatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, permissionData }) => {
      const response = await permissionsService.updatePermission(
        id,
        permissionData
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: permissionKeys.detail(variables.id),
      });
      toast.success("Permission updated successfully", {
        description: "The permission has been updated.",
      });
    },
    onError: (error) => {
      console.error("Update permission error:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to update permission";
      toast.error("Failed to update permission", {
        description: errorMessage,
      });
    },
  });
};

// Delete permission mutation
export const useDeletePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await permissionsService.deletePermission(id);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: permissionKeys.detail(variables),
      });
      toast.success("Permission deleted successfully", {
        description: "The permission has been deleted.",
      });
    },
    onError: (error) => {
      console.error("Delete permission error:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to delete permission";
      toast.error("Failed to delete permission", {
        description: errorMessage,
      });
    },
  });
};

// Utility functions for data transformation
export const permissionUtils = {
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
      isSystem: apiPermission.is_system || false,
      createdAt: apiPermission.created_at
        ? (() => {
            const date = parseUTCDate(apiPermission.created_at);
            return date ? date.toLocaleString() : "Unknown";
          })()
        : "Unknown",
      updatedAt: apiPermission.updated_at
        ? (() => {
            const date = parseUTCDate(apiPermission.updated_at);
            return date ? date.toLocaleString() : "Unknown";
          })()
        : apiPermission.created_at
          ? (() => {
              const date = parseUTCDate(apiPermission.created_at);
              return date ? date.toLocaleString() : "Unknown";
            })()
          : "Unknown",
    };
  },

  // Transform API resource data to display format
  transformResource: (apiResource) => {
    return {
      id: apiResource.id || apiResource,
      name: apiResource.name || apiResource,
      displayName: apiResource.display_name || apiResource.name || apiResource,
      description: apiResource.description || "",
    };
  },

  // Transform API action data to display format
  transformAction: (apiAction) => {
    return {
      id: apiAction.id || apiAction,
      name: apiAction.name || apiAction,
      displayName: apiAction.display_name || apiAction.name || apiAction,
      description: apiAction.description || "",
    };
  },

  // Get permission type color
  getTypeColor: (type) => {
    const colorMap = {
      CRUD: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      System: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      Analytics:
        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      Data: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      Custom:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
    };
    return colorMap[type] || colorMap.Custom;
  },

  // Get permission type based on resource and action
  getPermissionType: (resource, action) => {
    if (resource === "system") return "System";
    if (resource === "analytics") return "Analytics";
    if (resource === "data") return "Data";
    if (["create", "read", "update", "delete", "list"].includes(action))
      return "CRUD";
    return "Custom";
  },
};
