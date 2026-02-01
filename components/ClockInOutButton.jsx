"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Square, Loader2, Coffee, X } from "lucide-react";
import { useClockStatus, useClockIn, useClockOut, useStartBreak, useEndBreak } from "@/hooks/useClock";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useAuth";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { formatElapsedTimeHHMMSS } from "@/utils/time";

export const ClockInOutButton = ({ className = "" }) => {
  const { data: currentUserData } = useCurrentUser();
  const { hasPermission, isSuperuser } = usePermissionsCheck();
  const router = useRouter();
  const [showClockOutDialog, setShowClockOutDialog] = useState(false);
  const [clockOutNotes, setClockOutNotes] = useState("");
  const [elapsedTime, setElapsedTime] = useState("");

  const { data: clockStatus, isLoading: statusLoading } = useClockStatus({
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();
  const startBreakMutation = useStartBreak();
  const endBreakMutation = useEndBreak();

  // Check for clocked in status - API can return status, current_state, or is_clocked_in
  const isClockedIn =
    clockStatus?.is_clocked_in === true ||
    clockStatus?.status === "active" ||
    clockStatus?.status === "on_break" ||
    clockStatus?.current_state === "active" ||
    clockStatus?.current_state === "on_break";

  const isOnBreak =
    clockStatus?.is_on_break === true ||
    clockStatus?.status === "on_break" ||
    clockStatus?.current_state === "on_break";

  const isActive = isClockedIn && !isOnBreak;

  // Calculate and update elapsed time
  useEffect(() => {
    if (clockStatus?.clock_in_time && isClockedIn) {
      const updateElapsed = () => {
        setElapsedTime(formatElapsedTimeHHMMSS(clockStatus.clock_in_time));
      };

      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime("");
    }
  }, [clockStatus?.clock_in_time, isClockedIn]);

  // Check if user has clock:in permission or is a superuser
  // This check must happen AFTER all hooks are called
  if (!isSuperuser && !hasPermission("clock:in")) {
    return null;
  }

  const handleClockIn = () => {
    router.push("/clock");
  };

  const handleClockOutClick = () => {
    if (isClockedIn) {
      setShowClockOutDialog(true);
    }
  };

  const handleClockOut = async () => {
    const clockOutData = clockOutNotes.trim() ? { notes: clockOutNotes.trim() } : {};
    try {
      await clockOutMutation.mutateAsync(clockOutData);
      setShowClockOutDialog(false);
      setClockOutNotes("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleStartBreak = async () => {
    try {
      await startBreakMutation.mutateAsync();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleEndBreak = async () => {
    try {
      await endBreakMutation.mutateAsync();
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (statusLoading) {
    return (
      <Button variant="ghost" size="sm" className={`h-9 px-3 ${className}`} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 max-w-full shrink-0">
        {/* Timer Display - compact on mobile */}
        {isClockedIn && elapsedTime && (
          <Badge
            variant={isOnBreak ? "secondary" : "default"}
            className="h-8 sm:h-9 px-2 sm:px-3 font-mono text-xs sm:text-sm cursor-pointer hover:opacity-80 transition-opacity shrink-0"
            onClick={() => router.push("/clock/dashboard")}
          >
            <Clock className="h-3 w-3 mr-1 sm:mr-1.5 shrink-0" />
            <span className="truncate max-w-[5.5rem] sm:max-w-none tabular-nums">{elapsedTime}</span>
            {isOnBreak && (
              <span className="ml-1 sm:ml-1.5 text-xs opacity-75 shrink-0">(Break)</span>
            )}
          </Badge>
        )}

        {/* Break Controls - desktop only when clocked in (mobile: use clock dashboard) */}
        {isActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartBreak}
            className={`hidden sm:flex h-9 px-3 ${className}`}
            disabled={startBreakMutation.isPending}
          >
            {startBreakMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Coffee className="h-4 w-4 mr-2" />
                Break
              </>
            )}
          </Button>
        )}

        {isOnBreak && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEndBreak}
            className={`hidden sm:flex h-9 px-3 ${className}`}
            disabled={endBreakMutation.isPending}
          >
            {endBreakMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                End Break
              </>
            )}
          </Button>
        )}

        {/* Check In/Out Button - icon only on mobile when clocked in */}
        <Button
          variant={isClockedIn ? "default" : "ghost"}
          size="sm"
          onClick={isClockedIn ? handleClockOutClick : handleClockIn}
          className={`h-8 sm:h-9 px-2 sm:px-3 shrink-0 ${className}`}
          disabled={clockInMutation.isPending || clockOutMutation.isPending}
          title={isClockedIn ? "Check out" : "Check in"}
        >
          {clockInMutation.isPending || clockOutMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isClockedIn ? (
            <>
              <Square className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Check Out</span>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Check In</span>
            </>
          )}
        </Button>
      </div>

      {/* Check Out Dialog */}
      <Dialog open={showClockOutDialog} onOpenChange={setShowClockOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check Out</DialogTitle>
            <DialogDescription>
              Add any notes about your shift (optional) and confirm check out.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clockOutNotes">Notes (Optional)</Label>
              <Textarea
                id="clockOutNotes"
                value={clockOutNotes}
                onChange={(e) => setClockOutNotes(e.target.value)}
                placeholder="Add any notes about your shift..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClockOutDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClockOut}
              disabled={clockOutMutation.isPending}
            >
              {clockOutMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking Out...
                </>
              ) : (
                "Check Out"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};














