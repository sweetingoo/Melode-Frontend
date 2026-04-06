"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceService } from "@/services/attendance";
import { departmentsService } from "@/services/departments";
import { toast } from "sonner";

// Attendance query keys
export const attendanceKeys = {
  all: ["attendance"],
  shiftLeaveTypes: (params) => [...attendanceKeys.all, "shift-leave-types", params],
  shiftLeaveType: (slug) => [...attendanceKeys.all, "shift-leave-type", slug],
  employeeSettings: (userId, params) => [...attendanceKeys.all, "employee-settings", userId, params],
  contractTypes: (params) => [...attendanceKeys.all, "contract-types", params],
  contractType: (idOrSlug) => [...attendanceKeys.all, "contract-type", idOrSlug],
  holidayYears: (params) => [...attendanceKeys.all, "holiday-years", params],
  holidayYear: (slug) => [...attendanceKeys.all, "holiday-year", slug],
  currentHolidayYear: () => [...attendanceKeys.all, "holiday-year", "current"],
  holidayEntitlements: (params) => [...attendanceKeys.all, "holiday-entitlements", params],
  holidayEntitlement: (slug) => [...attendanceKeys.all, "holiday-entitlement", slug],
  holidayBalance: (params) => [
    ...attendanceKeys.all,
    "holiday-balance",
    params,
  ],
  leaveRequests: (params) => [...attendanceKeys.all, "leave-requests", params],
  pendingLeaveRequests: (params) => [...attendanceKeys.all, "leave-requests", "pending", params],
  pendingLeaveRequestDepartments: () => [...attendanceKeys.all, "leave-requests", "pending", "departments"],
  leaveApproverDepartments: (userId) => [...attendanceKeys.all, "leave-approver-departments", userId],
  leaveRequest: (slug) => [...attendanceKeys.all, "leave-request", slug],
  coverage: (params) => [...attendanceKeys.all, "coverage", params],
  gaps: (params) => [...attendanceKeys.all, "gaps", params],
  nowBoard: (params) => [...attendanceKeys.all, "now-board", params],
  departments: () => [...attendanceKeys.all, "departments"],
  employeeSuggest: (params) => [...attendanceKeys.all, "employees", "suggest", params],
  shiftRecords: (params) => [...attendanceKeys.all, "shift-records", params],
  shiftRecord: (slug) => [...attendanceKeys.all, "shift-record", slug],
  provisionalShifts: (params) => [...attendanceKeys.all, "provisional-shifts", params],
  provisionalShift: (slug) => [...attendanceKeys.all, "provisional-shift", slug],
  compareProvisionalAttendance: (slug) => [...attendanceKeys.all, "provisional-shift", slug, "compare"],
  mappedShiftTemplates: (params) => [...attendanceKeys.all, "mapped-shift-templates", params],
  mappedShiftTemplate: (slug) => [...attendanceKeys.all, "mapped-shift-template", slug],
  reports: {
    summary: (params) => [...attendanceKeys.all, "reports", "summary", params],
    holidayBalance: (params) => [...attendanceKeys.all, "reports", "holiday-balance", params],
    leaveCalendar: (params) => [...attendanceKeys.all, "reports", "leave-calendar", params],
    absence: (params) => [...attendanceKeys.all, "reports", "absence", params],
    individual: (userId, params) => [...attendanceKeys.all, "reports", "individual", userId, params],
  },
  settings: () => [...attendanceKeys.all, "settings"],
};

// Coverage / Gaps / Now-board
export const useCoverage = (params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.coverage(params),
    queryFn: async () => {
      const response = await attendanceService.getCoverage(params);
      return response.data ?? response;
    },
    enabled: !!(params.start_date && params.end_date),
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
};

export const useGaps = (params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.gaps(params),
    queryFn: async () => {
      const response = await attendanceService.getGaps(params);
      return response.data ?? response;
    },
    enabled: !!(params.start_date && params.end_date),
    staleTime: 1 * 60 * 1000,
    ...options,
  });
};

export const useNowBoard = (params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.nowBoard(params),
    queryFn: async () => {
      const response = await attendanceService.getNowBoard(params);
      return response.data ?? response;
    },
    staleTime: 30 * 1000, // 30 seconds for live view
    ...options,
  });
};

// Shift/Leave Types
export const useShiftLeaveTypes = (params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.shiftLeaveTypes(params),
    queryFn: async () => {
      const response = await attendanceService.getShiftLeaveTypes(params);
      return response.data || response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useShiftLeaveType = (slug, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.shiftLeaveType(slug),
    queryFn: async () => {
      const response = await attendanceService.getShiftLeaveType(slug);
      return response.data || response;
    },
    enabled: !!slug,
    ...options,
  });
};

export const useCreateShiftLeaveType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (typeData) => {
      const response = await attendanceService.createShiftLeaveType(typeData);
      return response.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.shiftLeaveTypes() });
      toast.success("Shift/Leave type created successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create shift/leave type";
      toast.error("Failed to create shift/leave type", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

export const useUpdateShiftLeaveType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, typeData }) => {
      const response = await attendanceService.updateShiftLeaveType(slug, typeData);
      return response.data || response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.shiftLeaveType(variables.slug) });
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "shift-leave-types"] });
      toast.success("Shift/Leave type updated successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update shift/leave type";
      toast.error("Failed to update shift/leave type", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

export const useDeleteShiftLeaveType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      const response = await attendanceService.deleteShiftLeaveType(slug);
      return response?.data ?? response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "shift-leave-types"] });
      toast.success("Shift/Leave type deleted successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete shift/leave type";
      toast.error("Failed to delete shift/leave type", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

// Employee Settings
export const useEmployeeSettings = (userId, params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.employeeSettings(userId, params),
    queryFn: async () => {
      const response = await attendanceService.getEmployeeSettings(userId, params);
      return response.data || response;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useCreateEmployeeSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settingsData) => {
      const response = await attendanceService.createEmployeeSettings(settingsData);
      return response.data || response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "employee-settings", data.user_id] });
      toast.success("Employee settings created successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create employee settings";
      toast.error("Failed to create employee settings", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

export const useUpdateEmployeeSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ settingsId, settingsData }) => {
      const response = await attendanceService.updateEmployeeSettings(settingsId, settingsData);
      return response.data || response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "employee-settings", data.user_id] });
      toast.success("Employee settings updated successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update employee settings";
      toast.error("Failed to update employee settings", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

// Contract Types
export const useContractTypes = (params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.contractTypes(params),
    queryFn: async () => {
      const response = await attendanceService.getContractTypes(params);
      return Array.isArray(response) ? response : response?.data ?? response ?? [];
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useCreateContractType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await attendanceService.createContractType(data);
      return response?.data ?? response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "contract-types"] });
      toast.success("Contract type created");
    },
    onError: (error) => {
      const msg = error?.response?.data?.detail || error?.response?.data?.message || "Failed to create contract type";
      toast.error(Array.isArray(msg) ? msg.map((e) => e.msg || e).join(", ") : msg);
    },
  });
};

export const useUpdateContractType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ idOrSlug, data }) => {
      const response = await attendanceService.updateContractType(idOrSlug, data);
      return response?.data ?? response;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "contract-types"] });
      toast.success("Contract type updated");
    },
    onError: (error) => {
      const msg = error?.response?.data?.detail || error?.response?.data?.message || "Failed to update contract type";
      toast.error(Array.isArray(msg) ? msg.map((e) => e.msg || e).join(", ") : msg);
    },
  });
};

export const useDeleteContractType = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (idOrSlug) => attendanceService.deleteContractType(idOrSlug),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "contract-types"] });
      toast.success("Contract type deleted");
    },
    onError: (error) => {
      const msg = error?.response?.data?.detail || error?.response?.data?.message || "Failed to delete contract type";
      toast.error(Array.isArray(msg) ? msg.map((e) => e.msg || e).join(", ") : msg);
    },
  });
};

// Holiday Years
export const useHolidayYears = (params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.holidayYears(params),
    queryFn: async () => {
      const response = await attendanceService.getHolidayYears(params);
      return response.data || response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useHolidayYear = (slug, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.holidayYear(slug),
    queryFn: async () => {
      const response = await attendanceService.getHolidayYear(slug);
      return response.data || response;
    },
    enabled: !!slug,
    ...options,
  });
};

export const useCreateHolidayYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (yearData) => {
      const response = await attendanceService.createHolidayYear(yearData);
      return response.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "holiday-years"] });
      toast.success("Holiday year created successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create holiday year";
      toast.error("Failed to create holiday year", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

export const useUpdateHolidayYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, yearData }) => {
      const response = await attendanceService.updateHolidayYear(slug, yearData);
      return response.data || response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.holidayYear(variables.slug) });
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "holiday-years"] });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.currentHolidayYear() });
      toast.success("Holiday year updated successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update holiday year";
      toast.error("Failed to update holiday year", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

export const useDeleteHolidayYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slug) => attendanceService.deleteHolidayYear(slug),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "holiday-years"] });
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.currentHolidayYear() });
      toast.success("Holiday year deleted");
    },
    onError: (error) => {
      const msg = error?.response?.data?.detail || error?.response?.data?.message || "Failed to delete holiday year";
      toast.error(Array.isArray(msg) ? msg.map((e) => e.msg || e).join(", ") : msg);
    },
  });
};

// Current Holiday Year
export const useCurrentHolidayYear = (options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.currentHolidayYear(),
    queryFn: async () => {
      const response = await attendanceService.getCurrentHolidayYear();
      return response.data || response;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// Rollover Holiday Year
export const useRolloverHolidayYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body = {}) => {
      const response = await attendanceService.rolloverHolidayYear(body);
      return response.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...attendanceKeys.all, "holiday-years"] });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.currentHolidayYear() });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.holidayEntitlements() });
      toast.success("Holiday year rolled over successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to rollover holiday year";
      toast.error("Failed to rollover holiday year", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

// Holiday Entitlements
export const useHolidayEntitlements = (params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.holidayEntitlements(params),
    queryFn: async () => {
      const response = await attendanceService.getHolidayEntitlements(params);
      return response.data || response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useHolidayBalance = (params = {}, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.holidayBalance(params),
    queryFn: async () => {
      const response = await attendanceService.getHolidayBalance(params);
      return response.data || response;
    },
    // API accepts user_id only and resolves first active job role; job_role_id is optional
    enabled: !!params.user_id,
    staleTime: 2 * 60 * 1000, // 2 minutes - balance changes frequently
    ...options,
  });
};

export const useCreateHolidayEntitlement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entitlementData) => {
      const response = await attendanceService.createHolidayEntitlement(entitlementData);
      return response.data || response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.holidayEntitlements() });
      if (data?.user_id && data?.job_role_id) {
        queryClient.invalidateQueries({
          queryKey: attendanceKeys.holidayBalance({ user_id: data.user_id, job_role_id: data.job_role_id, holiday_year_id: data.holiday_year_id }),
        });
      }
      toast.success("Holiday entitlement created successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create holiday entitlement";
      toast.error("Failed to create holiday entitlement", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

export const useUpdateHolidayEntitlement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, entitlementData }) => {
      const response = await attendanceService.updateHolidayEntitlement(slug, entitlementData);
      return response.data || response;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.holidayEntitlement(variables.slug) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.holidayEntitlements() });
      if (data?.user_id && data?.job_role_id) {
        queryClient.invalidateQueries({
          queryKey: attendanceKeys.holidayBalance({ user_id: data.user_id, job_role_id: data.job_role_id, holiday_year_id: data.holiday_year_id }),
        });
      }
      toast.success("Holiday entitlement updated successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update holiday entitlement";
      toast.error("Failed to update holiday entitlement", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

export const useRecalculateHolidayEntitlementHours = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entitlementIdOrSlug) => {
      const response = await attendanceService.recalculateHolidayEntitlementHours(entitlementIdOrSlug);
      return response.data ?? response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.holidayEntitlements() });
      if (data?.user_id != null && data?.job_role_id != null) {
        queryClient.invalidateQueries({
          queryKey: attendanceKeys.holidayBalance({
            user_id: data.user_id,
            job_role_id: data.job_role_id,
            holiday_year_id: data.holiday_year_id,
          }),
        });
      }
      toast.success("Holiday hours recalculated from leave");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.detail || "Failed to recalculate holiday hours";
      toast.error("Recalculate failed", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};

// Leave approver departments (admin config: which departments a user can approve leave for)
export const useLeaveApproverDepartments = (userId, options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.leaveApproverDepartments(userId),
    queryFn: async () => {
      const res = await attendanceService.getLeaveApproverDepartments(userId);
      return Array.isArray(res) ? res : [];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

export const useSetLeaveApproverDepartments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, department_ids }) => {
      const res = await attendanceService.setLeaveApproverDepartments(userId, { department_ids: department_ids ?? [] });
      return res;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.leaveApproverDepartments(variables.userId) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.pendingLeaveRequestDepartments() });
      toast.success("Leave approval departments updated");
    },
    onError: (error) => {
      const msg = error?.response?.data?.detail || "Failed to update leave approval departments";
      toast.error(msg);
    },
  });
};

// Attendance filter: departments for list/reports dropdown (fallback to /departments if attendance endpoint fails or is empty)
export const useAttendanceDepartments = (options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.departments(),
    queryFn: async () => {
      try {
        const response = await attendanceService.getAttendanceDepartments();
        const list = Array.isArray(response) ? response : response?.data ?? response?.departments ?? [];
        if (Array.isArray(list) && list.length > 0) return list;
      } catch (_) {
        // fallback below
      }
      try {
        const fallback = await departmentsService.getDepartments({ is_active: true, per_page: 50 });
        const data = fallback?.data ?? fallback;
        const departments = data?.departments ?? data?.data ?? (Array.isArray(data) ? data : []);
        return Array.isArray(departments)
          ? departments.map((d) => ({ id: d.id, name: d.name ?? `Department ${d.id}` }))
          : [];
      } catch (_) {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

// Auto-suggest employees when adding shifts / running reports (id, slug, display_name, department_id, department_name)
export const useAttendanceEmployeeSuggest = (params = {}, options = {}) => {
  const { q, department_id, limit = 20, enabled = true } = params;
  return useQuery({
    queryKey: attendanceKeys.employeeSuggest({ q, department_id, limit }),
    queryFn: async () => {
      const response = await attendanceService.suggestAttendanceEmployees({ q, department_id, limit });
      return response?.employees ?? [];
    },
    enabled: !!enabled,
    staleTime: 60 * 1000,
    ...options,
  });
};

// Attendance Settings
export const useAttendanceSettings = (options = {}) => {
  return useQuery({
    queryKey: attendanceKeys.settings(),
    queryFn: async () => {
      const response = await attendanceService.getAttendanceSettings();
      return response.data || response;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

export const useUpdateAttendanceSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settingsData) => {
      const response = await attendanceService.updateAttendanceSettings(settingsData);
      return response.data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.settings() });
      toast.success("Attendance settings updated successfully");
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update attendance settings";
      toast.error("Failed to update attendance settings", {
        description: Array.isArray(errorMessage) ? errorMessage.map((e) => e.msg || e).join(", ") : errorMessage,
      });
    },
  });
};
