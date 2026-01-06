import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryTypesService } from "@/services/categoryTypes";
import { toast } from "sonner";

// Category type query keys
export const categoryTypeKeys = {
  all: ["category-types"],
  lists: () => [...categoryTypeKeys.all, "list"],
  list: (params) => [...categoryTypeKeys.lists(), params],
  active: () => [...categoryTypeKeys.all, "active"],
  details: () => [...categoryTypeKeys.all, "detail"],
  detail: (slug) => [...categoryTypeKeys.details(), slug],
  byId: (id) => [...categoryTypeKeys.details(), "id", id],
};

// Get active category types query (for dropdowns/selectors)
export const useActiveCategoryTypes = () => {
  return useQuery({
    queryKey: categoryTypeKeys.active(),
    queryFn: async () => {
      const response = await categoryTypesService.getActiveCategoryTypes();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get all category types query (with pagination)
export const useCategoryTypes = (params = {}) => {
  return useQuery({
    queryKey: categoryTypeKeys.list(params),
    queryFn: async () => {
      const response = await categoryTypesService.getCategoryTypes(params);
      return response.data;
    },
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

// Get single category type query by slug
export const useCategoryType = (slug) => {
  return useQuery({
    queryKey: categoryTypeKeys.detail(slug),
    queryFn: async () => {
      const response = await categoryTypesService.getCategoryType(slug);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get single category type query by ID
export const useCategoryTypeById = (id) => {
  return useQuery({
    queryKey: categoryTypeKeys.byId(id),
    queryFn: async () => {
      const response = await categoryTypesService.getCategoryTypeById(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create category type mutation
export const useCreateCategoryType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryTypeData) => {
      const response = await categoryTypesService.createCategoryType(categoryTypeData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: categoryTypeKeys.all });
      toast.success("Category type created successfully", {
        description: `Category type "${data.display_name}" has been created.`,
      });
    },
    onError: (error) => {
      console.error("Create category type error:", error);
      // Handle 403 Forbidden (permission denied)
      if (error?.response?.status === 403) {
        const errorMessage =
          error?.response?.data?.detail ||
          "Permission denied: You do not have permission to create category types";
        toast.error("Permission Denied", {
          description: errorMessage,
        });
        return;
      }
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create category type";
      toast.error("Failed to create category type", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Update category type mutation
export const useUpdateCategoryType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, categoryTypeData }) => {
      const response = await categoryTypesService.updateCategoryType(slug, categoryTypeData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(categoryTypeKeys.detail(variables.slug), data);
      queryClient.invalidateQueries({ queryKey: categoryTypeKeys.all });
      toast.success("Category type updated successfully", {
        description: `Category type "${data.display_name}" has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Update category type error:", error);
      // Handle 403 Forbidden (permission denied)
      if (error?.response?.status === 403) {
        const errorMessage =
          error?.response?.data?.detail ||
          "Permission denied: You do not have permission to update category types";
        toast.error("Permission Denied", {
          description: errorMessage,
        });
        return;
      }
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update category type";
      toast.error("Failed to update category type", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Delete category type mutation
export const useDeleteCategoryType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      await categoryTypesService.deleteCategoryType(slug);
      return slug;
    },
    onSuccess: (slug) => {
      queryClient.removeQueries({ queryKey: categoryTypeKeys.detail(slug) });
      queryClient.invalidateQueries({ queryKey: categoryTypeKeys.all });
      toast.success("Category type deleted successfully", {
        description: "The category type has been removed.",
      });
    },
    onError: (error) => {
      console.error("Delete category type error:", error);
      // Handle 403 Forbidden (permission denied)
      if (error?.response?.status === 403) {
        const errorMessage =
          error?.response?.data?.detail ||
          "Permission denied: You do not have permission to delete category types";
        toast.error("Permission Denied", {
          description: errorMessage,
        });
        return;
      }
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete category type";
      toast.error("Failed to delete category type", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};
