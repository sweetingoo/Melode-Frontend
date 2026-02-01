"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clockService } from "@/services/clock";
import { attendanceKeys } from "@/hooks/useAttendance";
import { toast } from "sonner";

// Clock query keys
export const clockKeys = {
  all: ["clock"],
  status: () => [...clockKeys.all, "status"],
  records: (params) => [...clockKeys.all, "records", params],
  active: (params) => [...clockKeys.all, "active", params],
};

// Get clock status query
export const useClockStatus = (options = {}) => {
  return useQuery({
    queryKey: clockKeys.status(),
    queryFn: async () => {
      try {
        const response = await clockService.getClockStatus();
        return response.data;
      } catch (error) {
        // If it's a 404, user is not clocked in - return clocked_out status
        if (error.response?.status === 404) {
          return {
            status: "clocked_out",
            clock_in_time: null,
            clock_out_time: null,
          };
        }
        // Re-throw other errors
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds - frequently updated
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
    retry: (failureCount, error) => {
      // Don't retry on 404 errors (user not clocked in is a valid state)
      if (error.response?.status === 404) {
        return false;
      }
      // Retry other errors up to 3 times
      return failureCount < 3;
    },
    ...options,
  });
};

// Get clock records query
export const useClockRecords = (params = {}, options = {}) => {
  return useQuery({
    queryKey: clockKeys.records(params),
    queryFn: async () => {
      const response = await clockService.getClockRecords(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get active clocks query (manager view)
export const useActiveClocks = (params = {}, options = {}) => {
  return useQuery({
    queryKey: clockKeys.active(params),
    queryFn: async () => {
      const response = await clockService.getActiveClocks(params);
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds - frequently updated
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
    ...options,
  });
};

// Check in mutation (returns { clock_record, provisional_shifts_nearby } when API sends ClockInResponse)
export const useClockIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clockInData) => {
      const response = await clockService.clockIn(clockInData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: clockKeys.status() });
      queryClient.invalidateQueries({ queryKey: clockKeys.records() });
      queryClient.invalidateQueries({ queryKey: clockKeys.active() });
      toast.success("Checked in successfully", {
        description: "You have been checked in.",
      });
    },
    onError: (error) => {
      console.error("Check in error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to check in";
      toast.error("Failed to check in", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Link clock record to provisional shift (after user confirms "logging in to this shift")
export const useLinkClockToProvisionalShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clockRecordId, shiftRecordId }) => {
      const response = await clockService.linkToProvisionalShift(clockRecordId, shiftRecordId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clockKeys.status() });
      queryClient.invalidateQueries({ queryKey: clockKeys.records() });
      queryClient.invalidateQueries({ queryKey: clockKeys.active() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.shiftRecords() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.provisionalShifts() });
      toast.success("Shift linked", {
        description: "Your clock-in is now linked to this provisional shift.",
      });
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to link to shift";
      toast.error("Failed to link to shift", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Check out mutation
export const useClockOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clockOutData = {}) => {
      const response = await clockService.clockOut(clockOutData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: clockKeys.status() });
      queryClient.invalidateQueries({ queryKey: clockKeys.records() });
      queryClient.invalidateQueries({ queryKey: clockKeys.active() });
      toast.success("Checked out successfully", {
        description: "You have been checked out.",
      });
    },
    onError: (error) => {
      console.error("Check out error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to check out";
      toast.error("Failed to check out", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Update clock record mutation (manager)
export const useUpdateClockRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, clockData }) => {
      const response = await clockService.updateClockRecord(slug, clockData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: clockKeys.records() });
      queryClient.invalidateQueries({ queryKey: clockKeys.active() });
      toast.success("Session record updated successfully", {
        description: "The session record has been updated.",
      });
    },
    onError: (error) => {
      console.error("Update clock record error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update session record";
      toast.error("Failed to update session record", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Change shift role mutation
export const useChangeShiftRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (changeData) => {
      const response = await clockService.changeShiftRole(changeData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: clockKeys.status() });
      queryClient.invalidateQueries({ queryKey: clockKeys.records() });
      queryClient.invalidateQueries({ queryKey: clockKeys.active() });
      toast.success("Shift role changed successfully", {
        description: "Your shift role has been updated.",
      });
    },
    onError: (error) => {
      console.error("Change shift role error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to change shift role";
      toast.error("Failed to change shift role", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Start break mutation
export const useStartBreak = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (breakData = {}) => {
      const response = await clockService.startBreak(breakData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: clockKeys.status() });
      queryClient.invalidateQueries({ queryKey: clockKeys.active() });
      toast.success("Break started", {
        description: "Your break has been started.",
      });
    },
    onError: (error) => {
      console.error("Start break error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to start break";
      toast.error("Failed to start break", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// End break mutation
export const useEndBreak = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (breakData = {}) => {
      const response = await clockService.endBreak(breakData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: clockKeys.status() });
      queryClient.invalidateQueries({ queryKey: clockKeys.active() });
      toast.success("Break ended", {
        description: "Your break has been ended.",
      });
    },
    onError: (error) => {
      console.error("End break error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to end break";
      toast.error("Failed to end break", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};









