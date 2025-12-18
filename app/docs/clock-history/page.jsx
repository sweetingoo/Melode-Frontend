"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Calendar, Clock, Filter, Download, Search, MapPin, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormSelect } from "@/components/docs/FormMockup";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ClockHistoryDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Session History</h1>
        <p className="text-lg text-muted-foreground">
          View and review your check in/out history and work hours
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <History className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding the clock history feature</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What is Session History?</h3>
              <p className="text-sm text-muted-foreground">
                Session History provides a comprehensive record of all your check in/out sessions,
                including timestamps, locations, duration, and total hours worked. This helps you
                track your attendance and verify your work hours.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Session History</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Session History" in the sidebar navigation</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/clock/history</code></li>
                <li>Requires <code className="bg-muted px-1 py-0.5 rounded">clock:view</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-green-600" />
              <CardTitle>Session History Interface</CardTitle>
            </div>
            <CardDescription>Understanding the history display</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">History Page Layout</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The clock history page displays all your clock sessions in a table format:
              </p>
              <FormMockup
                title="Session History"
                description="Complete record of all check in/out sessions"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Session History</h3>
                    <div className="flex items-center gap-2">
                      <FormButton variant="outline" size="sm" icon={Download}>
                        Export
                      </FormButton>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search history..."
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
                      ]}
                      className="w-40"
                    />
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-3 text-left font-semibold">Date</th>
                          <th className="p-3 text-left font-semibold">Check In</th>
                          <th className="p-3 text-left font-semibold">Check Out</th>
                          <th className="p-3 text-left font-semibold">Duration</th>
                          <th className="p-3 text-left font-semibold">Location</th>
                          <th className="p-3 text-left font-semibold">Status</th>
                          <th className="p-3 text-left font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t hover:bg-muted/30">
                          <td className="p-3">Jan 15, 2024</td>
                          <td className="p-3">09:00 AM</td>
                          <td className="p-3">05:30 PM</td>
                          <td className="p-3 font-medium">8h 30m</td>
                          <td className="p-3">Main Office</td>
                          <td className="p-3">
                            <Badge className="bg-green-500 text-xs">Completed</Badge>
                          </td>
                          <td className="p-3">
                            <button className="p-1 hover:bg-muted rounded" disabled>
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                        <tr className="border-t hover:bg-muted/30">
                          <td className="p-3">Jan 14, 2024</td>
                          <td className="p-3">08:45 AM</td>
                          <td className="p-3">05:15 PM</td>
                          <td className="p-3 font-medium">8h 30m</td>
                          <td className="p-3">Main Office</td>
                          <td className="p-3">
                            <Badge className="bg-green-500 text-xs">Completed</Badge>
                          </td>
                          <td className="p-3">
                            <button className="p-1 hover:bg-muted rounded" disabled>
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                        <tr className="border-t hover:bg-muted/30 bg-muted/20">
                          <td className="p-3">Jan 13, 2024</td>
                          <td className="p-3">09:00 AM</td>
                          <td className="p-3">—</td>
                          <td className="p-3 font-medium">Active</td>
                          <td className="p-3">Main Office</td>
                          <td className="p-3">
                            <Badge className="bg-blue-500 text-xs">Active</Badge>
                          </td>
                          <td className="p-3">
                            <button className="p-1 hover:bg-muted rounded" disabled>
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-muted-foreground">Showing 1-10 of 45 records</p>
                    <div className="flex items-center gap-2">
                      <FormButton variant="outline" size="sm">
                        <ChevronLeft className="h-4 w-4" />
                      </FormButton>
                      <span className="text-sm">Page 1 of 5</span>
                      <FormButton variant="outline" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </FormButton>
                    </div>
                  </div>
                </div>
              </FormMockup>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">History Display Columns</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Each clock session record shows:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Date:</strong> The date of the clock session</li>
                <li><strong>Check In Time:</strong> When you checked in</li>
                <li><strong>Check Out Time:</strong> When you checked out (if completed)</li>
                <li><strong>Duration:</strong> Total hours worked for that session</li>
                <li><strong>Location:</strong> Where you checked in/out</li>
                <li><strong>Status:</strong> Whether the session is active or completed</li>
                <li><strong>Actions:</strong> View details button</li>
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
            <CardDescription>How to view detailed session information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step: View Session Details</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Find the Session</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Browse or search the history table to find the session you want to view.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 2: Click View Details</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click the eye icon in the Actions column to open the session details dialog.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 3: Review Session Information</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    The details dialog shows comprehensive session information:
                  </p>
                  <DialogMockup
                    title="Clock Session Details"
                    description="Complete information about this clock session"
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Close
                        </FormButton>
                        <FormButton size="sm" icon={Download}>
                          Export Session
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">Session ID: CLK-2024-001</h4>
                          <Badge className="bg-green-500 text-xs">Completed</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">January 15, 2024</p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Check In Time</p>
                          <p className="text-sm font-medium">09:00 AM</p>
                          <p className="text-xs text-muted-foreground">Jan 15, 2024</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Check Out Time</p>
                          <p className="text-sm font-medium">05:30 PM</p>
                          <p className="text-xs text-muted-foreground">Jan 15, 2024</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Duration</p>
                          <p className="text-sm font-bold">8 hours 30 minutes</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Location</p>
                          <p className="text-sm font-medium">Main Office</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm">Regular work day, no breaks</p>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-xs font-semibold mb-2">Session Timeline</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>09:00 AM - Checked In at Main Office</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>12:00 PM - Lunch break (30 minutes)</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>05:30 PM - Checked Out at Main Office</span>
                          </div>
                        </div>
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
              <CardTitle>Filtering & Sorting</CardTitle>
            </div>
            <CardDescription>Organise and find specific session records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Filter Options</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use filters to narrow down your clock history:
              </p>
              <FormMockup
                title="Filter Session History"
                description="Apply filters to find specific sessions"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                      <FormField
                        type="date"
                        value="2024-01-01"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                      <FormField
                        type="date"
                        value="2024-01-31"
                      />
                    </div>
                  </div>

                  <FormSelect
                    label="Status"
                    placeholder="All Statuses"
                    value=""
                    options={[
                      { value: "all", label: "All Statuses" },
                      { value: "completed", label: "Completed" },
                      { value: "active", label: "Active" },
                      { value: "incomplete", label: "Incomplete" },
                    ]}
                  />

                  <FormSelect
                    label="Location"
                    placeholder="All Locations"
                    value=""
                    options={[
                      { value: "all", label: "All Locations" },
                      { value: "office-1", label: "Main Office" },
                      { value: "office-2", label: "Branch Office" },
                    ]}
                  />

                  <div className="flex gap-2 pt-2">
                    <FormButton variant="outline" className="flex-1">
                      Clear Filters
                    </FormButton>
                    <FormButton className="flex-1" icon={Filter}>
                      Apply Filters
                    </FormButton>
                  </div>
                </div>
              </FormMockup>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Sort Options</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Sort your records by clicking column headers:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Date:</strong> Sort by date (newest first or oldest first)</li>
                <li><strong>Check In Time:</strong> Sort by check in time</li>
                <li><strong>Duration:</strong> Sort by hours worked (longest or shortest)</li>
                <li><strong>Location:</strong> Sort alphabetically by location</li>
                <li><strong>Status:</strong> Group by status (Active, Completed, Incomplete)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Download className="h-6 w-6 text-indigo-600" />
              <CardTitle>Exporting History</CardTitle>
            </div>
            <CardDescription>Download your clock history records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step: Export Session History</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Apply Filters (Optional)</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    If you want to export specific records, apply filters first (date range, location, status).
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 2: Click Export Button</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click the "Export" button in the top right corner of the history page.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 3: Select Export Format</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose your preferred export format:
                  </p>
                  <DialogMockup
                    title="Export Session History"
                    description="Export your clock history records"
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Cancel
                        </FormButton>
                        <FormButton size="sm" icon={Download}>
                          Export
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <div className="p-3 bg-muted rounded-lg mb-4">
                        <p className="text-xs text-muted-foreground mb-1">Export Range</p>
                        <p className="text-sm font-medium">January 1, 2024 - January 31, 2024</p>
                        <p className="text-xs text-muted-foreground">45 records</p>
                      </div>

                      <FormSelect
                        label="Export Format"
                        placeholder="Select format"
                        value="csv"
                        options={[
                          { value: "csv", label: "CSV (Comma Separated Values)" },
                          { value: "pdf", label: "PDF (Portable Document Format)" },
                          { value: "excel", label: "Excel (Microsoft Excel)" },
                        ]}
                      />

                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-semibold mb-2">Include Columns:</p>
                        <div className="space-y-1">
                          <label className="flex items-center gap-2 text-xs">
                            <input type="checkbox" checked disabled className="rounded" />
                            <span>Date, Check In, Check Out, Duration</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs">
                            <input type="checkbox" checked disabled className="rounded" />
                            <span>Location, Status, Notes</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </DialogMockup>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Export Formats</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>CSV:</strong> Comma-separated values for spreadsheet applications (Excel, Google Sheets)</li>
                <li><strong>PDF:</strong> Formatted document for printing or sharing, includes headers and formatting</li>
                <li><strong>Excel:</strong> Microsoft Excel format with formatting, formulas, and multiple sheets</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary Statistics</CardTitle>
            <CardDescription>Overview of your work hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-4">Statistics Display</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The clock history page displays summary statistics:
              </p>
              <FormMockup
                title="Work Hours Summary"
                description="Statistics for the selected period"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Total Hours</p>
                    <p className="text-2xl font-bold">176.5</p>
                    <p className="text-xs text-green-600">This month</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Average Daily</p>
                    <p className="text-2xl font-bold">8.4h</p>
                    <p className="text-xs text-muted-foreground">Per day</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Total Sessions</p>
                    <p className="text-2xl font-bold">45</p>
                    <p className="text-xs text-muted-foreground">This month</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Active Sessions</p>
                    <p className="text-2xl font-bold">1</p>
                    <p className="text-xs text-blue-600">Currently</p>
                  </div>
                </div>
              </FormMockup>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Available Statistics</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Total Hours:</strong> Sum of all hours worked in the selected period</li>
                <li><strong>Average Hours:</strong> Average hours per day or week</li>
                <li><strong>Total Sessions:</strong> Number of check in/out sessions</li>
                <li><strong>Active Sessions:</strong> Currently active clock sessions</li>
                <li><strong>Completed Sessions:</strong> Finished clock sessions</li>
                <li><strong>Longest Session:</strong> Longest single work session</li>
                <li><strong>Shortest Session:</strong> Shortest single work session</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagination & Navigation</CardTitle>
            <CardDescription>How to navigate through history records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Pagination Controls</h3>
              <p className="text-sm text-muted-foreground mb-2">
                When you have many records, use pagination to navigate:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Previous/Next Buttons:</strong> Navigate between pages</li>
                <li><strong>Page Numbers:</strong> Click specific page numbers to jump to that page</li>
                <li><strong>Items Per Page:</strong> Change how many records are shown per page (10, 25, 50, 100)</li>
                <li><strong>Total Records:</strong> See how many total records match your filters</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Quick Navigation</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Use date range filters to jump to specific time periods</li>
                <li>Search to quickly find sessions by date or location</li>
                <li>Sort columns to organise data differently</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Discrepancies & Corrections</CardTitle>
            <CardDescription>What to do if you notice errors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Reviewing Your History</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Regularly review your clock history to ensure accuracy:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Check that all check in/out times are correct</li>
                <li>Verify total hours match your actual work time</li>
                <li>Look for any missing sessions or incomplete records</li>
                <li>Confirm locations are accurate</li>
                <li>Check for any duplicate entries</li>
                <li>Verify break times are properly recorded (if applicable)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Reporting Issues</h3>
              <p className="text-sm text-muted-foreground mb-2">
                If you notice any discrepancies or errors:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Document the issue (session ID, date, time, what's wrong)</li>
                <li>Take a screenshot of the incorrect record</li>
                <li>Contact your administrator or HR department immediately</li>
                <li>Provide all relevant details to help them correct the record</li>
                <li>Follow up to ensure the correction is made</li>
              </ol>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm">
                <strong>Note:</strong> Only administrators can modify clock history records.
                If you notice an error, report it as soon as possible to ensure accurate time tracking.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
