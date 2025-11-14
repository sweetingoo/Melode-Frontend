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

// Switch role mutation using assignment_id - just updates localStorage, no API call
export const useSwitchDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId) => {
      // No API call - just return the assignmentId
      return assignmentId;
    },
    onSuccess: (assignmentId) => {
      // Store active assignment_id in localStorage (this is what we use for X-Assignment-ID header)
      if (typeof window !== "undefined") {
        localStorage.setItem("assignment_id", assignmentId.toString());
        // Also store for backward compatibility
        localStorage.setItem("activeRoleId", assignmentId.toString());
      }

      // The API client interceptor will automatically pick up the new value from localStorage

      // Invalidate user departments query to refresh data
      queryClient.invalidateQueries({
        queryKey: departmentContextKeys.userDepartments(),
      });

      // Invalidate profile and permissions queries to refresh with new context
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["users", "detail"] });

      toast.success("Role switched successfully", {
        description: "Your role context has been updated.",
      });
    },
    onError: (error) => {
      console.error("Switch role error:", error);
      toast.error("Failed to switch role", {
        description: "An error occurred while switching roles.",
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
