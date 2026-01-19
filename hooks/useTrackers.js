import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackersService } from "@/services/trackers";
import { toast } from "sonner";

// Tracker query keys
export const trackerKeys = {
  all: ["trackers"],
  lists: () => [...trackerKeys.all, "list"],
  list: (params) => [...trackerKeys.lists(), params],
  details: () => [...trackerKeys.all, "detail"],
  detail: (slug) => [...trackerKeys.details(), slug],
  search: (params) => [...trackerKeys.all, "search", params],
  entries: () => [...trackerKeys.all, "entries"],
  entryList: (params) => [...trackerKeys.entries(), "list", params],
  entryDetail: (id) => [...trackerKeys.entries(), "detail", id],
  entryTimeline: (id) => [...trackerKeys.entries(), "timeline", id],
  entryAuditLogs: (id) => [...trackerKeys.entries(), "audit-logs", id],
};

// Get all trackers query
export const useTrackers = (params = {}, options = {}) => {
  return useQuery({
    queryKey: trackerKeys.list(params),
    queryFn: async () => {
      const response = await trackersService.getTrackers(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get single tracker query
export const useTracker = (slug, options = {}) => {
  return useQuery({
    queryKey: trackerKeys.detail(slug),
    queryFn: async () => {
      const response = await trackersService.getTracker(slug);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Create tracker mutation
export const useCreateTracker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackerData) => {
      const response = await trackersService.createTracker(trackerData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: trackerKeys.lists() });
      toast.success("Tracker created successfully", {
        description: `Tracker "${data.name}" has been created.`,
      });
    },
    onError: (error) => {
      console.error("Create tracker error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create tracker";
      toast.error("Failed to create tracker", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Update tracker mutation
export const useUpdateTracker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, trackerData }) => {
      const response = await trackersService.updateTracker(slug, trackerData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(trackerKeys.detail(variables.slug), data);
      queryClient.invalidateQueries({ queryKey: trackerKeys.lists() });
      toast.success("Tracker updated successfully", {
        description: `Tracker "${data.name}" has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Update tracker error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update tracker";
      toast.error("Failed to update tracker", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Delete tracker mutation
export const useDeleteTracker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      await trackersService.deleteTracker(slug);
      return slug;
    },
    onSuccess: (slug) => {
      queryClient.invalidateQueries({ queryKey: trackerKeys.lists() });
      queryClient.removeQueries({ queryKey: trackerKeys.detail(slug) });
      toast.success("Tracker deleted successfully");
    },
    onError: (error) => {
      console.error("Delete tracker error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete tracker";
      toast.error("Failed to delete tracker", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Search trackers mutation
export const useSearchTrackers = (searchParams = {}, options = {}) => {
  return useQuery({
    queryKey: trackerKeys.search(searchParams),
    queryFn: async () => {
      const response = await trackersService.searchTrackers(searchParams);
      return response.data;
    },
    enabled: Object.keys(searchParams).length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

// Tracker Entry Hooks
// Get tracker entries query
export const useTrackerEntries = (searchParams = {}, options = {}) => {
  return useQuery({
    queryKey: trackerKeys.entryList(searchParams),
    queryFn: async () => {
      const response = await trackersService.getTrackerEntries(searchParams);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

// Get single tracker entry query
export const useTrackerEntry = (entryId, options = {}) => {
  return useQuery({
    queryKey: trackerKeys.entryDetail(entryId),
    queryFn: async () => {
      const response = await trackersService.getTrackerEntry(entryId);
      return response.data;
    },
    enabled: !!entryId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

// Create tracker entry mutation
export const useCreateTrackerEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryData) => {
      const response = await trackersService.createTrackerEntry(entryData);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate all entry list queries (with any params) to refresh the table
      queryClient.invalidateQueries({ 
        queryKey: trackerKeys.entries(),
        exact: false 
      });
      queryClient.invalidateQueries({ queryKey: trackerKeys.entryTimeline(data.id) });
      toast.success("Entry created successfully");
    },
    onError: (error) => {
      console.error("Create tracker entry error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create entry";
      toast.error("Failed to create entry", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Update tracker entry mutation
export const useUpdateTrackerEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, entryData }) => {
      const response = await trackersService.updateTrackerEntry(entryId, entryData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(trackerKeys.entryDetail(variables.entryId), data);
      queryClient.invalidateQueries({ queryKey: trackerKeys.entryList() });
      queryClient.invalidateQueries({ queryKey: trackerKeys.entryTimeline(variables.entryId) });
      queryClient.invalidateQueries({ queryKey: trackerKeys.entryAuditLogs(variables.entryId) });
      toast.success("Entry updated successfully");
    },
    onError: (error) => {
      console.error("Update tracker entry error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update entry";
      toast.error("Failed to update entry", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Delete tracker entry mutation
export const useDeleteTrackerEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId) => {
      await trackersService.deleteTrackerEntry(entryId);
      return entryId;
    },
    onSuccess: (entryId) => {
      // Invalidate all entry list queries (with any params) to refresh the table
      queryClient.invalidateQueries({ 
        queryKey: trackerKeys.entries(),
        exact: false 
      });
      queryClient.removeQueries({ queryKey: trackerKeys.entryDetail(entryId) });
      toast.success("Entry deleted successfully");
    },
    onError: (error) => {
      console.error("Delete tracker entry error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete entry";
      toast.error("Failed to delete entry", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Get tracker entry timeline query
export const useTrackerEntryTimeline = (entryId, options = {}) => {
  return useQuery({
    queryKey: trackerKeys.entryTimeline(entryId),
    queryFn: async () => {
      const response = await trackersService.getTrackerEntryTimeline(entryId);
      return response.data;
    },
    enabled: !!entryId,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
};

// Get tracker entry audit logs query
export const useTrackerEntryAuditLogs = (entryId, limit = 100, options = {}) => {
  return useQuery({
    queryKey: trackerKeys.entryAuditLogs(entryId),
    queryFn: async () => {
      const response = await trackersService.getTrackerEntryAuditLogs(entryId, limit);
      return response.data;
    },
    enabled: !!entryId,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
};
