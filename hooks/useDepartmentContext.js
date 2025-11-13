import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentContextService } from "@/services/departmentContext";
import { toast } from "sonner";

// Query keys for department context
export const departmentContextKeys = {
  all: ["departmentContext"],
  userDepartments: () => [...departmentContextKeys.all, "userDepartments"],
};

// Get user departments
export const useUserDepartments = () => {
  return useQuery({
    queryKey: departmentContextKeys.userDepartments(),
    queryFn: async () => {
      const response = await departmentContextService.getUserDepartments();
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Switch role mutation (previously department switching)
export const useSwitchDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId) => {
      const response = await departmentContextService.switchRole(roleId);
      return response;
    },
    onSuccess: (data, roleId) => {
      // Store active role ID in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("activeRoleId", roleId.toString());
        // Keep backward compatibility - also store as activeDepartmentId for migration period
        // This can be removed after full migration
        if (data.department?.id) {
          localStorage.setItem("activeDepartmentId", data.department.id.toString());
        }
      }

      // The API client interceptor will automatically pick up the new value from localStorage

      // Invalidate user departments query to refresh data
      queryClient.invalidateQueries({
        queryKey: departmentContextKeys.userDepartments(),
      });

      // Invalidate profile and permissions queries to refresh with new context
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["permissions"] });

      toast.success("Role switched successfully", {
        description: `Now viewing as ${data.role?.display_name || data.role?.name || "member"} in ${data.department?.name || "department"}.`,
      });
    },
    onError: (error) => {
      console.error("Switch role error:", error);
      
      // Handle 403 error when role switching is disabled
      if (error?.response?.status === 403) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Role switching is disabled. Please logout and login again to switch roles.";
        toast.error("Role Switching Disabled", {
          description: errorMessage,
          duration: 5000,
        });
        return;
      }
      
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to switch role";
      toast.error("Failed to switch role", {
        description: errorMessage,
      });
    },
  });
};

// Utility functions for department context (now role-based)
export const departmentContextUtils = {
  // Get active role ID from localStorage
  getActiveRoleId: () => {
    if (typeof window !== "undefined") {
      const roleId = localStorage.getItem("activeRoleId");
      return roleId ? parseInt(roleId) : null;
    }
    return null;
  },

  // Set active role ID in localStorage
  setActiveRoleId: (roleId) => {
    if (typeof window !== "undefined") {
      if (roleId) {
        localStorage.setItem("activeRoleId", roleId.toString());
      } else {
        localStorage.removeItem("activeRoleId");
      }
    }
  },

  // Clear active role
  clearActiveRole: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("activeRoleId");
      // Also clear legacy department ID
      localStorage.removeItem("activeDepartmentId");
    }
  },

  // Legacy support - Get active department ID (for backward compatibility)
  getActiveDepartmentId: () => {
    if (typeof window !== "undefined") {
      const deptId = localStorage.getItem("activeDepartmentId");
      return deptId ? parseInt(deptId) : null;
    }
    return null;
  },

  // Legacy support - Set active department ID (for backward compatibility)
  setActiveDepartmentId: (departmentId) => {
    if (typeof window !== "undefined") {
      if (departmentId) {
        localStorage.setItem("activeDepartmentId", departmentId.toString());
      } else {
        localStorage.removeItem("activeDepartmentId");
      }
    }
  },

  // Legacy support - Clear active department (for backward compatibility)
  clearActiveDepartment: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("activeDepartmentId");
    }
  },
};

