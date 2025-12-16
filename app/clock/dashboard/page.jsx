"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useClockStatus,
  useClockOut,
  useChangeShiftRole,
  useStartBreak,
  useEndBreak,
} from "@/hooks/useClock";
import { useRoles } from "@/hooks/useRoles";
import { useCurrentUser } from "@/hooks/useAuth";
import { formatElapsedTimeHHMMSS, calculateElapsedHours as calcElapsedHours } from "@/utils/time";
import {
  Clock,
  Square,
  Coffee,
  X,
  AlertTriangle,
  User,
  MapPin,
  Building2,
  Loader2,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ClockDashboardPage() {
  const router = useRouter();
  const [showClockOutDialog, setShowClockOutDialog] = useState(false);
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false);
  const [showStartBreakDialog, setShowStartBreakDialog] = useState(false);
  const [showEndBreakDialog, setShowEndBreakDialog] = useState(false);
  const [clockOutNotes, setClockOutNotes] = useState("");
  const [breakNotes, setBreakNotes] = useState("");
  const [endBreakNotes, setEndBreakNotes] = useState("");
  const [newShiftRoleId, setNewShiftRoleId] = useState("");
  const [changeRoleNotes, setChangeRoleNotes] = useState("");

  // Get current user
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();


  // Get clock status with auto-refresh
  const { data: clockStatus, isLoading, refetch } = useClockStatus({
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get all roles for shift role change
  const { data: rolesData } = useRoles();

  // Mutations
  const clockOutMutation = useClockOut();
  const changeRoleMutation = useChangeShiftRole();
  const startBreakMutation = useStartBreak();
  const endBreakMutation = useEndBreak();

  // Calculate elapsed time
  const [elapsedTime, setElapsedTime] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (clockStatus?.clock_in_time) {
      const updateElapsed = () => {
        const checkInTime = clockStatus.clock_in_time;
        const elapsedStr = formatElapsedTimeHHMMSS(checkInTime);
        setElapsedTime(elapsedStr);

        // Calculate seconds for other uses
        const hours = calcElapsedHours(checkInTime);
        setElapsedSeconds(Math.floor(hours * 3600));
      };

      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    }
  }, [clockStatus?.clock_in_time]);

  // Get available shift roles for current job role
  const availableShiftRoles = React.useMemo(() => {
    if (!clockStatus?.job_role_id || !rolesData) return [];
    return rolesData.filter(
      (role) =>
        role.roleType === "shift_role" &&
        role.parentRoleId === clockStatus.job_role_id
    );
  }, [clockStatus?.job_role_id, rolesData]);

  // Get current shift role name
  const currentShiftRoleName = React.useMemo(() => {
    if (!clockStatus?.current_shift_role_id || !rolesData) return "Unknown";
    const role = rolesData.find((r) => r.id === clockStatus.current_shift_role_id);
    return role?.display_name || role?.name || "Unknown";
  }, [clockStatus?.current_shift_role_id, rolesData]);

  // Get job role name
  const jobRoleName = React.useMemo(() => {
    if (!clockStatus?.job_role_id || !rolesData) return "Unknown";
    const role = rolesData.find((r) => r.id === clockStatus.job_role_id);
    return role?.display_name || role?.name || "Unknown";
  }, [clockStatus?.job_role_id, rolesData]);

  // Check if checked in
  if (isLoading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check if clocked out - API can return status, current_state, or is_clocked_in
  const isClockedOut =
    clockStatus?.is_clocked_in === false ||
    clockStatus?.status === "clocked_out" ||
    clockStatus?.current_state === "clocked_out" ||
    !clockStatus;

  if (isClockedOut) {
    return (
      <div className="container mx-auto p-6 max-w-2xl space-y-4">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Not Clocked In</h1>
            <p className="text-muted-foreground">
              You are not currently clocked in. Clock in to start your shift.
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Not Clocked In</CardTitle>
            <CardDescription>
              You are not currently clocked in. Clock in to start your shift.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/clock">
              <Button className="w-full">
                <Clock className="mr-2 h-4 w-4" />
                Check In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check break and active status - API can return status, current_state, or is_on_break
  const isOnBreak =
    clockStatus?.is_on_break === true ||
    clockStatus?.status === "on_break" ||
    clockStatus?.current_state === "on_break";

  const isActive =
    (clockStatus?.is_clocked_in === true || clockStatus?.status === "active" || clockStatus?.current_state === "active") &&
    !isOnBreak;

  const handleClockOut = async () => {
    const clockOutData = clockOutNotes.trim() ? { notes: clockOutNotes.trim() } : {};
    try {
      await clockOutMutation.mutateAsync(clockOutData);
      setShowClockOutDialog(false);
      setClockOutNotes("");
      router.push("/clock");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleChangeRole = async () => {
    if (!newShiftRoleId) {
      toast.error("Shift role is required", {
        description: "Please select a shift role.",
      });
      return;
    }

    const changeData = {
      shift_role_id: parseInt(newShiftRoleId),
    };

    if (changeRoleNotes.trim()) {
      changeData.notes = changeRoleNotes.trim();
    }

    try {
      await changeRoleMutation.mutateAsync(changeData);
      setShowChangeRoleDialog(false);
      setNewShiftRoleId("");
      setChangeRoleNotes("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleStartBreak = async () => {
    const breakData = breakNotes.trim() ? { notes: breakNotes.trim() } : {};
    try {
      await startBreakMutation.mutateAsync(breakData);
      setShowStartBreakDialog(false);
      setBreakNotes("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleEndBreak = async () => {
    const breakData = endBreakNotes.trim() ? { notes: endBreakNotes.trim() } : {};
    try {
      await endBreakMutation.mutateAsync(breakData);
      setShowEndBreakDialog(false);
      setEndBreakNotes("");
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Active Shift</h1>
            <p className="text-muted-foreground">
              Manage your current shift and breaks
            </p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Status
            </CardTitle>
            <Badge variant={isOnBreak ? "secondary" : "default"}>
              {isOnBreak ? "On Break" : "Active"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Elapsed Time */}
          <div className="text-center py-6">
            <div className="text-5xl font-bold mb-2">{elapsedTime}</div>
            <p className="text-sm text-muted-foreground">
              Time Elapsed
            </p>
          </div>

          {/* Role Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Job Role</p>
                <p className="font-medium">{jobRoleName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Shift Role</p>
                <p className="font-medium">{currentShiftRoleName}</p>
              </div>
            </div>
            {clockStatus.location && (
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {clockStatus.location.name || "Unknown"}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Check In Time</p>
                <p className="font-medium">
                  {clockStatus.clock_in_time
                    ? new Date(clockStatus.clock_in_time).toLocaleString("en-GB")
                    : "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Manage your shift and breaks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Break Controls */}
            {isActive && (
              <Button
                onClick={() => setShowStartBreakDialog(true)}
                disabled={startBreakMutation.isPending}
                variant="outline"
                className="w-full"
              >
                {startBreakMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Coffee className="mr-2 h-4 w-4" />
                )}
                Start Break
              </Button>
            )}

            {isOnBreak && (
              <Button
                onClick={() => setShowEndBreakDialog(true)}
                disabled={endBreakMutation.isPending}
                variant="outline"
                className="w-full"
              >
                {endBreakMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                End Break
              </Button>
            )}

            {/* Change Shift Role */}
            {availableShiftRoles.length > 0 && (
              <Button
                onClick={() => setShowChangeRoleDialog(true)}
                variant="outline"
                className="w-full"
              >
                <User className="mr-2 h-4 w-4" />
                Change Shift Role
              </Button>
            )}

            {/* Check Out */}
            <Button
              onClick={() => setShowClockOutDialog(true)}
              variant="destructive"
              className="w-full"
            >
              <Square className="mr-2 h-4 w-4" />
              Check Out
            </Button>
          </div>
        </CardContent>
      </Card>

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

      {/* Change Role Dialog */}
      <Dialog open={showChangeRoleDialog} onOpenChange={setShowChangeRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Shift Role</DialogTitle>
            <DialogDescription>
              Select a new shift role for your current shift.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newShiftRole">
                Shift Role <span className="text-red-500">*</span>
              </Label>
              <Select value={newShiftRoleId} onValueChange={setNewShiftRoleId}>
                <SelectTrigger id="newShiftRole">
                  <SelectValue placeholder="Select shift role" />
                </SelectTrigger>
                <SelectContent>
                  {availableShiftRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.display_name || role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="changeRoleNotes">Notes (Optional)</Label>
              <Textarea
                id="changeRoleNotes"
                value={changeRoleNotes}
                onChange={(e) => setChangeRoleNotes(e.target.value)}
                placeholder="Add any notes about the role change..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowChangeRoleDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeRole}
              disabled={changeRoleMutation.isPending || !newShiftRoleId}
            >
              {changeRoleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Start Break Dialog */}
      <Dialog open={showStartBreakDialog} onOpenChange={setShowStartBreakDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Break</DialogTitle>
            <DialogDescription>
              Add any notes about your break (optional) and confirm to start.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="breakNotes">Notes (Optional)</Label>
              <Textarea
                id="breakNotes"
                value={breakNotes}
                onChange={(e) => setBreakNotes(e.target.value)}
                placeholder="e.g., Lunch break, Coffee break..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowStartBreakDialog(false);
                setBreakNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartBreak}
              disabled={startBreakMutation.isPending}
            >
              {startBreakMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                "Start Break"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Break Dialog */}
      <Dialog open={showEndBreakDialog} onOpenChange={setShowEndBreakDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Break</DialogTitle>
            <DialogDescription>
              Add any notes about ending your break (optional) and confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endBreakNotes">Notes (Optional)</Label>
              <Textarea
                id="endBreakNotes"
                value={endBreakNotes}
                onChange={(e) => setEndBreakNotes(e.target.value)}
                placeholder="e.g., Back from lunch..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEndBreakDialog(false);
                setEndBreakNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEndBreak}
              disabled={endBreakMutation.isPending}
            >
              {endBreakMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ending...
                </>
              ) : (
                "End Break"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}





