"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Loader2,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Eye as EyeIcon,
  LogIn,
  LogOut,
  Shield,
  FileText,
  Package,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useUsers } from "@/hooks/useUsers";
import { useCurrentUser } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const AuditLogsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedResource, setSelectedResource] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const isMobile = useIsMobile();

  const { data: currentUserData } = useCurrentUser();
  const currentUserPermissions = currentUserData?.permissions || [];
  const currentUserDirectPermissions = currentUserData?.direct_permissions || [];

  // Check for SYSTEM_MONITOR permission
  const hasSystemMonitorPermission = useMemo(() => {
    const allPermissions = [...currentUserPermissions, ...currentUserDirectPermissions];
    return allPermissions.some((p) => {
      const perm = typeof p === "string" ? p : p.permission || p.name || "";
      return perm === "SYSTEM_MONITOR" || perm === "*" || perm.includes("monitor");
    });
  }, [currentUserPermissions, currentUserDirectPermissions]);

  // Build filters
  const filters = useMemo(() => {
    const filterParams = {
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    };

    if (selectedUser && selectedUser !== "__all__") filterParams.user_id = parseInt(selectedUser);
    if (selectedAction && selectedAction !== "__all__") filterParams.action = selectedAction;
    if (selectedResource && selectedResource !== "__all__") filterParams.resource = selectedResource;
    if (selectedSeverity && selectedSeverity !== "__all__") filterParams.severity = selectedSeverity;
    if (startDate) {
      filterParams.start_date = format(startDate, "yyyy-MM-dd'T'00:00:00");
    }
    if (endDate) {
      filterParams.end_date = format(endDate, "yyyy-MM-dd'T'23:59:59");
    }
    if (searchTerm) filterParams.resource_id = searchTerm;

    return filterParams;
  }, [
    currentPage,
    pageSize,
    selectedUser,
    selectedAction,
    selectedResource,
    selectedSeverity,
    startDate,
    endDate,
    searchTerm,
  ]);

  const { data: auditLogsData, isLoading, error, refetch } = useAuditLogs(
    filters,
    {
      enabled: hasSystemMonitorPermission,
    }
  );

  const { data: usersResponse } = useUsers();

  // Extract audit logs from response
  const auditLogs = useMemo(() => {
    if (!auditLogsData) return [];
    if (Array.isArray(auditLogsData)) return auditLogsData;
    if (auditLogsData.audit_logs) return auditLogsData.audit_logs;
    if (auditLogsData.data) return auditLogsData.data;
    if (auditLogsData.results) return auditLogsData.results;
    return [];
  }, [auditLogsData]);

  const totalCount = auditLogsData?.total_count || auditLogsData?.total || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Extract users
  const users = useMemo(() => {
    if (!usersResponse) return [];
    if (Array.isArray(usersResponse)) return usersResponse;
    if (usersResponse.users) return usersResponse.users;
    if (usersResponse.data) return usersResponse.data;
    return [];
  }, [usersResponse]);

  // Available actions
  const actions = [
    "create",
    "update",
    "delete",
    "read",
    "login",
    "logout",
    "login_failed",
    "password_change",
    "password_reset_request",
    "password_reset_complete",
    "account_deactivate",
    "account_reactivate",
    "account_lock",
    "account_unlock",
    "file_upload",
    "file_download",
    "file_delete",
    "file_access",
    "role_assign",
    "role_revoke",
    "permission_grant",
    "permission_revoke",
    "suspicious_activity",
    "security_violation",
    "unauthorized_access",
    "rate_limit_exceeded",
    "system_startup",
    "system_shutdown",
    "configuration_change",
  ];

  // Available resources
  const resources = [
    "task",
    "user",
    "form",
    "asset",
    "role",
    "permission",
    "file",
    "location",
    "department",
  ];

  // Severity levels
  const severities = ["debug", "info", "warning", "error", "critical"];

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-600 text-white";
      case "error":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "warning":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "info":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "debug":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Get action icon
  const getActionIcon = (action) => {
    switch (action?.toLowerCase()) {
      case "create":
        return <Plus className="h-4 w-4 text-green-600" />;
      case "update":
        return <Edit className="h-4 w-4 text-blue-600" />;
      case "delete":
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case "read":
      case "file_access":
        return <EyeIcon className="h-4 w-4 text-gray-600" />;
      case "login":
        return <LogIn className="h-4 w-4 text-green-600" />;
      case "logout":
        return <LogOut className="h-4 w-4 text-gray-600" />;
      case "role_assign":
      case "role_revoke":
      case "permission_grant":
      case "permission_revoke":
        return <Shield className="h-4 w-4 text-purple-600" />;
      case "file_upload":
      case "file_download":
      case "file_delete":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "suspicious_activity":
      case "security_violation":
      case "unauthorized_access":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  // Format action name
  const formatAction = (action) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Parse JSON safely
  const parseJSON = (jsonString) => {
    if (!jsonString) return null;
    try {
      return typeof jsonString === "string" ? JSON.parse(jsonString) : jsonString;
    } catch {
      return jsonString;
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (logId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  // View log details
  const viewLogDetails = (log) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedUser("");
    setSelectedAction("");
    setSelectedResource("");
    setSelectedSeverity("");
    setStartDate(null);
    setEndDate(null);
    setSearchTerm("");
    setCurrentPage(1);
  };

  // Export to CSV
  const handleExport = async () => {
    try {
      // This would call an export endpoint
      toast.info("Export functionality will be implemented");
    } catch (error) {
      toast.error("Failed to export audit logs");
    }
  };

  if (!hasSystemMonitorPermission) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Audit Logs</h1>
            <p className="text-muted-foreground">
              View system activity and audit trail
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have permission to view audit logs. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Audit Logs</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View system activity and audit trail
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              <X className="mr-1 h-3 w-3" />
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search Resource ID</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Resource ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>User</Label>
              <Select
                value={selectedUser || "__all__"}
                onValueChange={(value) => {
                  setSelectedUser(value === "__all__" ? "" : value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.display_name ||
                        `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                        user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select
                value={selectedAction || "__all__"}
                onValueChange={(value) => {
                  setSelectedAction(value === "__all__" ? "" : value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All actions</SelectItem>
                  {actions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {formatAction(action)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resource Type</Label>
              <Select
                value={selectedResource || "__all__"}
                onValueChange={(value) => {
                  setSelectedResource(value === "__all__" ? "" : value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All resources</SelectItem>
                  {resources.map((resource) => (
                    <SelectItem key={resource} value={resource}>
                      {resource.charAt(0).toUpperCase() + resource.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select
                value={selectedSeverity || "__all__"}
                onValueChange={(value) => {
                  setSelectedSeverity(value === "__all__" ? "" : value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All severities</SelectItem>
                  {severities.map((severity) => (
                    <SelectItem key={severity} value={severity}>
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      setCurrentPage(1);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date);
                      setCurrentPage(1);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Audit Logs ({totalCount.toLocaleString()} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Failed to load audit logs. Please try again.
              </p>
              <Button onClick={() => refetch()} className="mt-4">
                Retry
              </Button>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No audit logs found
            </div>
          ) : isMobile ? (
            // Mobile Card View
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <Card key={log.id} className="overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getActionIcon(log.action)}
                          <span className="font-medium">{formatAction(log.action)}</span>
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.resource && (
                            <>
                              {log.resource.charAt(0).toUpperCase() + log.resource.slice(1)}
                              {log.resource_id && ` #${log.resource_id}`}
                            </>
                          )}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleRowExpansion(log.id)}
                      >
                        {expandedRows.has(log.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">User:</span>
                        <p className="font-medium">
                          {log.user?.display_name ||
                            log.user?.email ||
                            "System"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Time:</span>
                        <p className="font-medium">
                          {formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    {expandedRows.has(log.id) && (
                      <div className="pt-3 border-t space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Full Time:</span>
                          <p>{format(new Date(log.created_at), "PPP p")}</p>
                        </div>
                        {log.ip_address && (
                          <div>
                            <span className="text-muted-foreground">IP:</span>
                            <p>{log.ip_address}</p>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewLogDetails(log)}
                          className="w-full"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Full Details
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Desktop Table View
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Timestamp</TableHead>
                    <TableHead className="min-w-[120px]">User</TableHead>
                    <TableHead className="min-w-[120px]">Action</TableHead>
                    <TableHead className="min-w-[100px]">Resource</TableHead>
                    <TableHead className="min-w-[100px]">Resource ID</TableHead>
                    <TableHead className="min-w-[100px]">Severity</TableHead>
                    <TableHead className="min-w-[120px]">IP Address</TableHead>
                    <TableHead className="min-w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <TableRow>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {format(new Date(log.created_at), "MMM dd, yyyy")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), "HH:mm:ss")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(log.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.user ? (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {log.user.display_name ||
                                  log.user.email ||
                                  "Unknown"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              System
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className="text-sm">{formatAction(log.action)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.resource ? (
                            <Badge variant="outline">
                              {log.resource.charAt(0).toUpperCase() +
                                log.resource.slice(1)}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.resource_id ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {log.resource_id}
                            </code>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.ip_address ? (
                            <code className="text-xs">{log.ip_address}</code>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewLogDetails(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(log.id) && (
                        <TableRow>
                          <TableCell colSpan={8} className="bg-muted/50">
                            <div className="p-4 space-y-3">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                {log.session_id && (
                                  <div>
                                    <span className="text-muted-foreground">Session ID:</span>
                                    <p className="font-mono text-xs">{log.session_id}</p>
                                  </div>
                                )}
                                {log.user_agent && (
                                  <div>
                                    <span className="text-muted-foreground">User Agent:</span>
                                    <p className="text-xs break-all">{log.user_agent}</p>
                                  </div>
                                )}
                              </div>
                              {log.old_values && (
                                <div>
                                  <span className="text-muted-foreground font-medium">
                                    Old Values:
                                  </span>
                                  <pre className="mt-1 p-2 bg-background rounded text-xs overflow-auto">
                                    {JSON.stringify(parseJSON(log.old_values), null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_values && (
                                <div>
                                  <span className="text-muted-foreground font-medium">
                                    New Values:
                                  </span>
                                  <pre className="mt-1 p-2 bg-background rounded text-xs overflow-auto">
                                    {JSON.stringify(parseJSON(log.new_values), null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.details && (
                                <div>
                                  <span className="text-muted-foreground font-medium">
                                    Details:
                                  </span>
                                  <pre className="mt-1 p-2 bg-background rounded text-xs overflow-auto">
                                    {JSON.stringify(parseJSON(log.details), null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <Label>Page size:</Label>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(parseInt(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Complete information about this audit log entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">ID</Label>
                  <p className="font-mono text-sm">{selectedLog.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Timestamp</Label>
                  <p>{format(new Date(selectedLog.created_at), "PPP p")}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <p>
                    {selectedLog.user?.display_name ||
                      selectedLog.user?.email ||
                      "System"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Action</Label>
                  <div className="flex items-center gap-2">
                    {getActionIcon(selectedLog.action)}
                    <span>{formatAction(selectedLog.action)}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Resource</Label>
                  <p>{selectedLog.resource || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Resource ID</Label>
                  <p className="font-mono text-sm">{selectedLog.resource_id || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Severity</Label>
                  <Badge className={getSeverityColor(selectedLog.severity)}>
                    {selectedLog.severity}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">IP Address</Label>
                  <p className="font-mono text-sm">{selectedLog.ip_address || "—"}</p>
                </div>
                {selectedLog.session_id && (
                  <div>
                    <Label className="text-muted-foreground">Session ID</Label>
                    <p className="font-mono text-xs break-all">
                      {selectedLog.session_id}
                    </p>
                  </div>
                )}
                {selectedLog.user_agent && (
                  <div>
                    <Label className="text-muted-foreground">User Agent</Label>
                    <p className="text-xs break-all">{selectedLog.user_agent}</p>
                  </div>
                )}
              </div>

              {selectedLog.old_values && (
                <div>
                  <Label className="text-muted-foreground">Old Values</Label>
                  <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-auto">
                    {JSON.stringify(parseJSON(selectedLog.old_values), null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <Label className="text-muted-foreground">New Values</Label>
                  <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-auto">
                    {JSON.stringify(parseJSON(selectedLog.new_values), null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.details && (
                <div>
                  <Label className="text-muted-foreground">Details</Label>
                  <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-auto">
                    {JSON.stringify(parseJSON(selectedLog.details), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogsPage;

