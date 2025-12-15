"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Square, Loader2 } from "lucide-react";
import { useClockStatus, useClockIn, useClockOut } from "@/hooks/useClock";
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

export const ClockInOutButton = ({ className = "" }) => {
  const { data: currentUserData } = useCurrentUser();
  const { hasPermission, isSuperuser } = usePermissionsCheck();

  // Superusers don't need to clock in/out - they can see everything
  // Also check if user has clock:in permission
  if (isSuperuser || !hasPermission("clock:in")) {
    return null;
  }
  const router = useRouter();
  const [showClockOutDialog, setShowClockOutDialog] = useState(false);
  const [clockOutNotes, setClockOutNotes] = useState("");
  const [elapsedTime, setElapsedTime] = useState("");

  const { data: clockStatus, isLoading: statusLoading } = useClockStatus({
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const clockInMutation = useClockIn();
  const clockOutMutation = useClockOut();

  const isClockedIn = clockStatus?.status === "active" || clockStatus?.status === "on_break";
  const isOnBreak = clockStatus?.status === "on_break";

  // Calculate and update elapsed time
  useEffect(() => {
    if (clockStatus?.clock_in_time && isClockedIn) {
      const updateElapsed = () => {
        const clockInTime = new Date(clockStatus.clock_in_time);
        const now = new Date();
        const diff = Math.floor((now - clockInTime) / 1000);

        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;

        setElapsedTime(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      };

      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    } else {
      setElapsedTime("");
    }
  }, [clockStatus?.clock_in_time, isClockedIn]);

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

  if (statusLoading) {
    return (
      <Button variant="ghost" size="sm" className={`h-9 px-3 ${className}`} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Timer Display */}
        {isClockedIn && elapsedTime && (
          <Badge
            variant={isOnBreak ? "secondary" : "default"}
            className="h-9 px-3 font-mono text-sm"
          >
            <Clock className="h-3 w-3 mr-1.5" />
            {elapsedTime}
            {isOnBreak && (
              <span className="ml-1.5 text-xs opacity-75">(Break)</span>
            )}
          </Badge>
        )}

        {/* Clock In/Out Button */}
        <Button
          variant={isClockedIn ? "default" : "ghost"}
          size="sm"
          onClick={isClockedIn ? handleClockOutClick : handleClockIn}
          className={`h-9 px-3 ${className}`}
          disabled={clockInMutation.isPending || clockOutMutation.isPending}
        >
          {clockInMutation.isPending || clockOutMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isClockedIn ? (
            <>
              <Square className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">
                {isOnBreak ? "On Break" : "Clock Out"}
              </span>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Clock In</span>
            </>
          )}
        </Button>
      </div>

      {/* Clock Out Dialog */}
      <Dialog open={showClockOutDialog} onOpenChange={setShowClockOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clock Out</DialogTitle>
            <DialogDescription>
              Add any notes about your shift (optional) and confirm clock out.
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
                  Clocking Out...
                </>
              ) : (
                "Clock Out"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};




