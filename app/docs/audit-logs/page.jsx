"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Filter, Search, Calendar, Eye, Download, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, LogIn, LogOut, Shield, User, Activity, Plus, Edit, Trash2 } from "lucide-react";
import { FormMockup, DialogMockup, FormField, FormButton, FormSelect } from "@/components/docs/FormMockup";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function AuditLogsDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Audit Logs</h1>
        <p className="text-lg text-muted-foreground">
          View system activity and audit trails
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding audit logs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What are Audit Logs?</h3>
              <p className="text-sm text-muted-foreground">
                Audit logs record all significant activities and changes in the system, including user actions,
                data modifications, access attempts, system events, security events, and administrative changes.
                Audit logs provide a complete trail of system activity for compliance, security, and troubleshooting purposes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Audit Logs</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click "Audit Logs" in the sidebar under Settings</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin/audit-logs</code></li>
                <li>Requires <code className="bg-muted px-1 py-0.5 rounded">SYSTEM_MONITOR</code> permission</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-green-600" />
              <CardTitle>Audit Logs Interface</CardTitle>
            </div>
            <CardDescription>Understanding the audit logs display</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Audit Logs Page Layout</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The audit logs page displays all system activity in a comprehensive table:
              </p>
              <FormMockup
                title="Audit Logs"
                description="Complete system activity and audit trail"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Audit Logs</h3>
                      <p className="text-xs text-muted-foreground">System activity and audit trail</p>
                    </div>
                    <FormButton variant="outline" size="sm" icon={Download}>
                      Export
                    </FormButton>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    <FormSelect
                      placeholder="All Users"
                      value=""
                      options={[
                        { value: "all", label: "All Users" },
                        { value: "user-1", label: "Alex Brown" },
                        { value: "user-2", label: "Sarah Williams" },
                      ]}
                    />
                    <FormSelect
                      placeholder="All Actions"
                      value=""
                      options={[
                        { value: "all", label: "All Actions" },
                        { value: "create", label: "Create" },
                        { value: "update", label: "Update" },
                        { value: "delete", label: "Delete" },
                        { value: "login", label: "Login" },
                      ]}
                    />
                    <FormSelect
                      placeholder="All Resources"
                      value=""
                      options={[
                        { value: "all", label: "All Resources" },
                        { value: "task", label: "Task" },
                        { value: "user", label: "User" },
                        { value: "form", label: "Form" },
                      ]}
                    />
                    <FormSelect
                      placeholder="All Severities"
                      value=""
                      options={[
                        { value: "all", label: "All Severities" },
                        { value: "info", label: "Info" },
                        { value: "warning", label: "Warning" },
                        { value: "error", label: "Error" },
                        { value: "critical", label: "Critical" },
                      ]}
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by resource ID..."
                        className="w-full px-10 py-2 border rounded-md text-sm"
                        disabled
                        value=""
                      />
                    </div>
                    <FormButton variant="outline" size="sm" icon={Calendar}>
                      Date Range
                    </FormButton>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-3 text-left font-semibold">Timestamp</th>
                          <th className="p-3 text-left font-semibold">User</th>
                          <th className="p-3 text-left font-semibold">Action</th>
                          <th className="p-3 text-left font-semibold">Resource</th>
                          <th className="p-3 text-left font-semibold">Severity</th>
                          <th className="p-3 text-left font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t hover:bg-muted/30">
                          <td className="p-3">
                            <div>
                              <p className="text-xs font-medium">Jan 15, 2024</p>
                              <p className="text-xs text-muted-foreground">10:30:45 AM</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Alex Brown</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4 text-green-600" />
                              <span className="text-sm">create</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs">task</Badge>
                            <p className="text-xs text-muted-foreground mt-1">ID: 123</p>
                          </td>
                          <td className="p-3">
                            <Badge className="bg-blue-500 text-xs">info</Badge>
                          </td>
                          <td className="p-3">
                            <button className="p-1 hover:bg-muted rounded" disabled>
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                        <tr className="border-t hover:bg-muted/30">
                          <td className="p-3">
                            <div>
                              <p className="text-xs font-medium">Jan 15, 2024</p>
                              <p className="text-xs text-muted-foreground">10:25:12 AM</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Sarah Williams</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <LogIn className="h-4 w-4 text-blue-600" />
                              <span className="text-sm">login</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs">user</Badge>
                            <p className="text-xs text-muted-foreground mt-1">ID: 456</p>
                          </td>
                          <td className="p-3">
                            <Badge className="bg-blue-500 text-xs">info</Badge>
                          </td>
                          <td className="p-3">
                            <button className="p-1 hover:bg-muted rounded" disabled>
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                        <tr className="border-t hover:bg-muted/30 bg-red-50 dark:bg-red-950/20">
                          <td className="p-3">
                            <div>
                              <p className="text-xs font-medium">Jan 15, 2024</p>
                              <p className="text-xs text-muted-foreground">10:20:33 AM</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Unknown User</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <span className="text-sm">unauthorized_access</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs">system</Badge>
                          </td>
                          <td className="p-3">
                            <Badge className="bg-red-600 text-xs">critical</Badge>
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
                    <p className="text-xs text-muted-foreground">Showing 1-50 of 1,234 records</p>
                    <div className="flex items-center gap-2">
                      <FormButton variant="outline" size="sm">
                        <ChevronLeft className="h-4 w-4" />
                      </FormButton>
                      <span className="text-sm">Page 1 of 25</span>
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
              <h3 className="font-semibold mb-2">Audit Log Columns</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Each audit log entry contains:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Timestamp:</strong> Exact date and time of the action</li>
                <li><strong>User:</strong> User who performed the action (or "System" for automated actions)</li>
                <li><strong>Action:</strong> The action performed (create, update, delete, login, etc.)</li>
                <li><strong>Resource:</strong> The resource type affected (task, user, form, etc.)</li>
                <li><strong>Resource ID:</strong> The specific resource identifier</li>
                <li><strong>Severity:</strong> Log severity level (info, warning, error, critical)</li>
                <li><strong>IP Address:</strong> IP address from which the action was performed</li>
                <li><strong>User Agent:</strong> Browser/client information</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Eye className="h-6 w-6 text-indigo-600" />
              <CardTitle>Viewing Log Details</CardTitle>
            </div>
            <CardDescription>How to view detailed audit log information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step: View Log Details</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Find the Log Entry</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Browse or search the audit logs table to find the entry you want to view.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 2: Click View Details</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click the eye icon in the Actions column to open the details dialog.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 3: Review Complete Log Information</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    The details dialog shows comprehensive log information:
                  </p>
                  <DialogMockup
                    title="Audit Log Details"
                    description="Complete information about this audit log entry"
                    footer={
                      <>
                        <FormButton variant="outline" size="sm">
                          Close
                        </FormButton>
                        <FormButton size="sm" icon={Download}>
                          Export Entry
                        </FormButton>
                      </>
                    }
                  >
                    <div className="space-y-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">Log ID: AUDIT-2024-001234</h4>
                          <Badge className="bg-blue-500 text-xs">info</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">January 15, 2024 at 10:30:45 AM</p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">User</p>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm font-medium">Alex Brown</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">alex.brown@example.com</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Action</p>
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4 text-green-600" />
                            <p className="text-sm font-medium">create</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Resource Type</p>
                          <Badge variant="outline" className="text-xs">task</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Resource ID</p>
                          <p className="text-sm font-medium">123</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">IP Address</p>
                          <p className="text-sm font-medium">192.168.1.100</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">User Agent</p>
                          <p className="text-xs font-medium">Chrome 120.0</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">User created a new task: "Complete quarterly report"</p>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-xs font-semibold mb-2">Changes Made</p>
                        <div className="p-3 bg-muted rounded-lg">
                          <pre className="text-xs overflow-auto">
                            {`{
  "title": "Complete quarterly report",
  "status": "pending",
  "priority": "high",
  "assigned_to_user_id": 456
}`}
                          </pre>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <p className="text-xs font-semibold mb-2">Metadata</p>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Session ID:</span>
                            <span className="font-mono">sess_abc123</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Request ID:</span>
                            <span className="font-mono">req_xyz789</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Duration:</span>
                            <span>245ms</span>
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
              <CardTitle>Filtering Audit Logs</CardTitle>
            </div>
            <CardDescription>How to filter and search audit logs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Filter Options</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use filters to narrow down audit logs:
              </p>
              <FormMockup
                title="Filter Audit Logs"
                description="Apply filters to find specific log entries"
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
                    label="User"
                    placeholder="All Users"
                    value=""
                    options={[
                      { value: "all", label: "All Users" },
                      { value: "user-1", label: "Alex Brown" },
                      { value: "user-2", label: "Sarah Williams" },
                    ]}
                  />

                  <FormSelect
                    label="Action"
                    placeholder="All Actions"
                    value=""
                    options={[
                      { value: "all", label: "All Actions" },
                      { value: "create", label: "Create" },
                      { value: "update", label: "Update" },
                      { value: "delete", label: "Delete" },
                      { value: "login", label: "Login" },
                      { value: "logout", label: "Logout" },
                      { value: "unauthorized_access", label: "Unauthorized Access" },
                    ]}
                  />

                  <FormSelect
                    label="Resource Type"
                    placeholder="All Resources"
                    value=""
                    options={[
                      { value: "all", label: "All Resources" },
                      { value: "task", label: "Task" },
                      { value: "user", label: "User" },
                      { value: "form", label: "Form" },
                      { value: "asset", label: "Asset" },
                    ]}
                  />

                  <FormSelect
                    label="Severity"
                    placeholder="All Severities"
                    value=""
                    options={[
                      { value: "all", label: "All Severities" },
                      { value: "debug", label: "Debug" },
                      { value: "info", label: "Info" },
                      { value: "warning", label: "Warning" },
                      { value: "error", label: "Error" },
                      { value: "critical", label: "Critical" },
                    ]}
                  />

                  <FormField
                    label="Resource ID"
                    type="text"
                    placeholder="Search by resource ID..."
                    value=""
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
              <h3 className="font-semibold mb-2">Search Functionality</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Use the search bar to find logs by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Resource ID (specific task, user, form ID, etc.)</li>
                <li>User email or username</li>
                <li>Action name</li>
                <li>Resource type</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Download className="h-6 w-6 text-indigo-600" />
              <CardTitle>Exporting Audit Logs</CardTitle>
            </div>
            <CardDescription>How to export audit log data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Step-by-Step: Export Audit Logs</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 1: Apply Filters (Optional)</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Apply any filters you want to include in the export (date range, user, action, etc.).
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Step 2: Click Export</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click the "Export" button in the top right corner.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Step 3: Select Export Format</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose your preferred export format:
                  </p>
                  <DialogMockup
                    title="Export Audit Logs"
                    description="Export audit log records"
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
                        <p className="text-xs text-muted-foreground">1,234 records</p>
                      </div>

                      <FormSelect
                        label="Export Format"
                        placeholder="Select format"
                        value="csv"
                        options={[
                          { value: "csv", label: "CSV (Comma Separated Values)" },
                          { value: "pdf", label: "PDF (Portable Document Format)" },
                          { value: "json", label: "JSON (JavaScript Object Notation)" },
                        ]}
                      />

                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-semibold mb-2">Include Fields:</p>
                        <div className="space-y-1">
                          <label className="flex items-center gap-2 text-xs">
                            <input type="checkbox" checked disabled className="rounded" />
                            <span>Timestamp, User, Action, Resource</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs">
                            <input type="checkbox" checked disabled className="rounded" />
                            <span>Severity, IP Address, User Agent</span>
                          </label>
                          <label className="flex items-center gap-2 text-xs">
                            <input type="checkbox" checked disabled className="rounded" />
                            <span>Description, Changes, Metadata</span>
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
                <li><strong>CSV:</strong> Spreadsheet format for analysis in Excel or Google Sheets</li>
                <li><strong>PDF:</strong> Formatted document for printing or sharing, includes headers and formatting</li>
                <li><strong>JSON:</strong> Machine-readable format for programmatic analysis or integration</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              <CardTitle>Log Severity Levels</CardTitle>
            </div>
            <CardDescription>Understanding different severity levels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Severity Levels</h3>
              <div className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-red-600 text-xs">critical</Badge>
                    <h4 className="font-semibold text-sm">Critical</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Critical security events, system failures, or unauthorized access attempts
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-red-500 text-xs">error</Badge>
                    <h4 className="font-semibold text-sm">Error</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Errors that prevent operations or indicate problems
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-yellow-500 text-xs">warning</Badge>
                    <h4 className="font-semibold text-sm">Warning</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Warnings about potential issues or unusual activity
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-blue-500 text-xs">info</Badge>
                    <h4 className="font-semibold text-sm">Info</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Normal system operations and user actions
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-gray-500 text-xs">debug</Badge>
                    <h4 className="font-semibold text-sm">Debug</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Detailed debugging information for troubleshooting
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-blue-600" />
              <CardTitle>Common Actions Tracked</CardTitle>
            </div>
            <CardDescription>Types of actions recorded in audit logs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">CRUD Operations</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Plus className="h-4 w-4 text-green-600" />
                    <h4 className="font-semibold text-sm">create</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">Resource creation</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-sm">read</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">Resource viewing</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Edit className="h-4 w-4 text-orange-600" />
                    <h4 className="font-semibold text-sm">update</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">Resource modification</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Trash2 className="h-4 w-4 text-red-600" />
                    <h4 className="font-semibold text-sm">delete</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">Resource deletion</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Authentication Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <LogIn className="h-4 w-4 text-green-600" />
                    <h4 className="font-semibold text-sm">login</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">Successful login</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <LogOut className="h-4 w-4 text-blue-600" />
                    <h4 className="font-semibold text-sm">logout</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">User logout</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <h4 className="font-semibold text-sm">login_failed</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">Failed login attempt</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <h4 className="font-semibold text-sm">password_change</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">Password changed</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Security Actions</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><code className="bg-muted px-1 py-0.5 rounded">unauthorized_access</code> - Unauthorized access attempts</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">suspicious_activity</code> - Suspicious behavior detected</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">security_violation</code> - Security policy violations</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">account_lock</code> - Account lockout events</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">rate_limit_exceeded</code> - Rate limiting triggers</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pagination & Navigation</CardTitle>
            <CardDescription>How to navigate through audit logs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Pagination Controls</h3>
              <p className="text-sm text-muted-foreground mb-2">
                When you have many audit log entries, use pagination:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Previous/Next Buttons:</strong> Navigate between pages</li>
                <li><strong>Page Numbers:</strong> Click specific page numbers to jump to that page</li>
                <li><strong>Items Per Page:</strong> Change how many records are shown (10, 25, 50, 100)</li>
                <li><strong>Total Records:</strong> See how many total records match your filters</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Quick Navigation Tips</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Use date range filters to jump to specific time periods</li>
                <li>Filter by severity to focus on critical issues</li>
                <li>Search by resource ID to track specific items</li>
                <li>Filter by user to see all actions by a specific person</li>
                <li>Use action filters to see specific types of operations</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Using Audit Logs for Security</CardTitle>
            <CardDescription>How to use audit logs for security monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Security Monitoring</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Use audit logs to monitor security:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Monitor for unauthorized access attempts</li>
                <li>Track failed login attempts and potential brute force attacks</li>
                <li>Identify suspicious activity patterns</li>
                <li>Review critical severity events immediately</li>
                <li>Track permission changes and role assignments</li>
                <li>Monitor data deletion and sensitive operations</li>
                <li>Review IP addresses for unusual access patterns</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Compliance & Reporting</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Audit logs support compliance requirements:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Export logs for compliance audits</li>
                <li>Generate reports on user activity</li>
                <li>Track data access for privacy compliance</li>
                <li>Document administrative changes</li>
                <li>Maintain records for regulatory requirements</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Troubleshooting</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Use audit logs for troubleshooting:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Trace the sequence of events leading to an issue</li>
                <li>Identify when problems occurred</li>
                <li>See what actions were taken before an error</li>
                <li>Review system events and configuration changes</li>
                <li>Correlate user actions with system behavior</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
