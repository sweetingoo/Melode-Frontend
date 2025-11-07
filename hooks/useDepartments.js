import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentsService } from "@/services/departments";
import { toast } from "sonner";

// Department query keys
export const departmentKeys = {
  all: ["departments"],
  lists: () => [...departmentKeys.all, "list"],
  list: (params) => [...departmentKeys.lists(), params],
  details: () => [...departmentKeys.all, "detail"],
  detail: (id) => [...departmentKeys.details(), id],
};

// Get all departments query
export const useDepartments = (params = {}) => {
  return useQuery({
    queryKey: departmentKeys.list(params),
    queryFn: async () => {
      const response = await departmentsService.getDepartments(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single department query
export const useDepartment = (id) => {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: async () => {
      const response = await departmentsService.getDepartment(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create department mutation
export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (departmentData) => {
      const response = await departmentsService.createDepartment(departmentData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      toast.success("Department created successfully", {
        description: `${data.name || "Department"} has been created.`,
      });
    },
    onError: (error) => {
      console.error("Create department error:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to create department";
      toast.error("Failed to create department", {
        description: errorMessage,
      });
    },
  });
};

// Update department mutation
export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, departmentData }) => {
      const response = await departmentsService.updateDepartment(
        id,
        departmentData
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        departmentKeys.detail(variables.id),
        data
      );
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      toast.success("Department updated successfully", {
        description: `${data.name || "Department"} has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Update department error:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to update department";
      toast.error("Failed to update department", {
        description: errorMessage,
      });
    },
  });
};

// Delete department mutation
export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await departmentsService.deleteDepartment(id);
      return response.data;
    },
    onSuccess: (data, id) => {
      queryClient.removeQueries({ queryKey: departmentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      toast.success("Department deleted successfully", {
        description: "The department has been removed.",
      });
    },
    onError: (error) => {
      console.error("Delete department error:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to delete department";
      toast.error("Failed to delete department", {
        description: errorMessage,
      });
    },
  });
};

