import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { trackersService } from "@/services/trackers";
import { toast } from "sonner";

// Tracker query keys
export const trackerKeys = {
  all: ["trackers"],
  lists: () => [...trackerKeys.all, "list"],
  list: (params) => [...trackerKeys.lists(), params],
  listAllPages: (params) => [...trackerKeys.lists(), "allPages", params],
  details: () => [...trackerKeys.all, "detail"],
  detail: (slug) => [...trackerKeys.details(), slug],
  search: (params) => [...trackerKeys.all, "search", params],
  auditLogs: (slug) => [...trackerKeys.details(), slug, "audit-logs"],
  entries: () => [...trackerKeys.all, "entries"],
  entryList: (params) => [...trackerKeys.entries(), "list", params],
  entryDetail: (identifier) => [...trackerKeys.entries(), "detail", identifier],
  entryTimeline: (identifier, page, per_page) => [...trackerKeys.entries(), "timeline", identifier, page, per_page],
  entryAuditLogs: (identifier) => [...trackerKeys.entries(), "audit-logs", identifier],
  entryAppointments: (identifier) => [...trackerKeys.entries(), "appointments", identifier],
  entryInboundMessages: (identifier) => [...trackerKeys.entries(), "inbound-messages", identifier],
  entrySmsThread: (identifier) => [...trackerKeys.entries(), "sms-thread", identifier],
  queueCounts: (slug) => [...trackerKeys.details(), slug, "queue-counts"],
};

const PAGE_SIZE = 50;

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

/**
 * Fetch trackers page by page and merge results (lazy loading). Use when you need the full list
 * without requesting a large per_page. Returns same shape as useTrackers.
 */
export const useTrackersAllPages = (params = {}, options = {}) => {
  const { per_page: _ignored, page: _ignoredPage, ...restParams } = params;
  const baseParams = { ...restParams, per_page: PAGE_SIZE, page: 1 };
  return useQuery({
    queryKey: trackerKeys.listAllPages(baseParams),
    queryFn: async () => {
      const allForms = [];
      let page = 1;
      let total = 0;
      do {
        const response = await trackersService.getTrackers({ ...baseParams, page, per_page: PAGE_SIZE });
        const data = response.data;
        const forms = data?.forms ?? (Array.isArray(data) ? data : []);
        const totalFromApi = data?.total ?? forms.length;
        total = totalFromApi;
        allForms.push(...forms);
        if (forms.length < PAGE_SIZE || allForms.length >= total) break;
        page += 1;
      } while (true);
      return {
        forms: allForms,
        trackers: allForms,
        total: allForms.length,
        page: 1,
        per_page: allForms.length,
        total_pages: 1,
      };
    },
    staleTime: 5 * 60 * 1000,
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

// Queue counts for patient-referral style trackers (Awaiting Triage, Chase Overdue, etc.)
export const useTrackerQueueCounts = (slug, options = {}) => {
  return useQuery({
    queryKey: trackerKeys.queueCounts(slug),
    queryFn: async () => {
      const response = await trackersService.getQueueCounts(slug);
      return response;
    },
    enabled: !!slug,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
};

// Create tracker from template mutation (e.g. "gastroenterology", "patient-referral")
export const useCreateTrackerFromTemplate = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateKey) => {
      const response = await trackersService.createTrackerFromTemplate(templateKey);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: trackerKeys.lists() });
      toast.success("Tracker created from template", {
        description: `"${data.name}" has been created. You can edit it now.`,
      });
      options.onCreated?.(data);
    },
    onError: (error) => {
      console.error("Create tracker from template error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create tracker from template";
      toast.error("Failed to create tracker from template", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
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
      // Invalidate all tracker queries to ensure list view updates
      queryClient.invalidateQueries({ queryKey: trackerKeys.all });
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
// Get tracker entries query (single page)
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

// Get tracker entries with infinite scroll (load more on scroll)
export const useInfiniteTrackerEntries = (baseParams = {}, options = {}) => {
  return useInfiniteQuery({
    queryKey: [...trackerKeys.entryList(baseParams), "infinite"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await trackersService.getTrackerEntries({
        ...baseParams,
        page: pageParam,
        per_page: baseParams.per_page ?? 50,
      });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      const page = lastPage.page ?? 1;
      const totalPages = lastPage.total_pages ?? 1;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

// Get tracker entries aggregates (sum/avg/count/min/max over all matching entries, backend)
export const useTrackerEntriesAggregates = (baseParams = {}, options = {}) => {
  return useQuery({
    queryKey: [...trackerKeys.entryList(baseParams), "aggregates"],
    queryFn: async () => {
      const response = await trackersService.getTrackerEntriesAggregates(baseParams);
      return response;
    },
    enabled: !!baseParams.form_id,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

// Get single tracker entry query (accepts slug or ID)
export const useTrackerEntry = (entryIdentifier, options = {}) => {
  return useQuery({
    queryKey: trackerKeys.entryDetail(entryIdentifier),
    queryFn: async () => {
      try {
        const response = await trackersService.getTrackerEntry(entryIdentifier);
        return response.data;
      } catch (error) {
        // Handle 404 errors specifically
        if (error?.response?.status === 404) {
          // Return null to show "not found" message instead of throwing
          return null;
        }
        // Re-throw other errors (permission, network, etc.)
        throw error;
      }
    },
    enabled: !!entryIdentifier,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
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
        exact: false,
      });
      // Refresh queue counts on trackers list when an entry is created
      queryClient.invalidateQueries({ queryKey: trackerKeys.details() });
      const identifier = data.slug || data.id;
      if (identifier) {
        queryClient.invalidateQueries({ queryKey: trackerKeys.entryTimeline(identifier) });
      }
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
    mutationFn: async ({ entryIdentifier, entryData }) => {
      const response = await trackersService.updateTrackerEntry(entryIdentifier, entryData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(trackerKeys.entryDetail(variables.entryIdentifier), data);
      // Refetch entry detail so UI shows updated stage/status (derived_stage) immediately
      queryClient.refetchQueries({ queryKey: trackerKeys.entryDetail(variables.entryIdentifier) });
      // Invalidate and refetch entry list so Stage/Status columns update immediately
      queryClient.invalidateQueries({ queryKey: trackerKeys.entries() });
      queryClient.refetchQueries({ queryKey: trackerKeys.entries() });
      queryClient.invalidateQueries({ queryKey: trackerKeys.details() }); // refresh queue counts
      queryClient.invalidateQueries({ queryKey: trackerKeys.entryTimeline(variables.entryIdentifier) });
      queryClient.invalidateQueries({ queryKey: trackerKeys.entryAuditLogs(variables.entryIdentifier) });
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

// Create tracker action mutation (log action with optional chase date)
export const useCreateTrackerAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryIdentifier, body }) => {
      const data = await trackersService.createTrackerAction(entryIdentifier, body);
      return { data, entryIdentifier };
    },
    onSuccess: ({ entryIdentifier }) => {
      queryClient.invalidateQueries({ queryKey: trackerKeys.entryDetail(entryIdentifier) });
      queryClient.invalidateQueries({ queryKey: trackerKeys.entryTimeline(entryIdentifier) });
      queryClient.invalidateQueries({ queryKey: trackerKeys.entries() });
      queryClient.invalidateQueries({ queryKey: trackerKeys.details() });
      toast.success("Action logged");
    },
    onError: (error) => {
      const msg = error?.response?.data?.detail || error?.message || "Failed to log action";
      toast.error(Array.isArray(msg) ? msg.map((e) => e.msg || e).join(", ") : msg);
    },
  });
};

// Mark tracker action as done (sets completed_at; recomputes case chase_due to next pending chase)
export const useCompleteTrackerAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryIdentifier, actionId }) => {
      const data = await trackersService.completeTrackerAction(entryIdentifier, actionId);
      return { data, entryIdentifier };
    },
    onSuccess: ({ entryIdentifier }) => {
      queryClient.invalidateQueries({ queryKey: trackerKeys.entryDetail(entryIdentifier) });
      queryClient.invalidateQueries({ queryKey: trackerKeys.entryTimeline(entryIdentifier) });
      queryClient.invalidateQueries({ queryKey: trackerKeys.entries() });
      queryClient.invalidateQueries({ queryKey: trackerKeys.details() });
      toast.success("Action marked as done");
    },
    onError: (error) => {
      const msg = error?.response?.data?.detail || error?.message || "Failed to mark action done";
      toast.error(Array.isArray(msg) ? msg.map((e) => e.msg || e).join(", ") : msg);
    },
  });
};

// Get tracker entry appointments query
export const useTrackerEntryAppointments = (entryIdentifier, options = {}) => {
  return useQuery({
    queryKey: trackerKeys.entryAppointments(entryIdentifier),
    queryFn: async () => {
      const data = await trackersService.getTrackerEntryAppointments(entryIdentifier);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!entryIdentifier,
    staleTime: 1 * 60 * 1000,
    ...options,
  });
};

// Create tracker appointment mutation
export const useCreateTrackerAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryIdentifier, body }) => {
      const data = await trackersService.createTrackerAppointment(entryIdentifier, body);
      return { data, entryIdentifier };
    },
    onSuccess: ({ entryIdentifier }) => {
      queryClient.invalidateQueries({ queryKey: trackerKeys.entryAppointments(entryIdentifier) });
      queryClient.invalidateQueries({ queryKey: trackerKeys.entryDetail(entryIdentifier) });
      toast.success("Appointment added");
    },
    onError: (error) => {
      const msg = error?.response?.data?.detail || error?.message || "Failed to add appointment";
      toast.error(Array.isArray(msg) ? msg.map((e) => e.msg || e).join(", ") : msg);
    },
  });
};

// Update tracker appointment mutation (e.g. status change)
export const useUpdateTrackerAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entryIdentifier, appointmentId, body }) => {
      const data = await trackersService.updateTrackerAppointment(entryIdentifier, appointmentId, body);
      return { data, entryIdentifier };
    },
    onSuccess: ({ entryIdentifier }) => {
      queryClient.invalidateQueries({ queryKey: trackerKeys.entryAppointments(entryIdentifier) });
      queryClient.invalidateQueries({ queryKey: trackerKeys.entryDetail(entryIdentifier) });
      toast.success("Appointment updated");
    },
    onError: (error) => {
      const msg = error?.response?.data?.detail || error?.message || "Failed to update appointment";
      toast.error(Array.isArray(msg) ? msg.map((e) => e.msg || e).join(", ") : msg);
    },
  });
};

// Delete tracker entry mutation
export const useDeleteTrackerEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryIdentifier) => {
      await trackersService.deleteTrackerEntry(entryIdentifier);
      return entryIdentifier;
    },
    onSuccess: (entryIdentifier) => {
      queryClient.invalidateQueries({
        queryKey: trackerKeys.entries(),
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: trackerKeys.details() }); // refresh queue counts
      queryClient.removeQueries({ queryKey: trackerKeys.entryDetail(entryIdentifier) });
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

// Get tracker entry timeline query (accepts slug or ID)
export const useTrackerEntryTimeline = (entryIdentifier, page = 1, per_page = 50, options = {}) => {
  return useQuery({
    queryKey: trackerKeys.entryTimeline(entryIdentifier, page, per_page),
    queryFn: async () => {
      const response = await trackersService.getTrackerEntryTimeline(entryIdentifier, page, per_page);
      return response.data;
    },
    enabled: !!entryIdentifier,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
};

// Get tracker entry audit logs query (accepts slug or ID)
export const useTrackerEntryAuditLogs = (entryIdentifier, pagination = { page: 1, per_page: 20 }, options = {}) => {
  return useQuery({
    queryKey: [...trackerKeys.entryAuditLogs(entryIdentifier), pagination],
    queryFn: async () => {
      const response = await trackersService.getTrackerEntryAuditLogs(entryIdentifier, pagination);
      // Backend returns {logs: [...], total: ..., page: ..., per_page: ..., total_pages: ...}
      return response.data || { logs: [], total: 0, page: 1, per_page: 20, total_pages: 0 };
    },
    enabled: !!entryIdentifier,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
};

// Get inbound messages for a tracker entry (e.g. patient SMS)
export const useTrackerEntryInboundMessages = (entryIdentifier, options = {}) => {
  return useQuery({
    queryKey: trackerKeys.entryInboundMessages(entryIdentifier),
    queryFn: async () => {
      const data = await trackersService.getTrackerEntryInboundMessages(entryIdentifier);
      return data?.messages ?? [];
    },
    enabled: !!entryIdentifier,
    staleTime: 1 * 60 * 1000,
    ...options,
  });
};

// Get full SMS thread (inbound + sent) for Communications tab – not tied to timeline pagination
export const useTrackerEntrySmsThread = (entryIdentifier, options = {}) => {
  return useQuery({
    queryKey: trackerKeys.entrySmsThread(entryIdentifier),
    queryFn: async () => {
      const data = await trackersService.getTrackerEntrySmsThread(entryIdentifier);
      return data ?? { inbound: [], sent: [] };
    },
    enabled: !!entryIdentifier,
    staleTime: 1 * 60 * 1000,
    refetchInterval: options.refetchInterval ?? false,
    ...options,
  });
};

// Get tracker audit logs query
export const useTrackerAuditLogs = (slug, pagination = { page: 1, per_page: 20 }, options = {}) => {
  return useQuery({
    queryKey: [...trackerKeys.auditLogs(slug), pagination],
    queryFn: async () => {
      const response = await trackersService.getTrackerAuditLogs(slug, pagination);
      // Backend returns {logs: [...], total: ..., page: ..., per_page: ..., total_pages: ...}
      return response.data || { logs: [], total: 0, page: 1, per_page: 20, total_pages: 0 };
    },
    enabled: !!slug,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
};
