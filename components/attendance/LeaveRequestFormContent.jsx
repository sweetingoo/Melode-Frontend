"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, ChevronDown, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { formatDateForAPI } from "@/utils/time";
import { useCreateLeaveRequest, useUpdateLeaveRequest } from "@/hooks/useLeaveRequests";
import { useShiftLeaveTypes, useHolidayBalance, useAttendanceSettings } from "@/hooks/useAttendance";
import { useAssignments } from "@/hooks/useAssignments";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const FULL_DAY_HOURS = 8;
const PART_DAY_HOURS = 4;

function datesInRange(from, to) {
  if (!from || !to || to < from) return [];
  const out = [];
  let d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  while (d <= end) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

const PART_DAY_OPTIONS = [
  { value: "full", label: "Full Day" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
];

/**
 * Leave request form content (no dialog). Use in a page or inside a dialog.
 * @param {Object} props
 * @param {boolean} [props.isReady] - When true, load assignments/leave types (e.g. open for dialog, true for page). Default true.
 * @param {Object|null} props.leaveRequest - Existing request for edit mode
 * @param {number|null} props.userId - User to request for (default current user)
 * @param {function} props.onSuccess - Called after successful create/update
 * @param {function} [props.onCancel] - Called when user cancels (e.g. back button)
 * @param {boolean} [props.inlineCalendar] - When true, show calendar directly on page instead of in a popover. Default false.
 */
export const LeaveRequestFormContent = ({
  isReady = true,
  leaveRequest = null,
  userId = null,
  onSuccess,
  onCancel,
  inlineCalendar = false,
}) => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState(undefined);
  const [dayEntries, setDayEntries] = useState([]);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [shiftLeaveTypeId, setShiftLeaveTypeId] = useState("");
  const [jobRoleId, setJobRoleId] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNegativeBalanceConfirm, setShowNegativeBalanceConfirm] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);
  const calendarPopoverRef = useRef(null);
  const [calendarClampOffset, setCalendarClampOffset] = useState(0);

  const today = useMemo(() => new Date(new Date().setHours(0, 0, 0, 0)), []);
  const isPastDate = (date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return d < today;
  };
  const applyDatePreset = (preset) => {
    const start = new Date(today);
    const end = new Date(today);
    switch (preset) {
      case "today":
        setDateRange({ from: start, to: end });
        break;
      case "yesterday":
        start.setDate(start.getDate() - 1);
        end.setDate(end.getDate() - 1);
        setDateRange({ from: start, to: end });
        break;
      case "next7":
        end.setDate(end.getDate() + 6);
        setDateRange({ from: start, to: end });
        break;
      case "next14":
        end.setDate(end.getDate() + 13);
        setDateRange({ from: start, to: end });
        break;
      case "last7":
        start.setDate(start.getDate() - 6);
        setDateRange({ from: start, to: end });
        break;
      case "last30":
        start.setDate(start.getDate() - 29);
        setDateRange({ from: start, to: end });
        break;
      case "thisMonth":
        start.setDate(1);
        setDateRange({ from: start, to: end });
        break;
      case "lastMonth":
        start.setMonth(start.getMonth() - 1);
        start.setDate(1);
        end.setDate(0);
        setDateRange({ from: start, to: end });
        break;
      default:
        break;
    }
    setIsCalendarOpen(false);
  };

  const createLeaveRequest = useCreateLeaveRequest();
  const updateLeaveRequest = useUpdateLeaveRequest();
  const targetUserId = userId || user?.id;

  const { data: assignmentsData } = useAssignments(
    { user_id: targetUserId, is_active: true },
    { enabled: isReady && !!targetUserId }
  );
  const assignments = Array.isArray(assignmentsData)
    ? assignmentsData
    : (assignmentsData?.assignments || []);

  const { data: shiftLeaveTypesData } = useShiftLeaveTypes(
    { category: "authorised_leave", is_active: true },
    { enabled: isReady }
  );
  const shiftLeaveTypes = shiftLeaveTypesData?.types || shiftLeaveTypesData || [];

  const getAssignmentRoleId = (a) =>
    a?.role_id ?? a?.job_role_id ?? a?.role?.id ?? a?.job_role?.id;
  const effectiveJobRoleId =
    jobRoleId ||
    (assignments?.length === 1 ? getAssignmentRoleId(assignments[0])?.toString() : null);

  const { data: balance } = useHolidayBalance(
    { user_id: targetUserId, job_role_id: effectiveJobRoleId },
    { enabled: !!targetUserId && !!effectiveJobRoleId }
  );
  const { data: attendanceSettings } = useAttendanceSettings();
  const allowNegative = attendanceSettings?.allow_negative_holiday_balance === true;
  const remainingHours = balance?.remaining_hours != null ? Number(balance.remaining_hours) : null;
  const selectedType = shiftLeaveTypes.find((t) => String(t.id) === shiftLeaveTypeId);
  const deductsFromAllowance = selectedType?.deducts_from_holiday_allowance === true;

  useEffect(() => {
    if (leaveRequest) {
      const from = leaveRequest.start_date ? (typeof leaveRequest.start_date === "string" ? parseISO(leaveRequest.start_date) : new Date(leaveRequest.start_date)) : null;
      const to = leaveRequest.end_date ? (typeof leaveRequest.end_date === "string" ? parseISO(leaveRequest.end_date) : new Date(leaveRequest.end_date)) : null;
      setDateRange(from && to ? { from, to } : undefined);
      setShiftLeaveTypeId(leaveRequest.shift_leave_type_id?.toString() || "");
      setJobRoleId(leaveRequest.job_role_id?.toString() || "");
      setReason(leaveRequest.reason || "");

      if (from && to) {
        const breakdownMap = {};
        if (Array.isArray(leaveRequest.days_breakdown) && leaveRequest.days_breakdown.length > 0) {
          leaveRequest.days_breakdown.forEach((e) => {
            const ds = typeof e.date === "string" ? e.date : e.date?.iso?.() ?? null;
            if (ds) breakdownMap[ds] = e.part_day || "full";
          });
        }
        const dates = datesInRange(from, to);
        const hasBreakdown = Object.keys(breakdownMap).length > 0;
        setDayEntries(
          dates.map((date) => {
            const dateStr = formatDateForAPI(date);
            return {
              date,
              included: hasBreakdown ? dateStr in breakdownMap : true,
              part_day: breakdownMap[dateStr] || "full",
            };
          })
        );
      } else {
        setDayEntries([]);
      }
    } else {
      setDateRange(undefined);
      setDayEntries([]);
      setShiftLeaveTypeId("");
      setJobRoleId("");
      setReason("");
    }
  }, [leaveRequest, isReady]);

  useEffect(() => {
    if (!isReady) return;
    if (leaveRequest) return;
    const from = dateRange?.from;
    const to = dateRange?.to ?? from;
    if (from && to && to >= from) {
      const dates = datesInRange(from, to);
      setDayEntries(dates.map((date) => ({ date, included: true, part_day: "full" })));
    } else {
      setDayEntries([]);
    }
  }, [dateRange?.from, dateRange?.to, leaveRequest, isReady]);

  useEffect(() => {
    if (!jobRoleId && assignments?.length === 1) {
      const id = getAssignmentRoleId(assignments[0]);
      setJobRoleId(id != null ? String(id) : "");
    }
  }, [assignments, jobRoleId]);

  useEffect(() => {
    if (!isCalendarOpen) {
      setCalendarClampOffset(0);
      return;
    }
    const el = calendarPopoverRef.current;
    if (!el) return;
    const padding = 16;
    const check = () => {
      requestAnimationFrame(() => {
        if (!calendarPopoverRef.current) return;
        const rect = calendarPopoverRef.current.getBoundingClientRect();
        if (rect.top < padding) {
          setCalendarClampOffset(padding - rect.top);
        } else {
          setCalendarClampOffset(0);
        }
      });
    };
    check();
    const t = setTimeout(check, 150);
    return () => clearTimeout(t);
  }, [isCalendarOpen]);

  const doSubmit = async (requestData) => {
    setIsSubmitting(true);
    try {
      if (leaveRequest) {
        await updateLeaveRequest.mutateAsync({ slug: leaveRequest.slug, requestData });
      } else {
        await createLeaveRequest.mutateAsync(requestData);
      }
      setShowNegativeBalanceConfirm(false);
      setPendingSubmit(null);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to submit leave request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const roleId = jobRoleId || (assignments?.length === 1 ? getAssignmentRoleId(assignments[0]) : null);
    if (!shiftLeaveTypeId || !roleId) return;

    if (leaveRequest) {
      const startDate = dateRange?.from;
      const endDate = dateRange?.to ?? dateRange?.from;
      if (!startDate || !endDate || endDate < startDate) return;
      const requestData = {
        job_role_id: parseInt(roleId, 10),
        shift_leave_type_id: parseInt(shiftLeaveTypeId),
        start_date: formatDateForAPI(startDate),
        end_date: formatDateForAPI(endDate),
        reason: reason || null,
      };
      if (deductsFromAllowance && remainingHours != null && remainingHours < 0 && !allowNegative) {
        setPendingSubmit(requestData);
        setShowNegativeBalanceConfirm(true);
        return;
      }
      await doSubmit(requestData);
      return;
    }

    const included = dayEntries.filter((d) => d.included);
    if (included.length === 0) return;

    const requestData = {
      job_role_id: parseInt(roleId, 10),
      shift_leave_type_id: parseInt(shiftLeaveTypeId),
      reason: reason || null,
      days: included.map((d) => ({ date: formatDateForAPI(d.date), part_day: d.part_day })),
    };

    if (deductsFromAllowance && remainingHours != null && remainingHours < 0 && !allowNegative) {
      setPendingSubmit(requestData);
      setShowNegativeBalanceConfirm(true);
      return;
    }

    await doSubmit(requestData);
  };

  const handleNegativeBalanceConfirm = async () => {
    if (pendingSubmit) await doSubmit(pendingSubmit);
  };

  const startDate = dateRange?.from;
  const endDate = dateRange?.to ?? dateRange?.from;
  const hasIncludedDay = dayEntries.some((d) => d.included);
  const totalHoursFromBreakdown = useMemo(() => {
    return dayEntries
      .filter((d) => d.included)
      .reduce((sum, d) => sum + (d.part_day === "full" ? FULL_DAY_HOURS : PART_DAY_HOURS), 0);
  }, [dayEntries]);
  const canSubmit =
    shiftLeaveTypeId &&
    effectiveJobRoleId &&
    (leaveRequest
      ? dateRange?.from && endDate && endDate >= startDate
      : dayEntries.length > 0 && hasIncludedDay);

  return (
    <>
      <form onSubmit={handleSubmit} className="min-w-0 space-y-6">
        {assignments?.length === 0 && (
          <p className="text-sm text-amber-600">
            You need at least one job role assignment to request leave. Contact your manager if you don&apos;t see one.
          </p>
        )}
        {assignments?.length === 1 && (
          <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            Job role: {assignments[0]?.role?.display_name || assignments[0]?.role?.name || assignments[0]?.job_role?.display_name || assignments[0]?.job_role?.name || "—"}
          </div>
        )}
        {assignments && assignments.length > 1 && (
          <div className="space-y-2">
            <Label htmlFor="job-role">Job Role *</Label>
            <Select value={jobRoleId} onValueChange={setJobRoleId} required>
              <SelectTrigger id="job-role">
                <SelectValue placeholder="Select job role" />
              </SelectTrigger>
              <SelectContent>
                {assignments
                  .filter((a) => getAssignmentRoleId(a) != null)
                  .map((assignment) => {
                    const roleId = getAssignmentRoleId(assignment);
                    return (
                      <SelectItem key={assignment.id} value={String(roleId)}>
                        {assignment.role?.display_name || assignment.role?.name || assignment.job_role?.display_name || assignment.job_role?.name || "Unknown Role"}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="leave-type">Leave Type *</Label>
          <Select value={shiftLeaveTypeId} onValueChange={setShiftLeaveTypeId} required>
            <SelectTrigger id="leave-type">
              <SelectValue placeholder="Select leave type" />
            </SelectTrigger>
            <SelectContent>
              {shiftLeaveTypes.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  <div className="flex items-center gap-2">
                    {type.display_color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.display_color }}
                      />
                    )}
                    <span>{type.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Date range *</Label>
          {inlineCalendar ? (
            <div className="min-w-0 rounded-lg border bg-card p-4">
              <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button type="button" variant="outline" size="sm" onClick={() => applyDatePreset("today")} className="text-xs h-8">Today</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyDatePreset("yesterday")} className="text-xs h-8">Yesterday</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyDatePreset("next7")} className="text-xs h-8">Next 7 days</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyDatePreset("next14")} className="text-xs h-8">Next 14 days</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyDatePreset("last7")} className="text-xs h-8">Last 7 days</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyDatePreset("last30")} className="text-xs h-8">Last 30 days</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyDatePreset("thisMonth")} className="text-xs h-8">This month</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyDatePreset("lastMonth")} className="text-xs h-8">Last month</Button>
              </div>
              <div className="min-w-0 flex justify-center overflow-hidden">
                <CalendarComponent
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={(date) => !leaveRequest && isPastDate(date)}
                  className="max-w-full rounded-md border"
                  classNames={{
                    months: "flex flex-col sm:flex-row gap-4 justify-center",
                    nav: "hidden",
                    nav_button_previous: "hidden",
                    nav_button_next: "hidden",
                  }}
                />
              </div>
              {dateRange?.from && (
                <p className="mt-3 text-center text-sm text-muted-foreground">
                  {dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime() ? (
                    <>{format(dateRange.from, "dd MMM yyyy")} – {format(dateRange.to, "dd MMM yyyy")}</>
                  ) : (
                    format(dateRange.from, "dd MMM yyyy")
                  )}
                </p>
              )}
            </div>
          ) : (
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen} modal={false}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                  onClick={() => setIsCalendarOpen(true)}
                  aria-expanded={isCalendarOpen}
                  aria-haspopup="dialog"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {dateRange?.from ? (
                    dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime() ? (
                      <>
                        {format(dateRange.from, "dd MMM yyyy")} – {format(dateRange.to, "dd MMM yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd MMM yyyy")
                    )
                  ) : (
                    <span>Pick date range</span>
                  )}
                  <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                ref={calendarPopoverRef}
                className="z-[100] w-auto max-w-[min(580px,calc(100vw-2rem))] p-0"
                align="start"
                side="bottom"
                avoidCollisions={true}
                collisionPadding={{ top: 24, right: 16, bottom: 16, left: 16 }}
              >
                <div
                  className="max-h-[min(80vh,calc(100vh-2rem))] min-h-0 flex flex-col overflow-hidden"
                  style={{ marginTop: calendarClampOffset }}
                >
                  <div className="p-2 border-b shrink-0 flex items-center justify-between gap-2">
                    <div className="grid grid-cols-2 gap-1.5 flex-1 min-w-0">
                      <Button type="button" variant="outline" size="sm" onClick={() => applyDatePreset("today")} className="text-xs h-7">Today</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyDatePreset("yesterday")} className="text-xs h-7">Yesterday</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyDatePreset("next7")} className="text-xs h-7">Next 7 days</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyDatePreset("next14")} className="text-xs h-7">Next 14 days</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyDatePreset("last7")} className="text-xs h-7">Last 7 days</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyDatePreset("last30")} className="text-xs h-7">Last 30 days</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyDatePreset("thisMonth")} className="text-xs h-7">This month</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => applyDatePreset("lastMonth")} className="text-xs h-7">Last month</Button>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setIsCalendarOpen(false)} aria-label="Close calendar">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-2">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      disabled={(date) => !leaveRequest && isPastDate(date)}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {dateRange?.from && endDate && endDate < dateRange.from && (
          <p className="text-sm text-destructive">End date must be on or after start date</p>
        )}

        {dayEntries.length > 0 && (
          <div className="space-y-2">
            <Label>Days in range</Label>
            <p className="text-xs text-muted-foreground">
              Uncheck days to exclude (e.g. weekends). Full day = {FULL_DAY_HOURS}h, morning/afternoon = {PART_DAY_HOURS}h each.
            </p>
            {hasIncludedDay && (
              <p className="text-sm font-medium">
                Total hours to be used: <span className="text-primary">{totalHoursFromBreakdown} hours</span>
              </p>
            )}
            <div className="max-h-[220px] overflow-y-auto rounded-md border p-2 space-y-1.5">
              {dayEntries.map((entry) => (
                <div key={formatDateForAPI(entry.date)} className="flex items-center gap-2">
                  <Checkbox
                    id={`day-${formatDateForAPI(entry.date)}`}
                    checked={entry.included}
                    onCheckedChange={(checked) => {
                      setDayEntries((prev) =>
                        prev.map((p) =>
                          formatDateForAPI(p.date) === formatDateForAPI(entry.date)
                            ? { ...p, included: !!checked }
                            : p
                        )
                      );
                    }}
                  />
                  <label
                    htmlFor={`day-${formatDateForAPI(entry.date)}`}
                    className={cn("flex-1 text-sm cursor-pointer", !entry.included && "text-muted-foreground")}
                  >
                    {format(entry.date, "EEE, d MMM yyyy")}
                  </label>
                  <Select
                    value={entry.part_day}
                    onValueChange={(value) => {
                      setDayEntries((prev) =>
                        prev.map((p) =>
                          formatDateForAPI(p.date) === formatDateForAPI(entry.date)
                            ? { ...p, part_day: value }
                            : p
                        )
                      );
                    }}
                    disabled={!entry.included}
                  >
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PART_DAY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {!hasIncludedDay && (
              <p className="text-sm text-destructive">Select at least one day to include.</p>
            )}
          </div>
        )}

        {deductsFromAllowance && remainingHours != null && (
          <div className="rounded-md border p-3 text-sm">
            <span className="text-muted-foreground">Remaining holiday balance: </span>
            <span
              className={
                remainingHours < 0 || (hasIncludedDay && totalHoursFromBreakdown > remainingHours)
                  ? "font-medium text-destructive"
                  : "font-medium"
              }
            >
              {remainingHours.toFixed(1)} hours
            </span>
            {remainingHours < 0 && (
              <p className="mt-1 text-destructive">Your holiday balance is negative. This request may still be submitted for approval.</p>
            )}
            {hasIncludedDay && totalHoursFromBreakdown > remainingHours && remainingHours >= 0 && (
              <p className="mt-1 text-destructive">This request uses more hours than your remaining balance.</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="reason">Reason (Optional)</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide a reason for your leave request..."
            rows={3}
          />
        </div>

        <AlertDialog open={showNegativeBalanceConfirm} onOpenChange={setShowNegativeBalanceConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Negative holiday balance</AlertDialogTitle>
              <AlertDialogDescription>
                Your remaining holiday balance is negative ({remainingHours?.toFixed(1)} hours). Submitting this request may not be allowed by your organisation&apos;s policy. Do you want to submit anyway?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPendingSubmit(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleNegativeBalanceConfirm} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-2 pt-2">
          {typeof onCancel === "function" && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={!canSubmit || isSubmitting} className="sm:min-w-[140px]">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {leaveRequest ? "Update Request" : "Submit Request"}
          </Button>
        </div>
      </form>
    </>
  );
};
