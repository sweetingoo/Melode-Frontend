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
import { usePreferences } from "@/hooks/useProfile";
import { Loader2, Clock, MapPin, User, FileText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ClockPage() {
  const router = useRouter();
  const [jobRoleId, setJobRoleId] = useState("");
  const [shiftRoleId, setShiftRoleId] = useState("");
  const [locationId, setLocationId] = useState("none");
  const [loginMethod] = useState("web"); // Always "web" for web version
  const [notes, setNotes] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get current user
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  // Superusers don't need to check in/out
  const isSuperuser = currentUser?.is_superuser || false;

  // Get clock status to check if already clocked in
  const { data: clockStatus, isLoading: statusLoading, refetch: refetchStatus } = useClockStatus();

  // Get all roles to find shift roles
  const { data: rolesData, isLoading: rolesLoading } = useRoles();

  // Get user assignments (which contain the roles they can check in with)
  const { data: departmentsData, isLoading: assignmentsLoading } = useUserDepartments();

  // Get locations
  const { data: locationsData, isLoading: locationsLoading } = useLocations();

  // Get user preferences from API (includes clock-in defaults)
  const { data: preferences, isLoading: preferencesLoading } = usePreferences();

  // Extract clock-in defaults from preferences
  const clockDefaults = preferences ? {
    default_job_role_id: preferences.default_job_role_id,
    default_shift_role_id: preferences.default_shift_role_id,
    default_location_id: preferences.default_location_id,
  } : null;

  // Check in mutation
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
      (r) => r.id === parseInt(jobRoleId) && (r.roleType === "job_role" || r.role_type === "job_role")
    );

    if (!selectedJobRole) return [];

    // Get shift roles that belong to this job role
    // Method 1: Check nested shift roles in the job role object
    const nestedShiftRoles = selectedJobRole.shift_roles || selectedJobRole.shiftRoles || [];

    // Method 2: Filter from rolesData array by parent_role_id
    const filteredShiftRoles = rolesData.filter(
      (role) => {
        const roleType = role.roleType || role.role_type;
        const parentRoleId = role.parentRoleId || role.parent_role_id;

        return (
          roleType === "shift_role" &&
          parentRoleId === parseInt(jobRoleId)
        );
      }
    );

    // Combine both sources and deduplicate by role ID
    const shiftRolesMap = new Map();

    // Add nested shift roles
    nestedShiftRoles.forEach((role) => {
      if (role?.id) {
        shiftRolesMap.set(role.id, role);
      }
    });

    // Add filtered shift roles (will overwrite duplicates)
    filteredShiftRoles.forEach((role) => {
      if (role?.id) {
        shiftRolesMap.set(role.id, role);
      }
    });

    return Array.from(shiftRolesMap.values());
  }, [jobRoleId, rolesData]);

  // Transform locations for select
  const locations = locationsData || [];

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load defaults from API when data is available
  useEffect(() => {
    if (clockDefaults?.default_job_role_id && userJobRoles.length > 0 && !jobRoleId) {
      const defaultJobRoleId = clockDefaults.default_job_role_id.toString();
      if (userJobRoles.some(role => role.id.toString() === defaultJobRoleId)) {
        setJobRoleId(defaultJobRoleId);
      }
    }
  }, [clockDefaults?.default_job_role_id, userJobRoles, jobRoleId]);

  useEffect(() => {
    if (clockDefaults?.default_shift_role_id && availableShiftRoles.length > 0 && !shiftRoleId && jobRoleId) {
      const defaultShiftRoleId = clockDefaults.default_shift_role_id.toString();
      if (availableShiftRoles.some(role => role.id.toString() === defaultShiftRoleId)) {
        setShiftRoleId(defaultShiftRoleId);
      }
    }
  }, [clockDefaults?.default_shift_role_id, availableShiftRoles, shiftRoleId, jobRoleId]);

  useEffect(() => {
    if (clockDefaults?.default_location_id && locations.length > 0 && locationId === "none") {
      const defaultLocationId = clockDefaults.default_location_id.toString();
      if (locations.some(loc => loc.id.toString() === defaultLocationId)) {
        setLocationId(defaultLocationId);
      }
    }
  }, [clockDefaults?.default_location_id, locations, locationId]);

  // Check if already checked in - redirect immediately
  useEffect(() => {
    if (!statusLoading && clockStatus) {
      const status = clockStatus.status;
      if (status === "active" || status === "on_break") {
        // Redirect to active shift dashboard immediately
        router.replace("/clock/dashboard");
      }
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
      // Refetch status to ensure we have the latest data
      await refetchStatus();
      // Redirect to dashboard
      router.push("/clock/dashboard");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // Show loading while checking status
  if (userLoading || statusLoading || assignmentsLoading || preferencesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If already clocked in (active or on break), show loading while redirecting
  // This prevents the form from flashing before redirect
  if (clockStatus) {
    const status = clockStatus.status;
    if (status === "active" || status === "on_break") {
      // The useEffect will handle the redirect, but show loading state here
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Redirecting to your active shift...</p>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-4">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Check In</h1>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-semibold">
            {currentTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })}
          </div>
          <div className="text-sm text-muted-foreground">
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardDescription>
            Select your job role, shift role, and location to check in.
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

            {/* Notes (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about your check in..."
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
                  Checking In...
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Check In
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}




