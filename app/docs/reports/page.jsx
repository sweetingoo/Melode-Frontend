"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileSpreadsheet, BarChart3, Filter, Download, Calendar, Users, Clock, CheckSquare, TrendingUp } from "lucide-react";
import { FormMockup } from "@/components/docs/FormMockup";

export default function ReportsDocumentation() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">Reports</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Generate comprehensive reports and analytics for your organisation's activities and performance.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Overview
            </CardTitle>
            <CardDescription>
              Understanding the reporting system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What are Reports?</h3>
              <p className="text-sm text-muted-foreground">
                The Reports feature provides comprehensive analytics and data exports for various aspects of your 
                organisation, including user activity, task completion, time tracking, and more. Reports help you 
                make data-driven decisions and track performance metrics.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing Reports</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Click "Reports" in the sidebar navigation</li>
                <li>URL: <code className="bg-muted px-1 rounded">/admin/reports</code></li>
                <li>Requires <code className="bg-muted px-1 rounded">reports:read</code> permission or Superuser role</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Available Reports
            </CardTitle>
            <CardDescription>
              Types of reports you can generate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">User Activity Reports</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>User login and activity history</li>
                <li>Time spent in the system</li>
                <li>Feature usage statistics</li>
                <li>Department-wise activity breakdown</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Task Reports</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Task completion rates</li>
                <li>Task assignment distribution</li>
                <li>Task status breakdown</li>
                <li>Task type performance metrics</li>
                <li>Overdue tasks analysis</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Time Tracking Reports</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Clock in/out records</li>
                <li>Total hours worked</li>
                <li>Attendance patterns</li>
                <li>Department-wise time tracking</li>
                <li>Overtime analysis</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Form Submission Reports</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Form submission statistics</li>
                <li>Completion rates</li>
                <li>Form type usage</li>
                <li>Submission trends over time</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Project Reports</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Project progress tracking</li>
                <li>Project task distribution</li>
                <li>Project completion timelines</li>
                <li>Resource allocation analysis</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Report Filters
            </CardTitle>
            <CardDescription>
              Customizing your reports with filters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Date Range Filters</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Select custom date ranges</li>
                <li>Use preset ranges (Today, This Week, This Month, This Year)</li>
                <li>Compare different time periods</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Department Filters</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Filter reports by department</li>
                <li>Compare performance across departments</li>
                <li>Department-specific analytics</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">User Filters</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Filter by specific users</li>
                <li>Filter by roles</li>
                <li>Individual performance reports</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Status Filters</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Filter by task status</li>
                <li>Filter by completion status</li>
                <li>Filter by active/inactive status</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exporting Reports
            </CardTitle>
            <CardDescription>
              Downloading and sharing reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Export Formats</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><strong>CSV</strong>: For spreadsheet applications (Excel, Google Sheets)</li>
                <li><strong>PDF</strong>: For formatted reports and printing</li>
                <li><strong>Excel</strong>: Native Excel format with formatting</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Export Options</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Click "Export" or "Download" button on any report</li>
                <li>Select your preferred format</li>
                <li>Reports are generated with current filters applied</li>
                <li>Large reports may take a moment to generate</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Report Visualizations
            </CardTitle>
            <CardDescription>
              Charts and graphs in reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Chart Types</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4 mb-4">
                <li><strong>Bar Charts</strong>: Compare values across categories</li>
                <li><strong>Line Charts</strong>: Show trends over time</li>
                <li><strong>Pie Charts</strong>: Show distribution and proportions</li>
                <li><strong>Tables</strong>: Detailed data views</li>
              </ul>
              <FormMockup title="Report Visualization Example" description="Sample chart and metrics">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-primary">142</div>
                      <div className="text-xs text-muted-foreground">Total Tasks</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">98</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-600">44</div>
                      <div className="text-xs text-muted-foreground">In Progress</div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Task Completion Rate</span>
                      <span className="font-semibold">69%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "69%" }}></div>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold">Monthly Task Trends</span>
                    </div>
                    <div className="h-24 flex items-end justify-between gap-1">
                      {[65, 72, 68, 85, 78, 82, 90].map((height, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div 
                            className="w-full bg-blue-600 rounded-t" 
                            style={{ height: `${height}%` }}
                          ></div>
                          <span className="text-[10px] text-muted-foreground">M{i+1}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </FormMockup>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Interactive Features</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Hover over chart elements for detailed information</li>
                <li>Click on chart segments to filter data</li>
                <li>Zoom and pan on time-series charts</li>
                <li>Toggle data series visibility</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Permissions
            </CardTitle>
            <CardDescription>
              Required permissions for reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Report Permissions</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li><code className="bg-muted px-1 rounded">reports:read</code> - View and generate reports</li>
                <li><code className="bg-muted px-1 rounded">reports:export</code> - Export reports to files</li>
                <li>Superusers have full access to all reports</li>
                <li>Some reports may require additional permissions (e.g., viewing user data requires user:read)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

