"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LeaveRequestFormContent } from "./LeaveRequestFormContent";

/**
 * Leave request form in a dialog. Uses inline calendar (no nested popover).
 */
export const LeaveRequestForm = ({ open, onOpenChange, leaveRequest = null, userId = null }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[680px] max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>{leaveRequest ? "Edit Leave Request" : "Request Leave"}</DialogTitle>
          <DialogDescription>
            {leaveRequest
              ? "Update your leave request details. You can only edit pending requests."
              : "Submit a new leave request. It will be reviewed by your manager."}
          </DialogDescription>
        </DialogHeader>
        <LeaveRequestFormContent
          isReady={open}
          leaveRequest={leaveRequest}
          userId={userId}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
          inlineCalendar={true}
        />
      </DialogContent>
    </Dialog>
  );
};
