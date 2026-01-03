import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { departmentsService } from "@/services/departments";
import { toast } from "sonner";
import { extractErrorMessage } from "@/utils/error-handler";

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
export const useDepartment = (slug) => {
  return useQuery({
    queryKey: departmentKeys.detail(slug),
    queryFn: async () => {
      const response = await departmentsService.getDepartment(slug);
      return response.data;
    },
    enabled: !!slug,
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
      // Invalidate and refetch all department list queries to refresh the list
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.refetchQueries({ queryKey: departmentKeys.lists() });
      toast.success("Department created successfully", {
        description: `${data.name || "Department"} has been created.`,
      });
    },
    onError: (error) => {
      console.error("Create department error:", error);
      const errorMessage = extractErrorMessage(error, "Failed to create department");
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
    mutationFn: async ({ slug, departmentData }) => {
      const response = await departmentsService.updateDepartment(
        slug,
        departmentData
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        departmentKeys.detail(variables.slug),
        data
      );
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      toast.success("Department updated successfully", {
        description: `${data.name || "Department"} has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Update department error:", error);
      const errorMessage = extractErrorMessage(error, "Failed to update department");
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
    mutationFn: async (slug) => {
      const response = await departmentsService.deleteDepartment(slug);
      return response.data;
    },
    onSuccess: (data, slug) => {
      queryClient.removeQueries({ queryKey: departmentKeys.detail(slug) });
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      toast.success("Department deleted successfully", {
        description: "The department has been removed.",
      });
    },
    onError: (error) => {
      console.error("Delete department error:", error);
      const errorMessage = extractErrorMessage(error, "Failed to delete department");
      toast.error("Failed to delete department", {
        description: errorMessage,
      });
    },
  });
};

