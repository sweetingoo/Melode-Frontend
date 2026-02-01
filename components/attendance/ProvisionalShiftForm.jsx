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
import { useCreateProvisionalShift, useUpdateProvisionalShift } from "@/hooks/useShiftRecords";
import { useShiftLeaveTypes } from "@/hooks/useAttendance";
import { useAssignments } from "@/hooks/useAssignments";
import { useUsers } from "@/hooks/useUsers";

export const ProvisionalShiftForm = ({ open, onOpenChange, shiftRecord = null }) => {
  const [shiftDate, setShiftDate] = useState(null);
  const [shiftLeaveTypeId, setShiftLeaveTypeId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [jobRoleId, setJobRoleId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [hours, setHours] = useState("7.5");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createProvisionalShift = useCreateProvisionalShift();
  const updateProvisionalShift = useUpdateProvisionalShift();

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
      setHours(shiftRecord.hours?.toString() || "7.5");
      setStartTime(shiftRecord.start_time ? String(shiftRecord.start_time).slice(0, 5) : "09:00");
      setEndTime(shiftRecord.end_time ? String(shiftRecord.end_time).slice(0, 5) : "17:00");
      setNotes(shiftRecord.notes || "");
    } else {
      setShiftDate(null);
      setShiftLeaveTypeId("");
      setSelectedUserId("");
      setJobRoleId("");
      setDepartmentId("");
      setHours("7.5");
      setStartTime("09:00");
      setEndTime("17:00");
      setNotes("");
    }
  }, [shiftRecord, open]);

  useEffect(() => {
    if (jobRoleId && assignments?.length) {
      const assignment = assignments.find((a) => String(a.role_id || a.job_role_id) === jobRoleId);
      if (assignment?.department_id) setDepartmentId(String(assignment.department_id));
    }
  }, [jobRoleId, assignments]);

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{shiftRecord ? "Edit Allocated Shift" : "Add Allocated Shift"}</DialogTitle>
          <DialogDescription>
            Create or edit a provisional (planned) shift. These can be compared with actual attendance later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                    No provisional types configured
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
              <Input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                required
              />
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
