"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Mail,
  Smartphone,
  Bell,
  AlertCircle,
  Loader2,
  Eye,
  CheckSquare,
  Calendar,
  User,
  Users,
  CheckSquare2,
} from "lucide-react";
import {
  useMessage,
  useMarkMessageAsRead,
  useAcknowledgeMessage,
} from "@/hooks/useMessages";
import { useCurrentUser } from "@/hooks/useAuth";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { useFileReferences } from "@/hooks/useFileReferences";

// Component to render message content with file references
const MessageContent = ({ content, className }) => {
  const { processedHtml, containerRef } = useFileReferences(content);
  
  return (
    <div
      ref={containerRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
};

const MessageDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const messageSlug = params.id || params.slug;
  const { data: currentUser } = useCurrentUser();
  const { data: message, isLoading } = useMessage(messageSlug);
  const markAsReadMutation = useMarkMessageAsRead();
  const acknowledgeMutation = useAcknowledgeMessage();
  
  const [acknowledgementNote, setAcknowledgementNote] = useState("");
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  // Auto-mark as read when message is opened
  useEffect(() => {
    if (message && currentUser) {
      const receipt = message.receipts?.find((r) => r.user_id === currentUser.id);
      if (!receipt?.is_read) {
        // Mark as read via web
        markAsReadMutation.mutate({ slug: messageSlug, readVia: "web" });
      }
    }
  }, [message, currentUser, messageSlug]);

  const handleAcknowledge = async () => {
    if (!message?.requires_acknowledgement) return;
    
    setIsAcknowledging(true);
    try {
      await acknowledgeMutation.mutateAsync({
        slug: messageSlug,
        acknowledgementNote: acknowledgementNote,
      });
      setAcknowledgementNote("");
    } catch (error) {
      console.error("Failed to acknowledge message:", error);
    } finally {
      setIsAcknowledging(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary", icon: Clock },
      sending: { label: "Sending", variant: "default", icon: Mail },
      sent: { label: "Sent", variant: "default", icon: CheckCircle2 },
      failed: { label: "Failed", variant: "destructive", icon: AlertCircle },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

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

  const getReadStatus = () => {
    if (!currentUser || !message) return { isRead: false, isAcknowledged: false };
    
    const receipt = message.receipts?.find((r) => r.user_id === currentUser.id);
    return {
      isRead: receipt?.is_read || false,
      isAcknowledged: receipt?.is_acknowledged || false,
      readAt: receipt?.read_at,
      acknowledgedAt: receipt?.acknowledged_at,
      acknowledgementNote: receipt?.acknowledgement_note,
      readVia: receipt?.read_via,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!message) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Message not found
          </CardContent>
        </Card>
      </div>
    );
  }

  const readStatus = getReadStatus();
  const recipients = message.recipients || [];
  const receipts = message.receipts || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{message.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(message.status)}
              {getPriorityBadge(message.priority)}
              <Badge variant="outline">{message.message_type}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Message Details */}
          <Card>
            <CardHeader>
              <CardTitle>Message Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MessageContent 
                content={message.content}
                className="prose max-w-none"
              />

              {/* Image */}
              {message.image_url && (
                <div className="mt-4">
                  <img
                    src={message.image_url}
                    alt="Message image"
                    className="max-w-full rounded-lg"
                  />
                </div>
              )}

              {/* Link */}
              {message.link_url && (
                <div className="mt-4">
                  <a
                    href={message.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-2"
                  >
                    {message.link_text || message.link_url}
                  </a>
                </div>
              )}

              <Separator />

              {/* Delivery Channels */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Delivery Channels</Label>
                <div className="flex flex-wrap gap-2">
                  {message.send_email && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </Badge>
                  )}
                  {message.send_sms && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Smartphone className="h-3 w-3" />
                      SMS
                    </Badge>
                  )}
                  {message.send_push && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Bell className="h-3 w-3" />
                      Push
                    </Badge>
                  )}
                </div>
              </div>

              {/* Content Delivery Mode */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Content Delivery Mode</Label>
                <Badge variant="outline">
                  {message.content_delivery_mode === "full" && "Full Content"}
                  {message.content_delivery_mode === "app_only" && "App Only"}
                  {message.content_delivery_mode === "hybrid" && "Hybrid"}
                </Badge>
              </div>

              {/* Summary (for hybrid mode) */}
              {message.summary && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Summary</Label>
                  <p className="text-sm text-muted-foreground">{message.summary}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acknowledgement Section */}
          {message.requires_acknowledgement && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare2 className="h-5 w-5" />
                  Acknowledgement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {readStatus.isAcknowledged ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-semibold">Acknowledged</span>
                    </div>
                    {readStatus.acknowledgedAt && (
                      <p className="text-sm text-muted-foreground">
                        Acknowledged on: {format(new Date(readStatus.acknowledgedAt), "PPP p")}
                      </p>
                    )}
                    {readStatus.acknowledgementNote && (
                      <div className="mt-2 p-3 bg-muted rounded-md">
                        <Label className="text-sm font-semibold">Note:</Label>
                        <p className="text-sm mt-1">{readStatus.acknowledgementNote}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      This message requires acknowledgement. Please acknowledge after reading.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="acknowledgement_note">
                        Acknowledgement Note (optional)
                      </Label>
                      <Textarea
                        id="acknowledgement_note"
                        value={acknowledgementNote}
                        onChange={(e) => setAcknowledgementNote(e.target.value)}
                        placeholder="Add a note (optional)..."
                        rows={3}
                      />
                    </div>
                    <Button
                      onClick={handleAcknowledge}
                      disabled={isAcknowledging}
                      className="w-full"
                    >
                      {isAcknowledging && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Acknowledge Message
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Read Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Read Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {readStatus.isRead ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Read
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Circle className="h-3 w-3" />
                      Unread
                    </Badge>
                  )}
                </div>
                {readStatus.readAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Read at:</span>
                    <span className="text-sm">
                      {format(new Date(readStatus.readAt), "PPP p")}
                    </span>
                  </div>
                )}
                {readStatus.readVia && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Read via:</span>
                    <Badge variant="outline">{readStatus.readVia}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Message Info */}
          <Card>
            <CardHeader>
              <CardTitle>Message Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Target:</span>
                  <Badge variant="outline">
                    {message.target_type === "user" && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        User
                      </span>
                    )}
                    {message.target_type === "role" && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Role
                      </span>
                    )}
                    {message.target_type === "task" && (
                      <span className="flex items-center gap-1">
                        <CheckSquare2 className="h-3 w-3" />
                        Task
                      </span>
                    )}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Created:</span>
                  <span className="text-sm">
                    {message.created_at
                      ? format(new Date(message.created_at), "PPP p")
                      : "N/A"}
                  </span>
                </div>
                {message.scheduled_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Scheduled:</span>
                    <span className="text-sm">
                      {format(new Date(message.scheduled_at), "PPP p")}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Read Receipt Log */}
      <Card>
        <CardHeader>
          <CardTitle>Read Receipts & Acknowledgements</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="receipts">
            <TabsList>
              <TabsTrigger value="receipts">Read Receipts</TabsTrigger>
              <TabsTrigger value="acknowledgements">Acknowledgements</TabsTrigger>
            </TabsList>
            <TabsContent value="receipts" className="mt-4">
              {receipts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No read receipts yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Read Status</TableHead>
                      <TableHead>Read At</TableHead>
                      <TableHead>Read Via</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts.map((receipt) => (
                      <TableRow key={receipt.user_id}>
                        <TableCell>
                          {receipt.user_name || `User ${receipt.user_id}`}
                        </TableCell>
                        <TableCell>{receipt.user_email || "N/A"}</TableCell>
                        <TableCell>
                          {receipt.is_read ? (
                            <Badge variant="default" className="flex items-center gap-1 w-fit">
                              <CheckCircle2 className="h-3 w-3" />
                              Read
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              <Circle className="h-3 w-3" />
                              Unread
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {receipt.read_at
                            ? format(new Date(receipt.read_at), "PPP p")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {receipt.read_via ? (
                            <Badge variant="outline">{receipt.read_via}</Badge>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            <TabsContent value="acknowledgements" className="mt-4">
              {receipts.filter((r) => r.is_acknowledged).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No acknowledgements yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Acknowledged At</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts
                      .filter((r) => r.is_acknowledged)
                      .map((receipt) => (
                        <TableRow key={receipt.user_id}>
                          <TableCell>
                            {receipt.user_name || `User ${receipt.user_id}`}
                          </TableCell>
                          <TableCell>{receipt.user_email || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant="default" className="flex items-center gap-1 w-fit">
                              <CheckCircle2 className="h-3 w-3" />
                              Acknowledged
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {receipt.acknowledged_at
                              ? format(new Date(receipt.acknowledged_at), "PPP p")
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {receipt.acknowledgement_note || "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MessageDetailPage;

