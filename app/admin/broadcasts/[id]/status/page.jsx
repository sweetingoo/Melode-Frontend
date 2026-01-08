"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  User,
  Mail,
  Smartphone,
  Bell,
  Search,
  Download,
  Filter,
} from "lucide-react";
import { useBroadcast } from "@/hooks/useMessages";
import { useCurrentUser } from "@/hooks/useAuth";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { parseUTCDate } from "@/utils/time";

const BroadcastStatusPage = () => {
  const params = useParams();
  const router = useRouter();
  const broadcastSlug = params.id || params.slug;
  const { data: currentUser } = useCurrentUser();
  const { hasPermission } = usePermissionsCheck();
  const { data: broadcast, isLoading } = useBroadcast(broadcastSlug);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "read", "unread", "acknowledged", "not_acknowledged"
  
  // Check if user can send broadcasts (communal outbox access)
  // Creators can always view status, others need BROADCAST_SEND or BROADCAST_READ
  const canSendBroadcasts = hasPermission("broadcast:create") || hasPermission("BROADCAST_CREATE") || hasPermission("broadcast:send") || hasPermission("BROADCAST_SEND");
  const canReadBroadcast = hasPermission("broadcast:read") || hasPermission("BROADCAST_READ");

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!broadcast) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              Broadcast not found
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if current user is the creator
  const isCreator = currentUser?.id === broadcast?.created_by_user_id;

  // Allow access if user is creator OR has send/read permission
  if (!isCreator && !canSendBroadcasts && !canReadBroadcast) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              You can only view status for broadcasts you created or if you have BROADCAST_SEND or BROADCAST_READ permission
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const recipients = broadcast.recipients || [];
  const receipts = broadcast.receipts || [];

  // Combine recipients with receipt data
  const recipientData = useMemo(() => {
    return recipients.map((recipient) => {
      const receipt = receipts.find((r) => r.user_id === recipient.id);
      return {
        ...recipient,
        receipt,
        is_read: receipt?.is_read || false,
        read_at: receipt?.read_at,
        acknowledgement_status: receipt?.acknowledgement_status || null,
        acknowledged_at: receipt?.acknowledged_at,
        acknowledgement_note: receipt?.acknowledgement_note,
      };
    });
  }, [recipients, receipts]);

  // Filter recipients
  const filteredRecipients = useMemo(() => {
    let filtered = recipientData;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.first_name?.toLowerCase().includes(term) ||
          r.last_name?.toLowerCase().includes(term) ||
          r.user_name?.toLowerCase().includes(term) ||
          r.email?.toLowerCase().includes(term) ||
          r.user_email?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter === "read") {
      filtered = filtered.filter((r) => r.is_read);
    } else if (statusFilter === "unread") {
      filtered = filtered.filter((r) => !r.is_read);
    } else if (statusFilter === "acknowledged") {
      filtered = filtered.filter((r) => r.acknowledgement_status);
    } else if (statusFilter === "not_acknowledged") {
      filtered = filtered.filter(
        (r) => broadcast.requires_acknowledgement && !r.acknowledgement_status
      );
    }

    return filtered;
  }, [recipientData, searchTerm, statusFilter, broadcast.requires_acknowledgement]);

  const stats = useMemo(() => {
    const total = recipientData.length;
    const read = recipientData.filter((r) => r.is_read).length;
    const unread = total - read;
    const acknowledged = recipientData.filter((r) => r.acknowledgement_status).length;
    const notAcknowledged = broadcast.requires_acknowledgement
      ? recipientData.filter((r) => !r.acknowledgement_status).length
      : 0;
    const agreed = recipientData.filter((r) => r.acknowledgement_status === "agreed").length;
    const disagreed = recipientData.filter((r) => r.acknowledgement_status === "disagreed").length;

    return {
      total,
      read,
      unread,
      acknowledged,
      notAcknowledged,
      agreed,
      disagreed,
    };
  }, [recipientData, broadcast.requires_acknowledgement]);

  const getAcknowledgementBadge = (status) => {
    if (!status) {
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

  const exportReport = () => {
    const csvData = [
      [
        "Name",
        "Email",
        "Read Status",
        "Read At",
        ...(broadcast.requires_acknowledgement
          ? ["Acknowledgement Status", "Acknowledged At", "Acknowledgement Note"]
          : []),
      ],
      ...filteredRecipients.map((r) => [
        r.user_name || `${r.first_name || ""} ${r.last_name || ""}`.trim() || r.display_name || r.full_name || "N/A",
        r.user_email || r.email || "N/A",
        r.is_read ? "Yes" : "No",
        r.read_at ? (() => {
          const date = parseUTCDate(r.read_at);
          return date && !isNaN(date.getTime()) ? format(date, "PPpp") : "N/A";
        })() : "N/A",
        ...(broadcast.requires_acknowledgement
          ? [
              r.acknowledgement_status || "Not acknowledged",
              r.acknowledged_at
                ? (() => {
                    const date = parseUTCDate(r.acknowledged_at);
                    return date && !isNaN(date.getTime()) ? format(date, "PPpp") : "N/A";
                  })()
                : "N/A",
              r.acknowledgement_note || "N/A",
            ]
          : []),
      ]),
    ];

    const csvContent = csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `broadcast-${broadcastSlug}-status-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Broadcast Status</h1>
      </div>

      {/* Broadcast Info */}
      <Card>
        <CardHeader>
          <CardTitle>{broadcast.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                Sent{" "}
                {broadcast.created_at
                  ? (() => {
                      const date = parseUTCDate(broadcast.created_at);
                      return date && !isNaN(date.getTime())
                        ? formatDistanceToNow(date, { addSuffix: true })
                        : "";
                    })()
                  : "Unknown time"}
              </span>
            </div>
            {broadcast.category && (
              <Badge variant="outline">{broadcast.category}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Recipients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.read}
            </div>
            <p className="text-xs text-muted-foreground">Read</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.unread}
            </div>
            <p className="text-xs text-muted-foreground">Unread</p>
          </CardContent>
        </Card>
        {broadcast.requires_acknowledgement && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.acknowledged}
              </div>
              <p className="text-xs text-muted-foreground">Acknowledged</p>
            </CardContent>
          </Card>
        )}
      </div>

      {broadcast.requires_acknowledgement && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.agreed}
              </div>
              <p className="text-xs text-muted-foreground">Agreed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.disagreed}
              </div>
              <p className="text-xs text-muted-foreground">Disagreed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Recipients
            </CardTitle>
            <Button variant="outline" size="sm" onClick={exportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Recipients</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                {broadcast.requires_acknowledgement && (
                  <>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="not_acknowledged">
                      Not Acknowledged
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Recipients List */}
          <div className="space-y-2">
            {filteredRecipients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recipients found
              </div>
            ) : (
              filteredRecipients.map((recipient) => (
                <Card key={recipient.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {(() => {
                            // Check for user_name first (from API response)
                            if (recipient.user_name) {
                              return recipient.user_name;
                            }
                            // Then try first_name + last_name
                            const fullName = `${recipient.first_name || ""} ${recipient.last_name || ""}`.trim();
                            if (fullName) {
                              return fullName;
                            }
                            // Fallback to other name fields
                            return recipient.display_name || recipient.full_name || recipient.user_email || recipient.email || recipient.username || "Unknown User";
                          })()}
                        </span>
                        {recipient.is_read ? (
                          <Badge variant="outline" className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200 border-green-200 dark:border-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Read
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200 border-orange-200 dark:border-orange-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Unread
                          </Badge>
                        )}
                        {broadcast.requires_acknowledgement &&
                          getAcknowledgementBadge(recipient.acknowledgement_status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {recipient.user_email || recipient.email || "No email"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {recipient.read_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Read{" "}
                              {(() => {
                                const date = parseUTCDate(recipient.read_at);
                                return date && !isNaN(date.getTime())
                                  ? formatDistanceToNow(date, { addSuffix: true })
                                  : "";
                              })()}
                            </span>
                          </div>
                        )}
                        {recipient.acknowledged_at && (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>
                              Acknowledged{" "}
                              {(() => {
                                const date = parseUTCDate(recipient.acknowledged_at);
                                return date && !isNaN(date.getTime())
                                  ? formatDistanceToNow(date, { addSuffix: true })
                                  : "";
                              })()}
                            </span>
                          </div>
                        )}
                      </div>
                      {recipient.acknowledgement_note && (
                        <div className="p-2 bg-muted rounded-md mt-2">
                          <p className="text-xs">
                            <strong>Note:</strong> {recipient.acknowledgement_note}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {broadcast.send_email && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                        </Badge>
                      )}
                      {broadcast.send_sms && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3" />
                        </Badge>
                      )}
                      {broadcast.send_push && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Bell className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BroadcastStatusPage;

