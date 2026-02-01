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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useCreateEmployeeSettings, useUpdateEmployeeSettings } from "@/hooks/useAttendance";
import { useUsers } from "@/hooks/useUsers";
import { useAssignments } from "@/hooks/useAssignments";
import { formatDateForAPI } from "@/utils/time";

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export const EmployeeSettingsForm = ({ open, onOpenChange, setting = null, preselectedUserId = null }) => {
  const [userId, setUserId] = useState("");
  const [jobRoleId, setJobRoleId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState("7.5");
  const [payRate, setPayRate] = useState("");
  const [workingDays, setWorkingDays] = useState(["monday", "tuesday", "wednesday", "thursday", "friday"]);
  const [isActive, setIsActive] = useState(true);

  const createSettings = useCreateEmployeeSettings();
  const updateSettings = useUpdateEmployeeSettings();

  const { data: usersData } = useUsers({ per_page: 100 });
  const users = usersData?.users ?? usersData?.data ?? [];
  const { data: assignmentsData } = useAssignments({
    user_id: userId ? parseInt(userId, 10) : undefined,
    is_active: true,
  });
  const assignments = assignmentsData?.assignments ?? assignmentsData ?? [];

  useEffect(() => {
    if (setting) {
      setUserId(String(setting.user_id));
      setJobRoleId(String(setting.job_role_id));
      setDepartmentId(String(setting.department_id));
      setStartDate(setting.start_date ? String(setting.start_date).slice(0, 10) : "");
      setEndDate(setting.end_date ? String(setting.end_date).slice(0, 10) : "");
      setHoursPerDay(String(setting.hours_per_day ?? 7.5));
      setPayRate(setting.pay_rate != null ? String(setting.pay_rate) : "");
      setWorkingDays(Array.isArray(setting.normal_working_days) ? [...setting.normal_working_days] : []);
      setIsActive(setting.is_active !== false);
    } else {
      setUserId(preselectedUserId ? String(preselectedUserId) : "");
      setJobRoleId("");
      setDepartmentId("");
      setStartDate("");
      setEndDate("");
      setHoursPerDay("7.5");
      setPayRate("");
      setWorkingDays(["monday", "tuesday", "wednesday", "thursday", "friday"]);
      setIsActive(true);
    }
  }, [setting, open, preselectedUserId]);

  // When creating new, clear job role and department when user changes
  useEffect(() => {
    if (!setting && userId) {
      setJobRoleId("");
      setDepartmentId("");
    }
  }, [userId, setting]);

  useEffect(() => {
    if (jobRoleId && assignments?.length) {
      const assignment = assignments.find((a) => String(a.role_id || a.job_role_id) === jobRoleId);
      if (assignment?.department_id) setDepartmentId(String(assignment.department_id));
    }
  }, [jobRoleId, assignments]);

  const toggleDay = (day) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numHours = parseFloat(hoursPerDay);
    if (!userId || !jobRoleId || !departmentId || !startDate || numHours <= 0 || numHours > 24 || workingDays.length === 0) return;

    try {
      if (setting) {
        await updateSettings.mutateAsync({
          settingsId: setting.id,
          settingsData: {
            end_date: endDate || null,
            hours_per_day: numHours,
            pay_rate: payRate ? parseFloat(payRate) : null,
            normal_working_days: workingDays,
            is_active: isActive,
          },
        });
      } else {
        await createSettings.mutateAsync({
          user_id: parseInt(userId, 10),
          job_role_id: parseInt(jobRoleId, 10),
          department_id: parseInt(departmentId, 10),
          start_date: startDate,
          end_date: endDate || null,
          hours_per_day: numHours,
          pay_rate: payRate ? parseFloat(payRate) : null,
          normal_working_days: workingDays,
          is_active: isActive,
        });
      }
      onOpenChange(false);
    } catch (err) {
      console.error("Save employee settings failed:", err);
    }
  };

  const canSubmit =
    userId &&
    jobRoleId &&
    departmentId &&
    startDate &&
    parseFloat(hoursPerDay) > 0 &&
    parseFloat(hoursPerDay) <= 24 &&
    workingDays.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{setting ? "Edit employee settings" : "Add employee job role settings"}</DialogTitle>
          <DialogDescription>
            Start date, hours per day and normal working days for this job role. Used for leave hour calculations.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={userId} onValueChange={setUserId} required disabled={!!setting}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.display_name || u.full_name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Job role</Label>
            <Select value={jobRoleId} onValueChange={setJobRoleId} required disabled={!!setting}>
              <SelectTrigger>
                <SelectValue placeholder="Select job role" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((a) => (
                  <SelectItem key={a.id || a.role_id} value={String(a.role_id || a.job_role_id)}>
                    {a.role?.display_name || a.role?.name || `Role ${a.role_id}`} — {a.department?.name || ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>End date (optional)</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Hours per day</Label>
            <Input
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Pay rate (optional, hourly)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={payRate}
              onChange={(e) => setPayRate(e.target.value)}
              placeholder="e.g. 12.50"
            />
          </div>
          <div className="space-y-2">
            <Label>Normal working days</Label>
            <div className="flex flex-wrap gap-4">
              {WEEKDAYS.map((day) => (
                <div key={day} className="flex items-center gap-2">
                  <Checkbox
                    id={`day-${day}`}
                    checked={workingDays.includes(day)}
                    onCheckedChange={() => toggleDay(day)}
                  />
                  <Label htmlFor={`day-${day}`} className="capitalize font-normal">
                    {day.slice(0, 3)}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          {setting && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="settings-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-input"
              />
              <Label htmlFor="settings-active">Active</Label>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || createSettings.isPending || updateSettings.isPending}>
              {(createSettings.isPending || updateSettings.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {setting ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
