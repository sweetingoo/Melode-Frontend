import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentCategoriesService } from "@/services/documentCategories";
import { toast } from "sonner";

// Document category query keys
export const documentCategoryKeys = {
  all: ["document-categories"],
  lists: () => [...documentCategoryKeys.all, "list"],
  list: () => [...documentCategoryKeys.lists()],
  details: () => [...documentCategoryKeys.all, "detail"],
  detail: (id) => [...documentCategoryKeys.details(), id],
  permissions: (id) => [...documentCategoryKeys.all, "permissions", id],
};

// Get category tree query
export const useDocumentCategories = (options = {}) => {
  return useQuery({
    queryKey: documentCategoryKeys.list(),
    queryFn: async () => {
      const response = await documentCategoriesService.getCategories();
      // Handle response with categories array
      if (response?.data && typeof response.data === 'object' && 'categories' in response.data) {
        return response.data;
      }
      // Handle direct array response
      return Array.isArray(response?.data)
        ? { categories: response.data }
        : { categories: [] };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get single category query
export const useDocumentCategory = (id, options = {}) => {
  return useQuery({
    queryKey: documentCategoryKeys.detail(id),
    queryFn: async () => {
      const response = await documentCategoriesService.getCategory(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get category permissions query
export const useDocumentCategoryPermissions = (id, options = {}) => {
  return useQuery({
    queryKey: documentCategoryKeys.permissions(id),
    queryFn: async () => {
      const response = await documentCategoriesService.getCategoryPermissions(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Create category mutation
export const useCreateDocumentCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData) => {
      const response = await documentCategoriesService.createCategory(categoryData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentCategoryKeys.lists() });
      toast.success("Category created successfully", {
        description: `Category "${data.name || 'Untitled'}" has been created.`,
      });
    },
    onError: (error) => {
      console.error("Create category error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create category";
      toast.error("Failed to create category", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Update category mutation
export const useUpdateDocumentCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, categoryData }) => {
      const response = await documentCategoriesService.updateCategory(id, categoryData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentCategoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentCategoryKeys.detail(variables.id) });
      toast.success("Category updated successfully", {
        description: `Category "${data.name || 'Untitled'}" has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Update category error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update category";
      toast.error("Failed to update category", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Delete category mutation
export const useDeleteDocumentCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await documentCategoriesService.deleteCategory(id);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentCategoryKeys.lists() });
      queryClient.removeQueries({ queryKey: documentCategoryKeys.detail(variables) });
      toast.success("Category deleted successfully", {
        description: "The category has been deleted.",
      });
    },
    onError: (error) => {
      console.error("Delete category error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete category";
      toast.error("Failed to delete category", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Update category permissions mutation
export const useUpdateDocumentCategoryPermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, permissions }) => {
      const response = await documentCategoriesService.updateCategoryPermissions(id, permissions);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentCategoryKeys.permissions(variables.id) });
      queryClient.invalidateQueries({ queryKey: documentCategoryKeys.detail(variables.id) });
      toast.success("Category permissions updated successfully", {
        description: "The category permissions have been updated.",
      });
    },
    onError: (error) => {
      console.error("Update category permissions error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update category permissions";
      toast.error("Failed to update category permissions", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

