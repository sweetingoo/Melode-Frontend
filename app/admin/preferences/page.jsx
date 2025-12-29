"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Clock,
  Save,
  Loader2,
  Bell,
  Mail,
  Smartphone,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePreferences,
  useUpdatePreferences,
} from "@/hooks/useProfile";
import { useRoles } from "@/hooks/useRoles";
import { useLocations } from "@/hooks/useLocations";
import { useUserDepartments } from "@/hooks/useDepartmentContext";
import { useOrganisation } from "@/hooks/useConfiguration";

export default function PreferencesPage() {
  // User Preferences Hooks
  const { data: preferences, isLoading: preferencesLoading } = usePreferences();
  const updatePreferencesMutation = useUpdatePreferences();

  // Extract clock-in defaults from preferences (memoized to prevent infinite loops)
  const clockDefaults = React.useMemo(() => {
    if (!preferences) return null;
    return {
      default_job_role_id: preferences.default_job_role_id,
      default_shift_role_id: preferences.default_shift_role_id,
      default_location_id: preferences.default_location_id,
    };
  }, [preferences?.default_job_role_id, preferences?.default_shift_role_id, preferences?.default_location_id]);
  const { data: rolesData } = useRoles();
  const { data: locationsData } = useLocations();
  const { data: departmentsData } = useUserDepartments();
  const { data: organisationData } = useOrganisation();

  // Clock-in Preferences State
  const [preferencesData, setPreferencesData] = useState({
    default_job_role_id: null,
    default_shift_role_id: null,
    default_location_id: null,
  });

  // Notification Preferences State
  const [notificationPreferences, setNotificationPreferences] = useState({
    email_enabled: true,
    sms_enabled: true,
  });

  // Extract notification preferences from preferences (with defaults)
  React.useEffect(() => {
    if (preferences?.additional_preferences?.notification_preferences) {
      setNotificationPreferences({
        email_enabled: preferences.additional_preferences.notification_preferences.email_enabled ?? true,
        sms_enabled: preferences.additional_preferences.notification_preferences.sms_enabled ?? true,
      });
    } else {
      // Default to both enabled if not set
      setNotificationPreferences({
        email_enabled: true,
        sms_enabled: true,
      });
    }
  }, [preferences?.additional_preferences?.notification_preferences]);

  // Check if email/SMS is configured at organization level
  const isEmailConfigured = organisationData?.integration_config?.sendgrid_api_key ? true : false;
  const isSMSConfigured = organisationData?.integration_config?.twilio_account_sid &&
    organisationData?.integration_config?.twilio_auth_token &&
    organisationData?.integration_config?.twilio_from_number ? true : false;

  // Extract job roles from user's assignments (same logic as clock page)
  const userJobRoles = React.useMemo(() => {
    if (!departmentsData?.departments) return [];

    const assignments = departmentsData.departments || [];
    const jobRoleMap = new Map();

    assignments.forEach((assignment) => {
      const role = assignment.role;
      if (role && (role.role_type === "job_role" || !role.role_type)) {
        let roleToUse = role;

        if (rolesData) {
          const fullRole = rolesData.find((r) => r.id === role.id);
          if (fullRole) {
            roleToUse = fullRole;
          }
        }

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
    if (!preferencesData.default_job_role_id || !rolesData) return [];

    const selectedJobRole = rolesData.find(
      (r) => r.id === parseInt(preferencesData.default_job_role_id) && (r.roleType === "job_role" || r.role_type === "job_role")
    );

    if (!selectedJobRole) return [];

    return rolesData.filter(
      (role) =>
        (role.roleType === "shift_role" || role.role_type === "shift_role") &&
        (role.parentRoleId === parseInt(preferencesData.default_job_role_id) || role.parent_role_id === parseInt(preferencesData.default_job_role_id))
    );
  }, [preferencesData.default_job_role_id, rolesData]);

  // Update preferences data when clock defaults load (only if values actually changed)
  useEffect(() => {
    if (!clockDefaults) return;

    setPreferencesData((prev) => {
      // Only update if values have actually changed to prevent infinite loops
      const newJobRoleId = clockDefaults.default_job_role_id || null;
      const newShiftRoleId = clockDefaults.default_shift_role_id || null;
      const newLocationId = clockDefaults.default_location_id || null;

      // Check if any value actually changed
      if (
        prev.default_job_role_id?.toString() === newJobRoleId?.toString() &&
        prev.default_shift_role_id?.toString() === newShiftRoleId?.toString() &&
        prev.default_location_id?.toString() === newLocationId?.toString()
      ) {
        return prev; // No change, return previous state
      }

      return {
        default_job_role_id: newJobRoleId,
        default_shift_role_id: newShiftRoleId,
        default_location_id: newLocationId,
      };
    });
  }, [clockDefaults?.default_job_role_id, clockDefaults?.default_shift_role_id, clockDefaults?.default_location_id]);

  // Handle saving clock-in preferences (partial update)
  const handleSaveClockPreferences = async () => {
    try {
      // Build payload with only the clock-in default fields (partial update)
      // API supports partial updates - only send fields we want to update
      const payload = {};

      // Convert string IDs to integers, or set to null if "none"
      if (preferencesData.default_job_role_id) {
        payload.default_job_role_id = parseInt(preferencesData.default_job_role_id);
      } else {
        // Send null to clear the preference
        payload.default_job_role_id = null;
      }

      if (preferencesData.default_shift_role_id) {
        payload.default_shift_role_id = parseInt(preferencesData.default_shift_role_id);
      } else {
        payload.default_shift_role_id = null;
      }

      if (preferencesData.default_location_id) {
        payload.default_location_id = parseInt(preferencesData.default_location_id);
      } else {
        payload.default_location_id = null;
      }

      await updatePreferencesMutation.mutateAsync(payload);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // Handle saving notification preferences
  const handleSaveNotificationPreferences = async () => {
    try {
      // Get current additional_preferences and merge with notification preferences
      const currentAdditionalPrefs = preferences?.additional_preferences || {};
      
      const payload = {
        additional_preferences: {
          ...currentAdditionalPrefs,
          notification_preferences: {
            email_enabled: notificationPreferences.email_enabled,
            sms_enabled: notificationPreferences.sms_enabled,
          },
        },
      };

      await updatePreferencesMutation.mutateAsync(payload);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Preferences</h1>
        <p className="text-muted-foreground">
          Configure your default settings for quick access and streamlined workflows
        </p>
      </div>

      {/* Clock-In Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Clock-In Defaults
          </CardTitle>
          <CardDescription>
            Set your default job role, shift role, and location for clock-in. These will automatically
            pre-populate the clock-in form, allowing for quick check-ins.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {preferencesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* Job Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="defaultJobRole">
                  Default Job Role
                </Label>
                <Select
                  value={preferencesData.default_job_role_id?.toString() || "none"}
                  onValueChange={(value) => {
                    setPreferencesData((prev) => ({
                      ...prev,
                      default_job_role_id: value === "none" ? null : value,
                      default_shift_role_id: null, // Reset shift role when job role changes
                    }));
                  }}
                  disabled={updatePreferencesMutation.isPending}
                >
                  <SelectTrigger id="defaultJobRole">
                    <SelectValue placeholder="Select default job role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No default</SelectItem>
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
                <Label htmlFor="defaultShiftRole">
                  Default Shift Role
                </Label>
                <Select
                  value={preferencesData.default_shift_role_id?.toString() || "none"}
                  onValueChange={(value) => {
                    setPreferencesData((prev) => ({
                      ...prev,
                      default_shift_role_id: value === "none" ? null : value,
                    }));
                  }}
                  disabled={!preferencesData.default_job_role_id || updatePreferencesMutation.isPending}
                >
                  <SelectTrigger id="defaultShiftRole">
                    <SelectValue placeholder="Select default shift role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No default</SelectItem>
                    {!preferencesData.default_job_role_id ? (
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
                {preferencesData.default_job_role_id && availableShiftRoles.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No shift roles are available for the selected job role.
                  </p>
                )}
              </div>

              {/* Location Selection */}
              <div className="space-y-2">
                <Label htmlFor="defaultLocation">
                  Default Location
                </Label>
                <Select
                  value={preferencesData.default_location_id?.toString() || "none"}
                  onValueChange={(value) => {
                    setPreferencesData((prev) => ({
                      ...prev,
                      default_location_id: value === "none" ? null : value,
                    }));
                  }}
                  disabled={updatePreferencesMutation.isPending}
                >
                  <SelectTrigger id="defaultLocation">
                    <SelectValue placeholder="Select default location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No default</SelectItem>
                    {!locationsData || locationsData.length === 0 ? (
                      <SelectItem value="no-locations" disabled>
                        No locations available
                      </SelectItem>
                    ) : (
                      locationsData.map((location) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveClockPreferences}
                  disabled={updatePreferencesMutation.isPending}
                >
                  {updatePreferencesMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Control how you receive automatic notifications for tasks, forms, and project updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {preferencesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Label htmlFor="email-notifications" className="text-base font-semibold cursor-pointer">
                      Receive Email Notifications
                    </Label>
                    {isEmailConfigured ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-muted-foreground" />
                        Not Configured
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for tasks, forms, and project updates
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notificationPreferences.email_enabled}
                  onCheckedChange={(checked) =>
                    setNotificationPreferences((prev) => ({
                      ...prev,
                      email_enabled: checked,
                    }))
                  }
                  disabled={updatePreferencesMutation.isPending || !isEmailConfigured}
                />
              </div>

              {/* SMS Notifications */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Label htmlFor="sms-notifications" className="text-base font-semibold cursor-pointer">
                      Receive SMS Notifications
                    </Label>
                    {isSMSConfigured ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-muted-foreground" />
                        Not Configured
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive SMS notifications for tasks, forms, and project updates
                  </p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={notificationPreferences.sms_enabled}
                  onCheckedChange={(checked) =>
                    setNotificationPreferences((prev) => ({
                      ...prev,
                      sms_enabled: checked,
                    }))
                  }
                  disabled={updatePreferencesMutation.isPending || !isSMSConfigured}
                />
              </div>

              {/* Important Note */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> These settings only apply to automatic notifications (tasks, forms, projects). 
                  Direct messages will always be delivered regardless of these settings.
                </p>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveNotificationPreferences}
                  disabled={updatePreferencesMutation.isPending}
                >
                  {updatePreferencesMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Notification Preferences
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-semibold">•</span>
              <span>
                Your default preferences will automatically pre-populate the clock-in form when you check in
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">•</span>
              <span>
                You can still change any value before submitting your clock-in if needed
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">•</span>
              <span>
                Setting defaults saves time and ensures consistency in your time tracking
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">•</span>
              <span>
                All preferences are optional - you can set any combination or leave them all blank
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}


