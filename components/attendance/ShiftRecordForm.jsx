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
import Link from "next/link";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { formatDateForAPI } from "@/utils/time";
import { useCreateShiftRecord, useUpdateShiftRecord } from "@/hooks/useShiftRecords";
import { useShiftLeaveTypes } from "@/hooks/useAttendance";
import { useAssignments } from "@/hooks/useAssignments";
import { useUsers } from "@/hooks/useUsers";
import { useAuth } from "@/hooks/useAuth";

const ALL_CATEGORIES = [
  { value: "attendance", label: "Attendance" },
  { value: "authorised_leave", label: "Authorised Leave" },
  { value: "unauthorised_leave", label: "Unauthorised Leave" },
  { value: "provisional", label: "Provisional" },
  { value: "mapped", label: "Mapped" },
];

/** When allowUserSelect is false, user can only add/edit attendance (not leave) - leave must go through request workflow */
const CATEGORIES_ATTENDANCE_ONLY = ALL_CATEGORIES.filter((c) => c.value === "attendance");

export const ShiftRecordForm = ({ open, onOpenChange, shiftRecord = null, userId = null, allowUserSelect = false }) => {
  const { user } = useAuth();
  const [shiftDate, setShiftDate] = useState(null);
  const [category, setCategory] = useState("attendance");
  const [shiftLeaveTypeId, setShiftLeaveTypeId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
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

  const { data: usersData } = useUsers(allowUserSelect ? { per_page: 100 } : { limit: 0 });
  const users = usersData?.users || usersData?.data || [];

  const { data: assignmentsData, isLoading: assignmentsLoading } = useAssignments(
    {
      user_id: targetUserId ? parseInt(targetUserId, 10) : undefined,
      is_active: true,
    },
    { enabled: open && !!targetUserId }
  );
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
      setJobRoleId("");
      setDepartmentId("");
      setHours("7.5");
      setStartTime("09:00");
      setEndTime("17:00");
      setNotes("");
    }
  }, [shiftRecord, open, userId, user?.id]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shiftDate || !shiftLeaveTypeId || !jobRoleId || !departmentId || !hours) return;
    const numHours = parseFloat(hours);
    if (numHours <= 0 || numHours > 24) return;

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

  const canSubmit = shiftDate && shiftLeaveTypeId && jobRoleId && departmentId && hours && parseFloat(hours) > 0 && parseFloat(hours) <= 24;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{shiftRecord ? "Edit Shift Record" : "Add Shift Record"}</DialogTitle>
          <DialogDescription>Record attendance, leave, or provisional shift. Hours are required.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {allowUserSelect && (
            <div className="space-y-2">
              <Label>User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId} required>
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
            {!allowUserSelect && (
              <p className="text-xs text-muted-foreground">Leave must be requested via the leave request workflow.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Shift / Leave Type</Label>
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
              <Input type="number" step="0.25" min="0.25" max="24" value={hours} onChange={(e) => setHours(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start time (optional)</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End time (optional)</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <DialogFooter>
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
