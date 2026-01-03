"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Check,
  X,
  BarChart3,
} from "lucide-react";
import { useMessage, useMarkMessageAsRead, useAcknowledgeMessageWithStatus } from "@/hooks/useMessages";
import { useCurrentUser } from "@/hooks/useAuth";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { parseUTCDate } from "@/utils/time";
import { useFileReferences } from "@/hooks/useFileReferences";

const BroadcastDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const broadcastSlug = params.id || params.slug;
  const { data: currentUser } = useCurrentUser();
  const { data: broadcast, isLoading } = useMessage(broadcastSlug);
  const markAsReadMutation = useMarkMessageAsRead();
  const acknowledgeMutation = useAcknowledgeMessageWithStatus();
  const { hasPermission } = usePermissionsCheck();
  const { processedHtml, containerRef } = useFileReferences(broadcast?.content);
  
  // Check if this is actually a broadcast
  const isBroadcast = broadcast?.is_broadcast === true;
  
  // Check broadcast read permission
  const canReadBroadcast = hasPermission("broadcast:read") || hasPermission("BROADCAST_READ") || hasPermission("message:read");

  const [acknowledgementNote, setAcknowledgementNote] = useState("");
  const [showAcknowledgeDialog, setShowAcknowledgeDialog] = useState(false);
  const [pendingAckStatus, setPendingAckStatus] = useState(null); // "agreed" or "disagreed"

  // Mark as read when opened
  useEffect(() => {
    if (broadcast && currentUser) {
      const receipt = broadcast.receipts?.find(
        (r) => r.user_id === currentUser.id
      );
      if (!receipt?.is_read) {
        markAsReadMutation.mutate({ slug: broadcastSlug, readVia: "web" });
      }
    }
  }, [broadcast, currentUser, broadcastSlug]);

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

  // Check permission
  if (!canReadBroadcast) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              You do not have permission to view this broadcast.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verify this is actually a broadcast
  if (!isBroadcast) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              This is not a broadcast. Please use the messages page for regular messages.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if current user is the creator
  const isCreator = currentUser?.id === broadcast.created_by_user_id;
  
  const receipt = broadcast.receipts?.find(
    (r) => r.user_id === currentUser?.id
  );
  const isRead = receipt?.is_read || false;
  const ackStatus = receipt?.acknowledgement_status || null;
  const requiresAck = broadcast.requires_acknowledgement || false;
  // Creators don't need to acknowledge their own broadcasts
  const canAcknowledge = requiresAck && !ackStatus && !isCreator;

  const getPriorityBadge = (priority) => {
    const colors = {
      low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      normal: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return (
      <Badge className={cn("text-xs", colors[priority] || "")}>
        {priority?.charAt(0).toUpperCase() + priority?.slice(1) || "Normal"}
      </Badge>
    );
  };

  const handleAcknowledge = (status) => {
    setPendingAckStatus(status);
    setShowAcknowledgeDialog(true);
  };

  const confirmAcknowledge = () => {
    acknowledgeMutation.mutate(
      {
        slug: broadcastSlug,
        acknowledgementStatus: pendingAckStatus,
        acknowledgementNote: acknowledgementNote.trim() || undefined,
      },
      {
        onSuccess: () => {
          setShowAcknowledgeDialog(false);
          setAcknowledgementNote("");
          setPendingAckStatus(null);
        },
      }
    );
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Broadcast Details</h1>
        </div>
        {currentUser?.id === broadcast.created_by_user_id && (
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/broadcasts/${broadcastSlug}/status`)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Status
          </Button>
        )}
      </div>

      {/* Broadcast Content */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-2xl">{broadcast.title}</CardTitle>
                {!isRead && (
                  <Badge variant="default" className="bg-primary">
                    New
                  </Badge>
                )}
                {broadcast.category && (
                  <Badge variant="outline">{broadcast.category}</Badge>
                )}
                {getPriorityBadge(broadcast.priority)}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>
                    {broadcast.created_by_user?.first_name}{" "}
                    {broadcast.created_by_user?.last_name ||
                      broadcast.created_by_user?.email ||
                      "Unknown"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {broadcast.created_at
                      ? (() => {
                          const date = parseUTCDate(broadcast.created_at);
                          return date && !isNaN(date.getTime())
                            ? format(date, "PPpp")
                            : "Unknown time";
                        })()
                      : "Unknown time"}
                  </span>
                </div>
                {isRead && receipt?.read_at && (
                  <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
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
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content */}
          <div
            ref={containerRef}
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />

          {/* Delivery Info */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <span className="text-sm font-medium">Delivery:</span>
            <div className="flex items-center gap-4">
              {broadcast.send_email && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </Badge>
              )}
              {broadcast.send_sms && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  SMS
                </Badge>
              )}
              {broadcast.send_push && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Bell className="h-3 w-3" />
                  Push
                </Badge>
              )}
            </div>
          </div>

          {/* Content Delivery Mode Info */}
          {broadcast.content_delivery_mode === "app_only" && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This broadcast content must be read in the app. The full content
                was not included in email/SMS notifications.
              </p>
            </div>
          )}

          {/* Acknowledgement Section - Only show for recipients, not creators */}
          {requiresAck && !isCreator && (
            <div className="pt-4 border-t space-y-4">
              <h3 className="font-semibold text-lg">Acknowledgement</h3>
              {ackStatus ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {ackStatus === "agreed" ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200 border-green-200 dark:border-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Agreed
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200 border-red-200 dark:border-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Disagreed
                      </Badge>
                    )}
                    {receipt?.acknowledged_at && (
                      <span className="text-sm text-muted-foreground">
                        on{" "}
                        {(() => {
                          const date = parseUTCDate(receipt.acknowledged_at);
                          return date && !isNaN(date.getTime())
                            ? format(date, "PPpp")
                            : "";
                        })()}
                      </span>
                    )}
                  </div>
                  {receipt?.acknowledgement_note && (
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm">
                        <strong>Note:</strong> {receipt.acknowledgement_note}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      This broadcast requires your acknowledgement. Please read
                      the content and indicate whether you agree or disagree.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="acknowledgement_note">
                      Note (optional)
                    </Label>
                    <Textarea
                      id="acknowledgement_note"
                      value={acknowledgementNote}
                      onChange={(e) => setAcknowledgementNote(e.target.value)}
                      placeholder="Add any additional notes..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => handleAcknowledge("agreed")}
                      disabled={acknowledgeMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      I Agree
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleAcknowledge("disagreed")}
                      disabled={acknowledgeMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-2" />
                      I Disagree
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acknowledgement Dialog */}
      <AlertDialog open={showAcknowledgeDialog} onOpenChange={setShowAcknowledgeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Acknowledgement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to{" "}
              <strong>
                {pendingAckStatus === "agreed" ? "agree" : "disagree"}
              </strong>{" "}
              to this broadcast?
              {acknowledgementNote.trim() && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <p className="text-sm">
                    <strong>Your note:</strong> {acknowledgementNote}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowAcknowledgeDialog(false);
                setPendingAckStatus(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAcknowledge}
              className={
                pendingAckStatus === "agreed"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {acknowledgeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm ${pendingAckStatus === "agreed" ? "Agreement" : "Disagreement"}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BroadcastDetailPage;

