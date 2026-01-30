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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
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

export const LeaveRequestForm = ({ open, onOpenChange, leaveRequest = null, userId = null }) => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [shiftLeaveTypeId, setShiftLeaveTypeId] = useState("");
  const [jobRoleId, setJobRoleId] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNegativeBalanceConfirm, setShowNegativeBalanceConfirm] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null);

  const createLeaveRequest = useCreateLeaveRequest();
  const updateLeaveRequest = useUpdateLeaveRequest();

  // Use provided userId or current user's id
  const targetUserId = userId || user?.id;

  // Get user's job roles (only when dialog is open and we have a user so the button can enable after load)
  const { data: assignmentsData } = useAssignments(
    { user_id: targetUserId, is_active: true },
    { enabled: open && !!targetUserId }
  );
  const assignments = Array.isArray(assignmentsData)
    ? assignmentsData
    : (assignmentsData?.assignments || []);

  // Get shift/leave types (only authorised_leave category)
  const { data: shiftLeaveTypesData } = useShiftLeaveTypes(
    { category: "authorised_leave", is_active: true },
    { enabled: open }
  );
  const shiftLeaveTypes = shiftLeaveTypesData?.types || shiftLeaveTypesData || [];

  // Support API shapes: role_id, job_role_id, or nested role.id / job_role.id
  const getAssignmentRoleId = (a) =>
    a?.role_id ?? a?.job_role_id ?? a?.role?.id ?? a?.job_role?.id;
  const effectiveJobRoleId =
    jobRoleId ||
    (assignments?.length === 1 ? getAssignmentRoleId(assignments[0])?.toString() : null);

  // Holiday balance for negative-balance warning (when type deducts from allowance)
  const { data: balance } = useHolidayBalance(
    { user_id: targetUserId, job_role_id: effectiveJobRoleId },
    { enabled: !!targetUserId && !!effectiveJobRoleId }
  );
  const { data: attendanceSettings } = useAttendanceSettings();
  const allowNegative = attendanceSettings?.allow_negative_holiday_balance === true;
  const remainingHours = balance?.remaining_hours != null ? Number(balance.remaining_hours) : null;
  const selectedType = shiftLeaveTypes.find((t) => String(t.id) === shiftLeaveTypeId);
  const deductsFromAllowance = selectedType?.deducts_from_holiday_allowance === true;

  // Initialize form when leaveRequest is provided (edit mode)
  useEffect(() => {
    if (leaveRequest) {
      setStartDate(leaveRequest.start_date ? new Date(leaveRequest.start_date) : null);
      setEndDate(leaveRequest.end_date ? new Date(leaveRequest.end_date) : null);
      setShiftLeaveTypeId(leaveRequest.shift_leave_type_id?.toString() || "");
      setJobRoleId(leaveRequest.job_role_id?.toString() || "");
      setReason(leaveRequest.reason || "");
    } else {
      // Reset form for new request
      setStartDate(null);
      setEndDate(null);
      setShiftLeaveTypeId("");
      setJobRoleId("");
      setReason("");
    }
  }, [leaveRequest, open]);

  // Auto-select first job role if only one (API returns role_id; some code uses job_role_id)
  useEffect(() => {
    if (!jobRoleId && assignments?.length === 1) {
      const id = getAssignmentRoleId(assignments[0]);
      setJobRoleId(id != null ? String(id) : "");
    }
  }, [assignments, jobRoleId]);

  const doSubmit = async (requestData) => {
    setIsSubmitting(true);
    try {
      if (leaveRequest) {
        await updateLeaveRequest.mutateAsync({ slug: leaveRequest.slug, requestData });
      } else {
        await createLeaveRequest.mutateAsync(requestData);
      }
      onOpenChange(false);
      setShowNegativeBalanceConfirm(false);
      setPendingSubmit(null);
    } catch (error) {
      console.error("Failed to submit leave request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const roleId = jobRoleId || (assignments?.length === 1 ? getAssignmentRoleId(assignments[0]) : null);
    if (!startDate || !endDate || !shiftLeaveTypeId || !roleId) {
      return;
    }

    if (endDate < startDate) {
      return;
    }

    const requestData = {
      job_role_id: parseInt(roleId, 10),
      shift_leave_type_id: parseInt(shiftLeaveTypeId),
      start_date: formatDateForAPI(startDate),
      end_date: formatDateForAPI(endDate),
      reason: reason || null,
    };

    // Negative balance warning: if type deducts and balance is negative and policy may not allow, confirm
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

  const canSubmit = startDate && endDate && shiftLeaveTypeId && effectiveJobRoleId && endDate >= startDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{leaveRequest ? "Edit Leave Request" : "Request Leave"}</DialogTitle>
          <DialogDescription>
            {leaveRequest
              ? "Update your leave request details. You can only edit pending requests."
              : "Submit a new leave request. It will be reviewed by your manager."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Job Role Selection */}
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

          {/* Leave Type Selection */}
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

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => date < (startDate || new Date(new Date().setHours(0, 0, 0, 0)))}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {startDate && endDate && endDate < startDate && (
            <p className="text-sm text-destructive">End date must be on or after start date</p>
          )}

          {/* Holiday balance when type deducts from allowance */}
          {deductsFromAllowance && remainingHours != null && (
            <div className="rounded-md border p-3 text-sm">
              <span className="text-muted-foreground">Remaining holiday balance: </span>
              <span className={remainingHours < 0 ? "font-medium text-destructive" : "font-medium"}>
                {remainingHours.toFixed(1)} hours
              </span>
              {remainingHours < 0 && (
                <p className="mt-1 text-destructive">Your holiday balance is negative. This request may still be submitted for approval.</p>
              )}
            </div>
          )}

          {/* Reason */}
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {leaveRequest ? "Update Request" : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
