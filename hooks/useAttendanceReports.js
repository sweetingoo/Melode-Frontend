"use client";

import { useQuery } from "@tanstack/react-query";
import { attendanceService } from "@/services/attendance";
import { attendanceKeys } from "./useAttendance";

// Attendance Reports
export const useAttendanceSummary = (params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.reports.summary(params),
    queryFn: async () => {
      const response = await attendanceService.getAttendanceSummary(params);
      return response.data || response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useHolidayBalanceReport = (params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.reports.holidayBalance(params),
    queryFn: async () => {
      const response = await attendanceService.getHolidayBalanceReport(params);
      return response.data || response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useLeaveCalendar = (params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.reports.leaveCalendar(params),
    queryFn: async () => {
      const response = await attendanceService.getLeaveCalendar(params);
      return response.data || response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - calendar updates frequently
    ...options,
  });
};

export const useIndividualReport = (userId, params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.reports.individual(userId, params),
    queryFn: async () => {
      const response = await attendanceService.getIndividualReport(userId, params);
      return response.data || response;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useAbsenceReport = (params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.reports.absence(params),
    queryFn: async () => {
      const response = await attendanceService.getAbsenceReport(params);
      return response.data || response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};
