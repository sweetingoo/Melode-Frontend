import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeesService } from "@/services/employees";
import { toast } from "sonner";

// Employee query keys
export const employeeKeys = {
  all: ["employees"],
  lists: () => [...employeeKeys.all, "list"],
  list: (params) => [...employeeKeys.lists(), params],
  details: () => [...employeeKeys.all, "detail"],
  detail: (id) => [...employeeKeys.details(), id],
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
export const useEmployee = (id) => {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: async () => {
      const response = await employeesService.getEmployee(id);
      return response.data;
    },
    enabled: !!id,
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
      toast.success("Employee created successfully", {
        description: `Employee has been created.`,
      });
    },
    onError: (error) => {
      console.error("Create employee error:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to create employee";
      toast.error("Failed to create employee", {
        description: errorMessage,
      });
    },
  });
};

// Update employee mutation
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, employeeData }) => {
      const response = await employeesService.updateEmployee(
        id,
        employeeData
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(employeeKeys.detail(variables.id), data);
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      toast.success("Employee updated successfully", {
        description: `Employee has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Update employee error:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to update employee";
      toast.error("Failed to update employee", {
        description: errorMessage,
      });
    },
  });
};

// Delete employee mutation
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await employeesService.deleteEmployee(id);
      return response.data;
    },
    onSuccess: (data, id) => {
      queryClient.removeQueries({ queryKey: employeeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      toast.success("Employee deleted successfully", {
        description: "The employee has been removed.",
      });
    },
    onError: (error) => {
      console.error("Delete employee error:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to delete employee";
      toast.error("Failed to delete employee", {
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

