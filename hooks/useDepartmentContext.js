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

// Switch department mutation
export const useSwitchDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (departmentId) => {
      const response = await departmentContextService.switchDepartment(
        departmentId
      );
      return response;
    },
    onSuccess: (data, departmentId) => {
      // Store active department in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("activeDepartmentId", departmentId.toString());
      }

      // The API client interceptor will automatically pick up the new value from localStorage

      // Invalidate user departments query to refresh data
      queryClient.invalidateQueries({
        queryKey: departmentContextKeys.userDepartments(),
      });

      // Invalidate profile and permissions queries to refresh with new context
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["permissions"] });

      toast.success("Department switched successfully", {
        description: `Now viewing as ${data.role?.display_name || data.role?.name || "member"} in ${data.department?.name || "department"}.`,
      });
    },
    onError: (error) => {
      console.error("Switch department error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to switch department";
      toast.error("Failed to switch department", {
        description: errorMessage,
      });
    },
  });
};

// Utility functions for department context
export const departmentContextUtils = {
  // Get active department ID from localStorage
  getActiveDepartmentId: () => {
    if (typeof window !== "undefined") {
      const deptId = localStorage.getItem("activeDepartmentId");
      return deptId ? parseInt(deptId) : null;
    }
    return null;
  },

  // Set active department ID in localStorage
  setActiveDepartmentId: (departmentId) => {
    if (typeof window !== "undefined") {
      if (departmentId) {
        localStorage.setItem("activeDepartmentId", departmentId.toString());
      } else {
        localStorage.removeItem("activeDepartmentId");
      }
    }
  },

  // Clear active department
  clearActiveDepartment: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("activeDepartmentId");
    }
  },
};

