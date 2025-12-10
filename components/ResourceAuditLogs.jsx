"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import {
  Plus,
  Edit,
  Trash2,
  Eye as EyeIcon,
  LogIn,
  LogOut,
  Shield,
  FileText,
  AlertCircle,
  Activity,
  Loader2,
  Eye,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useResourceAuditLogs } from "@/hooks/useAuditLogs";
import { format, formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

const ResourceAuditLogs = ({ resource, resourceId, title = "Activity History" }) => {
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const isMobile = useIsMobile();

  const { data: auditLogsData, isLoading, error } = useResourceAuditLogs(
    resource,
    resourceId,
    { limit: 50 }
  );

  // Extract audit logs from response
  const auditLogs = React.useMemo(() => {
    if (!auditLogsData) return [];
    if (Array.isArray(auditLogsData)) return auditLogsData;
    if (auditLogsData.audit_logs) return auditLogsData.audit_logs;
    if (auditLogsData.data) return auditLogsData.data;
    if (auditLogsData.results) return auditLogsData.results;
    return [];
  }, [auditLogsData]);

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Failed to load activity history
          </div>
        </CardContent>
      </Card>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No activity history available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {isMobile ? (
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
                          {formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                          })}
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
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {log.user?.display_name ||
                          log.user?.email ||
                          "System"}
                      </span>
                    </div>
                    {expandedRows.has(log.id) && (
                      <div className="pt-3 border-t space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Time:</span>
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
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <React.Fragment key={log.id}>
                      <TableRow>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {format(new Date(log.created_at), "MMM dd, yyyy HH:mm")}
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
                            <span className="text-sm text-muted-foreground">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className="text-sm">{formatAction(log.action)}</span>
                          </div>
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
                          <TableCell colSpan={6} className="bg-muted/50">
                            <div className="p-4 space-y-3">
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
                    <p className="font-mono text-xs break-all">{selectedLog.session_id}</p>
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
    </>
  );
};

export default ResourceAuditLogs;













