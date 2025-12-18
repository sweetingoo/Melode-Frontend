"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Clock, Save, MapPin, User, Briefcase } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormSelect } from "@/components/docs/FormMockup";
import { Separator } from "@/components/ui/separator";

export default function UserPreferencesDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">User Preferences</h1>
        <p className="text-lg text-muted-foreground">
          Configure your default settings for clock-in and other preferences
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding user preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What are User Preferences?</h3>
              <p className="text-sm text-muted-foreground">
                User preferences allow you to set default values for frequently used settings, such as
                your default job role, shift role, and location for clock-in. These defaults help
                streamline your workflow by pre-populating forms with your preferred values.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Preferences</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Open the main navigation sidebar (left side of the screen)</li>
                <li>Click on "Preferences" - this option is visible to all users</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/preferences</code></li>
                <li>The Preferences page is directly accessible from the main navigation, making it easy to configure your default settings</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-green-600" />
              <CardTitle>Clock-In Defaults</CardTitle>
            </div>
            <CardDescription>Setting your default clock-in preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">What are Clock-In Defaults?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Clock-in defaults allow you to pre-select your preferred job role, shift role, and
                location when checking in. These defaults will automatically populate the clock-in form,
                saving you time and ensuring consistency in your time tracking.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Setting Clock-In Defaults</h3>
              <p className="text-sm text-muted-foreground mb-4">
                To set your clock-in defaults:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-4">
                <li>Navigate to "Preferences" from the main navigation menu</li>
                <li>Find the "Clock-In Defaults" section</li>
                <li>Select your preferred default job role (optional)</li>
                <li>Select your preferred default shift role (optional, requires job role)</li>
                <li>Select your preferred default location (optional)</li>
                <li>Click "Save Preferences" to save your settings</li>
              </ol>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">Clock-In Defaults Form</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The preferences form looks like this:
              </p>
              <div className="border rounded-lg p-6 bg-muted/30">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Default Job Role</label>
                    <FormSelect
                      placeholder="Select default job role"
                      value="manager"
                      options={[
                        { value: "none", label: "No default" },
                        { value: "manager", label: "Manager" },
                        { value: "supervisor", label: "Supervisor" },
                        { value: "employee", label: "Employee" },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Default Shift Role</label>
                    <FormSelect
                      placeholder="Select default shift role"
                      value="day-shift"
                      options={[
                        { value: "none", label: "No default" },
                        { value: "day-shift", label: "Day Shift" },
                        { value: "night-shift", label: "Night Shift" },
                      ]}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Select a job role first to see available shift roles
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Default Location</label>
                    <FormSelect
                      placeholder="Select default location"
                      value="main-office"
                      options={[
                        { value: "none", label: "No default" },
                        { value: "main-office", label: "Main Office" },
                        { value: "facility", label: "Facility" },
                      ]}
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <FormButton icon={Save}>Save Preferences</FormButton>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">How Defaults Work</h3>
              <p className="text-sm text-muted-foreground mb-2">
                When you set clock-in defaults:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Defaults are <strong>optional</strong> - you can set any combination of defaults or none at all</li>
                <li>Defaults <strong>pre-populate</strong> the clock-in form but can still be changed before submitting</li>
                <li>Job role must be selected before shift role (shift roles belong to job roles)</li>
                <li>You can only select job roles and shift roles that you have access to</li>
                <li>Location defaults are independent and can be set regardless of role selections</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Briefcase className="h-6 w-6 text-purple-600" />
              <CardTitle>Job Role & Shift Role</CardTitle>
            </div>
            <CardDescription>Understanding role defaults</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Default Job Role</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Your default job role is the primary role you typically use when checking in. This
                should be one of the job roles assigned to you by your administrator.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Only job roles you have access to will appear in the dropdown</li>
                <li>If you don't have any job roles assigned, contact your administrator</li>
                <li>You can leave this blank if you frequently switch between roles</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Default Shift Role</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Your default shift role is the specific shift type you typically work. Shift roles
                are associated with job roles, so you must select a job role first.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Shift roles are filtered based on your selected job role</li>
                <li>If no shift roles are available for your job role, this field will be disabled</li>
                <li>You can leave this blank if you frequently switch between shifts</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-orange-600" />
              <CardTitle>Location Defaults</CardTitle>
            </div>
            <CardDescription>Setting your default work location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Default Location</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Your default location is the physical location where you typically work. Setting a
                default location helps track where work is performed and can be required by your
                organization's time tracking policies.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Location defaults are independent of role selections</li>
                <li>You can set a location default even if you don't set role defaults</li>
                <li>If your organization has multiple locations, select the one you work at most often</li>
                <li>You can still change the location when checking in if needed</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Using Check-In Defaults</CardTitle>
            <CardDescription>How defaults work when checking in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Pre-Population</h3>
                <p className="text-sm text-muted-foreground">
                  When you navigate to the clock-in page, your saved defaults will automatically
                  populate the form fields. This saves time and reduces the chance of selecting
                  the wrong role or location.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Flexibility</h3>
                <p className="text-sm text-muted-foreground">
                  Defaults are just starting points - you can always change any value before
                  submitting your clock-in. This allows you to handle exceptions or special
                  circumstances while still benefiting from defaults for your regular routine.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Validation</h3>
                <p className="text-sm text-muted-foreground">
                  The system validates that your defaults are still valid when you check in. If a
                  default role or location is no longer available or you no longer have access to it,
                  the form will load without that default, and you'll need to make a new selection.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Updating Preferences</CardTitle>
            <CardDescription>Changing your clock-in defaults</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">How to Update</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Navigate to "Preferences" from the main navigation menu</li>
                  <li>Scroll to the "Clock-In Defaults" section</li>
                  <li>Change any of the default values you want to update</li>
                  <li>Click "Save Preferences" to save your changes</li>
                  <li>You'll see a success message confirming your preferences were saved</li>
                </ol>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Clearing Defaults</h3>
                <p className="text-sm text-muted-foreground">
                  To clear a default, select "No default" from the dropdown for that field. You can
                  clear individual defaults or all of them at once. Changes are saved when you click
                  "Save Preferences".
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Integration</CardTitle>
            <CardDescription>Technical details for developers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Get User Preferences</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Endpoint: <code className="bg-muted px-1 py-0.5 rounded">GET /api/v1/profile/preferences</code>
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Response:
              </p>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                {`{
  "user_id": 1,
  "default_job_role_id": 5,
  "default_shift_role_id": 12,
  "default_location_id": 3,
  "additional_preferences": {
    "theme": "dark",
    "language": "en"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:45:00Z"
}`}
              </pre>
              <p className="text-xs text-muted-foreground mt-2">
                Returns null for any unset values. Auto-creates preferences if they don't exist.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Update User Preferences</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Endpoint: <code className="bg-muted px-1 py-0.5 rounded">PUT /api/v1/profile/preferences</code>
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Request Body (all fields optional - partial update supported):
              </p>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                {`{
  "default_job_role_id": 5,
  "default_shift_role_id": 12,
  "default_location_id": 3,
  "additional_preferences": {
    "theme": "dark",
    "language": "en",
    "notification_preferences": {
      "email": true,
      "push": false
    }
  }
}`}
              </pre>
              <p className="text-xs text-muted-foreground mt-2">
                Only include fields you want to update. Omitted fields remain unchanged. The <code className="bg-muted px-1 py-0.5 rounded">additional_preferences</code> field is a JSON object for future configurations.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Partial Updates</h3>
              <p className="text-sm text-muted-foreground mb-2">
                You can update only specific fields:
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold mb-1">Update only clock defaults:</p>
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                    {`{
  "default_job_role_id": 5,
  "default_shift_role_id": 12,
  "default_location_id": 3
}`}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">Update only UI preferences:</p>
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                    {`{
  "additional_preferences": {
    "theme": "dark",
    "language": "en"
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Validation</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Job role must be one the user has access to</li>
                <li>Shift role must belong to the selected job role</li>
                <li>Location must exist and be active</li>
                <li>API returns 400/403/404 errors if validation fails</li>
                <li>Auto-creation: If preferences don't exist, the first GET request creates them automatically with null values</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Future Extensibility</h3>
              <p className="text-sm text-muted-foreground mb-2">
                The <code className="bg-muted px-1 py-0.5 rounded">additional_preferences</code> field can store any JSON configuration:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>UI preferences (theme, language, layout)</li>
                <li>Notification preferences</li>
                <li>Dashboard settings</li>
                <li>Any other user-specific configurations</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}


