"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogIn, LogOut, History, MapPin, Play, Square } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormSelect } from "@/components/docs/FormMockup";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function ClockInOutDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Check In/Out</h1>
        <p className="text-lg text-muted-foreground">
          Track your work hours and attendance using the check in/out system
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding the check in/out feature</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What is Check In/Out?</h3>
              <p className="text-sm text-muted-foreground">
                The Check In/Out feature allows you to record your work hours by checking in when you start work
                and checking out when you finish. This system tracks your attendance and work time for payroll
                and reporting purposes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Check In/Out</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Check In/Out" in the sidebar navigation</li>
                <li>Use the check button in the header (if available)</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/clock</code></li>
                <li>Requires <code className="bg-muted px-1 py-0.5 rounded">clock:in</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <LogIn className="h-6 w-6 text-green-600" />
              <CardTitle>Check In</CardTitle>
            </div>
            <CardDescription>How to check in for work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step Check In Process</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Navigate to Check In/Out Page</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Go to the Check In/Out page from the sidebar or header.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 2: Check In Form</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    If you're not currently checked in, you'll see the check in form:
                  </p>
                  <FormMockup
                    title="Check In"
                    description="Start your work session"
                  >
                    <div className="space-y-4">
                      <FormSelect
                        label="Location"
                        placeholder="Select your work location"
                        required
                        value="main-office"
                        options={[
                          { value: "main-office", label: "Main Office" },
                          { value: "warehouse-a", label: "Warehouse A" },
                          { value: "remote", label: "Remote/Home Office" },
                        ]}
                      />
                      <FormField
                        label="Notes (Optional)"
                        type="text"
                        placeholder="Add any notes about your work session"
                        value=""
                      />
                      <FormButton className="w-full" icon={Play}>
                        Check In
                      </FormButton>
                    </div>
                  </FormMockup>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 3: Active Session Display</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    After checking in, you'll see your active session:
                  </p>
                  <FormMockup
                    title="Active Clock Session"
                    description="Your current work session"
                  >
                    <div className="space-y-4">
                      <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-semibold">Clocked In</span>
                          </div>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                        <div className="space-y-2 mt-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Check In Time:</span>
                            <span className="font-medium">09:00 AM</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Location:</span>
                            <span className="font-medium">Main Office</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Time Elapsed:</span>
                            <span className="font-bold text-lg">02:34:15</span>
                          </div>
                        </div>
                      </div>
                      <FormButton variant="destructive" className="w-full" icon={Square}>
                        Check Out
                      </FormButton>
                    </div>
                  </FormMockup>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">What Happens When You Check In</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>A new clock session is created with the current timestamp</li>
                <li>Your location is recorded (if GPS/location services are enabled)</li>
                <li>The system tracks your active work time</li>
                <li>You'll see a live timer showing how long you've been clocked in</li>
                <li>Your status changes to "Clocked In"</li>
              </ul>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                <strong>Note:</strong> You can only have one active clock session at a time.
                If you're already checked in, you'll need to check out before starting a new session.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <LogOut className="h-6 w-6 text-red-600" />
              <CardTitle>Check Out</CardTitle>
            </div>
            <CardDescription>How to check out when finishing work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">How to Check Out</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Navigate to the Check In/Out page or use the check button in the header</li>
                <li>If you're currently checked in, you'll see a "Check Out" button</li>
                <li>Review your total time worked (displayed on the timer)</li>
                <li>Optionally add notes about your work session</li>
                <li>Click "Check Out" to end your work session</li>
                <li>You'll see a confirmation message with your total hours worked</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What Happens When You Check Out</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Your clock session is completed with an end timestamp</li>
                <li>Total hours worked are calculated and saved</li>
                <li>The session is recorded in your clock history</li>
                <li>Your status changes to "Clocked Out"</li>
                <li>You can now check in again for a new session</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-purple-600" />
              <CardTitle>Location Tracking</CardTitle>
            </div>
            <CardDescription>How location is used in check in/out</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Location Selection</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  When checking in, you may be required to select your work location:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Select from a list of available locations</li>
                  <li>Your GPS location may be automatically detected (if enabled)</li>
                  <li>Location helps track where work is being performed</li>
                  <li>Some organisations require location verification for compliance</li>
                </ul>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Privacy Note:</strong> Location data is only used for attendance tracking and is
                  stored securely. You may need to grant location permissions in your browser.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <History className="h-6 w-6 text-indigo-600" />
              <CardTitle>Active Session Display</CardTitle>
            </div>
            <CardDescription>Understanding the active clock session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Live Timer</h3>
                <p className="text-sm text-muted-foreground">
                  When you're clocked in, you'll see a live timer showing:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
                  <li>Current time elapsed since checking in</li>
                  <li>Check in time and date</li>
                  <li>Current location (if applicable)</li>
                  <li>Quick access to check out</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Session Information</h3>
                <p className="text-sm text-muted-foreground">
                  The active session display shows all relevant information about your current work period,
                  making it easy to track your hours and check out when needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best Practices</CardTitle>
            <CardDescription>Tips for accurate time tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li><strong>Check in promptly:</strong> Check in as soon as you start work to ensure accurate time tracking</li>
              <li><strong>Check out on time:</strong> Remember to check out when you finish work or take breaks</li>
              <li><strong>Check your status:</strong> Verify that you're clocked in/out correctly before leaving</li>
              <li><strong>Add notes when needed:</strong> Use notes to document any special circumstances or breaks</li>
              <li><strong>Review your history:</strong> Regularly check your clock history to ensure accuracy</li>
              <li><strong>Report issues:</strong> Contact your administrator if you notice any discrepancies</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Common Issues</CardTitle>
            <CardDescription>Troubleshooting check in/out problems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-sm mb-1">Can't Check In</h3>
                <p className="text-xs text-muted-foreground">
                  If you're unable to check in, check that you're not already checked in from a previous session.
                  You may need to check out first or contact your administrator.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Location Not Detected</h3>
                <p className="text-xs text-muted-foreground">
                  If location tracking is required but not working, ensure your browser has location permissions
                  enabled. You may need to manually select your location from the list.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Timer Not Updating</h3>
                <p className="text-xs text-muted-foreground">
                  If the timer appears frozen, refresh the page. The timer should update automatically,
                  but a page refresh will sync the latest data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

