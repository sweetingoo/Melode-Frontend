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
    retry: (failureCount, error) => {
      // Don't retry on 403 Forbidden (permission denied)
      if (error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
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
 * Get form type by slug
 */
export const useFormType = (slug) => {
  return useQuery({
    queryKey: ["formTypes", slug],
    queryFn: () => formTypesService.getFormType(slug),
    enabled: !!slug,
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
      // Handle 403 Forbidden (permission denied)
      if (error?.response?.status === 403) {
        const errorMessage =
          error?.response?.data?.detail ||
          "Permission denied: You do not have permission to create form types";
        toast.error("Permission Denied", {
          description: errorMessage,
        });
        return;
      }
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
    mutationFn: ({ slug, data }) => formTypesService.updateFormType(slug, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["formTypes"] });
      queryClient.invalidateQueries({ queryKey: ["formTypes", variables.slug] });
      toast.success("Form type updated successfully");
    },
    onError: (error) => {
      // Handle 403 Forbidden (permission denied)
      if (error?.response?.status === 403) {
        const errorMessage =
          error?.response?.data?.detail ||
          "Permission denied: You do not have permission to update form types";
        toast.error("Permission Denied", {
          description: errorMessage,
        });
        return;
      }
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
    mutationFn: (slug) => formTypesService.deleteFormType(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formTypes"] });
      toast.success("Form type deleted successfully");
    },
    onError: (error) => {
      // Handle 403 Forbidden (permission denied)
      if (error?.response?.status === 403) {
        const errorMessage =
          error?.response?.data?.detail ||
          "Permission denied: You do not have permission to delete form types";
        toast.error("Permission Denied", {
          description: errorMessage,
        });
        return;
      }
      const errorMessage = error.response?.data?.detail || "Failed to delete form type";
      toast.error(errorMessage);
    },
  });
};

