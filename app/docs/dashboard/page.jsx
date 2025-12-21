"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, TrendingUp, TrendingDown, Users, Activity, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { FormMockup } from "@/components/docs/FormMockup";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function DashboardDocs() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Your central hub for viewing key metrics, statistics, and quick access to important features
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-6 w-6 text-blue-600" />
              <CardTitle>Overview</CardTitle>
            </div>
            <CardDescription>Understanding the dashboard interface</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">What is the Dashboard?</h3>
              <p className="text-sm text-muted-foreground">
                The dashboard is the first page you see after logging in. It provides a comprehensive overview of your organisation's
                activity, key metrics, and quick access to frequently used features. The dashboard content varies based on your role and permissions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Accessing the Dashboard</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Automatically displayed after successful login</li>
                <li>Accessible via the "Dashboard" link in the sidebar navigation</li>
                <li>URL: <code className="bg-muted px-1 py-0.5 rounded">/admin</code></li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <CardTitle>Key Metrics & Statistics</CardTitle>
            </div>
            <CardDescription>Understanding the metrics displayed on your dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-4">Dashboard View</h3>
              <p className="text-sm text-muted-foreground mb-4">
                When you log in, you'll see the dashboard with various metric cards. Here's what it looks like:
              </p>
              <FormMockup
                title="Dashboard Overview"
                description="Your central hub showing key metrics and statistics"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Dashboard</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Today</Badge>
                      <button className="p-2 hover:bg-muted rounded-md" disabled>
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <h4 className="text-2xl font-bold mb-1">1,234</h4>
                      <p className="text-xs text-muted-foreground">Total Users</p>
                      <p className="text-xs text-green-600 mt-1">+12% from last month</p>
                    </div>

                    <div className="p-4 border rounded-lg bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <h4 className="text-2xl font-bold mb-1">856</h4>
                      <p className="text-xs text-muted-foreground">Completed Tasks</p>
                      <p className="text-xs text-green-600 mt-1">+8% from last week</p>
                    </div>

                    <div className="p-4 border rounded-lg bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <Activity className="h-5 w-5 text-purple-600" />
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      </div>
                      <h4 className="text-2xl font-bold mb-1">342</h4>
                      <p className="text-xs text-muted-foreground">Active Sessions</p>
                      <p className="text-xs text-red-600 mt-1">-5% from yesterday</p>
                    </div>

                    <div className="p-4 border rounded-lg bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                      </div>
                      <h4 className="text-2xl font-bold mb-1">23</h4>
                      <p className="text-xs text-muted-foreground">Pending Alerts</p>
                    </div>
                  </div>
                </div>
              </FormMockup>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Available Metrics</h3>
              <p className="text-sm text-muted-foreground mb-3">
                The dashboard displays various metrics depending on your role. Common metrics include:
              </p>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">User Statistics</h4>
                    <p className="text-xs text-muted-foreground">Total users, active users, new users, and user growth trends</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Activity className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Activity Metrics</h4>
                    <p className="text-xs text-muted-foreground">Task completion rates, form submissions, check-in records</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Task Metrics</h4>
                    <p className="text-xs text-muted-foreground">Total tasks, completed tasks, pending tasks, overdue tasks</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm">Alerts & Notifications</h4>
                    <p className="text-xs text-muted-foreground">Important notifications, pending approvals, system alerts</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Time Period Selection</h3>
              <p className="text-sm text-muted-foreground mb-2">
                You can filter dashboard metrics by different time periods:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Day:</strong> View metrics for the current day</li>
                <li><strong>Week:</strong> View metrics for the current week</li>
                <li><strong>Month:</strong> View metrics for the current month</li>
                <li><strong>Year:</strong> View metrics for the current year</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Historical Data</h3>
              <p className="text-sm text-muted-foreground">
                Toggle the "Include Historical" option to include or exclude historical data in your metrics.
                This helps you compare current performance with past periods.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <TrendingDown className="h-6 w-6 text-red-600" />
              <CardTitle>Trend Indicators</CardTitle>
            </div>
            <CardDescription>Understanding trend arrows and indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Upward Trend</h4>
                  <p className="text-xs text-muted-foreground">Indicates an increase compared to the previous period</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Downward Trend</h4>
                  <p className="text-xs text-muted-foreground">Indicates a decrease compared to the previous period</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common actions accessible from the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              The dashboard provides quick access to frequently used features:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>View and manage your tasks</li>
              <li>Check in/out for time tracking</li>
              <li>Access recent forms and submissions</li>
              <li>View notifications and alerts</li>
              <li>Navigate to different sections of the application</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role-Based Dashboard</CardTitle>
            <CardDescription>How your role affects dashboard content</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              The dashboard content is customised based on your role and permissions:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li><strong>Regular Users:</strong> See personal metrics, assigned tasks, and their own activity</li>
              <li><strong>Managers:</strong> See team metrics, department statistics, and team activity</li>
              <li><strong>Administrators:</strong> See organisation-wide metrics, system statistics, and all activity</li>
              <li><strong>Superusers:</strong> See comprehensive system metrics and full administrative access</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Refreshing Data</CardTitle>
            <CardDescription>How to update dashboard metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Dashboard data is automatically refreshed periodically. You can also manually refresh the data by clicking
              the refresh button (if available) or by reloading the page. The refresh button ensures you have the most
              up-to-date information.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

