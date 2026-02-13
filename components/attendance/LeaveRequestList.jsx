"use client";

import React, { useState, useEffect } from "react";
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
import { CalendarIcon, Plus, Loader2, Pencil, XCircle, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { useLeaveRequests, useCancelLeaveRequest } from "@/hooks/useLeaveRequests";
import { LeaveRequestForm } from "./LeaveRequestForm";
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

const MD_BREAKPOINT = 768;

export const LeaveRequestList = ({ userId = null, showCreateButton = true, compactHeader = false }) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [cancelSlug, setCancelSlug] = useState(null);
  const [isMdOrUp, setIsMdOrUp] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MD_BREAKPOINT}px)`);
    const update = () => setIsMdOrUp(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const { data, isLoading, error } = useLeaveRequests({
    user_id: userId,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const cancelLeaveRequest = useCancelLeaveRequest();

  const leaveRequests = data?.requests || data || [];

  const statusFilterLabel =
    { all: "All Status", pending: "Pending", approved: "Approved", declined: "Declined", cancelled: "Cancelled" }[
      statusFilter
    ] || "Filter by status";

  const handleCancel = async () => {
    if (cancelSlug) {
      try {
        await cancelLeaveRequest.mutateAsync(cancelSlug);
        setCancelSlug(null);
      } catch (error) {
        console.error("Failed to cancel leave request:", error);
      }
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: "default",
      approved: "default",
      declined: "destructive",
      cancelled: "secondary",
    };

    const colors = {
      pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      approved: "bg-green-500/10 text-green-700 dark:text-green-400",
      declined: "bg-red-500/10 text-red-700 dark:text-red-400",
      cancelled: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
    };

    return (
      <Badge variant={variants[status] || "default"} className={colors[status] || ""}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/20 p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading leave requests…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm font-medium text-destructive">Failed to load leave requests</p>
        <p className="mt-1 text-xs text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  const RequestRowActions = ({ request }) =>
    request.status === "pending" ? (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSelectedRequest(request);
            setIsFormOpen(true);
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-destructive hover:text-destructive"
          onClick={() => setCancelSlug(request.slug)}
        >
          <XCircle className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    ) : request.status === "declined" && request.declined_reason ? (
      <span className="text-xs text-muted-foreground" title={request.declined_reason}>
        {request.declined_reason}
      </span>
    ) : null;

  return (
    <div className="space-y-5 min-w-0 overflow-hidden">
      <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:p-4">
        {!compactHeader && (
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Leave Requests</h2>
        )}
        <div className="flex min-w-0 flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground sm:sr-only">Filter</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-full min-w-0 sm:w-[160px]">
                <SelectValue placeholder="Filter by status">{statusFilterLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {showCreateButton && (
            <Button
              size="sm"
              className="h-9 gap-2 shadow-sm"
              onClick={() => {
                setSelectedRequest(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 shrink-0" />
              Request Leave
            </Button>
          )}
        </div>
      </div>

      {leaveRequests.length === 0 ? (
        <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 py-12 px-6 text-center sm:py-16">
          <div className="rounded-full bg-muted/50 p-4">
            <CalendarIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-base font-medium text-foreground">No leave requests yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Submit a request to book holiday, sick leave, or other time off. Your manager will review it.
          </p>
          {showCreateButton && (
            <Button
              className="mt-6 gap-2"
              size="sm"
              onClick={() => setIsFormOpen(true)}
            >
              <Plus className="h-4 w-4 shrink-0" />
              Create your first leave request
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop: table — render only on md+ so list is never shown twice */}
          {isMdOrUp ? (
          <div className="min-w-0 overflow-x-auto rounded-xl border bg-card shadow-sm" role="region" aria-label="Leave requests table">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-11 bg-muted/50 font-semibold">Leave Type</TableHead>
                  <TableHead className="h-11 bg-muted/50 font-semibold">Start Date</TableHead>
                  <TableHead className="h-11 bg-muted/50 font-semibold">End Date</TableHead>
                  <TableHead className="h-11 bg-muted/50 font-semibold">Hours</TableHead>
                  <TableHead className="h-11 bg-muted/50 font-semibold">Status</TableHead>
                  <TableHead className="h-11 bg-muted/50 font-semibold">Submitted</TableHead>
                  <TableHead className="h-11 w-[120px] bg-muted/50 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((request) => (
                  <TableRow key={request.id || request.slug} className="transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {request.shift_leave_type?.display_color && (
                          <div
                            className="h-3 w-3 shrink-0 rounded-full ring-2 ring-background"
                            style={{ backgroundColor: request.shift_leave_type.display_color }}
                          />
                        )}
                        {request.shift_leave_type?.name || "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {request.start_date ? format(new Date(request.start_date), "dd MMM yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {request.end_date ? format(new Date(request.end_date), "dd MMM yyyy") : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">{request.total_hours ?? 0}h</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {request.submitted_at ? format(new Date(request.submitted_at), "dd MMM, HH:mm") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <RequestRowActions request={request} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          ) : (
          <div className="space-y-3" role="region" aria-label="Leave requests list">
            {leaveRequests.map((request) => (
              <div
                key={request.id || request.slug}
                className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    {request.shift_leave_type?.display_color && (
                      <div
                        className="h-3 w-3 shrink-0 rounded-full ring-2 ring-background"
                        style={{ backgroundColor: request.shift_leave_type.display_color }}
                      />
                    )}
                    <span className="font-medium truncate">{request.shift_leave_type?.name || "Unknown"}</span>
                    {getStatusBadge(request.status)}
                  </div>
                  <RequestRowActions request={request} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {request.start_date ? format(new Date(request.start_date), "dd MMM") : "—"}
                    {" – "}
                    {request.end_date ? format(new Date(request.end_date), "dd MMM yyyy") : "—"}
                  </span>
                  <span className="flex items-center gap-1 tabular-nums">
                    <Clock className="h-3.5 w-3.5" />
                    {request.total_hours ?? 0}h
                  </span>
                </div>
                {request.status === "declined" && request.declined_reason && (
                  <p className="mt-2 text-xs text-muted-foreground">{request.declined_reason}</p>
                )}
              </div>
            ))}
          </div>
          )}
        </>
      )}

      <LeaveRequestForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        leaveRequest={selectedRequest}
        userId={userId}
      />

      <AlertDialog open={!!cancelSlug} onOpenChange={(open) => !open && setCancelSlug(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this leave request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground">
              Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
