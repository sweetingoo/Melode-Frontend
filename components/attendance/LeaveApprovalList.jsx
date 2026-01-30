"use client";

import React, { useState } from "react";
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
import { CalendarIcon, Check, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useLeaveRequests, useApproveLeaveRequest } from "@/hooks/useLeaveRequests";
import { useLeaveRequest } from "@/hooks/useLeaveRequests";

export const LeaveApprovalList = ({ statusFilter = "pending", compactHeader = false }) => {
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [approvalAction, setApprovalAction] = useState(null); // "approve" or "decline"
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useLeaveRequests({ status: statusFilter });
  const approveLeaveRequest = useApproveLeaveRequest();

  const leaveRequests = data?.requests || data || [];

  const handleApprove = async () => {
    if (!selectedSlug) return;

    try {
      await approveLeaveRequest.mutateAsync({
        slug: selectedSlug,
        approvalData: {
          approved: approvalAction === "approve",
          notes: notes || null,
        },
      });
      setSelectedSlug(null);
      setApprovalAction(null);
      setNotes("");
    } catch (error) {
      console.error("Failed to process leave request:", error);
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

      {leaveRequests.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">No leave requests pending approval</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((request) => (
                <TableRow key={request.id || request.slug}>
                  <TableCell className="font-medium">{request.user_name || "Unknown"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {request.shift_leave_type?.display_color && (
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: request.shift_leave_type.display_color }}
                        />
                      )}
                      {request.shift_leave_type?.name || "Unknown"}
                    </div>
                  </TableCell>
                  <TableCell>{request.start_date ? format(new Date(request.start_date), "PPP") : "-"}</TableCell>
                  <TableCell>{request.end_date ? format(new Date(request.end_date), "PPP") : "-"}</TableCell>
                  <TableCell>{request.total_hours || 0}h</TableCell>
                  <TableCell className="max-w-xs truncate">{request.reason || "-"}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {request.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSlug(request.slug);
                            setApprovalAction("approve");
                          }}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedSlug(request.slug);
                            setApprovalAction("decline");
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="mr-1 h-4 w-4" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Approval/Decline Dialog */}
      <Dialog open={!!selectedSlug && !!approvalAction} onOpenChange={(open) => !open && setSelectedSlug(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve" ? "Approve Leave Request" : "Decline Leave Request"}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === "approve"
                ? "Are you sure you want to approve this leave request?"
                : "Please provide a reason for declining this leave request."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {approvalAction === "decline" && (
              <div className="space-y-2">
                <Label htmlFor="decline-reason">Reason for Decline *</Label>
                <Textarea
                  id="decline-reason"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Please provide a reason for declining this leave request..."
                  rows={3}
                  required
                />
              </div>
            )}

            {approvalAction === "approve" && (
              <div className="space-y-2">
                <Label htmlFor="approve-notes">Notes (Optional)</Label>
                <Textarea
                  id="approve-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSlug(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approvalAction === "decline" && !notes.trim()}
              variant={approvalAction === "decline" ? "destructive" : "default"}
            >
              {approvalAction === "approve" ? "Approve" : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
