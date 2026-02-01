import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerCategoriesService } from "@/services/trackerCategories";
import { toast } from "sonner";

export const useTrackerCategories = (params = {}) => {
  return useQuery({
    queryKey: ["trackerCategories", params],
    queryFn: () => trackerCategoriesService.getTrackerCategories(params),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error?.response?.status === 403) return false;
      return failureCount < 3;
    },
  });
};

export const useActiveTrackerCategories = (params = {}) => {
  return useQuery({
    queryKey: ["trackerCategories", "active", "all", params],
    queryFn: () => trackerCategoriesService.getActiveTrackerCategories(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useTrackerCategory = (slug) => {
  return useQuery({
    queryKey: ["trackerCategories", slug],
    queryFn: () => trackerCategoriesService.getTrackerCategory(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateTrackerCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => trackerCategoriesService.createTrackerCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackerCategories"] });
      toast.success("Tracker category created successfully");
    },
    onError: (error) => {
      if (error?.response?.status === 403) {
        toast.error("Permission Denied", {
          description: error?.response?.data?.detail || "You do not have permission to create tracker categories",
        });
        return;
      }
      toast.error(error.response?.data?.detail || "Failed to create tracker category");
    },
  });
};

export const useUpdateTrackerCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }) => trackerCategoriesService.updateTrackerCategory(slug, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trackerCategories"] });
      if (variables?.slug) queryClient.invalidateQueries({ queryKey: ["trackerCategories", variables.slug] });
      toast.success("Tracker category updated successfully");
    },
    onError: (error) => {
      if (error?.response?.status === 403) {
        toast.error("Permission Denied", {
          description: error?.response?.data?.detail || "You do not have permission to update tracker categories",
        });
        return;
      }
      toast.error(error.response?.data?.detail || "Failed to update tracker category");
    },
  });
};

export const useDeleteTrackerCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug) => trackerCategoriesService.deleteTrackerCategory(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trackerCategories"] });
      toast.success("Tracker category deleted successfully");
    },
    onError: (error) => {
      if (error?.response?.status === 403) {
        toast.error("Permission Denied", {
          description: error?.response?.data?.detail || "You do not have permission to delete tracker categories",
        });
        return;
      }
      toast.error(error.response?.data?.detail || "Failed to delete tracker category");
    },
  });
};
