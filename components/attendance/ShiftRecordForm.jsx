"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Link from "next/link";
import { CalendarIcon, Loader2, Plus, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatDateForAPI } from "@/utils/time";
import { getUserDisplayName } from "@/utils/user";
import { useCreateShiftRecord, useUpdateShiftRecord, useCreateProvisionalShiftsRecurring } from "@/hooks/useShiftRecords";
import { useShiftLeaveTypes, useAttendanceEmployeeSuggest, useAttendanceDepartments } from "@/hooks/useAttendance";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { useAssignments, useEmployeeAssignments } from "@/hooks/useAssignments";
import { useAuth } from "@/hooks/useAuth";
import { ATTENDANCE_CATEGORY_OPTIONS, getCategoryDescription } from "@/lib/attendanceLabels";
import { ScrollArea } from "@/components/ui/scroll-area";

const ALL_CATEGORIES = ATTENDANCE_CATEGORY_OPTIONS;

/** When allowUserSelect is false, user can only add/edit attendance (not leave) - leave must go through request workflow */
const CATEGORIES_ATTENDANCE_ONLY = ALL_CATEGORIES.filter((c) => c.value === "attendance");

const PERM_MANAGE_ALL = "attendance:manage_all";

/** Parse "HH:mm" to minutes since midnight. Returns null if invalid. */
function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const parts = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!parts) return null;
  const h = parseInt(parts[1], 10);
  const m = parseInt(parts[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

/** Hours between start and end (overnight = end + 24h - start). For allocated/required shifts. */
function hoursBetween(startTime, endTime) {
  const startM = parseTimeToMinutes(startTime);
  const endM = parseTimeToMinutes(endTime);
  if (startM == null || endM == null) return null;
  let diffM = endM - startM;
  if (diffM < 0) diffM += 24 * 60;
  return Math.round((diffM / 60) * 100) / 100;
}

/** Parse "HH:mm" to decimal hours (e.g. "09:00" and "17:30" -> 8.5). Returns null if invalid. */
function hoursFromStartEnd(startStr, endStr) {
  if (!startStr || !endStr || !/^\d{1,2}:\d{2}$/.test(startStr) || !/^\d{1,2}:\d{2}$/.test(endStr)) return null;
  const [sh, sm] = startStr.split(":").map(Number);
  const [eh, em] = endStr.split(":").map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  if (endMins <= startMins) return null;
  const hours = (endMins - startMins) / 60;
  return Math.round(hours * 100) / 100;
}

export const ShiftRecordForm = ({
  open,
  onOpenChange,
  shiftRecord = null,
  userId = null,
  allowUserSelect = false,
  initialValues = null,
  defaultNewCategory = "attendance",
  restrictCategories = null,
}) => {
  const { user } = useAuth();
  const { hasPermission } = usePermissionsCheck();
  const canUseRecurring = hasPermission(PERM_MANAGE_ALL) || user?.is_superuser;
  const [shiftDate, setShiftDate] = useState(null);
  const [category, setCategory] = useState("attendance");
  const [shiftLeaveTypeId, setShiftLeaveTypeId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserForDisplay, setSelectedUserForDisplay] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [userComboboxOpen, setUserComboboxOpen] = useState(false);
  const [jobRoleId, setJobRoleId] = useState("");
  const [shiftRoleId, setShiftRoleId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [hours, setHours] = useState("7.5");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recurInterval, setRecurInterval] = useState("none");
  const [weeksAhead, setWeeksAhead] = useState(12);

  const createShiftRecord = useCreateShiftRecord();
  const updateShiftRecord = useUpdateShiftRecord();
  const createRecurringShifts = useCreateProvisionalShiftsRecurring();

  const RECUR_OPTIONS = [
    { value: "none", label: "None" },
    { value: "1", label: "Every 1 week" },
    { value: "2", label: "Every 2 weeks" },
    { value: "4", label: "Every 4 weeks" },
  ];
  const WEEKS_AHEAD_MIN = 1;
  const WEEKS_AHEAD_MAX = 52;

  const categoryOptions = useMemo(() => {
    if (restrictCategories?.length) {
      const allowed = new Set(restrictCategories);
      return ALL_CATEGORIES.filter((c) => allowed.has(c.value));
    }
    return allowUserSelect ? ALL_CATEGORIES : CATEGORIES_ATTENDANCE_ONLY;
  }, [allowUserSelect, restrictCategories]);

  const targetUserId = userId || selectedUserId || user?.id;
  // When editing, use the record's user so assignments load for that user from first render (state lags)
  const effectiveUserIdForAssignments =
    open && shiftRecord?.user_id != null
      ? shiftRecord.user_id
      : targetUserId
        ? parseInt(targetUserId, 10)
        : undefined;

  const getAssignmentRoleId = (a) => a?.role_id ?? a?.job_role_id ?? a?.role?.id ?? a?.roleId;
  const getRoleType = (a) => a?.role?.role_type ?? a?.role?.roleType ?? "job_role";
  const getParentRoleId = (a) => a?.role?.parent_role_id ?? a?.role?.parentRoleId ?? a?.role?.parent_role?.id;

  const { data: attendanceDepartmentsList = [] } = useAttendanceDepartments({
    enabled: allowUserSelect && open,
  });
  const attendanceDepartments = Array.isArray(attendanceDepartmentsList) ? attendanceDepartmentsList : [];

  const { data: suggestEmployees = [], isLoading: usersSearchLoading } = useAttendanceEmployeeSuggest(
    {
      q: debouncedUserSearch.trim() || undefined,
      department_id: allowUserSelect && departmentId ? parseInt(departmentId, 10) : undefined,
      limit: 20,
    },
    {
      enabled: allowUserSelect && open && userComboboxOpen && (!!departmentId || !!debouncedUserSearch.trim()),
    }
  );
  const employeesSorted = useMemo(
    () =>
      [...suggestEmployees].sort((a, b) =>
        (a.display_name || "").localeCompare(b.display_name || "", undefined, { sensitivity: "base" })
      ),
    [suggestEmployees]
  );
  const selectedUser = allowUserSelect
    ? selectedUserForDisplay ?? suggestEmployees.find((e) => String(e.id) === selectedUserId)
    : null;
  // When editing, prefer shiftRecord.user.slug so we fetch that user's assignments immediately (state lags)
  const selectedUserSlug =
    open && shiftRecord?.user?.slug ? shiftRecord.user.slug : open ? selectedUser?.slug : null;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserSearch(userSearch), 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  const listAssignmentsQuery = useAssignments(
    {
      user_id: effectiveUserIdForAssignments,
      is_active: true,
    },
    { enabled: open && !!effectiveUserIdForAssignments && !selectedUserSlug }
  );
  const employeeAssignmentsQuery = useEmployeeAssignments(selectedUserSlug || "");

  const assignmentsData = selectedUserSlug ? employeeAssignmentsQuery.data : listAssignmentsQuery.data;
  const assignmentsLoading = selectedUserSlug ? employeeAssignmentsQuery.isLoading : listAssignmentsQuery.isLoading;
  const rawAssignments = assignmentsData?.assignments ?? assignmentsData;
  const assignments = Array.isArray(rawAssignments) ? rawAssignments : [];
  const assignmentsWithRole = assignments.filter((a) => getAssignmentRoleId(a) != null);

  // Normalize assignment department id (support snake_case and camelCase from API)
  const getAssignmentDepartmentId = (a) => {
    const raw = a.department_id ?? a.departmentId ?? a.department?.id;
    if (raw == null) return null;
    const num = Number(raw);
    return Number.isNaN(num) ? null : num;
  };

  // Departments the selected user is assigned to (for Department dropdown) — normalize id to number for consistent filtering
  const departmentsForUser = useMemo(() => {
    const seen = new Set();
    return assignmentsWithRole
      .map((a) => {
        const id = getAssignmentDepartmentId(a);
        const name = a.department?.name ?? a.department_name;
        return id != null ? { id, name } : null;
      })
      .filter((d) => d != null && !seen.has(d.id) && (seen.add(d.id), true));
  }, [assignmentsWithRole]);

  // Assignments in selected department (User -> Department -> Role)
  const assignmentsInSelectedDept = useMemo(() => {
    if (!departmentId) return [];
    const deptIdNum = parseInt(departmentId, 10);
    if (Number.isNaN(deptIdNum)) return [];
    return assignmentsWithRole.filter((a) => getAssignmentDepartmentId(a) === deptIdNum);
  }, [assignmentsWithRole, departmentId]);

  // Job roles only (for first dropdown) — role_type is job_role or legacy/unspecified
  const jobRoleOptions = useMemo(() => {
    return assignmentsInSelectedDept.filter((a) => {
      const rt = getRoleType(a);
      return rt === "job_role" || !rt;
    });
  }, [assignmentsInSelectedDept]);

  // Shift roles under the selected job role (for second dropdown).
  // Include (1) user's assignments that are shift roles with this parent, and
  // (2) shift roles from the job role's role.shift_roles so all defined shift roles show even without a separate assignment.
  const shiftRoleOptions = useMemo(() => {
    if (!jobRoleId) return [];
    const jid = String(jobRoleId);
    const fromAssignments = assignmentsInSelectedDept.filter((a) => {
      const rt = getRoleType(a);
      const parentId = getParentRoleId(a);
      return rt === "shift_role" && parentId != null && String(parentId) === jid;
    });
    const selectedJobAssignment = jobRoleOptions.find((a) => String(getAssignmentRoleId(a)) === jid);
    const fromRoleData = selectedJobAssignment?.role?.shift_roles ?? selectedJobAssignment?.role?.shiftRoles ?? [];
    const seen = new Set();
    const merged = [];
    fromAssignments.forEach((a) => {
      const roleId = getAssignmentRoleId(a);
      if (roleId != null && !seen.has(roleId)) {
        seen.add(roleId);
        merged.push({
          id: roleId,
          display_name: a.role?.display_name || a.role?.name || a.job_role?.display_name || a.job_role?.name || `Role ${roleId}`,
        });
      }
    });
    (Array.isArray(fromRoleData) ? fromRoleData : []).forEach((sr) => {
      const id = sr.id ?? sr.role_id;
      if (id != null && !seen.has(id)) {
        seen.add(id);
        merged.push({
          id,
          display_name: sr.display_name ?? sr.name ?? `Role ${id}`,
        });
      }
    });
    return merged;
  }, [assignmentsInSelectedDept, jobRoleId, jobRoleOptions]);

  const { data: shiftLeaveTypesData } = useShiftLeaveTypes({ category, is_active: true });
  const shiftLeaveTypes = shiftLeaveTypesData?.types || shiftLeaveTypesData || [];

  const prevSelectedUserIdRef = useRef(selectedUserId);
  const prevDepartmentIdRef = useRef(departmentId);

  useEffect(() => {
    if (shiftRecord) {
      const uid = shiftRecord.user_id?.toString() || "";
      const deptId = shiftRecord.department_id?.toString() || "";
      setShiftDate(shiftRecord.shift_date ? new Date(shiftRecord.shift_date) : null);
      setCategory(shiftRecord.category || "attendance");
      setShiftLeaveTypeId(shiftRecord.shift_leave_type_id?.toString() || "");
      setSelectedUserId(uid);
      setSelectedUserForDisplay(shiftRecord.user ?? null);
      setJobRoleId(shiftRecord.job_role_id?.toString() || "");
      setShiftRoleId(shiftRecord.shift_role_id?.toString() || "");
      setDepartmentId(deptId);
      setHours(shiftRecord.hours?.toString() || "7.5");
      setStartTime(shiftRecord.start_time ? String(shiftRecord.start_time).slice(0, 5) : "09:00");
      setEndTime(shiftRecord.end_time ? String(shiftRecord.end_time).slice(0, 5) : "17:00");
      setNotes(shiftRecord.notes || "");
      setRecurInterval("none");
      setWeeksAhead(12);
      // Keep "on change" effects from clearing user/job role when opening edit
      prevSelectedUserIdRef.current = uid;
      prevDepartmentIdRef.current = deptId;
    } else if (open && initialValues) {
      const nextCat =
        initialValues.defaultCategory ||
        defaultNewCategory ||
        (restrictCategories?.length === 1 ? restrictCategories[0] : "attendance");
      setShiftDate(initialValues.shiftDate ? new Date(initialValues.shiftDate + "T12:00:00") : null);
      setCategory(nextCat);
      setShiftLeaveTypeId("");
      setSelectedUserId(initialValues.userId?.toString() || userId?.toString() || "");
      setSelectedUserForDisplay(null);
      setUserSearch("");
      setDebouncedUserSearch("");
      setUserComboboxOpen(false);
      setJobRoleId(initialValues.jobRoleId?.toString() || "");
      setShiftRoleId(initialValues.shiftRoleId?.toString() || "");
      setDepartmentId(initialValues.departmentId?.toString() || "");
      setHours("7.5");
      setStartTime("09:00");
      setEndTime("17:00");
      setNotes("");
      setRecurInterval("none");
      setWeeksAhead(12);
      prevSelectedUserIdRef.current = initialValues.userId?.toString() || userId?.toString() || "";
      prevDepartmentIdRef.current = initialValues.departmentId?.toString() || "";
    } else {
      setShiftDate(null);
      setCategory(
        restrictCategories?.length === 1 ? restrictCategories[0] : defaultNewCategory || "attendance"
      );
      setShiftLeaveTypeId("");
      setSelectedUserId(userId?.toString() || "");
      setSelectedUserForDisplay(null);
      setUserSearch("");
      setDebouncedUserSearch("");
      setUserComboboxOpen(false);
      setJobRoleId("");
      setShiftRoleId("");
      setDepartmentId("");
      setHours("7.5");
      setStartTime("09:00");
      setEndTime("17:00");
      setNotes("");
      setRecurInterval("none");
      setWeeksAhead(12);
    }
  }, [shiftRecord, open, userId, user?.id, initialValues, defaultNewCategory, restrictCategories]);

  useEffect(() => {
    if (prevSelectedUserIdRef.current !== selectedUserId) {
      prevSelectedUserIdRef.current = selectedUserId;
      setJobRoleId("");
      // When allowUserSelect, flow is Department first then User — do not clear department when user changes
      if (!allowUserSelect) setDepartmentId("");
    } else {
      prevSelectedUserIdRef.current = selectedUserId;
    }
  }, [selectedUserId, allowUserSelect]);

  useEffect(() => {
    if (prevDepartmentIdRef.current !== departmentId) {
      prevDepartmentIdRef.current = departmentId;
      setJobRoleId("");
      if (allowUserSelect) {
        setSelectedUserId("");
        setSelectedUserForDisplay(null);
        setUserSearch("");
        setDebouncedUserSearch("");
      }
    } else {
      prevDepartmentIdRef.current = departmentId;
    }
  }, [departmentId, allowUserSelect]);

  // Auto-select department when adding and user has only one department
  useEffect(() => {
    if (!shiftRecord && !departmentId && departmentsForUser?.length === 1) {
      setDepartmentId(String(departmentsForUser[0].id));
    }
  }, [shiftRecord, departmentId, departmentsForUser]);

  // Auto-select first job role when adding and selected department has only one job role
  useEffect(() => {
    if (!shiftRecord && !jobRoleId && jobRoleOptions?.length === 1) {
      const roleId = getAssignmentRoleId(jobRoleOptions[0]);
      if (roleId != null) {
        setJobRoleId(String(roleId));
      }
    }
  }, [shiftRecord, jobRoleId, jobRoleOptions]);

  // When job role is set (e.g. from edit), ensure department is set from assignment
  useEffect(() => {
    if (jobRoleId && assignments?.length && !departmentId) {
      const assignment = assignments.find((a) => String(getAssignmentRoleId(a)) === jobRoleId);
      const deptId = assignment && getAssignmentDepartmentId(assignment);
      if (deptId != null) setDepartmentId(String(deptId));
    }
  }, [jobRoleId, assignments, departmentId]);

  // Clear job role (and shift role) if not in the selected department
  useEffect(() => {
    if (!departmentId || !jobRoleId || jobRoleOptions.length === 0) return;
    const isInDept = jobRoleOptions.some((a) => String(getAssignmentRoleId(a)) === jobRoleId);
    if (!isInDept) {
      setJobRoleId("");
      setShiftRoleId("");
    }
  }, [departmentId, jobRoleId, jobRoleOptions]);

  // Auto-calculate hours: overnight span for allocated/required; same-day for attended leave paths; 0 when start-only (attendance)
  useEffect(() => {
    if (category === "provisional" || category === "mapped") {
      const computed = hoursBetween(startTime, endTime);
      if (computed != null) setHours(String(computed));
      return;
    }
    const calculated = hoursFromStartEnd(startTime, endTime);
    if (calculated != null) setHours(String(calculated));
    else if (startTime && !endTime) setHours("0");
  }, [startTime, endTime, category]);

  useEffect(() => {
    if (category !== "provisional" && category !== "mapped") {
      setRecurInterval("none");
    }
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shiftDate || !shiftLeaveTypeId || !jobRoleId || !departmentId) return;
    const numHours = hours === "" || hours == null ? 0 : parseFloat(hours);
    if (numHours < 0 || numHours > 24) return;
    const plannedCategory = category === "provisional" || category === "mapped";
    if (plannedCategory && numHours <= 0) return;
    if (!plannedCategory && numHours === 0 && (!startTime || endTime)) return;

    setIsSubmitting(true);
    try {
      const payload = {
        user_id: parseInt(targetUserId, 10),
        job_role_id: parseInt(jobRoleId, 10),
        shift_role_id: shiftRoleId ? parseInt(shiftRoleId, 10) : null,
        shift_leave_type_id: parseInt(shiftLeaveTypeId, 10),
        category,
        shift_date: formatDateForAPI(shiftDate),
        start_time: startTime || null,
        end_time: endTime || null,
        hours: numHours,
        department_id: parseInt(departmentId, 10),
        notes: notes || null,
      };

      if (shiftRecord) {
        await updateShiftRecord.mutateAsync({
          slug: shiftRecord.slug,
          recordData: {
            shift_date: formatDateForAPI(shiftDate),
            start_time: startTime || null,
            end_time: endTime || null,
            hours: numHours,
            notes: notes || null,
          },
        });
      } else if (
        canUseRecurring &&
        plannedCategory &&
        recurInterval &&
        recurInterval !== "none"
      ) {
        const numWeeks = Math.min(WEEKS_AHEAD_MAX, Math.max(WEEKS_AHEAD_MIN, Number(weeksAhead) || 12));
        await createRecurringShifts.mutateAsync({
          ...payload,
          recur_interval_weeks: parseInt(recurInterval, 10),
          weeks_ahead: numWeeks,
        });
      } else {
        await createShiftRecord.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Shift record save failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const numHoursParsed = hours === "" || hours == null ? 0 : parseFloat(hours);
  const plannedCategory = category === "provisional" || category === "mapped";
  const hoursValid = plannedCategory
    ? numHoursParsed > 0 && numHoursParsed <= 24
    : numHoursParsed >= 0 &&
      numHoursParsed <= 24 &&
      (numHoursParsed > 0 || (startTime && !endTime));
  const canSubmit =
    shiftDate &&
    shiftLeaveTypeId &&
    jobRoleId &&
    departmentId &&
    hoursValid &&
    (!allowUserSelect || !!selectedUserId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <DialogTitle>{shiftRecord ? "Edit Shift Record" : "Add Shift Record"}</DialogTitle>
          <DialogDescription>
            Add or edit attended time, authorised or unauthorised leave, allocated shifts, or required slots. Choose a category,
            then pick the matching shift type. Recurring options apply to allocated and required shifts (admin).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto px-6 pb-4 space-y-4 flex-1 min-h-0">
          {allowUserSelect && (
            <>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={departmentId || ""}
                  onValueChange={(v) => {
                    setDepartmentId(v);
                    setJobRoleId("");
                    setShiftRoleId("");
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        attendanceDepartments.length === 0 ? "Loading…" : "Select department"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {attendanceDepartments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Select department first, then choose the user.</p>
              </div>
              <div className="space-y-2">
                <Label>User</Label>
                <Popover open={userComboboxOpen} onOpenChange={(open) => { setUserComboboxOpen(open); if (!open) { setUserSearch(""); setDebouncedUserSearch(""); } }}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={userComboboxOpen}
                      disabled={!departmentId}
                      className={cn("w-full justify-between font-normal", !selectedUserId && "text-muted-foreground")}
                    >
                      {!departmentId
                        ? "Select department first"
                        : selectedUser
                          ? getUserDisplayName(selectedUser)
                          : "Type to search users in this department"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search by name..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="h-9"
                        autoFocus
                      />
                    </div>
                    <ScrollArea className="max-h-64">
                      {usersSearchLoading ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
                      ) : employeesSorted.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                          {debouncedUserSearch.trim() ? "No one found. Try another name." : "Type to search users in this department."}
                        </p>
                      ) : (
                        <ul className="p-1">
                          {employeesSorted.map((e) => (
                            <li key={e.id}>
                              <button
                                type="button"
                                className={cn(
                                  "w-full rounded-sm px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                                  String(e.id) === selectedUserId && "bg-accent"
                                )}
                                onClick={() => {
                                  setSelectedUserId(String(e.id));
                                  setSelectedUserForDisplay({ id: e.id, slug: e.slug, display_name: e.display_name, department_id: e.department_id, department_name: e.department_name });
                                  setUserComboboxOpen(false);
                                  setUserSearch("");
                                  setDebouncedUserSearch("");
                                }}
                              >
                                {e.department_name ? `${e.display_name} — ${e.department_name}` : e.display_name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}

          {!allowUserSelect && (effectiveUserIdForAssignments) && (
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={departmentId || ""}
                onValueChange={(v) => {
                  setDepartmentId(v);
                  setJobRoleId("");
                  setShiftRoleId("");
                }}
                required
                disabled={!effectiveUserIdForAssignments || assignmentsLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !effectiveUserIdForAssignments
                        ? "Select user first"
                        : assignmentsLoading
                          ? "Loading…"
                          : departmentsForUser.length === 0
                            ? "No departments found"
                            : "Select department"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {departmentsForUser.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => { setCategory(v); setShiftLeaveTypeId(""); }}
              disabled={!allowUserSelect && !!shiftRecord && shiftRecord.category !== "attendance"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getCategoryDescription(category) && (
              <p className="text-xs text-muted-foreground">{getCategoryDescription(category)}</p>
            )}
            {!allowUserSelect && !restrictCategories?.length && (
              <p className="text-xs text-muted-foreground">Leave must be requested via the leave request workflow.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Shift Type</Label>
            <div className="flex gap-2">
              <Select value={shiftLeaveTypeId} onValueChange={setShiftLeaveTypeId} required className="flex-1 min-w-0">
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {shiftLeaveTypes.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" className="shrink-0 h-10 w-10" title="Manage shift types" asChild>
                <Link href="/admin/attendance/settings" target="_blank" rel="noopener noreferrer">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Job Role</Label>
            <Select
              key={departmentId || "no-dept"}
              value={jobRoleId}
              onValueChange={(v) => {
                setJobRoleId(v);
                setShiftRoleId("");
              }}
              required
              disabled={!departmentId || assignmentsLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !effectiveUserIdForAssignments
                      ? "Select user first"
                      : !departmentId
                        ? "Select department first"
                        : assignmentsLoading
                          ? "Loading…"
                          : jobRoleOptions.length === 0
                            ? "No job roles in this department"
                            : "Select job role"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {jobRoleOptions.map((a) => {
                  const roleId = getAssignmentRoleId(a);
                  return (
                    <SelectItem key={a.id ?? roleId} value={String(roleId)}>
                      {a.role?.display_name || a.role?.name || a.job_role?.display_name || a.job_role?.name || `Role ${roleId}`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Shift Role (optional)</Label>
            <Select
              key={jobRoleId || "no-job"}
              value={shiftRoleId || "__none__"}
              onValueChange={(v) => setShiftRoleId(v === "__none__" ? "" : v)}
              disabled={!jobRoleId || assignmentsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shift role (or leave as job role only)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None (use job role only)</SelectItem>
                {shiftRoleOptions.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {jobRoleId && shiftRoleOptions.length === 0 && (
              <p className="text-xs text-muted-foreground">No shift roles for this job role.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start", !shiftDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {shiftDate ? format(shiftDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar mode="single" selected={shiftDate} onSelect={setShiftDate} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Hours</Label>
              <Input type="number" step="0.25" min="0" max="24" value={hours} onChange={(e) => setHours(e.target.value)} placeholder={!endTime ? "0 if adding end time later" : undefined} />
              {!endTime && startTime && (
                <p className="text-xs text-muted-foreground">Use 0 when recording start only; add end time and hours when you finish.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              {!endTime && <p className="text-xs text-muted-foreground">Add end time when you leave (you can edit this record later).</p>}
            </div>
            <div className="space-y-2">
              <Label>End time (optional)</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              <p className="text-xs text-muted-foreground">Leave blank to add when you finish work.</p>
            </div>
          </div>

          {!shiftRecord && canUseRecurring && allowUserSelect && plannedCategory && (
            <>
              <div className="space-y-2">
                <Label>Recur this shift</Label>
                <Select value={recurInterval} onValueChange={setRecurInterval}>
                  <SelectTrigger>
                    <SelectValue placeholder="None — single record only" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECUR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  For <strong className="font-medium text-foreground">Allocated</strong> and{" "}
                  <strong className="font-medium text-foreground">Required</strong> only. Requires attendance admin permission.
                </p>
              </div>
              {recurInterval && recurInterval !== "none" && (
                <div className="space-y-2">
                  <Label htmlFor="shift-form-weeks-ahead">Create for how many weeks ahead?</Label>
                  <Input
                    id="shift-form-weeks-ahead"
                    type="number"
                    min={WEEKS_AHEAD_MIN}
                    max={WEEKS_AHEAD_MAX}
                    value={weeksAhead}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!Number.isNaN(v)) setWeeksAhead(Math.min(WEEKS_AHEAD_MAX, Math.max(WEEKS_AHEAD_MIN, v)));
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Records are created from the start date forward (1–52 weeks). You can adjust or remove individual dates on
                    the Rota later.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          </div>

          <DialogFooter className="shrink-0 px-6 pb-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !canSubmit ||
                isSubmitting ||
                createShiftRecord.isPending ||
                updateShiftRecord.isPending ||
                createRecurringShifts.isPending
              }
            >
              {(isSubmitting || createShiftRecord.isPending || updateShiftRecord.isPending || createRecurringShifts.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {shiftRecord ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
