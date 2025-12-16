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
  MapPin,
  BookOpen,
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
  const { data: recentClockRecords } = useClockRecords({ limit: 5 });

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
          link: `/admin/tasks/${task.id}`,
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
          link: `/admin/forms/${form.id}`,
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
        title: record.clock_in_time ? "Clocked In" : "Clocked Out",
        description: record.location?.name || record.job_role?.display_name || "Clock record",
        timestamp: record.clock_in_time || record.clock_out_time || record.created_at,
        link: "/clock/history",
        icon: Clock,
        color: "orange",
      });
    });

    // Sort by timestamp (most recent first)
    return activities.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    }).slice(0, 10); // Limit to 10 most recent
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your system statistics and performance metrics.
          </p>
        </div>

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your system statistics and performance metrics.
            </p>
          </div>
        </div>

        <Card>
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
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {hasWildcardPermissions.rolePermissions ||
              hasWildcardPermissions.directPermissions
              ? "Complete system overview and management controls."
              : `Welcome! Here's what you can access with your current permissions.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/docs">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Documentation</span>
              <span className="sm:hidden">Docs</span>
            </Button>
          </Link>
          {shouldFetchDashboard && (
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isDashboardLoading}
          >
            {isDashboardLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Superadmin Dashboard - System Statistics */}
      {shouldFetchDashboard && (
        <>
          {/* Loading State */}
          {isDashboardLoading && (
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
          )}

          {/* Main Stats Grid */}
          {!isDashboardLoading && dashboardData && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Total Users */}
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {dashboardData.total_users?.title || "Total Users"}
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData.total_users?.value?.toLocaleString() || "0"}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    {getTrendIcon(dashboardData.total_users?.change_percentage)}
                    <span
                      className={getTrendColor(
                        dashboardData.total_users?.change_percentage
                      )}
                    >
                      {dashboardData.total_users?.change_text || "No change"}
                    </span>
                    <span>from last {period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dashboardData.total_users?.description ||
                      "Active users in the system"}
                  </p>
                </CardContent>
              </Card>

              {/* New Invitations */}
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {dashboardData.new_invitations?.title || "New Invitations"}
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData.new_invitations?.value?.toLocaleString() ||
                      "0"}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    {getTrendIcon(
                      dashboardData.new_invitations?.change_percentage
                    )}
                    <span
                      className={getTrendColor(
                        dashboardData.new_invitations?.change_percentage
                      )}
                    >
                      {dashboardData.new_invitations?.change_text ||
                        "No change"}
                    </span>
                    <span>from last {period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dashboardData.new_invitations?.description ||
                      "Invitations sent this period"}
                  </p>
                </CardContent>
              </Card>

              {/* Active Roles */}
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {dashboardData.active_roles?.title || "Active Roles"}
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData.active_roles?.value?.toLocaleString() || "0"}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    {getTrendIcon(
                      dashboardData.active_roles?.change_percentage
                    )}
                    <span
                      className={getTrendColor(
                        dashboardData.active_roles?.change_percentage
                      )}
                    >
                      {dashboardData.active_roles?.change_text || "No change"}
                    </span>
                    <span>from last {period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dashboardData.active_roles?.description ||
                      "Roles currently in use"}
                  </p>
                </CardContent>
              </Card>

              {/* Permissions */}
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {dashboardData.permissions?.title || "Permissions"}
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <Key className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboardData.permissions?.value?.toLocaleString() || "0"}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    {getTrendIcon(dashboardData.permissions?.change_percentage)}
                    <span
                      className={getTrendColor(
                        dashboardData.permissions?.change_percentage
                      )}
                    >
                      {dashboardData.permissions?.change_text || "No change"}
                    </span>
                    <span>from last {period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dashboardData.permissions?.description ||
                      "Total permission sets"}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* System Activity and Health */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      User Registrations
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {dashboardData?.system_activity?.user_registrations?.toLocaleString() ||
                        "0"}{" "}
                      this {period}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Sessions</span>
                    <span className="text-sm text-muted-foreground">
                      {dashboardData?.system_activity?.active_sessions?.toLocaleString() ||
                        "0"}{" "}
                      online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">System Health</span>
                    <div className="flex items-center gap-2">
                      {dashboardData?.system_health && (
                        <>
                          <Badge
                            variant="outline"
                            className={`${getHealthStatus(
                              dashboardData.system_health.status
                            ).color
                              } border-current`}
                          >
                            {dashboardData.system_health.status}
                          </Badge>
                          <span className="text-sm font-medium">
                            {dashboardData.system_health.uptime_percentage?.toFixed(
                              1
                            ) || "0"}
                            % uptime
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="my-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
                  <Link href="/docs">
                    <Button
                      className="w-full justify-start cursor-pointer"
                      variant="outline"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Documentation
                    </Button>
                  </Link>
                  {canCreateInvitations && (
                    <Link href="/admin/invitations">
                      <Button
                        className="w-full justify-start cursor-pointer"
                        variant="outline"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Send New Invitation
                      </Button>
                    </Link>
                  )}
                  {canManageUsers && (
                    <Link href="/admin/employee-management">
                      <Button
                        className="w-full justify-start cursor-pointer"
                        variant="outline"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        Manage People
                      </Button>
                    </Link>
                  )}
                  {canManageRoles && (
                    <Link href="/admin/role-management">
                      <Button
                        className="w-full justify-start cursor-pointer"
                        variant="outline"
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        Configure Roles
                      </Button>
                    </Link>
                  )}
                  {canManagePermissions && (
                    <Link href="/admin/permissions-management">
                      <Button
                        className="w-full justify-start cursor-pointer"
                        variant="outline"
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Manage Permissions
                      </Button>
                    </Link>
                  )}
                  {!canCreateInvitations &&
                    !canManageUsers &&
                    !canManageRoles &&
                    !canManagePermissions && (
                      <div className="text-center text-muted-foreground py-8">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">
                          No actions available with your current permissions.
                        </p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activities
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest updates across tasks, assets, forms, and more
              </p>
            </CardHeader>
            <CardContent>
              {recentActivities.length > 0 ? (
                <div className="space-y-3">
                  {recentActivities.slice(0, 8).map((activity) => {
                    const Icon = activity.icon;
                    const colorClasses = {
                      blue: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
                      green: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
                      purple: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
                      orange: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400",
                    };
                    return (
                      <Link key={activity.id} href={activity.link}>
                        <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className={`h-10 w-10 rounded-full ${colorClasses[activity.color] || colorClasses.blue} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {activity.title}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                {activity.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {activity.description}
                            </p>
                            {activity.timestamp && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activities to display</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Last Updated */}
          {dashboardData?.generated_at && (
            <div className="text-center text-xs text-muted-foreground">
              Last updated:{" "}
              {new Date(dashboardData.generated_at).toLocaleString()}
            </div>
          )}
        </>
      )}

      {/* Personal Dashboard for Regular Users */}
      {!shouldFetchDashboard && currentUserData && (
        <>
          {/* Personal Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* My Tasks Card */}
            <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {myStats?.total_tasks || myTasksData?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {myTasksData?.items?.filter(t => t.status === "pending").length || 0} pending
                </p>
                <Link href="/admin/my-tasks">
                  <Button variant="ghost" size="sm" className="mt-2 w-full">
                    View Tasks <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Clock Status Card */}
            <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clock Status</CardTitle>
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clockStatus?.status === "active" || clockStatus?.status === "on_break" ? (
                    <span className="text-green-600">Clocked In</span>
                  ) : (
                    <span className="text-muted-foreground">Clocked Out</span>
                  )}
                </div>
                {clockStatus?.status === "active" && clockStatus?.clock_in_time && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Since {new Date(clockStatus.clock_in_time).toLocaleTimeString()}
                  </p>
                )}
                <Link href="/clock">
                  <Button variant="ghost" size="sm" className="mt-2 w-full">
                    {clockStatus?.status === "active" || clockStatus?.status === "on_break" ? "View Shift" : "Check In"} <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Clock History Card */}
            <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {myStats?.total_clock_records_this_week || recentClockRecords?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Clock records this week
                </p>
                <Link href="/clock/history">
                  <Button variant="ghost" size="sm" className="mt-2 w-full">
                    View History <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Completion Rate Card */}
            <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion</CardTitle>
                <div className="h-8 w-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                  <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {myStats?.total_tasks > 0
                    ? Math.round((myStats?.completed_tasks || 0) / myStats.total_tasks * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {myStats?.completed_tasks || 0} of {myStats?.total_tasks || 0} completed
                </p>
                <div className="mt-2 w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${myStats?.total_tasks > 0
                        ? Math.round((myStats?.completed_tasks || 0) / myStats.total_tasks * 100)
                        : 0}%`
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions and Recent Activity */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
            {/* Quick Actions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/docs">
                    <Button className="w-full justify-start h-auto py-3" variant="outline">
                      <BookOpen className="mr-2 h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Documentation</div>
                        <div className="text-xs text-muted-foreground">Help & guides</div>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/clock">
                    <Button className="w-full justify-start h-auto py-3" variant="outline">
                      <Clock className="mr-2 h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Check In/Out</div>
                        <div className="text-xs text-muted-foreground">Time tracking</div>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/admin/my-tasks">
                    <Button className="w-full justify-start h-auto py-3" variant="outline">
                      <CheckSquare className="mr-2 h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">My Tasks</div>
                        <div className="text-xs text-muted-foreground">View & manage</div>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/clock/history">
                    <Button className="w-full justify-start h-auto py-3" variant="outline">
                      <Calendar className="mr-2 h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Clock History</div>
                        <div className="text-xs text-muted-foreground">Past records</div>
                      </div>
                    </Button>
                  </Link>
                  <Link href="/admin/preferences">
                    <Button className="w-full justify-start h-auto py-3" variant="outline">
                      <Activity className="mr-2 h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Preferences</div>
                        <div className="text-xs text-muted-foreground">Settings</div>
                      </div>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.length > 0 ? (
                    <>
                      {recentActivities.slice(0, 5).map((activity) => {
                        const Icon = activity.icon;
                        const colorClasses = {
                          blue: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
                          green: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
                          purple: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
                          orange: "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400",
                        };
                        return (
                          <Link key={activity.id} href={activity.link}>
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                              <div className={`h-8 w-8 rounded-full ${colorClasses[activity.color] || colorClasses.blue} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {activity.title}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {activity.description}
                                </p>
                                {activity.timestamp && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {new Date(activity.timestamp).toLocaleDateString()} {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                      <Link href={shouldFetchDashboard ? "/admin" : "/clock/history"}>
                        <Button variant="ghost" size="sm" className="w-full mt-2">
                          View All Activities <ArrowRight className="ml-2 h-3 w-3" />
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No recent activity
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Tasks */}
          {myTasksData?.items && myTasksData.items.length > 0 && (
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Pending Tasks
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tasks that need your attention
                  </p>
                </div>
                <Link href="/admin/my-tasks">
                  <Button variant="outline" size="sm">
                    View All <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {myTasksData.items.slice(0, 5).map((task) => (
                    <Link key={task.id} href={`/admin/my-tasks?task=${task.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{task.title || task.name}</p>
                          {task.due_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {task.priority && (
                          <Badge variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"}>
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Permissions Section */}
          <div className="mt-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight">
                Your Permissions
              </h2>
              <p className="text-muted-foreground">
                Here are all the permissions assigned to your account
              </p>
            </div>

            {/* Wildcard Permissions Display */}
            {hasWildcardPermissions.rolePermissions ||
              hasWildcardPermissions.directPermissions ? (
              <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <Shield className="h-5 w-5" />
                    Superuser Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-amber-700 dark:text-amber-300">
                    You have superuser privileges with access to all system
                    permissions and features.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Key className="h-5 w-5" />
                    Your Permissions
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    All permissions assigned to your account
                  </p>
                </CardHeader>
                <CardContent>
                  {currentUserDirectPermissions.length > 0 ? (
                    <div className="space-y-2">
                      {currentUserDirectPermissions.map((permission, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {typeof permission === "object"
                                ? permission.display_name ||
                                permission.name ||
                                permission.slug ||
                                permission.permission
                                : permission
                                  .replace(":", ": ")
                                  .replace(/([a-z])([A-Z])/g, "$1 $2")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </p>
                            {typeof permission === "object" &&
                              permission.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {permission.description}
                                </p>
                              )}
                            {typeof permission === "object" &&
                              permission.resource &&
                              permission.action && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {permission.resource}:{permission.action}
                                </p>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Key className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No Permissions Assigned
                      </h3>
                      <p className="text-muted-foreground text-center">
                        You don't have any specific permissions assigned. Contact
                        your administrator for access.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
