"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, MapPin, Filter, Search, Eye, User, AlertCircle, RefreshCw } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormSelect } from "@/components/docs/FormMockup";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ActiveClocksDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Active People</h1>
        <p className="text-lg text-muted-foreground">
          Monitor active check-in sessions across the organisation
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding active people monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What are Active People?</h3>
              <p className="text-sm text-muted-foreground">
                Active People shows all employees who are currently checked in across your organisation.
                This helps managers and administrators monitor who is working, track attendance in real-time,
                and ensure proper time tracking. You can see who is working, where they are, and how long
                they've been checked in.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Active People</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Active People" in the sidebar under Settings</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/clock</code></li>
                <li>Requires <code className="bg-muted px-1 py-0.5 rounded">clock:view_all</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-green-600" />
              <CardTitle>Active People Interface</CardTitle>
            </div>
            <CardDescription>Understanding the active people display</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Active People Dashboard</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The Active People page displays all currently active clock sessions:
              </p>
              <FormMockup
                title="Active People"
                description="Real-time view of all active clock sessions"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Active People</h3>
                      <p className="text-xs text-muted-foreground">12 employees currently checked in</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <FormButton variant="outline" size="sm" icon={RefreshCw}>
                        Refresh
                      </FormButton>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by name, location..."
                        className="w-full px-10 py-2 border rounded-md text-sm"
                        disabled
                        value=""
                      />
                    </div>
                    <FormSelect
                      placeholder="All Locations"
                      value=""
                      options={[
                        { value: "all", label: "All Locations" },
                        { value: "office-1", label: "Main Office" },
                        { value: "office-2", label: "Branch Office" },
                      ]}
                      className="w-40"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">Alex Brown</h4>
                            <p className="text-xs text-muted-foreground">alex.brown@example.com</p>
                          </div>
                        </div>
                        <Badge className="bg-green-500 text-xs">
                          <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                          Active
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground mb-1">Check In</p>
                          <p className="font-medium">09:00 AM</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Location</p>
                          <p className="font-medium">Main Office</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Time Elapsed</p>
                          <p className="font-bold text-lg">02:34:15</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Department</p>
                          <p className="font-medium">Operations</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">Sarah Williams</h4>
                            <p className="text-xs text-muted-foreground">sarah.williams@example.com</p>
                          </div>
                        </div>
                        <Badge className="bg-green-500 text-xs">
                          <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                          Active
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground mb-1">Check In</p>
                          <p className="font-medium">08:45 AM</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Location</p>
                          <p className="font-medium">Branch Office</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Time Elapsed</p>
                          <p className="font-bold text-lg">02:49:30</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Department</p>
                          <p className="font-medium">Operations</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FormMockup>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Information Displayed</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Each active clock session shows:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Employee Name:</strong> Name of the clocked-in employee</li>
                <li><strong>Email:</strong> Employee email address</li>
                <li><strong>Check In Time:</strong> When the employee checked in</li>
                <li><strong>Location:</strong> Where the employee checked in</li>
                <li><strong>Time Elapsed:</strong> Live timer showing how long they've been checked in</li>
                <li><strong>Department:</strong> Employee's department</li>
                <li><strong>Status Badge:</strong> Visual indicator showing active status</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Eye className="h-6 w-6 text-indigo-600" />
              <CardTitle>Viewing Session Details</CardTitle>
            </div>
            <CardDescription>How to view detailed active session information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step: View Active Session Details</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Find the Active Session</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Browse the active people list or use search to find the employee's session.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 2: Click to View Details</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click on an active session card to view detailed information.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 3: Review Session Information</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    The details dialog shows comprehensive session information:
                  </p>
                  <DialogMockup
                    title="Active Session Details"
                    description="Detailed information about this active clock session"
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Close
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-sm">Alex Brown</h4>
                            <p className="text-xs text-muted-foreground">alex.brown@example.com</p>
                          </div>
                          <Badge className="bg-green-500 text-xs">
                            <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                            Active
                          </Badge>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Check In Time</p>
                          <p className="text-sm font-medium">09:00 AM</p>
                          <p className="text-xs text-muted-foreground">Jan 15, 2024</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Location</p>
                          <p className="text-sm font-medium">Main Office</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Time Elapsed</p>
                          <p className="text-sm font-bold text-lg">02:34:15</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Department</p>
                          <p className="text-sm font-medium">Operations</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Role</p>
                          <p className="text-sm font-medium">Manager</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Session ID</p>
                          <p className="text-sm font-medium">CLK-2024-001</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm">Regular work day</p>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-xs font-semibold mb-2">Estimated Check Out</p>
                        <p className="text-sm">Based on average: ~05:30 PM</p>
                      </div>
                    </div>
                  </DialogMockup>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Filter className="h-6 w-6 text-purple-600" />
              <CardTitle>Filtering & Searching</CardTitle>
            </div>
            <CardDescription>How to find specific active sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Search Functionality</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Use the search bar to find active sessions by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Employee name</li>
                <li>Email address</li>
                <li>Department name</li>
                <li>Location name</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Filter Options</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Filter active people by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Location:</strong> Show only active sessions at specific locations</li>
                <li><strong>Department:</strong> Filter by employee department</li>
                <li><strong>Role:</strong> Filter by employee role</li>
                <li><strong>Duration:</strong> Show sessions by how long they've been active</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 text-blue-600" />
              <CardTitle>Real-Time Updates</CardTitle>
            </div>
            <CardDescription>How the active people update automatically</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Automatic Refresh</h3>
              <p className="text-sm text-muted-foreground mb-2">
                The Active People page automatically updates:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>When new employees check in, they appear in the list</li>
                <li>When employees check out, they are removed from the list</li>
                <li>Time elapsed timers update every second</li>
                <li>Session information refreshes periodically</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Manual Refresh</h3>
              <p className="text-sm text-muted-foreground mb-2">
                You can manually refresh the data:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click the "Refresh" button to immediately update all data</li>
                <li>Refresh ensures you have the most current information</li>
                <li>Useful when you need to verify current status</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              <CardTitle>Monitoring & Alerts</CardTitle>
            </div>
            <CardDescription>What to watch for in active people</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Things to Monitor</h3>
              <p className="text-sm text-muted-foreground mb-2">
                When monitoring active people, watch for:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Long Sessions:</strong> Sessions that have been active for unusually long periods</li>
                <li><strong>Missing Employees:</strong> Employees who should be working but aren't checked in</li>
                <li><strong>Location Mismatches:</strong> Employees checked in at unexpected locations</li>
                <li><strong>Multiple Sessions:</strong> Employees with multiple active sessions (shouldn't happen)</li>
                <li><strong>Stale Sessions:</strong> Sessions that appear to be stuck or not updating</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Taking Action</h3>
              <p className="text-sm text-muted-foreground mb-2">
                If you notice issues:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Click on the session to view details</li>
                <li>Contact the employee if there's a concern</li>
                <li>Document any discrepancies</li>
                <li>Report issues to administrators if needed</li>
                <li>Use the refresh button to ensure you have current data</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics & Summary</CardTitle>
            <CardDescription>Overview of active clock sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-4">Summary Information</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The Active People page displays summary statistics:
              </p>
              <FormMockup
                title="Active People Summary"
                description="Overview of current active sessions"
              >
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Total Active</p>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-xs text-muted-foreground">employees</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">By Location</p>
                    <p className="text-sm font-medium">8 Main Office</p>
                    <p className="text-sm font-medium">4 Facilities</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Average Duration</p>
                    <p className="text-2xl font-bold">2.5h</p>
                    <p className="text-xs text-muted-foreground">per session</p>
                  </div>
                </div>
              </FormMockup>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
