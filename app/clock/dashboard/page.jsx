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
import {
  Clock,
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
  const [clockOutNotes, setClockOutNotes] = useState("");
  const [newShiftRoleId, setNewShiftRoleId] = useState("");
  const [changeRoleNotes, setChangeRoleNotes] = useState("");

  // Get current user
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  // Superusers don't need to clock in/out
  const isSuperuser = currentUser?.is_superuser || false;

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
        const clockInTime = new Date(clockStatus.clock_in_time);
        const now = new Date();
        const diff = Math.floor((now - clockInTime) / 1000);
        setElapsedSeconds(diff);

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

  // Don't show clock dashboard for superusers
  if (!userLoading && isSuperuser) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Clock Dashboard Not Available</h1>
              <p className="text-muted-foreground">
                Superusers don't need to clock in/out. You have full access to view everything.
              </p>
              <Button onClick={() => router.push("/admin")} className="mt-4">
                Go to Admin Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if clocked in
  if (isLoading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!clockStatus || clockStatus.status === "clocked_out") {
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
                Clock In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOnBreak = clockStatus.status === "on_break";
  const isActive = clockStatus.status === "active";

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

  // Get current shift role name
  const currentShiftRoleName = React.useMemo(() => {
    if (!clockStatus?.current_shift_role_id || !rolesData) return "Unknown";
    const role = rolesData.find((r) => r.id === clockStatus.current_shift_role_id);
    return role?.name || "Unknown";
  }, [clockStatus?.current_shift_role_id, rolesData]);

  // Get job role name
  const jobRoleName = React.useMemo(() => {
    if (!clockStatus?.job_role_id || !rolesData) return "Unknown";
    const role = rolesData.find((r) => r.id === clockStatus.job_role_id);
    return role?.name || "Unknown";
  }, [clockStatus?.job_role_id, rolesData]);

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
                <p className="text-sm text-muted-foreground">Clock In Time</p>
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
                onClick={handleStartBreak}
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
                onClick={handleEndBreak}
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

            {/* Clock Out */}
            <Button
              onClick={() => setShowClockOutDialog(true)}
              variant="destructive"
              className="w-full"
            >
              <ClockOut className="mr-2 h-4 w-4" />
              Clock Out
            </Button>
          </div>
        </CardContent>
      </Card>

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
                      {role.name}
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
    </div>
  );
}





