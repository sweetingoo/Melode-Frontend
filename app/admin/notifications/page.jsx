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
    message_type: "",
    priority: "",
    unread_only: false,
  });

  // Build query params
  const queryParams = {
    page: currentPage,
    per_page: 20,
    ...(searchTerm && { search: searchTerm }),
    ...(filters.message_type && { message_type: filters.message_type }),
    ...(filters.priority && { priority: filters.priority }),
    ...(filters.unread_only && { unread_only: true }),
  };

  const { data: notificationsData, isLoading: isLoadingNotifications } = useNotifications(queryParams);

  const notifications = notificationsData?.messages || notificationsData?.data || [];
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
    if (!currentUser) return { isRead: false };
    
    const receipt = notification.receipts?.find((r) => r.user_id === currentUser.id);
    return {
      isRead: receipt?.is_read || false,
      readAt: receipt?.read_at,
    };
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
                    <SelectItem value="">All types</SelectItem>
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
                    <SelectItem value="">All priorities</SelectItem>
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
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                        !readStatus.isRead ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" : ""
                      }`}
                      onClick={() => {
                        // Navigate to message detail if it's a message, or handle notification click
                        if (notification.id) {
                          router.push(`/admin/messages/${notification.id}`);
                        }
                      }}
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
                              <div className="flex items-center gap-2 mb-1">
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
                                {getPriorityBadge(notification.priority)}
                                <Badge variant="outline">{notification.message_type}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {notification.content?.replace(/<[^>]*>/g, "") || notification.summary || "No content"}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {notification.created_at
                                  ? format(new Date(notification.created_at), "MMM d, yyyy HH:mm")
                                  : "N/A"}
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

