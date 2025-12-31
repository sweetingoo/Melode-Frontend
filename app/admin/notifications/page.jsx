"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Bell,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Eye,
  Loader2,
  Mail,
  MessageSquare,
  CheckSquare,
  Send,
  XCircle,
} from "lucide-react";
import {
  useNotifications,
} from "@/hooks/useNotifications";
import { useCurrentUser } from "@/hooks/useAuth";
import { format } from "date-fns";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";

const NotificationsPage = () => {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { hasPermission } = usePermissionsCheck();
  
  // Permission checks
  const canReadNotifications = hasPermission("notification:read") || hasPermission("notification:list");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    message_type: "all",
    priority: "all",
    unread_only: false,
  });

  // Build query params
  const queryParams = {
    page: currentPage,
    per_page: 20,
    ...(searchTerm && { search: searchTerm }),
    ...(filters.message_type && filters.message_type !== "all" && { message_type: filters.message_type }),
    ...(filters.priority && filters.priority !== "all" && { priority: filters.priority }),
    ...(filters.unread_only && { unread_only: true }),
  };

  const { data: notificationsData, isLoading: isLoadingNotifications } = useNotifications(queryParams);

  // Updated to use 'notifications' instead of 'messages'
  const notifications = notificationsData?.notifications || notificationsData?.messages || notificationsData?.data || [];
  const totalPages = notificationsData?.total_pages || 1;
  const total = notificationsData?.total || 0;

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { label: "Low", variant: "secondary" },
      normal: { label: "Normal", variant: "default" },
      high: { label: "High", variant: "default" },
      urgent: { label: "Urgent", variant: "destructive" },
    };
    const config = priorityConfig[priority] || priorityConfig.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMessageTypeIcon = (messageType) => {
    const iconConfig = {
      notification: Mail,
      alert: AlertCircle,
      task: CheckSquare,
      general: MessageSquare,
    };
    return iconConfig[messageType] || MessageSquare;
  };

  const getReadStatus = (notification) => {
    // Use is_read directly from notification (new API structure)
    return {
      isRead: notification.is_read || false,
      readAt: notification.read_at,
      isAcknowledged: notification.is_acknowledged || false,
      acknowledgementStatus: notification.acknowledgement_status,
      acknowledgedAt: notification.acknowledged_at,
    };
  };

  const handleNotificationClick = (notification, showStatus = false) => {
    // Route based on message type
    if (notification.is_broadcast) {
      // For sent broadcasts, optionally show status page
      if (showStatus && notification.created_by_user_id === currentUser?.id) {
        router.push(`/admin/broadcasts/${notification.id}/status`);
      } else {
        router.push(`/admin/broadcasts/${notification.id}`);
      }
    } else if (notification.conversation_id) {
      router.push(`/admin/messages?conversation=${notification.conversation_id}`);
    } else {
      router.push(`/admin/messages/${notification.id}`);
    }
  };

  // If user doesn't have permission to read notifications, show access denied
  if (!canReadNotifications) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to view notifications.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            View your notifications and alerts
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            >
              {isFiltersOpen ? "Hide" : "Show"} Filters
            </Button>
          </div>
        </CardHeader>
        {isFiltersOpen && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search notifications..."
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
                <Label>Message Type</Label>
                <Select
                  value={filters.message_type}
                  onValueChange={(value) => {
                    setFilters({ ...filters, message_type: value });
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => {
                    setFilters({ ...filters, priority: value });
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="unread_only"
                    checked={filters.unread_only}
                    onChange={(e) => {
                      setFilters({ ...filters, unread_only: e.target.checked });
                      setCurrentPage(1);
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="unread_only" className="cursor-pointer">
                    Unread only
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingNotifications ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications found</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {notifications.map((notification) => {
                  const readStatus = getReadStatus(notification);
                  const Icon = getMessageTypeIcon(notification.message_type);
                  const isBroadcast = notification.is_broadcast;
                  const isSent = notification.created_by_user_id === currentUser?.id;
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                        !readStatus.isRead ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          !readStatus.isRead 
                            ? "bg-blue-100 dark:bg-blue-900" 
                            : "bg-muted"
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            !readStatus.isRead 
                              ? "text-blue-600 dark:text-blue-400" 
                              : "text-muted-foreground"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className={`font-semibold ${
                                  !readStatus.isRead ? "text-blue-900 dark:text-blue-100" : ""
                                }`}>
                                  {notification.title}
                                </h3>
                                {!readStatus.isRead && (
                                  <Badge variant="default" className="h-5 px-1.5">
                                    <Circle className="h-3 w-3 fill-current" />
                                  </Badge>
                                )}
                                {isSent && isBroadcast && (
                                  <Badge variant="outline" className="h-5 px-1.5 flex items-center gap-1">
                                    <Send className="h-3 w-3" />
                                    Sent
                                  </Badge>
                                )}
                                {isBroadcast && notification.category && (
                                  <Badge variant="outline" className="h-5 px-1.5">
                                    {notification.category}
                                  </Badge>
                                )}
                                {getPriorityBadge(notification.priority)}
                                <Badge variant="outline" className="h-5 px-1.5">{notification.message_type}</Badge>
                                {notification.requires_acknowledgement && (
                                  <div className="flex items-center gap-1">
                                    {readStatus.isAcknowledged ? (
                                      readStatus.acknowledgementStatus === "agreed" ? (
                                        <Badge variant="outline" className="h-5 px-1.5 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200 border-green-200 dark:border-green-800">
                                          <CheckCircle2 className="h-3 w-3 mr-0.5" />
                                          Agreed
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="h-5 px-1.5 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200 border-red-200 dark:border-red-800">
                                          <XCircle className="h-3 w-3 mr-0.5" />
                                          Disagreed
                                        </Badge>
                                      )
                                    ) : (
                                      <Badge variant="outline" className="h-5 px-1.5 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800">
                                        <AlertCircle className="h-3 w-3 mr-0.5" />
                                        Pending
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div 
                                className="text-sm text-muted-foreground line-clamp-2 [&_p]:mb-0 [&_p]:last:mb-0 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-1 [&_li]:mb-0.5 [&_strong]:font-bold [&_em]:italic [&_a]:underline [&_a]:hover:underline-offset-2"
                                dangerouslySetInnerHTML={{ 
                                  __html: notification.content || notification.summary || "No content"
                                }}
                              />
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {notification.created_at
                                    ? format(new Date(notification.created_at), "MMM d, yyyy HH:mm")
                                    : "N/A"}
                                </div>
                                {notification.sender_name && (
                                  <span>• {notification.sender_name}</span>
                                )}
                                {isSent && isBroadcast && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNotificationClick(notification, true);
                                    }}
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    • View Status
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {readStatus.isRead ? (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Read
                                </Badge>
                              ) : (
                                <Badge variant="default" className="flex items-center gap-1">
                                  <Circle className="h-3 w-3" />
                                  Unread
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;

