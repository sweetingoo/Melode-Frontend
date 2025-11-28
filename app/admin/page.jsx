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
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useDashboardStats } from "@/hooks/useDashboard";
import { useCurrentUser } from "@/hooks/useAuth";
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
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {dashboardData.total_users?.title || "Total Users"}
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
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
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {dashboardData.new_invitations?.title || "New Invitations"}
                  </CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
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
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {dashboardData.active_roles?.title || "Active Roles"}
                  </CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
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
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {dashboardData.permissions?.title || "Permissions"}
                  </CardTitle>
                  <Key className="h-4 w-4 text-muted-foreground" />
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
                            className={`${
                              getHealthStatus(
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

          {/* Last Updated */}
          {dashboardData?.generated_at && (
            <div className="text-center text-xs text-muted-foreground">
              Last updated:{" "}
              {new Date(dashboardData.generated_at).toLocaleString()}
            </div>
          )}
        </>
      )}

      {/* Permissions List for Regular Users */}
      {!shouldFetchDashboard && currentUserData && (
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
      )}
    </div>
  );
};

export default Dashboard;
