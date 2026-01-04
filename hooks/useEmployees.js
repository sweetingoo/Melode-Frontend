import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeesService } from "@/services/employees";
import { toast } from "sonner";

// Employee query keys
export const employeeKeys = {
  all: ["employees"],
  lists: () => [...employeeKeys.all, "list"],
  list: (params) => [...employeeKeys.lists(), params],
  details: () => [...employeeKeys.all, "detail"],
  detail: (slug) => [...employeeKeys.details(), slug],
  hierarchy: () => [...employeeKeys.all, "hierarchy"],
};

// Get all employees query
export const useEmployees = (params = {}) => {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: async () => {
      const response = await employeesService.getEmployees(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single employee query
export const useEmployee = (slug) => {
  return useQuery({
    queryKey: employeeKeys.detail(slug),
    queryFn: async () => {
      const response = await employeesService.getEmployee(slug);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create employee mutation
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeData) => {
      const response = await employeesService.createEmployee(employeeData);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch all employee list queries to refresh the list
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.refetchQueries({ queryKey: employeeKeys.lists() });
      toast.success("Person created successfully", {
        description: `Person has been created.`,
      });
    },
    onError: (error) => {
      console.error("Create employee error:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to create person";
      toast.error("Failed to create person", {
        description: errorMessage,
      });
    },
  });
};

// Update employee mutation
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, employeeData }) => {
      const response = await employeesService.updateEmployee(
        slug,
        employeeData
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(employeeKeys.detail(variables.slug), data);
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      toast.success("Person updated successfully", {
        description: `Person has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Update employee error:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to update person";
      toast.error("Failed to update person", {
        description: errorMessage,
      });
    },
  });
};

// Delete employee mutation
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      const response = await employeesService.deleteEmployee(slug);
      return response.data;
    },
    onSuccess: (data, slug) => {
      queryClient.removeQueries({ queryKey: employeeKeys.detail(slug) });
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      toast.success("Person deleted successfully", {
        description: "The person has been removed.",
      });
    },
    onError: (error) => {
      console.error("Delete employee error:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to delete person";
      toast.error("Failed to delete person", {
        description: errorMessage,
      });
    },
  });
};

// Get hierarchy image query
export const useHierarchyImage = () => {
  return useQuery({
    queryKey: employeeKeys.hierarchy(),
    queryFn: async () => {
      const response = await employeesService.getHierarchyImage();
      return URL.createObjectURL(response.data);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

