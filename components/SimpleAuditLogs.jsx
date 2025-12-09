"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  User,
} from "lucide-react";
import { useResourceAuditLogs } from "@/hooks/useAuditLogs";
import { format, formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

const SimpleAuditLogs = ({ resource, resourceId, title = "Recent Activity" }) => {
  const isMobile = useIsMobile();

  const { data: auditLogsData, isLoading, error } = useResourceAuditLogs(
    resource,
    resourceId,
    { limit: 10 } // Only show last 10 activities
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

  // Get action icon
  const getActionIcon = (action) => {
    switch (action?.toLowerCase()) {
      case "create":
        return <Plus className="h-3 w-3 text-green-600" />;
      case "update":
        return <Edit className="h-3 w-3 text-blue-600" />;
      case "delete":
        return <Trash2 className="h-3 w-3 text-red-600" />;
      case "read":
      case "file_access":
        return <EyeIcon className="h-3 w-3 text-gray-600" />;
      case "login":
        return <LogIn className="h-3 w-3 text-green-600" />;
      case "logout":
        return <LogOut className="h-3 w-3 text-gray-600" />;
      case "role_assign":
      case "role_revoke":
      case "permission_grant":
      case "permission_revoke":
        return <Shield className="h-3 w-3 text-purple-600" />;
      case "file_upload":
      case "file_download":
      case "file_delete":
        return <FileText className="h-3 w-3 text-blue-600" />;
      case "suspicious_activity":
      case "security_violation":
      case "unauthorized_access":
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      default:
        return <Activity className="h-3 w-3 text-gray-600" />;
    }
  };

  // Format action name
  const formatAction = (action) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || auditLogs.length === 0) {
    return null; // Don't show anything if there's an error or no logs
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          // Mobile List View
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                <div className="mt-0.5">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{formatAction(log.action)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate">
                      {log.user?.display_name ||
                        log.user?.email ||
                        "System"}
                    </span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Desktop Table View
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Action</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead className="w-[150px]">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm">{formatAction(log.action)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {log.user?.display_name ||
                            log.user?.email ||
                            "System"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleAuditLogs;












