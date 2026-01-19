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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Send,
  Info,
  BarChart3,
  Megaphone,
} from "lucide-react";
import { useBroadcastInbox, useAllBroadcasts } from "@/hooks/useMessages";
import { useUsers } from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useRoles";
import { useCreateMessage } from "@/hooks/useMessages";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { useCurrentUser } from "@/hooks/useAuth";
import CreateBroadcastDialog from "@/components/broadcasts/CreateBroadcastDialog";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Plus } from "lucide-react";
import { parseUTCDate } from "@/utils/time";
import { toast } from "sonner";

const BroadcastsPage = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("inbox"); // "inbox" or "outbox"
  const { data: usersData } = useUsers();
  const { data: rolesData } = useRoles();
  const createMessageMutation = useCreateMessage();
  const { hasPermission } = usePermissionsCheck();
  const { data: currentUser } = useCurrentUser();
  
  // Check broadcast permissions
  // BROADCAST_SEND is used for creating broadcasts and viewing communal outbox
  const canCreateBroadcast = hasPermission("broadcast:create") || hasPermission("BROADCAST_CREATE") || hasPermission("broadcast:send") || hasPermission("BROADCAST_SEND");
  const canReadBroadcast = hasPermission("broadcast:read") || hasPermission("BROADCAST_READ") || hasPermission("message:read");
  const [filters, setFilters] = useState({
    category: "all",
    priority: "all",
    unread_only: false,
    unacknowledged_only: false,
    search: "",
  });

  // Fetch inbox data (always available)
  const { data: inboxData, isLoading: inboxLoading, error: inboxError } = useBroadcastInbox({
    page,
    per_page: 20,
    ...(filters.category && filters.category !== "all" && { category: filters.category }),
    ...(filters.priority && filters.priority !== "all" && { priority: filters.priority }),
    ...(filters.unread_only && { unread_only: true }),
    ...(filters.unacknowledged_only && { unacknowledged_only: true }),
  }, {
    enabled: activeTab === "inbox", // Only fetch when inbox tab is active
  });

  // Fetch outbox data (only for users with BROADCAST_SEND permission)
  // Always fetch first page to get counts for tab badge, even if tab is not active
  const { data: allBroadcastsData, isLoading: allBroadcastsLoading, error: allBroadcastsError } = useAllBroadcasts({
    page: 1, // Always fetch first page for counts
    per_page: 20,
  }, {
    enabled: canCreateBroadcast, // Fetch if user has permission (for tab badge count)
  });
  
  // Fetch full outbox data when outbox tab is active (with filters and pagination)
  const { data: outboxData, isLoading: outboxLoading, error: outboxError } = useAllBroadcasts({
    page,
    per_page: 20,
    ...(filters.category && filters.category !== "all" && { category: filters.category }),
    ...(filters.priority && filters.priority !== "all" && { priority: filters.priority }),
  }, {
    enabled: activeTab === "outbox" && canCreateBroadcast, // Only fetch when outbox tab is active and user has permission
  });

  // Separate data for inbox and outbox
  // Backend returns broadcasts in different formats: { broadcasts: [...] }, { messages: [...] }, or { data: [...] }
  const inboxBroadcasts = inboxData?.broadcasts || inboxData?.messages || inboxData?.data || [];
  
  // Helper to extract broadcasts array from response
  const getBroadcastsArray = (data) => {
    if (!data) return [];
    return data.broadcasts || data.messages || data.data || [];
  };
  
  // For outbox: use outboxData when available and tab is active, otherwise use allBroadcastsData
  // allBroadcastsData is always fetched for badge count
  const outboxDataForDisplay = activeTab === "outbox" 
    ? (outboxData || allBroadcastsData)
    : allBroadcastsData;
  
  const outboxBroadcasts = getBroadcastsArray(outboxDataForDisplay);
  const inboxTotal = inboxData?.total || inboxBroadcasts.length;
  const outboxTotal = outboxDataForDisplay?.total || outboxBroadcasts.length;
  
  // Debug logging
  if (process.env.NODE_ENV === "development") {
    console.log("Outbox Debug:", {
      activeTab,
      outboxData: outboxData ? { ...outboxData, broadcasts: outboxData.broadcasts?.length || 0 } : null,
      allBroadcastsData: allBroadcastsData ? { ...allBroadcastsData, broadcasts: allBroadcastsData.broadcasts?.length || 0 } : null,
      outboxDataForDisplay: outboxDataForDisplay ? { ...outboxDataForDisplay, broadcasts: outboxDataForDisplay.broadcasts?.length || 0 } : null,
      outboxBroadcasts,
      outboxBroadcastsLength: outboxBroadcasts.length,
      outboxTotal,
      filters,
    });
  }
  const inboxTotalPages = inboxData?.total_pages || inboxData?.page_size ? Math.ceil(inboxTotal / (inboxData?.page_size || 20)) : Math.ceil(inboxTotal / 20);
  const outboxTotalPages = outboxDataForDisplay?.total_pages || outboxDataForDisplay?.page_size ? Math.ceil(outboxTotal / (outboxDataForDisplay?.page_size || 20)) : Math.ceil(outboxTotal / 20);

  // Extract unique categories from both inbox and outbox
  const categories = useMemo(() => {
    const cats = new Set();
    [...inboxBroadcasts, ...outboxBroadcasts].forEach((broadcast) => {
      if (broadcast.category) {
        cats.add(broadcast.category);
      }
    });
    return Array.from(cats).sort();
  }, [inboxBroadcasts, outboxBroadcasts]);

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

  // Filter broadcasts for inbox
  // Backend /broadcasts/inbox endpoint should already filter by recipient
  // We only apply client-side filters (search, category, priority, unread, unacknowledged)
  const filteredInboxBroadcasts = useMemo(() => {
    let filtered = inboxBroadcasts;
    
    if (filters.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(
        (broadcast) =>
          broadcast.title?.toLowerCase().includes(term) ||
          broadcast.content?.toLowerCase().includes(term) ||
          broadcast.category?.toLowerCase().includes(term)
      );
    }
    
    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter((broadcast) => broadcast.category === filters.category);
    }
    
    if (filters.priority && filters.priority !== "all") {
      filtered = filtered.filter((broadcast) => broadcast.priority === filters.priority);
    }
    
    if (filters.unread_only) {
      filtered = filtered.filter((broadcast) => !getReadStatus(broadcast));
    }
    
    if (filters.unacknowledged_only) {
      filtered = filtered.filter((broadcast) => {
        if (!broadcast.requires_acknowledgement) return false;
        const status = getAcknowledgementStatus(broadcast);
        return !status || status === "not_acknowledged";
      });
    }
    
    return filtered;
  }, [inboxBroadcasts, filters]);

  // Filter broadcasts for outbox
  // Backend /broadcasts?my_broadcasts=true endpoint should already filter by created_by_user_id
  // We only apply client-side filters (search, category, priority)
  const filteredOutboxBroadcasts = useMemo(() => {
    // Ensure we have an array
    if (!Array.isArray(outboxBroadcasts)) {
      console.warn("outboxBroadcasts is not an array:", outboxBroadcasts);
      return [];
    }
    
    let filtered = outboxBroadcasts;
    
    if (filters.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(
        (broadcast) =>
          broadcast.title?.toLowerCase().includes(term) ||
          broadcast.content?.toLowerCase().includes(term) ||
          broadcast.category?.toLowerCase().includes(term)
      );
    }
    
    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter((broadcast) => broadcast.category === filters.category);
    }
    
    if (filters.priority && filters.priority !== "all") {
      filtered = filtered.filter((broadcast) => broadcast.priority === filters.priority);
    }
    
    return filtered;
  }, [outboxBroadcasts, filters]);

  // Check if user has permission to read broadcasts OR create broadcasts (communal outbox)
  if (!canReadBroadcast && !canCreateBroadcast) {
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

  // Check for errors
  if (activeTab === "inbox" && inboxError) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Failed to load inbox broadcasts. Please try again.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (activeTab === "outbox" && allBroadcastsError) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Failed to load outbox broadcasts. Please try again.
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Inbox
            {inboxData && (
              <Badge variant="secondary" className="ml-1">
                {inboxData?.total || inboxData?.messages?.length || 0}
              </Badge>
            )}
          </TabsTrigger>
          {canCreateBroadcast && (
            <TabsTrigger value="outbox" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Outbox
              {allBroadcastsData && (
                <Badge variant="secondary" className="ml-1">
                  {allBroadcastsData?.total || allBroadcastsData?.broadcasts?.length || allBroadcastsData?.messages?.length || 0}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Inbox Tab */}
        <TabsContent value="inbox" className="space-y-4">
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
            {inboxLoading ? "Loading..." : `${filteredInboxBroadcasts.length} Broadcast${filteredInboxBroadcasts.length !== 1 ? "s" : ""}`}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              (Received)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inboxLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredInboxBroadcasts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No broadcasts found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInboxBroadcasts.map((broadcast) => {
                const isRead = getReadStatus(broadcast);
                const ackStatus = getAcknowledgementStatus(broadcast);
                const receipt = broadcast.receipts?.find(
                  (r) => r.user_id === broadcast.current_user_id
                );
                // For inbox view, check if current user sent it
                const isSent = currentUser?.id === broadcast.created_by_user_id;
                
                // Calculate acknowledgment stats for sent broadcasts
                const ackStats = isSent && broadcast.requires_acknowledgement ? (() => {
                  const receipts = broadcast.receipts || [];
                  const totalRecipients = receipts.length;
                  const acknowledged = receipts.filter(r => r.acknowledgement_status).length;
                  const agreed = receipts.filter(r => r.acknowledgement_status === "agreed").length;
                  const disagreed = receipts.filter(r => r.acknowledgement_status === "disagreed").length;
                  return { totalRecipients, acknowledged, agreed, disagreed };
                })() : null;

                return (
                  <Card
                    key={broadcast.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors border-l-4",
                      !isRead && !isSent && "border-l-primary bg-primary/5",
                      isSent && "border-l-green-500 bg-green-50/30 dark:bg-green-950/10"
                    )}
                    onClick={() => router.push(`/admin/broadcasts/${broadcast.slug || broadcast.id}`)}
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
                            {isSent && (
                              <>
                                <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800">
                                  <Send className="h-3 w-3 mr-1" />
                                  Sent by you
                                </Badge>
                                <Badge variant="outline" className="bg-muted text-muted-foreground">
                                  <Info className="h-3 w-3 mr-1" />
                                  No action needed
                                </Badge>
                              </>
                            )}
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
                                  ? (() => {
                                      const date = parseUTCDate(broadcast.created_at);
                                      return date && !isNaN(date.getTime())
                                        ? formatDistanceToNow(date, { addSuffix: true })
                                        : "Unknown time";
                                    })()
                                  : "Unknown time"}
                              </span>
                            </div>
                            {/* Show acknowledgment status for received broadcasts */}
                            {broadcast.requires_acknowledgement && !isSent && (
                              <div className="flex items-center gap-1">
                                {getAcknowledgementBadge(ackStatus)}
                              </div>
                            )}
                            {/* Show acknowledgment stats for sent broadcasts */}
                            {isSent && broadcast.requires_acknowledgement && ackStats && (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  <BarChart3 className="h-3 w-3 mr-1" />
                                  {ackStats.acknowledged}/{ackStats.totalRecipients} acknowledged
                                  {ackStats.agreed > 0 && ` (${ackStats.agreed} agreed`}
                                  {ackStats.disagreed > 0 && `, ${ackStats.disagreed} disagreed`}
                                  {ackStats.agreed > 0 || ackStats.disagreed > 0 ? ')' : ''}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs"
                                  disabled={!broadcast.slug && !broadcast.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const broadcastIdentifier = broadcast.slug || broadcast.id;
                                    if (broadcastIdentifier) {
                                      router.push(`/admin/broadcasts/${broadcastIdentifier}/status`);
                                    } else {
                                      console.error("Cannot navigate to status: broadcast has no slug or id", broadcast);
                                      toast.error("Error", {
                                        description: "Cannot view status: broadcast identifier is missing.",
                                      });
                                    }
                                  }}
                                >
                                  View Status
                                </Button>
                              </div>
                            )}
                            {isRead && receipt?.read_at && !isSent && (
                              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>
                                  Read{" "}
                                  {(() => {
                                    const date = parseUTCDate(receipt.read_at);
                                    return date && !isNaN(date.getTime())
                                      ? formatDistanceToNow(date, { addSuffix: true })
                                      : "";
                                  })()}
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
          {!inboxLoading && inboxTotalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Page {page} of {inboxTotalPages}
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
                  onClick={() => setPage((p) => Math.min(inboxTotalPages, p + 1))}
                  disabled={page === inboxTotalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Outbox Tab */}
        {canCreateBroadcast && (
          <TabsContent value="outbox" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                </div>
              </CardContent>
            </Card>

            {/* Broadcasts List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {outboxLoading ? "Loading..." : `${filteredOutboxBroadcasts.length} Broadcast${filteredOutboxBroadcasts.length !== 1 ? "s" : ""}`}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (Sent)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {outboxLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredOutboxBroadcasts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No broadcasts found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOutboxBroadcasts.map((broadcast) => {
                      // In outbox, all broadcasts are sent broadcasts
                      const isSent = true;
                      
                      // Calculate acknowledgment stats for sent broadcasts
                      const ackStats = isSent && broadcast.requires_acknowledgement ? (() => {
                        const receipts = broadcast.receipts || [];
                        const totalRecipients = receipts.length;
                        const acknowledged = receipts.filter(r => r.acknowledgement_status).length;
                        const agreed = receipts.filter(r => r.acknowledgement_status === "agreed").length;
                        const disagreed = receipts.filter(r => r.acknowledgement_status === "disagreed").length;
                        return { totalRecipients, acknowledged, agreed, disagreed };
                      })() : null;

                      return (
                        <Card
                          key={broadcast.id}
                          className={cn(
                            "cursor-pointer hover:bg-muted/50 transition-colors border-l-4",
                            "border-l-green-500 bg-green-50/30 dark:bg-green-950/10"
                          )}
                          onClick={() => router.push(`/admin/broadcasts/${broadcast.slug || broadcast.id}`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold text-lg">{broadcast.title}</h3>
                                  {broadcast.category && (
                                    <Badge variant="outline">{broadcast.category}</Badge>
                                  )}
                                  {getPriorityBadge(broadcast.priority)}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {broadcast.summary || broadcast.content?.replace(/<[^>]*>/g, "").substring(0, 100) || "No content"}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span>
                                      {broadcast.created_by_user?.first_name} {broadcast.created_by_user?.last_name || broadcast.created_by_user?.email || "Unknown"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {broadcast.created_at
                                        ? formatDistanceToNow(parseUTCDate(broadcast.created_at), { addSuffix: true })
                                        : "Unknown time"}
                                    </span>
                                  </div>
                                  {ackStats && (
                                    <>
                                      <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        <span>{ackStats.totalRecipients} recipients</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>{ackStats.acknowledged} acknowledged</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {broadcast.send_email && (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                  </Badge>
                                )}
                                {broadcast.send_sms && (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Bell className="h-3 w-3" />
                                  </Badge>
                                )}
                                {broadcast.send_push && (
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <Bell className="h-3 w-3" />
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={!broadcast.slug && !broadcast.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const broadcastIdentifier = broadcast.slug || broadcast.id;
                                    if (broadcastIdentifier) {
                                      router.push(`/admin/broadcasts/${broadcastIdentifier}/status`);
                                    } else {
                                      console.error("Cannot navigate to status: broadcast has no slug or id", broadcast);
                                      toast.error("Error", {
                                        description: "Cannot view status: broadcast identifier is missing.",
                                      });
                                    }
                                  }}
                                >
                                  <BarChart3 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {!outboxLoading && outboxTotalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-muted-foreground">
                      Page {page} of {outboxTotalPages}
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
                        onClick={() => setPage((p) => Math.min(outboxTotalPages, p + 1))}
                        disabled={page === outboxTotalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

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

