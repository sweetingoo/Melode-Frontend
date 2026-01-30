"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceService } from "@/services/attendance";
import { attendanceKeys } from "./useAttendance";
import { toast } from "sonner";

// Leave Requests
export const useLeaveRequests = (params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.leaveRequests(params),
    queryFn: async () => {
      const response = await attendanceService.getLeaveRequests(params);
      return response.data || response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - leave requests change frequently
    ...options,
  });
};

export const useLeaveRequest = (slug, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.leaveRequest(slug),
    queryFn: async () => {
      const response = await attendanceService.getLeaveRequest(slug);
      return response.data || response;
    },
    enabled: !!slug,
    ...options,
  });
};

export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestData) => {
      const response = await attendanceService.createLeaveRequest(requestData);
      return response.data || response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.leaveRequests() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.pendingLeaveRequests() });
      if (data?.user_id && data?.job_role_id) {
        queryClient.invalidateQueries({
          queryKey: attendanceKeys.holidayBalance({ user_id: data.user_id, job_role_id: data.job_role_id }),
        });
      }
      toast.success("Leave request submitted successfully", {
        description: "Your leave request has been submitted and is pending approval.",
      });
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to submit leave request";
      toast.error("Failed to submit leave request", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

export const useUpdateLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, requestData }) => {
      const response = await attendanceService.updateLeaveRequest(slug, requestData);
      return response.data || response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.leaveRequest(variables.slug) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.leaveRequests() });
      toast.success("Leave request updated successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update leave request";
      toast.error("Failed to update leave request", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

export const useCancelLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      const response = await attendanceService.cancelLeaveRequest(slug);
      return response.data || response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.leaveRequest(variables.slug) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.leaveRequests() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.pendingLeaveRequests() });
      if (data?.user_id && data?.job_role_id) {
        queryClient.invalidateQueries({
          queryKey: attendanceKeys.holidayBalance({ user_id: data.user_id, job_role_id: data.job_role_id }),
        });
      }
      toast.success("Leave request cancelled successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to cancel leave request";
      toast.error("Failed to cancel leave request", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

export const useApproveLeaveRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, approvalData }) => {
      const response = await attendanceService.approveLeaveRequest(slug, approvalData);
      return response.data || response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.leaveRequest(variables.slug) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.leaveRequests() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.pendingLeaveRequests() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.shiftRecords() });
      if (data?.user_id && data?.job_role_id) {
        queryClient.invalidateQueries({
          queryKey: attendanceKeys.holidayBalance({ user_id: data.user_id, job_role_id: data.job_role_id }),
        });
      }
      toast.success(data?.status === "approved" ? "Leave request approved" : "Leave request declined", {
        description: data?.status === "approved" ? "The leave request has been approved." : data?.declined_reason || "The leave request has been declined.",
      });
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to process leave request";
      toast.error("Failed to process leave request", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

// Pending Leave Requests
export const usePendingLeaveRequests = (params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.pendingLeaveRequests(params),
    queryFn: async () => {
      const response = await attendanceService.getPendingLeaveRequests(params);
      return response.data || response;
    },
    staleTime: 1 * 60 * 1000, // 1 minute - pending requests change frequently
    ...options,
  });
};
