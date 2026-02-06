"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Check, ChevronDown, ChevronUp, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { usePendingLeaveRequests, usePendingLeaveRequestDepartments, useApproveLeaveRequest, useLeaveRequest } from "@/hooks/useLeaveRequests";
import { useHolidayBalance } from "@/hooks/useAttendance";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "submitted_at", label: "Date submitted" },
  { value: "start_date", label: "Start date" },
  { value: "end_date", label: "End date" },
  { value: "created_at", label: "Created" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
];

export const LeaveApprovalList = ({ statusFilter = "pending", compactHeader = false }) => {
  const [statusFilterState, setStatusFilterState] = useState(statusFilter);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [sortBy, setSortBy] = useState("submitted_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalAction, setApprovalAction] = useState(null);
  const [notes, setNotes] = useState("");

  const listParams = useMemo(
    () => ({
      status: statusFilterState || "pending",
      department_id:
        departmentFilter && departmentFilter !== "" && departmentFilter !== "all"
          ? Number(departmentFilter)
          : undefined,
      sort_by: sortBy || "submitted_at",
      sort_order: sortOrder || "desc",
      page: 1,
      per_page: 100,
    }),
    [statusFilterState, departmentFilter, sortBy, sortOrder]
  );

  const { data, isLoading } = usePendingLeaveRequests(listParams);
  const { data: departmentsData } = usePendingLeaveRequestDepartments();
  const approveLeaveRequestMutation = useApproveLeaveRequest();
  const leaveRequests = Array.isArray(data?.requests) ? data.requests : Array.isArray(data) ? data : [];

  const departmentOptions = useMemo(() => {
    const list = Array.isArray(departmentsData) ? departmentsData : [];
    const options = list.map((d) => ({ id: Number(d.id), name: d.name || `Department ${d.id}` }));
    const selectedId =
      departmentFilter && departmentFilter !== "" && departmentFilter !== "all"
        ? Number(departmentFilter)
        : null;
    if (selectedId != null && !options.some((o) => o.id === selectedId)) {
      options.push({ id: selectedId, name: `Department ${selectedId}` });
    }
    return options.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }, [departmentsData, departmentFilter]);

  const selectedSlug = selectedRequest?.slug;
  const { data: fullRequest } = useLeaveRequest(selectedSlug, { enabled: !!selectedSlug });
  const requestForPopup = fullRequest || selectedRequest;
  const { data: balance } = useHolidayBalance(
    requestForPopup?.user_id && requestForPopup?.job_role_id
      ? { user_id: requestForPopup.user_id, job_role_id: requestForPopup.job_role_id }
      : {},
    { enabled: !!requestForPopup?.user_id && !!requestForPopup?.job_role_id }
  );
  const remainingHours = balance?.remaining_hours != null ? Number(balance.remaining_hours) : null;

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const openReview = (request, action) => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setNotes("");
  };

  const closeReview = () => {
    setSelectedRequest(null);
    setApprovalAction(null);
    setNotes("");
  };

  const handleApproveOrDecline = async () => {
    if (!selectedSlug) return;
    if (approvalAction === "decline" && !notes.trim()) return;

    try {
      await approveLeaveRequestMutation.mutateAsync({
        slug: selectedSlug,
        approvalData: {
          approved: approvalAction === "approve",
          notes: notes.trim() || null,
        },
      });
      closeReview();
    } catch (error) {
      console.error("Failed to process leave request:", error);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      approved: "bg-green-500/10 text-green-700 dark:text-green-400",
      declined: "bg-red-500/10 text-red-700 dark:text-red-400",
      cancelled: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
    };
    return (
      <Badge variant="secondary" className={colors[status] || ""}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : ""}
      </Badge>
    );
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <ChevronDown className="ml-1 h-4 w-4 opacity-50" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4" />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!compactHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Leave Requests Pending Approval</h2>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter" className="text-sm text-muted-foreground whitespace-nowrap">
            Status
          </Label>
          <Select value={statusFilterState} onValueChange={setStatusFilterState}>
            <SelectTrigger id="status-filter" className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="department-filter" className="text-sm text-muted-foreground whitespace-nowrap">
            Department
          </Label>
          <Select value={departmentFilter || "all"} onValueChange={(v) => setDepartmentFilter(v === "all" ? "" : v)}>
            <SelectTrigger id="department-filter" className="w-[180px]">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departmentOptions.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name || `Department ${d.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="sort-by" className="text-sm text-muted-foreground whitespace-nowrap">
            Sort by
          </Label>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger id="sort-by" className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))} title={sortOrder === "asc" ? "Ascending" : "Descending"}>
            {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {leaveRequests.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">No leave requests match the filters</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="h-8 -ml-2 font-semibold" onClick={() => handleSort("submitted_at")}>
                    Date submitted
                    <SortIcon column="submitted_at" />
                  </Button>
                </TableHead>
                <TableHead>Department</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="h-8 -ml-2 font-semibold" onClick={() => handleSort("start_date")}>
                    Start date
                    <SortIcon column="start_date" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="h-8 -ml-2 font-semibold" onClick={() => handleSort("end_date")}>
                    End date
                    <SortIcon column="end_date" />
                  </Button>
                </TableHead>
                <TableHead>Total hours</TableHead>
                <TableHead className="max-w-[200px]">Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((request) => (
                <TableRow key={request.id || request.slug}>
                  <TableCell className="font-medium">{request.user_name || "Unknown"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {request.shift_leave_type?.display_color && (
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: request.shift_leave_type.display_color }} />
                      )}
                      {request.shift_leave_type?.name || "Unknown"}
                    </div>
                  </TableCell>
                  <TableCell>
                    {request.submitted_at
                      ? format(new Date(request.submitted_at), "dd MMM yyyy HH:mm")
                      : "—"}
                  </TableCell>
                  <TableCell>{request.department_name || "—"}</TableCell>
                  <TableCell>{request.start_date ? format(new Date(request.start_date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell>{request.end_date ? format(new Date(request.end_date), "dd MMM yyyy") : "—"}</TableCell>
                  <TableCell>{request.total_hours != null ? Number(request.total_hours) : 0}h</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={request.reason || ""}>
                    {request.reason || "—"}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {request.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReview(request, null)}
                        className="gap-1"
                      >
                        Review
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Review / Approve / Decline Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && closeReview()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review leave request</DialogTitle>
            <DialogDescription>View details and approve or decline.</DialogDescription>
          </DialogHeader>

          {requestForPopup && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Employee</span>
                <span className="font-medium">{requestForPopup.user_name || "Unknown"}</span>
                <span className="text-muted-foreground">Leave type</span>
                <span className="font-medium">{requestForPopup.shift_leave_type?.name || "Unknown"}</span>
                <span className="text-muted-foreground">Date submitted</span>
                <span>
                  {requestForPopup.submitted_at
                    ? format(new Date(requestForPopup.submitted_at), "dd MMM yyyy HH:mm")
                    : "—"}
                </span>
                <span className="text-muted-foreground">Department</span>
                <span>{requestForPopup.department_name || "—"}</span>
              </div>

              <div>
                <Label className="text-muted-foreground">Dates requested</Label>
                {Array.isArray(requestForPopup.days_breakdown) && requestForPopup.days_breakdown.length > 0 ? (
                  <ul className="mt-1 space-y-1 rounded-md border p-2 text-sm">
                    {requestForPopup.days_breakdown.map((entry, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span>{entry.date ? format(new Date(entry.date), "EEE, d MMM yyyy") : "—"}</span>
                        <span>
                          {entry.part_day === "full" ? "Full day" : entry.part_day === "morning" ? "Morning" : "Afternoon"}
                          {entry.hours != null ? ` (${Number(entry.hours)}h)` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm">
                    {requestForPopup.start_date && requestForPopup.end_date
                      ? `${format(new Date(requestForPopup.start_date), "dd MMM yyyy")} – ${format(new Date(requestForPopup.end_date), "dd MMM yyyy")} (full days)`
                      : "—"}
                  </p>
                )}
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total hours</span>
                <span className="font-medium">{requestForPopup.total_hours != null ? Number(requestForPopup.total_hours) : 0}h</span>
              </div>

              {requestForPopup.reason && (
                <div>
                  <Label className="text-muted-foreground">Note / Reason</Label>
                  <p className="mt-1 rounded-md border p-2 text-sm">{requestForPopup.reason}</p>
                </div>
              )}

              {remainingHours != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Leave remaining (balance)</span>
                  <span className={cn("font-medium", remainingHours < 0 && "text-destructive")}>{remainingHours.toFixed(1)} hours</span>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                {approvalAction === null && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      className="text-green-700 bg-green-500/10 hover:bg-green-500/20"
                      onClick={() => setApprovalAction("approve")}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setApprovalAction("decline")}>
                      <X className="mr-1 h-4 w-4" />
                      Decline
                    </Button>
                  </>
                )}
                {approvalAction === "decline" && (
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="decline-reason">Reason for decline *</Label>
                    <Textarea
                      id="decline-reason"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Please provide a reason..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeReview}>
              Cancel
            </Button>
            {approvalAction === "approve" && (
              <Button
                onClick={handleApproveOrDecline}
                disabled={approveLeaveRequestMutation.isPending}
              >
                {approveLeaveRequestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm approve
              </Button>
            )}
            {approvalAction === "decline" && (
              <Button
                variant="destructive"
                onClick={handleApproveOrDecline}
                disabled={!notes.trim() || approveLeaveRequestMutation.isPending}
              >
                {approveLeaveRequestMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm decline
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
