"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceService } from "@/services/attendance";
import { attendanceKeys } from "./useAttendance";
import { toast } from "sonner";

// Shift Records
export const useShiftRecords = (params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.shiftRecords(params),
    queryFn: async () => {
      const response = await attendanceService.getShiftRecords(params);
      return response.data || response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

/** Fetches all pages of shift records (per_page=100) and returns { records, total }. Use for rota/timeline. */
export const useShiftRecordsAllPages = (params = {}, options = {}) => {
  const keyParams = { ...params };
  delete keyParams.page;
  delete keyParams.per_page;
  return useQuery({
    queryKey: [...attendanceKeys.shiftRecords(keyParams), "all-pages"],
    queryFn: () => attendanceService.getShiftRecordsAllPages(params),
    enabled: !!(params.start_date && params.end_date),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

export const useShiftRecord = (slug, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.shiftRecord(slug),
    queryFn: async () => {
      const response = await attendanceService.getShiftRecord(slug);
      return response.data || response;
    },
    enabled: !!slug,
    ...options,
  });
};

export const useCreateShiftRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordData) => {
      const response = await attendanceService.createShiftRecord(recordData);
      return response.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.shiftRecords() });
      toast.success("Shift record created successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create shift record";
      toast.error("Failed to create shift record", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

export const useUpdateShiftRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, recordData }) => {
      const response = await attendanceService.updateShiftRecord(slug, recordData);
      return response.data || response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.shiftRecord(variables.slug) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.shiftRecords() });
      toast.success("Shift record updated successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update shift record";
      toast.error("Failed to update shift record", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

export const useDeleteShiftRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      const response = await attendanceService.deleteShiftRecord(slug);
      return response.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.shiftRecords() });
      toast.success("Shift record deleted successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete shift record";
      toast.error("Failed to delete shift record", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

// Mapped Shift Templates
export const useMappedShiftTemplates = (params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.mappedShiftTemplates(params),
    queryFn: async () => {
      const response = await attendanceService.getMappedShiftTemplates(params);
      return response.data || response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useMappedShiftTemplate = (slug, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.mappedShiftTemplate(slug),
    queryFn: async () => {
      const response = await attendanceService.getMappedShiftTemplate(slug);
      return response.data || response;
    },
    enabled: !!slug,
    ...options,
  });
};

export const useCreateMappedShiftTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateData) => {
      const response = await attendanceService.createMappedShiftTemplate(templateData);
      return response.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.mappedShiftTemplates() });
      toast.success("Required shift template created successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create required shift template";
      toast.error("Failed to create required shift template", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

export const useUpdateMappedShiftTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, templateData }) => {
      const response = await attendanceService.updateMappedShiftTemplate(slug, templateData);
      return response.data || response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.mappedShiftTemplate(variables.slug) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.mappedShiftTemplates() });
      toast.success("Required shift template updated successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update required shift template";
      toast.error("Failed to update required shift template", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

export const useDeleteMappedShiftTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      const response = await attendanceService.deleteMappedShiftTemplate(slug);
      return response.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.mappedShiftTemplates() });
      toast.success("Required shift template deleted successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete required shift template";
      toast.error("Failed to delete required shift template", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

export const useGenerateShiftsFromTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, generateData }) => {
      const response = await attendanceService.generateShiftsFromTemplate(slug, generateData);
      return response.data || response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.mappedShiftTemplate(variables.slug) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.shiftRecords() });
      toast.success("Shifts generated successfully", {
        description: `Generated ${data?.count || 0} shift records from template.`,
      });
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to generate shifts";
      toast.error("Failed to generate shifts", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

// Provisional Shifts
export const useProvisionalShifts = (params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.provisionalShifts(params),
    queryFn: async () => {
      const response = await attendanceService.getProvisionalShifts(params);
      return response.data || response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useProvisionalShift = (slug, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.provisionalShift(slug),
    queryFn: async () => {
      const response = await attendanceService.getProvisionalShift(slug);
      return response.data || response;
    },
    enabled: !!slug,
    ...options,
  });
};

export const useCreateProvisionalShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shiftData) => {
      const response = await attendanceService.createProvisionalShift(shiftData);
      return response.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "provisional-shifts"] });
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "shift-records"] });
      toast.success("Allocated shift created successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create allocated shift";
      toast.error("Failed to create allocated shift", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

export const useUpdateProvisionalShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, shiftData }) => {
      const response = await attendanceService.updateProvisionalShift(slug, shiftData);
      return response.data || response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.provisionalShift(variables.slug) });
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "provisional-shifts"] });
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "shift-records"] });
      toast.success("Allocated shift updated successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update allocated shift";
      toast.error("Failed to update allocated shift", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

export const useDeleteProvisionalShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      const response = await attendanceService.deleteProvisionalShift(slug);
      return response.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "provisional-shifts"] });
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "shift-records"] });
      toast.success("Provisional shift deleted successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete allocated shift";
      toast.error("Failed to delete allocated shift", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

export const useCompareProvisionalAttendance = (slug, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.compareProvisionalAttendance(slug),
    queryFn: async () => {
      const response = await attendanceService.compareProvisionalAttendance(slug);
      return response.data || response;
    },
    enabled: !!slug,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};
