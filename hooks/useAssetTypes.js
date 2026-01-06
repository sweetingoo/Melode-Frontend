import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assetTypesService } from "@/services/assetTypes";
import { toast } from "sonner";

// Asset type query keys
export const assetTypeKeys = {
  all: ["asset-types"],
  lists: () => [...assetTypeKeys.all, "list"],
  list: (params) => [...assetTypeKeys.lists(), params],
  active: () => [...assetTypeKeys.all, "active"],
  details: () => [...assetTypeKeys.all, "detail"],
  detail: (slug) => [...assetTypeKeys.details(), slug],
  byName: (name) => [...assetTypeKeys.all, "name", name],
  search: (params) => [...assetTypeKeys.all, "search", params],
};

// Get active asset types query (for dropdowns/selectors)
export const useActiveAssetTypes = () => {
  return useQuery({
    queryKey: assetTypeKeys.active(),
    queryFn: async () => {
      const response = await assetTypesService.getActiveAssetTypes();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get all asset types query (with pagination)
export const useAssetTypes = (params = {}) => {
  return useQuery({
    queryKey: assetTypeKeys.list(params),
    queryFn: async () => {
      const response = await assetTypesService.getAssetTypes(params);
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

// Get single asset type query
export const useAssetType = (slug) => {
  return useQuery({
    queryKey: assetTypeKeys.detail(slug),
    queryFn: async () => {
      const response = await assetTypesService.getAssetType(slug);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get asset type by name query
export const useAssetTypeByName = (name) => {
  return useQuery({
    queryKey: assetTypeKeys.byName(name),
    queryFn: async () => {
      const response = await assetTypesService.getAssetTypeByName(name);
      return response.data;
    },
    enabled: !!name,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create asset type mutation
export const useCreateAssetType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetTypeData) => {
      const response = await assetTypesService.createAssetType(assetTypeData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: assetTypeKeys.all });
      toast.success("Asset type created successfully", {
        description: `Asset type "${data.display_name}" has been created.`,
      });
    },
    onError: (error) => {
      console.error("Create asset type error:", error);
      // Handle 403 Forbidden (permission denied)
      if (error?.response?.status === 403) {
        const errorMessage =
          error?.response?.data?.detail ||
          "Permission denied: You do not have permission to create asset types";
        toast.error("Permission Denied", {
          description: errorMessage,
        });
        return;
      }
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create asset type";
      toast.error("Failed to create asset type", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Update asset type mutation
export const useUpdateAssetType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, assetTypeData }) => {
      const response = await assetTypesService.updateAssetType(slug, assetTypeData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(assetTypeKeys.detail(variables.slug), data);
      queryClient.invalidateQueries({ queryKey: assetTypeKeys.all });
      toast.success("Asset type updated successfully", {
        description: `Asset type "${data.display_name}" has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Update asset type error:", error);
      // Handle 403 Forbidden (permission denied)
      if (error?.response?.status === 403) {
        const errorMessage =
          error?.response?.data?.detail ||
          "Permission denied: You do not have permission to update asset types";
        toast.error("Permission Denied", {
          description: errorMessage,
        });
        return;
      }
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update asset type";
      toast.error("Failed to update asset type", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Delete asset type mutation
export const useDeleteAssetType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      await assetTypesService.deleteAssetType(slug);
      return slug;
    },
    onSuccess: (slug) => {
      queryClient.removeQueries({ queryKey: assetTypeKeys.detail(slug) });
      queryClient.invalidateQueries({ queryKey: assetTypeKeys.all });
      toast.success("Asset type deleted successfully", {
        description: "The asset type has been removed.",
      });
    },
    onError: (error) => {
      console.error("Delete asset type error:", error);
      // Handle 403 Forbidden (permission denied)
      if (error?.response?.status === 403) {
        const errorMessage =
          error?.response?.data?.detail ||
          "Permission denied: You do not have permission to delete asset types";
        toast.error("Permission Denied", {
          description: errorMessage,
        });
        return;
      }
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete asset type";
      toast.error("Failed to delete asset type", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};
