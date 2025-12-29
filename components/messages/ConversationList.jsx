"use client";

import React, { useMemo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Users, Circle } from "lucide-react";
import { useCurrentUser } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";

const ConversationList = ({
  conversations = [],
  isLoading = false,
  selectedConversationId = null,
  onConversationClick,
  usersData = null,
}) => {
  const { data: currentUser } = useCurrentUser();
  const { isUserOnline } = usePresence();

  // Get users map for quick lookup
  const usersMap = useMemo(() => {
    const users = usersData?.users || usersData?.data || [];
    const map = new Map();
    users.forEach((user) => {
      map.set(user.id, user);
    });
    return map;
  }, [usersData]);

  // Get participant names (excluding current user)
  const getParticipantNames = (conversation) => {
    if (!conversation.participant_user_ids || conversation.participant_user_ids.length === 0) {
      return "Unknown";
    }

    const participants = conversation.participant_user_ids
      .filter((id) => {
        // Filter out current user
        if (!currentUser) return true;
        const normalizedId = typeof id === 'string' ? parseInt(id) : id;
        const normalizedCurrentUserId = typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id;
        return normalizedId !== normalizedCurrentUserId;
      })
      .map((id) => {
        const user = usersMap.get(id);
        if (user) {
          return `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || user.username || "Unknown";
        }
        return "Unknown";
      });

    if (participants.length === 0) {
      return "You";
    }

    if (participants.length === 1) {
      return participants[0];
    }

    if (participants.length === 2) {
      return participants.join(" and ");
    }

    return `${participants[0]} and ${participants.length - 1} others`;
  };

  // Get participant avatars (excluding current user, max 2)
  const getParticipantAvatars = (conversation) => {
    if (!conversation.participant_user_ids || conversation.participant_user_ids.length === 0) {
      return [];
    }

    const participantIds = conversation.participant_user_ids
      .filter((id) => {
        // Filter out current user
        if (!currentUser) return true;
        const normalizedId = typeof id === 'string' ? parseInt(id) : id;
        const normalizedCurrentUserId = typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id;
        return normalizedId !== normalizedCurrentUserId;
      })
      .slice(0, 2); // Max 2 avatars

    return participantIds.map((id) => {
      const user = usersMap.get(id);
      return {
        id,
        name: user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || user.username || "Unknown" : "Unknown",
        initials: user ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "?" : "?",
        isOnline: isUserOnline(id),
      };
    });
  };

  // Check if any participant in conversation is online
  const hasOnlineParticipant = (conversation) => {
    if (!conversation.participant_user_ids || conversation.participant_user_ids.length === 0) {
      return false;
    }

    return conversation.participant_user_ids.some((id) => {
      // Filter out current user
      if (currentUser) {
        const normalizedId = typeof id === 'string' ? parseInt(id) : id;
        const normalizedCurrentUserId = typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id;
        if (normalizedId === normalizedCurrentUserId) return false;
      }
      return isUserOnline(id);
    });
  };

  // Format last message time
  const formatLastMessageTime = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isToday(date)) {
        return format(date, "HH:mm");
      } else if (isYesterday(date)) {
        return "Yesterday";
      } else {
        return format(date, "MMM d");
      }
    } catch (e) {
      return "";
    }
  };

  // Strip HTML tags from text (SSR-safe)
  const stripHtml = (html) => {
    if (!html) return "";
    if (typeof html !== "string") return String(html);
    // Remove HTML tags using regex (SSR-safe)
    const stripped = html.replace(/<[^>]*>/g, "");
    // Decode common HTML entities
    return stripped
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  };

  // Get last message preview with sender info
  const getLastMessagePreview = (conversation) => {
    // Get last message content
    const lastMessage = conversation.last_message_content || 
                       conversation.last_message || 
                       conversation.last_message_text;
    
    if (!lastMessage) return null;
    
    // Get sender info
    const lastMessageSenderId = conversation.last_message_created_by || 
                                conversation.last_message_created_by_id ||
                                conversation.last_message_created_by_user_id;
    
    let senderName = null;
    if (lastMessageSenderId && usersMap) {
      const sender = usersMap.get(lastMessageSenderId);
      if (sender) {
        senderName = `${sender.first_name || ""} ${sender.last_name || ""}`.trim() || 
                     sender.email || 
                     sender.username || 
                     "Unknown";
      }
    }
    
    // Strip HTML from message
    const stripped = stripHtml(lastMessage);
    const preview = stripped.length > 60 ? stripped.substring(0, 60) + "..." : stripped;
    
    // Format: "Message preview - by Sender Name" or just "Message preview" if no sender
    if (senderName) {
      return `${preview} - ${senderName}`;
    }
    return preview;
  };
  
  // Get main thread subject (from first message)
  const getMainThreadSubject = (conversation) => {
    // Use first_message_title or initial_message_title if available, otherwise fall back to subject
    const title = conversation.first_message_title || 
                  conversation.initial_message_title || 
                  conversation.subject || 
                  null;
    
    if (!title) return null;
    
    // Add "Re:" prefix if not already present
    const titleStr = stripHtml(title);
    if (titleStr.toLowerCase().startsWith("re:")) {
      return titleStr;
    }
    
    // Always use "Re:" prefix for all threads
    return `Re: ${titleStr}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <p className="text-sm text-muted-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground mt-1">Start a new conversation to get started</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="divide-y">
        {conversations.map((conversation) => {
          // Normalize IDs for comparison (handle string/number mismatch)
          const normalizedSelectedId = selectedConversationId 
            ? String(selectedConversationId).trim() 
            : null;
          const normalizedConversationId = conversation.id 
            ? String(conversation.id).trim() 
            : null;
          const isSelected = normalizedSelectedId === normalizedConversationId;
          
          const participantNames = getParticipantNames(conversation);
          const avatars = getParticipantAvatars(conversation);
          const lastMessageTime = formatLastMessageTime(conversation.last_message_at);

          return (
            <div
              key={conversation.id}
              onClick={() => onConversationClick(conversation.id)}
              className={cn(
                "px-4 py-3 cursor-pointer transition-all flex items-start gap-3 relative",
                isSelected 
                  ? "bg-primary/15 border-l-4 border-l-primary shadow-sm hover:bg-primary/20" 
                  : "hover:bg-muted/50 border-l-4 border-l-transparent"
              )}
            >
              {/* Avatars */}
              <div className="flex-shrink-0 relative">
                {avatars.length === 0 ? (
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      <Users className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                ) : avatars.length === 1 ? (
                  <div className="relative">
                    <Avatar className={cn(
                      "h-10 w-10",
                      avatars[0].isOnline && "ring-2 ring-green-500 ring-offset-2 ring-offset-background"
                    )}>
                      <AvatarFallback>{avatars[0].initials}</AvatarFallback>
                    </Avatar>
                    {avatars[0].isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>
                ) : (
                  <div className="relative h-10 w-10">
                    <Avatar className={cn(
                      "h-8 w-8 absolute top-0 left-0 border-2 border-background",
                      avatars[0].isOnline && "ring-2 ring-green-500"
                    )}>
                      <AvatarFallback className="text-xs">{avatars[0].initials}</AvatarFallback>
                    </Avatar>
                    <Avatar className={cn(
                      "h-8 w-8 absolute bottom-0 right-0 border-2 border-background",
                      avatars[1].isOnline && "ring-2 ring-green-500"
                    )}>
                      <AvatarFallback className="text-xs">{avatars[1].initials}</AvatarFallback>
                    </Avatar>
                    {(avatars[0].isOnline || avatars[1].isOnline) && (
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-background rounded-full" />
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isSelected && (
                      <Circle className="h-2 w-2 fill-primary text-primary flex-shrink-0" />
                    )}
                    <h3 className={cn(
                      "text-sm truncate",
                      isSelected ? "font-bold text-primary dark:text-primary" : "font-semibold"
                    )}>
                      {stripHtml(getMainThreadSubject(conversation) || conversation.subject || participantNames)}
                    </h3>
                  </div>
                  {lastMessageTime && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {lastMessageTime}
                    </span>
                  )}
                </div>
                {(() => {
                  const lastMessagePreview = getLastMessagePreview(conversation);
                  return lastMessagePreview ? (
                    <p className="text-xs text-muted-foreground truncate mb-1">
                      {lastMessagePreview}
                    </p>
                  ) : null;
                })()}
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground truncate">
                    {participantNames}
                  </p>
                  {hasOnlineParticipant(conversation) && (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                      <span className="h-1.5 w-1.5 bg-green-500 rounded-full mr-1.5 inline-block" />
                      Online
                    </Badge>
                  )}
                  {!conversation.is_active && (
                    <Badge variant="secondary" className="text-xs">
                      Archived
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default ConversationList;


