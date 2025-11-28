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
export const useAssignments = (params = {}) => {
  return useQuery({
    queryKey: assignmentKeys.list(params),
    queryFn: async () => {
      const response = await assignmentsService.getAssignments(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get assignments for a specific employee
export const useEmployeeAssignments = (employeeId) => {
  return useQuery({
    queryKey: assignmentKeys.employee(employeeId),
    queryFn: async () => {
      const response =
        await assignmentsService.getEmployeeAssignments(employeeId);
      return response.data;
    },
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get assignments for a specific department
export const useDepartmentAssignments = (departmentId) => {
  return useQuery({
    queryKey: assignmentKeys.department(departmentId),
    queryFn: async () => {
      const response =
        await assignmentsService.getDepartmentAssignments(departmentId);
      return response.data;
    },
    enabled: !!departmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single assignment query
export const useAssignment = (id) => {
  return useQuery({
    queryKey: assignmentKeys.detail(id),
    queryFn: async () => {
      const response = await assignmentsService.getAssignment(id);
      return response.data;
    },
    enabled: !!id,
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
    mutationFn: async ({ id, assignmentData }) => {
      const response = await assignmentsService.updateAssignment(
        id,
        assignmentData
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(assignmentKeys.detail(variables.id), data);
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
    mutationFn: async ({ employeeId, departmentId }) => {
      const response = await assignmentsService.deleteAssignment(
        employeeId,
        departmentId
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.employee(variables.employeeId),
      });
      queryClient.invalidateQueries({
        queryKey: assignmentKeys.department(variables.departmentId),
      });
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
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

