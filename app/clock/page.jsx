"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClockIn, useClockStatus } from "@/hooks/useClock";
import { useCurrentUser } from "@/hooks/useAuth";
import { useRoles } from "@/hooks/useRoles";
import { useLocations } from "@/hooks/useLocations";
import { useUserDepartments } from "@/hooks/useDepartmentContext";
import { Loader2, Clock, MapPin, User, FileText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ClockPage() {
  const router = useRouter();
  const [jobRoleId, setJobRoleId] = useState("");
  const [shiftRoleId, setShiftRoleId] = useState("");
  const [locationId, setLocationId] = useState("none");
  const [loginMethod, setLoginMethod] = useState("web");
  const [notes, setNotes] = useState("");

  // Get current user
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  // Superusers don't need to clock in/out
  const isSuperuser = currentUser?.is_superuser || false;

  // Get clock status to check if already clocked in
  const { data: clockStatus, isLoading: statusLoading } = useClockStatus();

  // Get all roles to find shift roles
  const { data: rolesData, isLoading: rolesLoading } = useRoles();

  // Get user assignments (which contain the roles they can clock in with)
  const { data: departmentsData, isLoading: assignmentsLoading } = useUserDepartments();

  // Get locations
  const { data: locationsData, isLoading: locationsLoading } = useLocations();

  // Clock in mutation
  const clockInMutation = useClockIn();

  // Extract job roles from user's assignments
  const userJobRoles = React.useMemo(() => {
    if (!departmentsData?.departments) return [];

    const assignments = departmentsData.departments || [];

    // Get unique job roles from assignments
    const jobRoleMap = new Map();

    assignments.forEach((assignment) => {
      const role = assignment.role;
      if (role && (role.role_type === "job_role" || !role.role_type)) {
        // Use role from assignment directly, or try to find it in rolesData for additional info
        let roleToUse = role;

        if (rolesData) {
          const fullRole = rolesData.find((r) => r.id === role.id);
          if (fullRole) {
            roleToUse = fullRole;
          }
        }

        // Ensure we have the roleType property
        if (!roleToUse.roleType && roleToUse.role_type) {
          roleToUse = { ...roleToUse, roleType: roleToUse.role_type };
        }

        if (!jobRoleMap.has(role.id)) {
          jobRoleMap.set(role.id, {
            id: role.id,
            name: roleToUse.display_name || role.display_name || roleToUse.name || role.name || role.role_name,
            display_name: roleToUse.display_name || role.display_name || roleToUse.name || role.name || role.role_name,
            roleType: role.role_type || "job_role",
            ...roleToUse,
          });
        }
      }
    });

    return Array.from(jobRoleMap.values());
  }, [departmentsData?.departments, rolesData]);

  // Get shift roles for selected job role
  const availableShiftRoles = React.useMemo(() => {
    if (!jobRoleId || !rolesData) return [];

    const selectedJobRole = rolesData.find(
      (r) => r.id === parseInt(jobRoleId) && r.roleType === "job_role"
    );

    if (!selectedJobRole) return [];

    // Get shift roles that belong to this job role
    return rolesData.filter(
      (role) =>
        role.roleType === "shift_role" &&
        role.parentRoleId === parseInt(jobRoleId)
    );
  }, [jobRoleId, rolesData]);

  // Transform locations for select
  const locations = locationsData || [];

  // Check if already clocked in
  useEffect(() => {
    if (!statusLoading && clockStatus?.status === "active") {
      // Redirect to active shift dashboard or show message
      toast.info("You are already clocked in", {
        description: "Redirecting to your active shift...",
      });
      router.push("/clock/dashboard");
    }
  }, [clockStatus, statusLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!jobRoleId) {
      toast.error("Job role is required", {
        description: "Please select a job role.",
      });
      return;
    }

    if (!shiftRoleId) {
      toast.error("Shift role is required", {
        description: "Please select a shift role.",
      });
      return;
    }

    const clockInData = {
      job_role_id: parseInt(jobRoleId),
      shift_role_id: parseInt(shiftRoleId),
      login_method: loginMethod,
    };

    if (locationId && locationId !== "none") {
      clockInData.location_id = parseInt(locationId);
    }

    if (notes.trim()) {
      clockInData.notes = notes.trim();
    }

    try {
      await clockInMutation.mutateAsync(clockInData);
      // Redirect to dashboard or show success
      router.push("/clock/dashboard");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (userLoading || statusLoading || assignmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }


  // If already clocked in, show message
  if (clockStatus?.status === "active") {
    return (
      <div className="container mx-auto p-6 max-w-2xl space-y-4">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Already Clocked In</h1>
            <p className="text-muted-foreground">
              You are currently clocked in. View your active shift or clock out.
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Already Clocked In</CardTitle>
            <CardDescription>
              You are currently clocked in. View your active shift or clock out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/clock/dashboard">
              <Button className="w-full">View Active Shift</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-4">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Clock In</h1>
          <p className="text-muted-foreground">
            Select your job role, shift role, and location to clock in.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Clock In
          </CardTitle>
          <CardDescription>
            Select your job role, shift role, and location to clock in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="jobRole">
                Job Role <span className="text-red-500">*</span>
              </Label>
              <Select
                value={jobRoleId}
                onValueChange={(value) => {
                  setJobRoleId(value);
                  setShiftRoleId(""); // Reset shift role when job role changes
                }}
                disabled={clockInMutation.isPending}
              >
                <SelectTrigger id="jobRole">
                  <SelectValue placeholder="Select job role" />
                </SelectTrigger>
                <SelectContent>
                  {userJobRoles.length === 0 ? (
                    <SelectItem value="no-roles" disabled>
                      No job roles available
                    </SelectItem>
                  ) : (
                    userJobRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.display_name || role.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {userJobRoles.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  You don't have any job roles assigned. Please contact your administrator.
                </p>
              )}
            </div>

            {/* Shift Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="shiftRole">
                Shift Role <span className="text-red-500">*</span>
              </Label>
              <Select
                value={shiftRoleId}
                onValueChange={setShiftRoleId}
                disabled={!jobRoleId || clockInMutation.isPending}
              >
                <SelectTrigger id="shiftRole">
                  <SelectValue placeholder="Select shift role" />
                </SelectTrigger>
                <SelectContent>
                  {!jobRoleId ? (
                    <SelectItem value="select-job-first" disabled>
                      Select a job role first
                    </SelectItem>
                  ) : availableShiftRoles.length === 0 ? (
                    <SelectItem value="no-shift-roles" disabled>
                      No shift roles available for this job role
                    </SelectItem>
                  ) : (
                    availableShiftRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.display_name || role.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {jobRoleId && availableShiftRoles.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No shift roles are available for the selected job role.
                </p>
              )}
            </div>

            {/* Location Selection (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="location">
                Location <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Select
                value={locationId}
                onValueChange={setLocationId}
                disabled={clockInMutation.isPending}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No location</SelectItem>
                  {locationsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading locations...
                    </SelectItem>
                  ) : locations.length === 0 ? (
                    <SelectItem value="no-locations" disabled>
                      No locations available
                    </SelectItem>
                  ) : (
                    locations.map((location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Login Method */}
            <div className="space-y-2">
              <Label htmlFor="loginMethod">
                Login Method <span className="text-red-500">*</span>
              </Label>
              <Select
                value={loginMethod}
                onValueChange={setLoginMethod}
                disabled={clockInMutation.isPending}
              >
                <SelectTrigger id="loginMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web">Web</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                  <SelectItem value="app">App</SelectItem>
                  <SelectItem value="nfc">NFC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about your clock in..."
                disabled={clockInMutation.isPending}
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={
                clockInMutation.isPending ||
                !jobRoleId ||
                !shiftRoleId ||
                userJobRoles.length === 0
              }
            >
              {clockInMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clocking In...
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Clock In
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}




