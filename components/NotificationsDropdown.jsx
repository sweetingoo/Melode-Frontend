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
import { Bell, Mail, MessageSquare, CheckSquare2, AlertCircle, Clock, Loader2 } from "lucide-react";
import { useNotifications, useUnreadNotificationsCount } from "@/hooks/useNotifications";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";

const NotificationsDropdown = () => {
  const router = useRouter();
  const { data: unreadCountData } = useUnreadNotificationsCount();
  const [isOpen, setIsOpen] = useState(false);
  const { data: notificationsData, isLoading } = useNotifications(
    { page: 1, per_page: 5, unread_only: false },
    { enabled: isOpen } // Only fetch when popover is open
  );

  const unreadCount = unreadCountData?.unread_count || 0;
  const notifications = notificationsData?.messages || notificationsData?.data || [];

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
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };

  const handleNotificationClick = (notificationId) => {
    router.push(`/admin/messages/${notificationId}`);
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
                  const Icon = getMessageTypeIcon(notification.message_type);
                  const isUnread = !notification.receipts?.some(
                    (r) => r.is_read
                  ) || notification.receipts?.length === 0;

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification.id)}
                      className={cn(
                        "p-3 cursor-pointer transition-colors hover:bg-muted/50",
                        isUnread && "bg-blue-50/50 dark:bg-blue-950/10"
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
                                "text-sm font-medium truncate",
                                isUnread && "font-semibold"
                              )}
                            >
                              {notification.title}
                            </h4>
                            {isUnread && (
                              <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                            {notification.content?.replace(/<[^>]*>/g, "").substring(0, 80) ||
                              notification.summary ||
                              "No content"}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatNotificationTime(notification.created_at)}
                            </span>
                            <Badge variant="outline" className="text-xs h-4 px-1.5">
                              {notification.message_type}
                            </Badge>
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

