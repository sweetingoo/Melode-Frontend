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
import { useCreateShiftRecord, useUpdateShiftRecord } from "@/hooks/useShiftRecords";
import { useShiftLeaveTypes, useAttendanceDepartments, useAttendanceEmployeeSuggest } from "@/hooks/useAttendance";
import { useAssignments, useEmployeeAssignments } from "@/hooks/useAssignments";
import { useAuth } from "@/hooks/useAuth";
import { ATTENDANCE_CATEGORY_OPTIONS, getCategoryDescription } from "@/lib/attendanceLabels";
import { ScrollArea } from "@/components/ui/scroll-area";

const ALL_CATEGORIES = ATTENDANCE_CATEGORY_OPTIONS;

/** When allowUserSelect is false, user can only add/edit attendance (not leave) - leave must go through request workflow */
const CATEGORIES_ATTENDANCE_ONLY = ALL_CATEGORIES.filter((c) => c.value === "attendance");

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

export const ShiftRecordForm = ({ open, onOpenChange, shiftRecord = null, userId = null, allowUserSelect = false }) => {
  const { user } = useAuth();
  const [shiftDate, setShiftDate] = useState(null);
  const [category, setCategory] = useState("attendance");
  const [shiftLeaveTypeId, setShiftLeaveTypeId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserForDisplay, setSelectedUserForDisplay] = useState(null);
  const [userDepartmentFilter, setUserDepartmentFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [userComboboxOpen, setUserComboboxOpen] = useState(false);
  const [jobRoleId, setJobRoleId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [hours, setHours] = useState("7.5");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetUserId = userId || selectedUserId || user?.id;
  const createShiftRecord = useCreateShiftRecord();
  const updateShiftRecord = useUpdateShiftRecord();

  const getAssignmentRoleId = (a) => a?.role_id ?? a?.job_role_id ?? a?.roleId;

  const { data: suggestEmployees = [], isLoading: usersSearchLoading } = useAttendanceEmployeeSuggest(
    {
      q: debouncedUserSearch.trim() || undefined,
      department_id: userDepartmentFilter ? parseInt(userDepartmentFilter, 10) : undefined,
      limit: 20,
    },
    {
      enabled: allowUserSelect && open && userComboboxOpen,
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
  const selectedUserSlug = open ? selectedUser?.slug : null;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserSearch(userSearch), 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  const { data: attendanceDepartments = [] } = useAttendanceDepartments({ enabled: allowUserSelect && open });
  const departmentsSorted = [...(Array.isArray(attendanceDepartments) ? attendanceDepartments : [])].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
  );

  const listAssignmentsQuery = useAssignments(
    {
      user_id: targetUserId ? parseInt(targetUserId, 10) : undefined,
      is_active: true,
    },
    { enabled: open && !!targetUserId && !selectedUserSlug }
  );
  const employeeAssignmentsQuery = useEmployeeAssignments(selectedUserSlug || "");

  const assignmentsData = selectedUserSlug ? employeeAssignmentsQuery.data : listAssignmentsQuery.data;
  const assignmentsLoading = selectedUserSlug ? employeeAssignmentsQuery.isLoading : listAssignmentsQuery.isLoading;
  const rawAssignments = assignmentsData?.assignments ?? assignmentsData;
  const assignments = Array.isArray(rawAssignments) ? rawAssignments : [];
  const assignmentsWithRole = assignments.filter((a) => getAssignmentRoleId(a) != null);

  const { data: shiftLeaveTypesData } = useShiftLeaveTypes({ category, is_active: true });
  const shiftLeaveTypes = shiftLeaveTypesData?.types || shiftLeaveTypesData || [];

  useEffect(() => {
    if (shiftRecord) {
      setShiftDate(shiftRecord.shift_date ? new Date(shiftRecord.shift_date) : null);
      setCategory(shiftRecord.category || "attendance");
      setShiftLeaveTypeId(shiftRecord.shift_leave_type_id?.toString() || "");
      setSelectedUserId(shiftRecord.user_id?.toString() || "");
      setSelectedUserForDisplay(shiftRecord.user ?? null);
      setJobRoleId(shiftRecord.job_role_id?.toString() || "");
      setDepartmentId(shiftRecord.department_id?.toString() || "");
      setHours(shiftRecord.hours?.toString() || "7.5");
      setStartTime(shiftRecord.start_time ? String(shiftRecord.start_time).slice(0, 5) : "09:00");
      setEndTime(shiftRecord.end_time ? String(shiftRecord.end_time).slice(0, 5) : "17:00");
      setNotes(shiftRecord.notes || "");
    } else {
      setShiftDate(null);
      setCategory("attendance");
      setShiftLeaveTypeId("");
      setSelectedUserId(userId?.toString() || "");
      setSelectedUserForDisplay(null);
      setUserDepartmentFilter("");
      setUserSearch("");
      setDebouncedUserSearch("");
      setUserComboboxOpen(false);
      setJobRoleId("");
      setDepartmentId("");
      setHours("7.5");
      setStartTime("09:00");
      setEndTime("17:00");
      setNotes("");
    }
  }, [shiftRecord, open, userId, user?.id]);

  useEffect(() => {
    if (allowUserSelect && userDepartmentFilter) {
      setSelectedUserId("");
      setSelectedUserForDisplay(null);
    }
  }, [userDepartmentFilter, allowUserSelect]);

  const prevSelectedUserIdRef = useRef(selectedUserId);
  useEffect(() => {
    if (allowUserSelect && prevSelectedUserIdRef.current !== selectedUserId) {
      prevSelectedUserIdRef.current = selectedUserId;
      setJobRoleId("");
      setDepartmentId("");
    } else {
      prevSelectedUserIdRef.current = selectedUserId;
    }
  }, [selectedUserId, allowUserSelect]);

  // Auto-select first job role when adding and user has only one assignment
  useEffect(() => {
    if (!shiftRecord && !jobRoleId && assignmentsWithRole?.length === 1) {
      const roleId = getAssignmentRoleId(assignmentsWithRole[0]);
      if (roleId != null) {
        setJobRoleId(String(roleId));
      }
    }
  }, [shiftRecord, jobRoleId, assignmentsWithRole]);

  useEffect(() => {
    if (jobRoleId && assignments?.length) {
      const assignment = assignments.find((a) => String(getAssignmentRoleId(a)) === jobRoleId);
      if (assignment?.department_id) setDepartmentId(String(assignment.department_id));
    }
  }, [jobRoleId, assignments]);

  // Auto-calculate hours when both start and end time are set; clear to 0 when end time is removed (start-only)
  useEffect(() => {
    const calculated = hoursFromStartEnd(startTime, endTime);
    if (calculated != null) setHours(String(calculated));
    else if (startTime && !endTime) setHours("0");
  }, [startTime, endTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shiftDate || !shiftLeaveTypeId || !jobRoleId || !departmentId) return;
    const numHours = hours === "" || hours == null ? 0 : parseFloat(hours);
    if (numHours < 0 || numHours > 24) return;
    // When only start time is set (no end time), allow 0 hours so user can add end time later
    if (numHours === 0 && (!startTime || endTime)) return;

    setIsSubmitting(true);
    try {
      const payload = {
        user_id: parseInt(targetUserId, 10),
        job_role_id: parseInt(jobRoleId, 10),
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
  const canSubmit =
    shiftDate &&
    shiftLeaveTypeId &&
    jobRoleId &&
    departmentId &&
    numHoursParsed >= 0 &&
    numHoursParsed <= 24 &&
    (numHoursParsed > 0 || (startTime && !endTime)) &&
    (!allowUserSelect || !!selectedUserId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <DialogTitle>{shiftRecord ? "Edit Shift Record" : "Add Shift Record"}</DialogTitle>
          <DialogDescription>Record attendance, leave, or allocated shift. Hours are required.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto px-6 pb-4 space-y-4 flex-1 min-h-0">
          {allowUserSelect && (
            <>
              <div className="space-y-2">
                <Label>Department (filter)</Label>
                <Select
                  value={userDepartmentFilter || "__all__"}
                  onValueChange={(v) => setUserDepartmentFilter(v === "__all__" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All departments</SelectItem>
                    {departmentsSorted.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      className={cn("w-full justify-between font-normal", !selectedUserId && "text-muted-foreground")}
                    >
                      {selectedUser ? getUserDisplayName(selectedUser) : "Type to search users..."}
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
                          {debouncedUserSearch.trim() ? "No one found. Try another name or department." : "Type to search or pick a department first."}
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
                {(allowUserSelect ? ALL_CATEGORIES : CATEGORIES_ATTENDANCE_ONLY).map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getCategoryDescription(category) && (
              <p className="text-xs text-muted-foreground">{getCategoryDescription(category)}</p>
            )}
            {!allowUserSelect && (
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
              value={jobRoleId}
              onValueChange={setJobRoleId}
              required
              disabled={!targetUserId || assignmentsLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !targetUserId
                      ? "Select user first"
                      : assignmentsLoading
                        ? "Loading…"
                        : assignmentsWithRole.length === 0
                          ? "No job roles found"
                          : "Select job role"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {assignmentsWithRole.map((a) => {
                  const roleId = getAssignmentRoleId(a);
                  return (
                    <SelectItem key={a.id} value={String(roleId)}>
                      {a.role?.display_name || a.role?.name || a.job_role?.display_name || a.job_role?.name || `Role ${roleId}`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
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

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          </div>

          <DialogFooter className="shrink-0 px-6 pb-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {shiftRecord ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
