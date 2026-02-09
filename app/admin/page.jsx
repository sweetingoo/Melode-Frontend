"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  User,
  UserPlus,
  Shield,
  Key,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Clock,
  CheckSquare,
  Calendar,
  BarChart3,
  Target,
  Zap,
  ArrowRight,
  FileText,
  Images,
  MapPin,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useDashboardStats } from "@/hooks/useDashboard";
import { useCurrentUser } from "@/hooks/useAuth";
import { useMyStats } from "@/hooks/useProfile";
import { useClockStatus } from "@/hooks/useClock";
import { useMyTasks, useTasks } from "@/hooks/useTasks";
import { useClockRecords } from "@/hooks/useClock";
import { useAssets } from "@/hooks/useAssets";
import { useForms } from "@/hooks/useForms";
import { toast } from "sonner";
import Link from "next/link";
import {
  DashboardPinnedBroadcast,
  DashboardBroadcasts,
  DashboardCompliance,
  DashboardClock,
  DashboardUpcomingShifts,
  DashboardTasks,
  DashboardAnnualLeave,
  DashboardRecentActivity,
  DashboardChartHoursWeek,
  DashboardChartTasksSummary,
  DashboardChartLeaveBalance,
  DashboardChartOverview,
  DashboardChartAssets,
} from "@/components/dashboard";

const Dashboard = () => {
  const [period, setPeriod] = useState("month");
  const [includeHistorical, setIncludeHistorical] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get current user data for permission-based content
  const { data: currentUserData, isLoading: currentUserLoading } =
    useCurrentUser();

  // Get personal stats for regular users
  const { data: myStats, isLoading: myStatsLoading } = useMyStats();
  const { data: clockStatus } = useClockStatus();
  const { data: myTasksData, isLoading: myTasksLoading } = useMyTasks({
    limit: 5,
    status: "pending"
  });
  const { data: recentClockRecords } = useClockRecords({ page: 1, per_page: 5 });

  // Get current user's permissions
  const currentUserPermissions = currentUserData?.permissions || [];
  const currentUserDirectPermissions =
    currentUserData?.direct_permissions || [];

  // Check if current user has wildcard permissions
  const hasWildcardPermissions = React.useMemo(() => {
    const rolePermissions = currentUserPermissions.some(
      (p) =>
        p === "*" ||
        p.id === "*" ||
        p.permission_id === "*" ||
        (typeof p === "object" && (p.permission === "*" || p.name === "*"))
    );
    const directPermissions = currentUserDirectPermissions.some(
      (p) =>
        p === "*" ||
        p.id === "*" ||
        p.permission_id === "*" ||
        (typeof p === "object" && (p.permission === "*" || p.name === "*"))
    );
    return { rolePermissions, directPermissions };
  }, [currentUserPermissions, currentUserDirectPermissions]);

  // Only fetch dashboard data for superadmins (users with wildcard permissions)
  const shouldFetchDashboard =
    isClient &&
    (hasWildcardPermissions.rolePermissions ||
      hasWildcardPermissions.directPermissions);

  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useDashboardStats(
    { period, include_historical: includeHistorical },
    { enabled: shouldFetchDashboard }
  );

  // Get recent activities for dashboard (admin view) - after shouldFetchDashboard is defined
  const { data: recentTasksData } = useTasks(
    { limit: 5, sort_by: "created_at", order: "desc" },
    { enabled: shouldFetchDashboard }
  );
  const { data: recentAssetsData } = useAssets(
    { limit: 5 },
    { enabled: shouldFetchDashboard }
  );
  const { data: recentFormsData } = useForms(
    { limit: 5 },
    { enabled: shouldFetchDashboard }
  );

  // Helper to extract items from different API response formats
  const extractItems = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.items && Array.isArray(data.items)) return data.items;
    if (data.tasks && Array.isArray(data.tasks)) return data.tasks;
    if (data.assets && Array.isArray(data.assets)) return data.assets;
    if (data.forms && Array.isArray(data.forms)) return data.forms;
    if (data.records && Array.isArray(data.records)) return data.records;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.results && Array.isArray(data.results)) return data.results;
    return [];
  };

  // Combine and sort recent activities
  const recentActivities = React.useMemo(() => {
    const activities = [];

    // Add recent tasks (for admins)
    if (shouldFetchDashboard) {
      const tasks = extractItems(recentTasksData);
      tasks.slice(0, 5).forEach((task) => {
        activities.push({
          id: `task-${task.id}`,
          type: "task",
          title: task.title || task.name || "Untitled Task",
          description: task.description || `Task #${task.id}`,
          timestamp: task.created_at || task.createdAt,
          link: `/admin/tasks/${task.slug || task.id}`,
          icon: CheckSquare,
          color: "blue",
        });
      });
    }

    // Add recent assets (for admins)
    if (shouldFetchDashboard) {
      const assets = extractItems(recentAssetsData);
      assets.slice(0, 5).forEach((asset) => {
        activities.push({
          id: `asset-${asset.id}`,
          type: "asset",
          title: asset.name || asset.asset_name || `Asset #${asset.asset_number || asset.id}`,
          description: asset.asset_number || `Asset ID: ${asset.id}`,
          timestamp: asset.created_at || asset.createdAt,
          link: `/admin/assets`,
          icon: Images,
          color: "green",
        });
      });
    }

    // Add recent forms (for admins)
    if (shouldFetchDashboard) {
      const forms = extractItems(recentFormsData);
      forms.slice(0, 5).forEach((form) => {
        activities.push({
          id: `form-${form.id}`,
          type: "form",
          title: form.form_title || form.name || "Untitled Form",
          description: form.description || `Form #${form.id}`,
          timestamp: form.created_at || form.createdAt,
          link: `/admin/forms/${form.slug || form.id}`,
          icon: FileText,
          color: "purple",
        });
      });
    }

    // Add recent clock records (for all users)
    const clockRecords = extractItems(recentClockRecords);
    clockRecords.slice(0, 5).forEach((record) => {
      activities.push({
        id: `clock-${record.id}`,
        type: "clock",
        title: record.clock_in_time ? "Checked In" : "Checked Out",
        description: record.location?.name || record.job_role?.display_name || "Session record",
        timestamp: record.clock_in_time || record.clock_out_time || record.created_at,
        link: "/admin/clock/history",
        icon: Clock,
        color: "orange",
      });
    });

    // Sort by timestamp descending so latest activity is first (null/undefined timestamps last)
    return activities
      .sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return (timeB || 0) - (timeA || 0);
      })
      .slice(0, 10); // Keep only 10 most recent
  }, [shouldFetchDashboard, recentTasksData, recentAssetsData, recentFormsData, recentClockRecords]);

  // Get all permission names/slugs that the user has
  const userPermissionNames = React.useMemo(() => {
    // If user has wildcard permissions, they have all permissions
    if (
      hasWildcardPermissions.rolePermissions ||
      hasWildcardPermissions.directPermissions
    ) {
      return ["*"]; // Wildcard means all permissions
    }

    // Extract permission names/slugs from both role and direct permissions
    const rolePerms = currentUserPermissions
      .map((p) => {
        if (typeof p === "string") return p;
        if (typeof p === "object")
          return p.name || p.slug || p.permission || p.display_name;
        return null;
      })
      .filter(Boolean);

    const directPerms = currentUserDirectPermissions
      .map((p) => {
        if (typeof p === "string") return p;
        if (typeof p === "object")
          return p.name || p.slug || p.permission || p.display_name;
        return null;
      })
      .filter(Boolean);

    return [...new Set([...rolePerms, ...directPerms])];
  }, [
    currentUserPermissions,
    currentUserDirectPermissions,
    hasWildcardPermissions,
  ]);

  // Check specific permissions
  const canManageUsers =
    userPermissionNames.includes("*") ||
    userPermissionNames.some(
      (perm) =>
        perm.includes("users") ||
        perm === "users:read" ||
        perm === "users:write"
    );
  const canManageRoles =
    userPermissionNames.includes("*") ||
    userPermissionNames.some(
      (perm) =>
        perm.includes("roles") ||
        perm === "roles:read" ||
        perm === "roles:write"
    );
  const canManagePermissions =
    userPermissionNames.includes("*") ||
    userPermissionNames.some(
      (perm) =>
        perm.includes("permissions") ||
        perm === "permissions:read" ||
        perm === "permissions:write"
    );
  const canCreateInvitations =
    userPermissionNames.includes("*") ||
    userPermissionNames.some(
      (perm) =>
        perm.includes("invitations") ||
        perm === "invitations:create" ||
        perm === "invitations:write"
    );

  const handleRefresh = () => {
    if (shouldFetchDashboard) {
      refetchDashboard();
      toast.success("Dashboard data refreshed");
    } else {
      // For regular users, just show a message
      toast.success("Your permissions are up to date");
    }
  };

  const getTrendIcon = (changePercentage) => {
    if (changePercentage > 0)
      return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (changePercentage < 0)
      return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Activity className="h-3 w-3 text-gray-400" />;
  };

  const getTrendColor = (changePercentage) => {
    if (changePercentage > 0) return "text-green-600";
    if (changePercentage < 0) return "text-red-600";
    return "text-gray-500";
  };

  const getHealthStatus = (status) => {
    switch (status?.toLowerCase()) {
      case "healthy":
      case "operational":
        return {
          color: "text-green-600",
          icon: CheckCircle,
          bg: "bg-green-100",
        };
      case "warning":
      case "degraded":
        return {
          color: "text-yellow-600",
          icon: AlertCircle,
          bg: "bg-yellow-100",
        };
      case "error":
      case "down":
        return { color: "text-red-600", icon: AlertCircle, bg: "bg-red-100" };
      default:
        return {
          color: "text-muted-foreground",
          icon: Activity,
          bg: "bg-muted",
        };
    }
  };

  // Show loading state while hydrating
  if (!isClient || currentUserLoading) {
    return (
      <div className="space-y-6">

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="min-h-full rounded-2xl bg-gradient-to-b from-muted/20 to-background p-6 md:p-8">
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Failed to load dashboard data
            </h3>
            <p className="text-muted-foreground mb-4">
              There was an error loading the dashboard statistics.
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Superadmin Dashboard - same design as Normal user dashboard */}
      {shouldFetchDashboard && (
        <div className="min-h-full rounded-2xl bg-gradient-to-b from-muted/20 to-background p-6 md:p-8">
          {/* Greeting + date (same as Normal user), period + refresh on the right */}
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {(() => {
                  const h = new Date().getHours();
                  const time = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
                  return time;
                })()}
                , {currentUserData?.first_name || currentUserData?.display_name || "there"}
              </p>
              <p className="text-2xl font-semibold tracking-tight mt-0.5">
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-28 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={handleRefresh} disabled={isDashboardLoading}>
                {isDashboardLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </header>

          {/* Loading */}
          {isDashboardLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          )}

          {!isDashboardLoading && dashboardData && (
            <>
              {/* System overview: users, invitations, roles, permissions (superuser sees a lot) */}
              <section className="mb-10">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">System overview</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  <Link href="/admin/people-management" className="rounded-2xl border bg-card shadow-sm p-5 hover:bg-muted/50 hover:shadow transition-colors">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total users</p>
                    <p className="text-2xl font-bold mt-1 tabular-nums">{dashboardData?.total_users?.value ?? 0}</p>
                  </Link>
                  <Link href="/admin/people-management?tab=invitations" className="rounded-2xl border bg-card shadow-sm p-5 hover:bg-muted/50 hover:shadow transition-colors">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Invitations</p>
                    <p className="text-2xl font-bold mt-1 tabular-nums">{dashboardData?.new_invitations?.value ?? 0}</p>
                  </Link>
                  <Link href="/admin/role-management" className="rounded-2xl border bg-card shadow-sm p-5 hover:bg-muted/50 hover:shadow transition-colors">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active roles</p>
                    <p className="text-2xl font-bold mt-1 tabular-nums">{dashboardData?.active_roles?.value ?? 0}</p>
                  </Link>
                  <Link href="/admin/permissions-management" className="rounded-2xl border bg-card shadow-sm p-5 hover:bg-muted/50 hover:shadow transition-colors">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Permissions</p>
                    <p className="text-2xl font-bold mt-1 tabular-nums">{dashboardData?.permissions?.value ?? 0}</p>
                  </Link>
                </div>
              </section>

              {/* Operational: clocked in, tasks, online, completed */}
              <section className="mb-10">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">This period</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <Link href="/admin/clock/history" className="rounded-2xl border bg-card shadow-sm p-5 hover:bg-muted/50 hover:shadow transition-colors">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Clocked in</p>
                    <p className="text-2xl font-bold mt-1 tabular-nums">
                      {dashboardData?.operational?.clock_ins_today ?? dashboardData?.active_now?.clocked_in_now_count ?? 0}
                    </p>
                  </Link>
                  <Link href="/admin/tasks" className="rounded-2xl border bg-card shadow-sm p-5 hover:bg-muted/50 hover:shadow transition-colors">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tasks open</p>
                    <p className="text-2xl font-bold mt-1 tabular-nums">
                      {dashboardData?.operational?.tasks_open ?? 0}
                    </p>
                  </Link>
                  <div className="rounded-2xl border bg-card shadow-sm p-5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Online (30m)</p>
                    <p className="text-2xl font-bold mt-1 tabular-nums">
                      {dashboardData?.active_now?.active_sessions_count ?? dashboardData?.system_activity?.active_sessions ?? 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border bg-card shadow-sm p-5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed ({period})</p>
                    <p className="text-2xl font-bold mt-1 tabular-nums">
                      {dashboardData?.operational?.tasks_completed_this_period ?? 0}
                    </p>
                  </div>
                </div>
              </section>

              {/* Needs attention: only when there is something */}
              {dashboardData?.needs_attention && ((dashboardData.needs_attention.pending_invitations ?? 0) + (dashboardData.needs_attention.overdue_tasks ?? 0) + (dashboardData.needs_attention.submissions_pending_review ?? 0)) > 0 && (
                <section className="mb-10">
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 px-5 py-4 flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wider">Needs attention</span>
                    {(dashboardData.needs_attention.pending_invitations ?? 0) > 0 && (
                      <Link href="/admin/people-management?tab=invitations" className="text-sm font-medium text-amber-800 dark:text-amber-200 hover:underline">
                        {dashboardData.needs_attention.pending_invitations} pending invitation{dashboardData.needs_attention.pending_invitations !== 1 ? "s" : ""}
                      </Link>
                    )}
                    {(dashboardData.needs_attention.overdue_tasks ?? 0) > 0 && (
                      <Link href="/admin/tasks?status=overdue" className="text-sm font-medium text-red-700 dark:text-red-300 hover:underline">
                        {dashboardData.needs_attention.overdue_tasks} overdue task{dashboardData.needs_attention.overdue_tasks !== 1 ? "s" : ""}
                      </Link>
                    )}
                    {(dashboardData.needs_attention.submissions_pending_review ?? 0) > 0 && (
                      <Link href="/admin/forms?filter=pending_review" className="text-sm font-medium text-amber-800 dark:text-amber-200 hover:underline">
                        {dashboardData.needs_attention.submissions_pending_review} submission{dashboardData.needs_attention.submissions_pending_review !== 1 ? "s" : ""} pending review
                      </Link>
                    )}
                  </div>
                </section>
              )}

              {/* Charts: only those that add insight (Overview = at-a-glance; Assets = proportion) */}
              {dashboardData && (
                <section className="mb-10">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">At a glance</h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <DashboardChartOverview dashboardData={dashboardData} />
                    <DashboardChartAssets dashboardData={dashboardData} />
                  </div>
                </section>
              )}

              {/* Main content: shortcuts + activity */}
              <section className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Shortcuts - compact list */}
                <div className="lg:col-span-1">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Shortcuts</h2>
                  <nav className="flex flex-col gap-1">
                    {canManageUsers && (
                      <Link href="/admin/people-management" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>People</span>
                        {(dashboardData?.needs_attention?.pending_invitations ?? 0) > 0 && (
                          <Badge variant="secondary" className="ml-auto text-xs">{dashboardData.needs_attention.pending_invitations}</Badge>
                        )}
                      </Link>
                    )}
                    {canManageRoles && (
                      <Link href="/admin/role-management" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>Roles</span>
                      </Link>
                    )}
                    {canManagePermissions && (
                      <Link href="/admin/permissions-management" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <span>Permissions</span>
                      </Link>
                    )}
                    <Link href="/admin/tasks" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <span>Tasks</span>
                      {(dashboardData?.needs_attention?.overdue_tasks ?? 0) > 0 && (
                        <Badge variant="destructive" className="ml-auto text-xs">{dashboardData.needs_attention.overdue_tasks}</Badge>
                      )}
                    </Link>
                    <Link href="/admin/forms" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Forms</span>
                    </Link>
                    <Link href="/admin/assets" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                      <Images className="h-4 w-4 text-muted-foreground" />
                      <span>Assets</span>
                      {(dashboardData?.operational?.assets_maintenance_due ?? 0) > 0 && (
                        <Badge variant="outline" className="ml-auto text-xs">{dashboardData.operational.assets_maintenance_due} maintenance</Badge>
                      )}
                    </Link>
                  </nav>
                </div>

                {/* Recent activity - slim list */}
                <div className="lg:col-span-2">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Recent activity</h2>
                  {recentActivities.length > 0 ? (
                    <ul className="rounded-2xl border divide-y overflow-hidden bg-card shadow-sm">
                      {recentActivities.slice(0, 5).map((activity) => {
                        const Icon = activity.icon;
                        return (
                          <li key={activity.id}>
                            <Link href={activity.link} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{activity.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                              </div>
                              {activity.timestamp && (
                                <span className="text-xs text-muted-foreground shrink-0">
                                  {new Date(activity.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" })} {new Date(activity.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground py-6">No recent activity</p>
                  )}
                </div>
              </section>

              {/* Secondary stats: forms, assets - one compact row */}
              {dashboardData?.operational && (
                <section className="pb-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <Link href="/admin/forms" className="hover:text-foreground">
                    {dashboardData.operational.form_submissions_this_period ?? 0} form submission{(dashboardData.operational.form_submissions_this_period ?? 0) !== 1 ? "s" : ""} this {period}
                  </Link>
                  <Link href="/admin/assets" className="hover:text-foreground">
                    {dashboardData.operational.assets_total ?? 0} assets
                    {(dashboardData.operational.assets_maintenance_due ?? 0) > 0 && (
                      <span className="text-amber-600 dark:text-amber-400"> · {dashboardData.operational.assets_maintenance_due} need maintenance</span>
                    )}
                  </Link>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* Non-superadmin: keep existing header + personal dashboard */}
      {!shouldFetchDashboard && (
        <div className="space-y-6">
          {/* Personal Dashboard – polished layout with greeting and charts */}
      {!shouldFetchDashboard && currentUserData && (
        <div className="min-h-full rounded-2xl bg-gradient-to-b from-muted/20 to-background p-6 md:p-8">
          {/* Greeting + date on same row as refresh */}
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {(() => {
                  const h = new Date().getHours();
                  const time = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
                  return time;
                })()}
                , {currentUserData?.first_name || currentUserData?.display_name || "there"}
              </p>
              <p className="text-2xl font-semibold tracking-tight mt-0.5">
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm" className="shrink-0" disabled={isDashboardLoading}>
              {isDashboardLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </header>

          {/* 1. Pinned Broadcast (top) */}
          <div className="mb-6">
            <DashboardPinnedBroadcast />
          </div>

          {/* 2–8. Widget grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <DashboardBroadcasts />
            <DashboardCompliance />
            <DashboardClock />
            <DashboardUpcomingShifts />
            <DashboardTasks />
            <DashboardAnnualLeave />
            <DashboardRecentActivity activities={recentActivities} />
          </div>

          {/* Charts section */}
          <section className="mt-10">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              This week at a glance
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <DashboardChartHoursWeek />
              <DashboardChartTasksSummary />
              <DashboardChartLeaveBalance />
            </div>
          </section>
        </div>
      )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
