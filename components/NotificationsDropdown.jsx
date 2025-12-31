"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Mail, MessageSquare, CheckSquare2, AlertCircle, Clock, Loader2, Send, CheckCircle2, XCircle, UserCheck, Info, Megaphone } from "lucide-react";
import { useNotifications, useUnreadNotificationsCount } from "@/hooks/useNotifications";
import { useCurrentUser } from "@/hooks/useAuth";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { parseUTCDate } from "@/utils/time";

// Helper function to ensure HTML content is properly rendered
const getNotificationContent = (notification) => {
  const content = notification.content || notification.summary || "No content";
  if (!content || typeof content !== 'string') {
    return "No content";
  }
  
  // Check if content contains HTML tags (either as <tag> or &lt;tag&gt;)
  const hasHtmlTags = content.includes('<') || content.includes('&lt;');
  
  if (hasHtmlTags) {
    // If content contains HTML entities like &lt; or &gt;, decode them
    if (content.includes('&lt;') || content.includes('&gt;') || content.includes('&amp;')) {
      // Create a temporary element to decode HTML entities
      if (typeof window !== 'undefined') {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        return tempDiv.innerHTML; // This will decode entities
      }
    }
    // If it's already proper HTML, return as-is
    return content;
  }
  
  // If it's plain text, return as-is (will be rendered as text)
  return content;
};

const NotificationsDropdown = () => {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const { data: unreadCountData } = useUnreadNotificationsCount();
  const [isOpen, setIsOpen] = useState(false);
  const { data: notificationsData, isLoading } = useNotifications(
    { page: 1, per_page: 5, unread_only: false },
    { enabled: isOpen } // Only fetch when popover is open
  );

  const unreadCount = unreadCountData?.unread_count || 0;
  // Updated to use 'notifications' instead of 'messages'
  const notifications = notificationsData?.notifications || notificationsData?.messages || notificationsData?.data || [];

  const getMessageTypeIcon = (messageType) => {
    const iconConfig = {
      notification: Mail,
      alert: AlertCircle,
      task: CheckSquare2,
      general: MessageSquare,
    };
    return iconConfig[messageType] || MessageSquare;
  };

  const formatNotificationTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = parseUTCDate(dateString);
    if (!date || isNaN(date.getTime())) return "N/A";
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  const handleNotificationClick = (notification) => {
    // Route based on message type
    if (notification.is_broadcast) {
      router.push(`/admin/broadcasts/${notification.id}`);
    } else if (notification.conversation_id) {
      router.push(`/admin/messages?conversation=${notification.conversation_id}`);
    } else {
      router.push(`/admin/messages/${notification.id}`);
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        onOpenAutoFocus={(e) => {
          // Refetch notifications when popover opens
          e.preventDefault();
        }}
      >
        <div className="flex flex-col max-h-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => router.push("/admin/notifications")}
            >
              View All
            </Button>
          </div>

          {/* Notifications List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Bell className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                <p className="text-xs text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => {
                  // Use Megaphone icon for broadcasts, otherwise use message type icon
                  const Icon = notification.is_broadcast ? Megaphone : getMessageTypeIcon(notification.message_type);
                  // Use is_read directly from notification (new API structure)
                  const isUnread = !notification.is_read;
                  const isSent = notification.created_by_user_id === currentUser?.id;
                  const isBroadcast = notification.is_broadcast;

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "p-3 cursor-pointer transition-colors hover:bg-muted/50 border-l-4",
                        isUnread && "bg-blue-50/50 dark:bg-blue-950/10",
                        // Different styling for sent broadcasts
                        isSent && isBroadcast && "bg-green-50/30 dark:bg-green-950/10 border-l-green-500"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                            isUnread
                              ? "bg-blue-100 dark:bg-blue-900"
                              : "bg-muted"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4",
                              isUnread
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-muted-foreground"
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4
                              className={cn(
                                "text-sm font-medium truncate [&_p]:mb-0 [&_p]:last:mb-0 [&_p]:inline",
                                isUnread && "font-semibold"
                              )}
                              dangerouslySetInnerHTML={{ 
                                __html: (() => {
                                  const title = notification.title || "";
                                  if (!title || typeof title !== 'string') return "";
                                  // Decode HTML entities if present
                                  if (title.includes('&lt;') || title.includes('&gt;') || title.includes('&amp;')) {
                                    if (typeof window !== 'undefined') {
                                      const tempDiv = document.createElement('div');
                                      tempDiv.innerHTML = title;
                                      return tempDiv.innerHTML;
                                    }
                                  }
                                  return title;
                                })()
                              }}
                            />
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {isUnread && (
                                <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                              )}
                              {isSent && isBroadcast && (
                                <>
                                  <Badge variant="outline" className="text-xs h-4 px-1.5 flex items-center gap-0.5 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800">
                                    <Send className="h-3 w-3" />
                                    Sent by you
                                  </Badge>
                                  <Badge variant="outline" className="text-xs h-4 px-1.5 flex items-center gap-0.5 bg-muted text-muted-foreground">
                                    <Info className="h-3 w-3" />
                                    No action needed
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>
                          <div 
                            className="text-xs text-muted-foreground line-clamp-2 mb-1 [&_p]:mb-0 [&_p]:last:mb-0 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-1 [&_li]:mb-0.5 [&_strong]:font-bold [&_em]:italic [&_a]:underline [&_a]:hover:underline-offset-2"
                            dangerouslySetInnerHTML={{ 
                              __html: getNotificationContent(notification)
                            }}
                          />
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">
                              {formatNotificationTime(notification.created_at)}
                            </span>
                            {isBroadcast && notification.category && (
                              <Badge variant="outline" className="text-xs h-4 px-1.5">
                                {notification.category}
                              </Badge>
                            )}
                            {notification.priority && notification.priority !== "normal" && (
                              <Badge 
                                variant={notification.priority === "urgent" ? "destructive" : "default"}
                                className="text-xs h-4 px-1.5"
                              >
                                {notification.priority}
                              </Badge>
                            )}
                            {/* Only show acknowledgment status for received broadcasts, not sent ones */}
                            {notification.requires_acknowledgement && !isSent && (
                              <div className="flex items-center gap-1">
                                {notification.is_acknowledged ? (
                                  notification.acknowledgement_status === "agreed" ? (
                                    <Badge variant="outline" className="text-xs h-4 px-1.5 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200 border-green-200 dark:border-green-800">
                                      <CheckCircle2 className="h-3 w-3 mr-0.5" />
                                      Agreed
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs h-4 px-1.5 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200 border-red-200 dark:border-red-800">
                                      <XCircle className="h-3 w-3 mr-0.5" />
                                      Disagreed
                                    </Badge>
                                  )
                                ) : (
                                  <Badge variant="outline" className="text-xs h-4 px-1.5 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800">
                                    <AlertCircle className="h-3 w-3 mr-0.5" />
                                    Pending
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => router.push("/admin/notifications")}
              >
                See all notifications
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsDropdown;

