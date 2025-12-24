import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formTypesService } from "@/services/formTypes";
import { toast } from "sonner";

/**
 * Get all form types with pagination and filters
 */
export const useFormTypes = (params = {}) => {
  return useQuery({
    queryKey: ["formTypes", params],
    queryFn: () => formTypesService.getFormTypes(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get all active form types (for dropdowns)
 */
export const useActiveFormTypes = () => {
  return useQuery({
    queryKey: ["formTypes", "active", "all"],
    queryFn: () => formTypesService.getActiveFormTypes(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get form type by ID
 */
export const useFormType = (id) => {
  return useQuery({
    queryKey: ["formTypes", id],
    queryFn: () => formTypesService.getFormType(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get form type by name
 */
export const useFormTypeByName = (name) => {
  return useQuery({
    queryKey: ["formTypes", "name", name],
    queryFn: () => formTypesService.getFormTypeByName(name),
    enabled: !!name,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Create form type mutation
 */
export const useCreateFormType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formTypeData) => formTypesService.createFormType(formTypeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formTypes"] });
      toast.success("Form type created successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to create form type");
    },
  });
};

/**
 * Update form type mutation
 */
export const useUpdateFormType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => formTypesService.updateFormType(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["formTypes"] });
      queryClient.invalidateQueries({ queryKey: ["formTypes", variables.id] });
      toast.success("Form type updated successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to update form type");
    },
  });
};

/**
 * Delete form type mutation
 */
export const useDeleteFormType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => formTypesService.deleteFormType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formTypes"] });
      toast.success("Form type deleted successfully");
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || "Failed to delete form type";
      toast.error(errorMessage);
    },
  });
};

