"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clockService } from "@/services/clock";
import { attendanceKeys } from "@/hooks/useAttendance";
import { toast } from "sonner";
import { normalizeManagerActiveClockRow } from "@/utils/clockRecordPath";

// Clock query keys
export const clockKeys = {
  all: ["clock"],
  status: () => [...clockKeys.all, "status"],
  records: (params) => [...clockKeys.all, "records", params],
  myRecords: (params) => [...clockKeys.all, "my-records", params],
  active: (params) => [...clockKeys.all, "active", params],
  nfcCredential: () => [...clockKeys.all, "nfc-credential"],
  nfcUserStatus: (userSlug) => [...clockKeys.all, "nfc-user-status", userSlug],
  nfcWalletLinks: () => [...clockKeys.all, "nfc-wallet-links"],
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

// Get current user's clock records query (dashboard-safe)
export const useMyClockRecords = (params = {}, options = {}) => {
  return useQuery({
    queryKey: clockKeys.myRecords(params),
    queryFn: async () => {
      const response = await clockService.getMyClockRecords(params);
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
      const res = await clockService.getActiveClocks(params);
      // Axios response has .data; if the service ever returns the body only, use res as-is
      const body = res != null && typeof res === "object" && "data" in res ? res.data : res;
      const list = Array.isArray(body)
        ? body
        : Array.isArray(body?.items)
          ? body.items
          : Array.isArray(body?.data)
            ? body.data
            : [];
      const normalized = list.map(normalizeManagerActiveClockRow);
      if (process.env.NODE_ENV === "development") {
        const sample = normalized[0];
        console.debug("[clock] useActiveClocks response", {
          rawHasDataKey: res != null && typeof res === "object" && "data" in res,
          bodyIsArray: Array.isArray(body),
          rowCount: normalized.length,
          firstRow: sample
            ? {
                user_id: sample.user_id,
                slug: sample.slug,
                clock_record_id: sample.clock_record_id,
              }
            : null,
        });
      }
      return normalized;
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
      // Invalidate all records/active queries (any params)
      queryClient.invalidateQueries({ queryKey: ["clock", "records"] });
      queryClient.invalidateQueries({ queryKey: ["clock", "active"] });
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
      queryClient.invalidateQueries({ queryKey: ["clock", "records"] });
      queryClient.invalidateQueries({ queryKey: ["clock", "active"] });
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
      queryClient.invalidateQueries({ queryKey: ["clock", "records"] });
      queryClient.invalidateQueries({ queryKey: ["clock", "active"] });
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

// Manager clock out another user mutation
export const useManagerClockOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userSlug, notes, logout_method = "manual" }) => {
      const response = await clockService.managerClockOut({ userSlug, notes, logout_method });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clockKeys.status() });
      queryClient.invalidateQueries({ queryKey: ["clock", "records"] });
      queryClient.invalidateQueries({ queryKey: ["clock", "active"] });
      toast.success("User clocked out", {
        description: "The user has been clocked out by a manager.",
      });
    },
    onError: (error) => {
      console.error("Manager clock out error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to clock out user";
      toast.error("Failed to clock out user", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

export const useClockNfcCredentialStatus = (options = {}) => {
  return useQuery({
    queryKey: clockKeys.nfcCredential(),
    queryFn: async () => {
      const response = await clockService.getNfcCredentialStatus();
      return response.data;
    },
    ...options,
  });
};

export const useClockNfcWalletLinks = (options = {}) => {
  return useQuery({
    queryKey: clockKeys.nfcWalletLinks(),
    queryFn: async () => {
      const response = await clockService.getNfcWalletLinks();
      return response.data;
    },
    ...options,
  });
};

export const useRotateClockNfcForUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userSlug }) => {
      const response = await clockService.rotateNfcCredentialForUser(userSlug);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      const slug = variables?.userSlug != null ? String(variables.userSlug).trim() : "";
      queryClient.invalidateQueries({ queryKey: clockKeys.nfcCredential() });
      if (slug) {
        queryClient.invalidateQueries({ queryKey: clockKeys.nfcUserStatus(slug) });
      }
    },
    onError: (error) => {
      console.error("Rotate NFC credential for user error:", error);
    },
  });
};

export const useClockNfcCredentialStatusForUser = (userSlug, options = {}) => {
  const slug = userSlug != null ? String(userSlug).trim() : "";
  return useQuery({
    queryKey: clockKeys.nfcUserStatus(slug),
    queryFn: async () => {
      const response = await clockService.getNfcCredentialStatusForUser(slug);
      return response.data;
    },
    enabled: !!slug,
    ...options,
  });
};

export const useDisableClockNfcForUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userSlug }) => {
      const response = await clockService.disableNfcCredentialForUser(userSlug);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      const slug = variables?.userSlug != null ? String(variables.userSlug).trim() : "";
      queryClient.invalidateQueries({ queryKey: clockKeys.nfcUserStatus(slug) });
      queryClient.invalidateQueries({ queryKey: clockKeys.nfcCredential() });
    },
    onError: (error) => {
      console.error("Disable NFC credential for user error:", error);
    },
  });
};

export const useEnableClockNfcForUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userSlug }) => {
      const response = await clockService.enableNfcCredentialForUser(userSlug);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      const slug = variables?.userSlug != null ? String(variables.userSlug).trim() : "";
      queryClient.invalidateQueries({ queryKey: clockKeys.nfcUserStatus(slug) });
      queryClient.invalidateQueries({ queryKey: clockKeys.nfcCredential() });
    },
    onError: (error) => {
      console.error("Enable NFC credential for user error:", error);
    },
  });
};

// Update clock record mutation (manager)
export const useUpdateClockRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables) => {
      const clockData = variables.clockData;
      const recordKey =
        variables.recordKey ?? variables.slug ?? variables.id ?? variables.clockRecordSlug;
      const keyStr = recordKey != null ? String(recordKey).trim() : "";
      if (process.env.NODE_ENV === "development") {
        console.debug("[clock] useUpdateClockRecord mutationFn", {
          variableKeys: variables && typeof variables === "object" ? Object.keys(variables) : [],
          recordKeyRaw: recordKey,
          keyStr,
          hasClockData: !!clockData,
        });
      }
      if (!keyStr || keyStr === "undefined") {
        throw new Error("Missing clock record identifier (slug or id)");
      }
      const response = await clockService.updateClockRecord(keyStr, clockData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clock", "records"] });
      queryClient.invalidateQueries({ queryKey: ["clock", "active"] });
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
      queryClient.invalidateQueries({ queryKey: ["clock", "records"] });
      queryClient.invalidateQueries({ queryKey: ["clock", "active"] });
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
      queryClient.invalidateQueries({ queryKey: ["clock", "active"] });
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
      queryClient.invalidateQueries({ queryKey: ["clock", "active"] });
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









