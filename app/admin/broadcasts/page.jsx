"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Search,
  Filter,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Users,
  Bell,
  MessageSquare,
} from "lucide-react";
import { useBroadcastInbox } from "@/hooks/useMessages";
import { useUsers } from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useRoles";
import { useCreateMessage } from "@/hooks/useMessages";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { useCurrentUser } from "@/hooks/useAuth";
import CreateBroadcastDialog from "@/components/broadcasts/CreateBroadcastDialog";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Plus } from "lucide-react";

const BroadcastsPage = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { data: usersData } = useUsers();
  const { data: rolesData } = useRoles();
  const createMessageMutation = useCreateMessage();
  const { hasPermission } = usePermissionsCheck();
  const { data: currentUser } = useCurrentUser();
  
  // Check broadcast permissions
  const canCreateBroadcast = hasPermission("broadcast:create") || hasPermission("BROADCAST_CREATE");
  const canReadBroadcast = hasPermission("broadcast:read") || hasPermission("BROADCAST_READ") || hasPermission("message:read");
  const [filters, setFilters] = useState({
    category: "all",
    priority: "all",
    unread_only: false,
    unacknowledged_only: false,
    search: "",
  });

  const { data, isLoading, error } = useBroadcastInbox({
    page,
    per_page: 20,
    ...(filters.category && filters.category !== "all" && { category: filters.category }),
    ...(filters.priority && filters.priority !== "all" && { priority: filters.priority }),
    ...(filters.unread_only && { unread_only: true }),
    ...(filters.unacknowledged_only && { unacknowledged_only: true }),
  });

  // Filter out broadcasts created by the current user (creators don't need to acknowledge their own broadcasts)
  const broadcasts = useMemo(() => {
    const allBroadcasts = data?.messages || data?.data || [];
    if (!currentUser) return allBroadcasts;
    // Only show broadcasts where the user is a recipient, not the creator
    return allBroadcasts.filter(
      (broadcast) => broadcast.created_by_user_id !== currentUser.id
    );
  }, [data, currentUser]);
  
  const total = broadcasts.length;
  const totalPages = data?.total_pages || Math.ceil(total / 20);

  // Extract unique categories from broadcasts
  const categories = useMemo(() => {
    const cats = new Set();
    broadcasts.forEach((broadcast) => {
      if (broadcast.category) {
        cats.add(broadcast.category);
      }
    });
    return Array.from(cats).sort();
  }, [broadcasts]);

  const getPriorityBadge = (priority) => {
    const variants = {
      low: "secondary",
      normal: "default",
      high: "destructive",
      urgent: "destructive",
    };
    const colors = {
      low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      normal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return (
      <Badge
        variant={variants[priority] || "default"}
        className={cn("text-xs", colors[priority] || "")}
      >
        {priority?.charAt(0).toUpperCase() + priority?.slice(1) || "Normal"}
      </Badge>
    );
  };

  const getReadStatus = (broadcast) => {
    const receipt = broadcast.receipts?.find(
      (r) => r.user_id === broadcast.current_user_id
    );
    return receipt?.is_read || false;
  };

  const getAcknowledgementStatus = (broadcast) => {
    if (!broadcast.requires_acknowledgement) return null;
    const receipt = broadcast.receipts?.find(
      (r) => r.user_id === broadcast.current_user_id
    );
    if (!receipt) return "not_acknowledged";
    return receipt.acknowledgement_status || "not_acknowledged";
  };

  const getAcknowledgementBadge = (status) => {
    if (!status || status === "not_acknowledged") {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          Not acknowledged
        </Badge>
      );
    }
    if (status === "agreed") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200 border-green-200 dark:border-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Agreed
        </Badge>
      );
    }
    if (status === "disagreed") {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200 border-red-200 dark:border-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Disagreed
        </Badge>
      );
    }
    return null;
  };

  const filteredBroadcasts = useMemo(() => {
    if (!filters.search) return broadcasts;
    const term = filters.search.toLowerCase();
    return broadcasts.filter(
      (broadcast) =>
        broadcast.title?.toLowerCase().includes(term) ||
        broadcast.content?.toLowerCase().includes(term) ||
        broadcast.category?.toLowerCase().includes(term)
    );
  }, [broadcasts, filters.search]);

  // Check if user has permission to read broadcasts
  if (!canReadBroadcast) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              You do not have permission to view broadcasts.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Failed to load broadcasts. Please try again.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Broadcasts</h1>
        {canCreateBroadcast && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Broadcast
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search broadcasts..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="pl-9"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={filters.category}
                onValueChange={(value) =>
                  setFilters({ ...filters, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={filters.priority}
                onValueChange={(value) =>
                  setFilters({ ...filters, priority: value })
                }
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

            {/* Toggles */}
            <div className="space-y-3">
              <Label>Quick Filters</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="unread_only" className="text-sm font-normal cursor-pointer">
                    Unread only
                  </Label>
                  <Switch
                    id="unread_only"
                    checked={filters.unread_only}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, unread_only: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="unacknowledged_only" className="text-sm font-normal cursor-pointer">
                    Unacknowledged only
                  </Label>
                  <Switch
                    id="unacknowledged_only"
                    checked={filters.unacknowledged_only}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, unacknowledged_only: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Broadcasts List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {isLoading ? "Loading..." : `${total} Broadcast${total !== 1 ? "s" : ""}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredBroadcasts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No broadcasts found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBroadcasts.map((broadcast) => {
                const isRead = getReadStatus(broadcast);
                const ackStatus = getAcknowledgementStatus(broadcast);
                const receipt = broadcast.receipts?.find(
                  (r) => r.user_id === broadcast.current_user_id
                );

                return (
                  <Card
                    key={broadcast.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors",
                      !isRead && "border-l-4 border-l-primary bg-primary/5"
                    )}
                    onClick={() => router.push(`/admin/broadcasts/${broadcast.id}`)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3
                              className={cn(
                                "font-semibold text-lg",
                                !isRead && "font-bold"
                              )}
                            >
                              {broadcast.title}
                            </h3>
                            {!isRead && (
                              <Badge variant="default" className="bg-primary">
                                New
                              </Badge>
                            )}
                            {broadcast.category && (
                              <Badge variant="outline">
                                {broadcast.category}
                              </Badge>
                            )}
                            {getPriorityBadge(broadcast.priority)}
                          </div>

                          <div
                            className="text-sm text-muted-foreground line-clamp-2"
                            dangerouslySetInnerHTML={{
                              __html: broadcast.content?.substring(0, 200) || "",
                            }}
                          />

                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>
                                {broadcast.created_by_user?.first_name}{" "}
                                {broadcast.created_by_user?.last_name ||
                                  broadcast.created_by_user?.email ||
                                  "Unknown"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {broadcast.created_at
                                  ? formatDistanceToNow(
                                      new Date(broadcast.created_at),
                                      { addSuffix: true }
                                    )
                                  : "Unknown time"}
                              </span>
                            </div>
                            {broadcast.requires_acknowledgement && (
                              <div className="flex items-center gap-1">
                                {getAcknowledgementBadge(ackStatus)}
                              </div>
                            )}
                            {isRead && receipt?.read_at && (
                              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>
                                  Read{" "}
                                  {formatDistanceToNow(
                                    new Date(receipt.read_at),
                                    { addSuffix: true }
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Broadcast Dialog */}
      <CreateBroadcastDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={async (data) => {
          try {
            await createMessageMutation.mutateAsync(data);
            setShowCreateDialog(false);
            router.refresh();
          } catch (error) {
            // Error is handled by the mutation
          }
        }}
        isLoading={createMessageMutation.isPending}
        usersData={usersData}
        rolesData={rolesData}
      />
    </div>
  );
};

export default BroadcastsPage;

