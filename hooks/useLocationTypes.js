import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { locationTypesService } from "@/services/locationTypes";
import { toast } from "sonner";

// Location type query keys
export const locationTypeKeys = {
  all: ["location-types"],
  lists: () => [...locationTypeKeys.all, "list"],
  list: (params) => [...locationTypeKeys.lists(), params],
  active: () => [...locationTypeKeys.all, "active"],
  details: () => [...locationTypeKeys.all, "detail"],
  detail: (slug) => [...locationTypeKeys.details(), slug],
  byName: (name) => [...locationTypeKeys.all, "name", name],
};

// Get active location types query (for dropdowns/selectors)
export const useActiveLocationTypes = () => {
  return useQuery({
    queryKey: locationTypeKeys.active(),
    queryFn: async () => {
      const response = await locationTypesService.getActiveLocationTypes();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get all location types query (with pagination)
export const useLocationTypes = (params = {}) => {
  return useQuery({
    queryKey: locationTypeKeys.list(params),
    queryFn: async () => {
      const response = await locationTypesService.getLocationTypes(params);
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

// Get single location type query
export const useLocationType = (slug) => {
  return useQuery({
    queryKey: locationTypeKeys.detail(slug),
    queryFn: async () => {
      const response = await locationTypesService.getLocationType(slug);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get location type by name query
export const useLocationTypeByName = (name) => {
  return useQuery({
    queryKey: locationTypeKeys.byName(name),
    queryFn: async () => {
      const response = await locationTypesService.getLocationTypeByName(name);
      return response.data;
    },
    enabled: !!name,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create location type mutation
export const useCreateLocationType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (locationTypeData) => {
      const response = await locationTypesService.createLocationType(locationTypeData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: locationTypeKeys.all });
      toast.success("Location type created successfully", {
        description: `Location type "${data.display_name}" has been created.`,
      });
    },
    onError: (error) => {
      console.error("Create location type error:", error);
      // Handle 403 Forbidden (permission denied)
      if (error?.response?.status === 403) {
        const errorMessage =
          error?.response?.data?.detail ||
          "Permission denied: You do not have permission to create location types";
        toast.error("Permission Denied", {
          description: errorMessage,
        });
        return;
      }
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create location type";
      toast.error("Failed to create location type", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Update location type mutation
export const useUpdateLocationType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, locationTypeData }) => {
      const response = await locationTypesService.updateLocationType(slug, locationTypeData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(locationTypeKeys.detail(variables.slug), data);
      queryClient.invalidateQueries({ queryKey: locationTypeKeys.all });
      toast.success("Location type updated successfully", {
        description: `Location type "${data.display_name}" has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Update location type error:", error);
      // Handle 403 Forbidden (permission denied)
      if (error?.response?.status === 403) {
        const errorMessage =
          error?.response?.data?.detail ||
          "Permission denied: You do not have permission to update location types";
        toast.error("Permission Denied", {
          description: errorMessage,
        });
        return;
      }
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update location type";
      toast.error("Failed to update location type", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Delete location type mutation
export const useDeleteLocationType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      await locationTypesService.deleteLocationType(slug);
      return slug;
    },
    onSuccess: (slug) => {
      queryClient.removeQueries({ queryKey: locationTypeKeys.detail(slug) });
      queryClient.invalidateQueries({ queryKey: locationTypeKeys.all });
      toast.success("Location type deleted successfully", {
        description: "The location type has been removed.",
      });
    },
    onError: (error) => {
      console.error("Delete location type error:", error);
      // Handle 403 Forbidden (permission denied)
      if (error?.response?.status === 403) {
        const errorMessage =
          error?.response?.data?.detail ||
          "Permission denied: You do not have permission to delete location types";
        toast.error("Permission Denied", {
          description: errorMessage,
        });
        return;
      }
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete location type";
      toast.error("Failed to delete location type", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};
