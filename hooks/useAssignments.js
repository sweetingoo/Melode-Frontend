import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentsService } from "@/services/assignments";
import { toast } from "sonner";

// Assignment query keys
export const assignmentKeys = {
  all: ["assignments"],
  lists: () => [...assignmentKeys.all, "list"],
  list: (params) => [...assignmentKeys.lists(), params],
  details: () => [...assignmentKeys.all, "detail"],
  detail: (id) => [...assignmentKeys.details(), id],
  employee: (employeeId) => [...assignmentKeys.all, "employee", employeeId],
  department: (departmentId) => [
    ...assignmentKeys.all,
    "department",
    departmentId,
  ],
};

// Get all assignments query
// options.enabled: when false, the query will not run (e.g. when dialog is closed)
export const useAssignments = (params = {}, options = {}) => {
  const { enabled = true, ...restOptions } = options;
  return useQuery({
    queryKey: assignmentKeys.list(params),
    queryFn: async () => {
      const response = await assignmentsService.getAssignments(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
    ...restOptions,
  });
};

// Get assignments for a specific employee
export const useEmployeeAssignments = (userSlug) => {
  return useQuery({
    queryKey: assignmentKeys.employee(userSlug),
    queryFn: async () => {
      const response =
        await assignmentsService.getEmployeeAssignments(userSlug);
      return response.data;
    },
    enabled: !!userSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get assignments for a specific department
export const useDepartmentAssignments = (departmentSlug) => {
  return useQuery({
    queryKey: assignmentKeys.department(departmentSlug),
    queryFn: async () => {
      const response =
        await assignmentsService.getDepartmentAssignments(departmentSlug);
      return response.data;
    },
    enabled: !!departmentSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single assignment query
export const useAssignment = (slug) => {
  return useQuery({
    queryKey: assignmentKeys.detail(slug),
    queryFn: async () => {
      const response = await assignmentsService.getAssignment(slug);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create assignment mutation
export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentData) => {
      const response =
        await assignmentsService.createAssignment(assignmentData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.all });
      toast.success("Assignment created successfully", {
        description: "Person has been assigned to department.",
      });
    },
    onError: (error) => {
      console.error("Create assignment error:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to create assignment";
      toast.error("Failed to create assignment", {
        description: errorMessage,
      });
    },
  });
};

// Update assignment mutation
export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, assignmentData }) => {
      const response = await assignmentsService.updateAssignment(
        slug,
        assignmentData
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(assignmentKeys.detail(variables.slug), data);
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
      toast.success("Assignment updated successfully", {
        description: "Assignment has been updated.",
      });
    },
    onError: (error) => {
      console.error("Update assignment error:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to update assignment";
      toast.error("Failed to update assignment", {
        description: errorMessage,
      });
    },
  });
};

// Delete assignment mutation
export const useDeleteAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userSlug, departmentSlug }) => {
      const response = await assignmentsService.deleteAssignment(
        userSlug,
        departmentSlug
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.employee(variables.userSlug),
      });
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.department(variables.departmentSlug),
      });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
      // Invalidate users list so people-management page shows updated role (no stale "removed" role)
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Assignment removed successfully", {
        description: "The assignment has been removed.",
      });
    },
    onError: (error) => {
      console.error("Delete assignment error:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to delete assignment";
      toast.error("Failed to delete assignment", {
        description: errorMessage,
      });
    },
  });
};

