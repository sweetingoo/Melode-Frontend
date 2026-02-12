import { api } from "./api-client";

// Attendance API service
export const attendanceService = {
  // Shift/Leave Types
  getShiftLeaveTypes: async (params = {}) => {
    try {
      return await api.get("/attendance/shift-leave-types", { params });
    } catch (error) {
      console.error("Get shift/leave types failed:", error);
      throw error;
    }
  },

  getShiftLeaveType: async (slug) => {
    try {
      return await api.get(`/attendance/shift-leave-types/${slug}`);
    } catch (error) {
      console.error(`Get shift/leave type ${slug} failed:`, error);
      throw error;
    }
  },

  createShiftLeaveType: async (typeData) => {
    try {
      return await api.post("/attendance/shift-leave-types", typeData);
    } catch (error) {
      console.error("Create shift/leave type failed:", error);
      throw error;
    }
  },

  updateShiftLeaveType: async (slug, typeData) => {
    try {
      return await api.put(`/attendance/shift-leave-types/${slug}`, typeData);
    } catch (error) {
      console.error(`Update shift/leave type ${slug} failed:`, error);
      throw error;
    }
  },

  deleteShiftLeaveType: async (slug) => {
    try {
      return await api.delete(`/attendance/shift-leave-types/${slug}`);
    } catch (error) {
      console.error(`Delete shift/leave type ${slug} failed:`, error);
      throw error;
    }
  },

  // Employee Job Role Settings
  getEmployeeSettings: async (userId, params = {}) => {
    try {
      return await api.get(`/attendance/employees/${userId}/settings`, { params });
    } catch (error) {
      console.error(`Get employee settings for user ${userId} failed:`, error);
      throw error;
    }
  },

  createEmployeeSettings: async (settingsData) => {
    try {
      return await api.post("/attendance/employee-settings", settingsData);
    } catch (error) {
      console.error("Create employee settings failed:", error);
      throw error;
    }
  },

  updateEmployeeSettings: async (settingsId, settingsData) => {
    try {
      return await api.put(`/attendance/employee-settings/${settingsId}`, settingsData);
    } catch (error) {
      console.error(`Update employee settings ${settingsId} failed:`, error);
      throw error;
    }
  },

  // Holiday Years
  getHolidayYears: async (params = {}) => {
    try {
      return await api.get("/attendance/holiday-years", { params });
    } catch (error) {
      console.error("Get holiday years failed:", error);
      throw error;
    }
  },

  getHolidayYear: async (slug) => {
    try {
      return await api.get(`/attendance/holiday-years/${slug}`);
    } catch (error) {
      console.error(`Get holiday year ${slug} failed:`, error);
      throw error;
    }
  },

  getCurrentHolidayYear: async () => {
    try {
      return await api.get("/attendance/holiday-years/current");
    } catch (error) {
      console.error("Get current holiday year failed:", error);
      throw error;
    }
  },

  createHolidayYear: async (yearData) => {
    try {
      return await api.post("/attendance/holiday-years", yearData);
    } catch (error) {
      console.error("Create holiday year failed:", error);
      throw error;
    }
  },

  updateHolidayYear: async (slug, yearData) => {
    try {
      return await api.put(`/attendance/holiday-years/${slug}`, yearData);
    } catch (error) {
      console.error(`Update holiday year ${slug} failed:`, error);
      throw error;
    }
  },

  rolloverHolidayYear: async (body = {}) => {
    try {
      return await api.post("/attendance/holiday-years/rollover", body);
    } catch (error) {
      console.error("Rollover holiday year failed:", error);
      throw error;
    }
  },

  // Holiday Entitlements
  getHolidayEntitlements: async (params = {}) => {
    try {
      return await api.get("/attendance/holiday-entitlements", { params });
    } catch (error) {
      console.error("Get holiday entitlements failed:", error);
      throw error;
    }
  },

  getHolidayEntitlement: async (slug) => {
    try {
      return await api.get(`/attendance/holiday-entitlements/${slug}`);
    } catch (error) {
      console.error(`Get holiday entitlement ${slug} failed:`, error);
      throw error;
    }
  },

  getHolidayBalance: async (params = {}) => {
    try {
      return await api.get("/attendance/holiday-balance", { params });
    } catch (error) {
      console.error("Get holiday balance failed:", error);
      throw error;
    }
  },

  createHolidayEntitlement: async (entitlementData) => {
    try {
      return await api.post("/attendance/holiday-entitlements", entitlementData);
    } catch (error) {
      console.error("Create holiday entitlement failed:", error);
      throw error;
    }
  },

  updateHolidayEntitlement: async (slug, entitlementData) => {
    try {
      return await api.put(`/attendance/holiday-entitlements/${slug}`, entitlementData);
    } catch (error) {
      console.error(`Update holiday entitlement ${slug} failed:`, error);
      throw error;
    }
  },

  // Leave Requests
  getLeaveRequests: async (params = {}) => {
    try {
      return await api.get("/attendance/leave-requests", { params });
    } catch (error) {
      console.error("Get leave requests failed:", error);
      throw error;
    }
  },

  getLeaveRequest: async (slug) => {
    try {
      return await api.get(`/attendance/leave-requests/${slug}`);
    } catch (error) {
      console.error(`Get leave request ${slug} failed:`, error);
      throw error;
    }
  },

  createLeaveRequest: async (requestData) => {
    try {
      return await api.post("/attendance/leave-requests", requestData);
    } catch (error) {
      console.error("Create leave request failed:", error);
      throw error;
    }
  },

  updateLeaveRequest: async (slug, requestData) => {
    try {
      return await api.put(`/attendance/leave-requests/${slug}`, requestData);
    } catch (error) {
      console.error(`Update leave request ${slug} failed:`, error);
      throw error;
    }
  },

  cancelLeaveRequest: async (slug) => {
    try {
      return await api.post(`/attendance/leave-requests/${slug}/cancel`);
    } catch (error) {
      console.error(`Cancel leave request ${slug} failed:`, error);
      throw error;
    }
  },

  approveLeaveRequest: async (slug, approvalData) => {
    try {
      return await api.post(`/attendance/leave-requests/${slug}/approve`, approvalData);
    } catch (error) {
      console.error(`Approve leave request ${slug} failed:`, error);
      throw error;
    }
  },

  /**
   * Get departments that have leave requests (for approval list filter). No department:read needed.
   */
  getPendingLeaveRequestDepartments: async () => {
    try {
      const res = await api.get("/attendance/leave-requests/pending/departments");
      return res.data ?? res;
    } catch (error) {
      console.error("Get pending leave request departments failed:", error);
      throw error;
    }
  },

  /**
   * Get pending leave requests for approval list with filters.
   * @param {Object} filters - { status, department_id, sort_by, sort_order, page, per_page }
   * Only defined, non-empty values are sent as query params; department_id is sent as number.
   */
  getPendingLeaveRequests: async (filters = {}) => {
    const queryParams = {};
    if (filters.status != null && filters.status !== "") queryParams.status = filters.status;
    if (filters.department_id != null && filters.department_id !== "") {
      queryParams.department_id = Number(filters.department_id);
    }
    if (filters.sort_by != null && filters.sort_by !== "") queryParams.sort_by = filters.sort_by;
    if (filters.sort_order != null && filters.sort_order !== "") queryParams.sort_order = filters.sort_order;
    if (filters.page != null) queryParams.page = Number(filters.page);
    if (filters.per_page != null) queryParams.per_page = Number(filters.per_page);
    try {
      return await api.get("/attendance/leave-requests/pending", { params: queryParams });
    } catch (error) {
      console.error("Get pending leave requests failed:", error);
      throw error;
    }
  },

  // Coverage / Gaps / Now-board (Time & Attendance UI)
  getCoverage: async (params = {}) => {
    try {
      return await api.get("/attendance/coverage", { params });
    } catch (error) {
      console.error("Get coverage failed:", error);
      throw error;
    }
  },

  getGaps: async (params = {}) => {
    try {
      return await api.get("/attendance/gaps", { params });
    } catch (error) {
      console.error("Get gaps failed:", error);
      throw error;
    }
  },

  getNowBoard: async (params = {}) => {
    try {
      return await api.get("/attendance/now-board", { params });
    } catch (error) {
      console.error("Get now-board failed:", error);
      throw error;
    }
  },

  /**
   * Get departments for attendance filter dropdown (list/reports).
   * Returns [{ id, name }]. Requires attendance:view.
   */
  getAttendanceDepartments: async () => {
    try {
      const res = await api.get("/attendance/departments");
      return res.data ?? res;
    } catch (error) {
      console.error("Get attendance departments failed:", error);
      throw error;
    }
  },

  /**
   * Suggest employees for adding shifts / reports. Returns { employees: [{ id, slug, display_name, department_id?, department_name? }] }.
   * Use q for name search and department_id to narrow by department.
   */
  suggestAttendanceEmployees: async (params = {}) => {
    try {
      const res = await api.get("/attendance/employees/suggest", { params });
      return res.data ?? res;
    } catch (error) {
      console.error("Suggest attendance employees failed:", error);
      throw error;
    }
  },

  // Shift Records
  getShiftRecords: async (params = {}) => {
    try {
      return await api.get("/attendance/shift-records", { params });
    } catch (error) {
      console.error("Get shift records failed:", error);
      throw error;
    }
  },

  /**
   * Fetches all shift records by paginating with per_page=100 (backend max).
   * Use when you need the full set for a date range (e.g. rota timeline).
   */
  getShiftRecordsAllPages: async (params = {}) => {
    const { page: _page, per_page: _perPage, ...rest } = params;
    const perPage = 100;
    const first = await api.get("/attendance/shift-records", {
      params: { ...rest, page: 1, per_page: perPage },
    });
    const data = first.data ?? first;
    const total = data.total ?? 0;
    const records = [...(data.records ?? [])];
    const totalPages = data.total_pages ?? Math.max(1, Math.ceil(total / perPage));

    for (let page = 2; page <= totalPages; page++) {
      const res = await api.get("/attendance/shift-records", {
        params: { ...rest, page, per_page: perPage },
      });
      const pageData = res.data ?? res;
      records.push(...(pageData.records ?? []));
    }
    return { records, total };
  },

  getShiftRecord: async (slug) => {
    try {
      return await api.get(`/attendance/shift-records/${slug}`);
    } catch (error) {
      console.error(`Get shift record ${slug} failed:`, error);
      throw error;
    }
  },

  createShiftRecord: async (recordData) => {
    try {
      return await api.post("/attendance/shift-records", recordData);
    } catch (error) {
      console.error("Create shift record failed:", error);
      throw error;
    }
  },

  updateShiftRecord: async (slug, recordData) => {
    try {
      return await api.put(`/attendance/shift-records/${slug}`, recordData);
    } catch (error) {
      console.error(`Update shift record ${slug} failed:`, error);
      throw error;
    }
  },

  deleteShiftRecord: async (slug) => {
    try {
      return await api.delete(`/attendance/shift-records/${slug}`);
    } catch (error) {
      console.error(`Delete shift record ${slug} failed:`, error);
      throw error;
    }
  },

  // Mapped Shift Templates
  getMappedShiftTemplates: async (params = {}) => {
    try {
      return await api.get("/attendance/mapped-shift-templates", { params });
    } catch (error) {
      console.error("Get mapped shift templates failed:", error);
      throw error;
    }
  },

  getMappedShiftTemplate: async (slug) => {
    try {
      return await api.get(`/attendance/mapped-shift-templates/${slug}`);
    } catch (error) {
      console.error(`Get mapped shift template ${slug} failed:`, error);
      throw error;
    }
  },

  createMappedShiftTemplate: async (templateData) => {
    try {
      return await api.post("/attendance/mapped-shift-templates", templateData);
    } catch (error) {
      console.error("Create mapped shift template failed:", error);
      throw error;
    }
  },

  updateMappedShiftTemplate: async (slug, templateData) => {
    try {
      return await api.put(`/attendance/mapped-shift-templates/${slug}`, templateData);
    } catch (error) {
      console.error(`Update mapped shift template ${slug} failed:`, error);
      throw error;
    }
  },

  deleteMappedShiftTemplate: async (slug) => {
    try {
      return await api.delete(`/attendance/mapped-shift-templates/${slug}`);
    } catch (error) {
      console.error(`Delete mapped shift template ${slug} failed:`, error);
      throw error;
    }
  },

  generateShiftsFromTemplate: async (slug, generateData) => {
    try {
      return await api.post(`/attendance/mapped-shift-templates/${slug}/generate`, generateData);
    } catch (error) {
      console.error(`Generate shifts from template ${slug} failed:`, error);
      throw error;
    }
  },

  // Reports
  getAttendanceSummary: async (params = {}) => {
    try {
      return await api.get("/attendance/reports/summary", { params });
    } catch (error) {
      console.error("Get attendance summary failed:", error);
      throw error;
    }
  },

  getHolidayBalanceReport: async (params = {}) => {
    try {
      return await api.get("/attendance/reports/holiday-balance", { params });
    } catch (error) {
      console.error("Get holiday balance report failed:", error);
      throw error;
    }
  },

  getLeaveCalendar: async (params = {}) => {
    try {
      return await api.get("/attendance/reports/leave-calendar", { params });
    } catch (error) {
      console.error("Get leave calendar failed:", error);
      throw error;
    }
  },

  getIndividualReport: async (userId, params = {}) => {
    try {
      return await api.get(`/attendance/reports/individual/${userId}`, { params });
    } catch (error) {
      console.error(`Get individual report for user ${userId} failed:`, error);
      throw error;
    }
  },

  exportPayroll: async (params = {}) => {
    try {
      return await api.get("/attendance/reports/payroll-export", {
        params,
        responseType: "blob",
      });
    } catch (error) {
      console.error("Export payroll failed:", error);
      throw error;
    }
  },

  getAbsenceReport: async (params = {}) => {
    try {
      return await api.get("/attendance/reports/absence", { params });
    } catch (error) {
      console.error("Get absence report failed:", error);
      throw error;
    }
  },

  // Provisional Shifts
  getProvisionalShifts: async (params = {}) => {
    try {
      return await api.get("/attendance/provisional-shifts", { params });
    } catch (error) {
      console.error("Get provisional shifts failed:", error);
      throw error;
    }
  },

  getProvisionalShift: async (slug) => {
    try {
      return await api.get(`/attendance/provisional-shifts/${slug}`);
    } catch (error) {
      console.error(`Get provisional shift ${slug} failed:`, error);
      throw error;
    }
  },

  createProvisionalShift: async (shiftData) => {
    try {
      return await api.post("/attendance/provisional-shifts", shiftData);
    } catch (error) {
      console.error("Create provisional shift failed:", error);
      throw error;
    }
  },

  createProvisionalShiftsRecurring: async (shiftData) => {
    try {
      return await api.post("/attendance/provisional-shifts/create-recurring", shiftData);
    } catch (error) {
      console.error("Create recurring allocated shifts failed:", error);
      throw error;
    }
  },

  updateProvisionalShift: async (slug, shiftData) => {
    try {
      return await api.put(`/attendance/provisional-shifts/${slug}`, shiftData);
    } catch (error) {
      console.error(`Update provisional shift ${slug} failed:`, error);
      throw error;
    }
  },

  deleteProvisionalShift: async (slug) => {
    try {
      return await api.delete(`/attendance/provisional-shifts/${slug}`);
    } catch (error) {
      console.error(`Delete provisional shift ${slug} failed:`, error);
      throw error;
    }
  },

  compareProvisionalAttendance: async (slug) => {
    try {
      return await api.get(`/attendance/provisional-shifts/${slug}/compare-attendance`);
    } catch (error) {
      console.error(`Compare provisional attendance for ${slug} failed:`, error);
      throw error;
    }
  },

  // Settings
  getAttendanceSettings: async () => {
    try {
      return await api.get("/attendance/settings");
    } catch (error) {
      console.error("Get attendance settings failed:", error);
      throw error;
    }
  },

  updateAttendanceSettings: async (settingsData) => {
    try {
      return await api.put("/attendance/settings", settingsData);
    } catch (error) {
      console.error("Update attendance settings failed:", error);
      throw error;
    }
  },
};
