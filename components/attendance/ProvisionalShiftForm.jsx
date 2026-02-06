"use client";

import React, { useState, useEffect } from "react";
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
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatDateForAPI } from "@/utils/time";
import { useCreateProvisionalShift, useCreateProvisionalShiftsRecurring, useUpdateProvisionalShift } from "@/hooks/useShiftRecords";

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

/** Compute hours between start and end time (full span, no deduction). Overnight = end + 24h - start. */
function hoursBetween(startTime, endTime) {
  const startM = parseTimeToMinutes(startTime);
  const endM = parseTimeToMinutes(endTime);
  if (startM == null || endM == null) return null;
  let diffM = endM - startM;
  if (diffM < 0) diffM += 24 * 60; // overnight
  return Math.round((diffM / 60) * 100) / 100;
}
import { useShiftLeaveTypes } from "@/hooks/useAttendance";
import { useAssignments } from "@/hooks/useAssignments";
import { useUsers } from "@/hooks/useUsers";

export const ProvisionalShiftForm = ({ open, onOpenChange, shiftRecord = null, initialValues = null }) => {
  const [shiftDate, setShiftDate] = useState(null);
  const [shiftLeaveTypeId, setShiftLeaveTypeId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [jobRoleId, setJobRoleId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [hours, setHours] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [notes, setNotes] = useState("");
  const [recurInterval, setRecurInterval] = useState("none"); // "none" | "1" | "2" | "4"
  const [weeksAhead, setWeeksAhead] = useState(12); // how many weeks in the future to create (1–52)
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createProvisionalShift = useCreateProvisionalShift();
  const createProvisionalShiftsRecurring = useCreateProvisionalShiftsRecurring();
  const updateProvisionalShift = useUpdateProvisionalShift();

  const RECUR_OPTIONS = [
    { value: "none", label: "None" },
    { value: "1", label: "Every 1 Week" },
    { value: "2", label: "Every 2 Weeks" },
    { value: "4", label: "Every 4 Weeks" },
  ];
  const WEEKS_AHEAD_MIN = 1;
  const WEEKS_AHEAD_MAX = 52;

  const { data: usersData } = useUsers({ per_page: 100 });
  const users = usersData?.users || usersData?.data || [];

  const { data: assignmentsData } = useAssignments({
    user_id: selectedUserId ? parseInt(selectedUserId, 10) : undefined,
    is_active: true,
  });
  const assignments = assignmentsData?.assignments || assignmentsData || [];

  const { data: shiftLeaveTypesData } = useShiftLeaveTypes({ category: "provisional", is_active: true });
  const shiftLeaveTypes = shiftLeaveTypesData?.types || shiftLeaveTypesData || [];

  useEffect(() => {
    if (shiftRecord) {
      setShiftDate(shiftRecord.shift_date ? new Date(shiftRecord.shift_date) : null);
      setShiftLeaveTypeId(shiftRecord.shift_leave_type_id?.toString() || "");
      setSelectedUserId(shiftRecord.user_id?.toString() || "");
      setJobRoleId(shiftRecord.job_role_id?.toString() || "");
      setDepartmentId(shiftRecord.department_id?.toString() || "");
      setStartTime(shiftRecord.start_time ? String(shiftRecord.start_time).slice(0, 5) : "09:00");
      setEndTime(shiftRecord.end_time ? String(shiftRecord.end_time).slice(0, 5) : "17:00");
      setHours(shiftRecord.hours?.toString() || "");
      setNotes(shiftRecord.notes || "");
    } else if (open && initialValues) {
      setShiftDate(initialValues.shiftDate ? new Date(initialValues.shiftDate + "T12:00:00") : null);
      setJobRoleId(initialValues.jobRoleId || "");
      setDepartmentId(initialValues.departmentId || "");
      setShiftLeaveTypeId("");
      setSelectedUserId("");
      setHours("");
      setStartTime("09:00");
      setEndTime("17:00");
      setNotes("");
      setRecurInterval("none");
      setWeeksAhead(12);
    } else {
      setShiftDate(null);
      setShiftLeaveTypeId("");
      setSelectedUserId("");
      setJobRoleId("");
      setDepartmentId("");
      setHours("");
      setStartTime("09:00");
      setEndTime("17:00");
      setNotes("");
      setRecurInterval("none");
      setWeeksAhead(12);
    }
  }, [shiftRecord, open, initialValues]);

  useEffect(() => {
    if (jobRoleId && assignments?.length) {
      const assignment = assignments.find((a) => String(a.role_id || a.job_role_id) === jobRoleId);
      if (assignment?.department_id) setDepartmentId(String(assignment.department_id));
    }
  }, [jobRoleId, assignments]);

  // Auto-calculate hours from start and end time (full span, no deduction)
  useEffect(() => {
    const computed = hoursBetween(startTime, endTime);
    if (computed != null) setHours(String(computed));
  }, [startTime, endTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shiftDate || !shiftLeaveTypeId || !selectedUserId || !jobRoleId || !departmentId || !hours) return;
    const numHours = parseFloat(hours);
    if (numHours <= 0 || numHours > 24) return;

    setIsSubmitting(true);
    try {
      const payload = {
        user_id: parseInt(selectedUserId, 10),
        job_role_id: parseInt(jobRoleId, 10),
        shift_leave_type_id: parseInt(shiftLeaveTypeId, 10),
        category: "provisional",
        shift_date: formatDateForAPI(shiftDate),
        start_time: startTime || null,
        end_time: endTime || null,
        hours: numHours,
        department_id: parseInt(departmentId, 10),
        notes: notes || null,
      };

      if (shiftRecord) {
        await updateProvisionalShift.mutateAsync({
          slug: shiftRecord.slug,
          shiftData: {
            shift_date: formatDateForAPI(shiftDate),
            start_time: startTime || null,
            end_time: endTime || null,
            hours: numHours,
            notes: notes || null,
          },
        });
      } else if (recurInterval && recurInterval !== "none") {
        const numWeeks = Math.min(WEEKS_AHEAD_MAX, Math.max(WEEKS_AHEAD_MIN, Number(weeksAhead) || 12));
        await createProvisionalShiftsRecurring.mutateAsync({
          ...payload,
          recur_interval_weeks: parseInt(recurInterval, 10),
          weeks_ahead: numWeeks,
        });
      } else {
        await createProvisionalShift.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Allocated shift save failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    shiftDate &&
    shiftLeaveTypeId &&
    selectedUserId &&
    jobRoleId &&
    departmentId &&
    hours &&
    parseFloat(hours) > 0 &&
    parseFloat(hours) <= 24;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <DialogTitle>{shiftRecord ? "Edit Allocated Shift" : "Add Allocated Shift"}</DialogTitle>
          <DialogDescription>
            Create or edit an allocated (planned) shift. These can be compared with actual attendance later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="overflow-y-auto flex-1 min-h-0 px-6 pb-4 space-y-4">
          <div className="space-y-2">
            <Label>User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId} required disabled={!!shiftRecord}>
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.display_name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Shift / Leave Type (Allocated)</Label>
            <Select value={shiftLeaveTypeId} onValueChange={setShiftLeaveTypeId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {shiftLeaveTypes.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
                {shiftLeaveTypes.length === 0 && (
                  <SelectItem value="_none" disabled>
                    No allocated types configured
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Job Role</Label>
            <Select value={jobRoleId} onValueChange={setJobRoleId} required disabled={!selectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select job role" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((a) => (
                  <SelectItem key={a.id || a.role_id} value={String(a.role_id || a.job_role_id)}>
                    {a.role?.display_name || a.role?.name || `Role ${a.role_id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End time</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Hours</Label>
            <Input
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="From start/end time"
              required
            />
            <p className="text-xs text-muted-foreground">Auto-calculated from start and end time (full span). You can override if needed.</p>
          </div>

          {!shiftRecord && (
            <>
              <div className="space-y-2">
                <Label>Recur this Shift</Label>
                <Select value={recurInterval} onValueChange={setRecurInterval}>
                  <SelectTrigger>
                    <SelectValue placeholder="None — single shift only" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECUR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {recurInterval && recurInterval !== "none" && (
                <div className="space-y-2">
                  <Label htmlFor="weeks-ahead">Create for how many weeks ahead?</Label>
                  <Input
                    id="weeks-ahead"
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
                    Shifts will be created from the start date up to this many weeks in the future (1–52). You can remove individual occurrences later from the Rota or Allocated tab.
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

          <DialogFooter className="shrink-0 border-t bg-muted/30 px-6 py-4">
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
