"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight,
  MoreVertical,
  Mail,
  Smartphone,
  Bell,
  Send,
  Loader2,
  Settings,
  CheckCircle2,
  Circle,
  ChevronUp,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import RichTextEditor from "@/components/RichTextEditor";
import MentionTextarea from "@/components/MentionTextarea";
import { useCreateMessage, useMarkMessageAsRead, useConversationMessages, useConversation } from "@/hooks/useMessages";
import { useCurrentUser } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { messageKeys } from "@/hooks/useMessages";
import { messagesService } from "@/services/messages";
import { usePresence, useBatchPresence } from "@/hooks/usePresence";
import { toast } from "sonner";
import { MessageSquare, UserPlus, AlertCircle } from "lucide-react";

const ConversationView = ({
  conversationId,
  isMobile,
  onBack,
  usersData,
  rolesData
}) => {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const { isUserOnline } = usePresence();
  const [replyMessage, setReplyMessage] = useState("");
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const [deliveryChannels, setDeliveryChannels] = useState({
    send_email: false,
    send_sms: false,
    send_push: true,
    alert_via_email: true,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const createMessageMutation = useCreateMessage();
  const markAsReadMutation = useMarkMessageAsRead();
  const markedAsReadRef = useRef(new Set());
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const isLoadingInitialRef = useRef(true);
  const pendingMessageRef = useRef(null);

  // Load messages for conversation - always load from page 1, then append older pages
  const { data: messagesData, isLoading: isLoadingMessages } = useConversationMessages(
    conversationId,
    { page: 1, per_page: 20 },
    {
      enabled: !!conversationId,
      onSuccess: (data) => {
        isLoadingInitialRef.current = false;
        // Check if there are more pages
        const total = data.total || 0;
        const pageSize = data.page_size || 20;
        const currentPageNum = data.page || 1;

        // Only show "Load more" if:
        // 1. Total is greater than 0 (there are messages)
        // 2. Current page is less than total pages
        if (total === 0) {
          setHasMorePages(false);
        } else {
          const totalPages = Math.ceil(total / pageSize);
          setHasMorePages(currentPageNum < totalPages);
        }
      },
    }
  );

  // For now, we'll use the first page. Pagination can be enhanced later to load multiple pages
  const messages = messagesData?.messages || [];
  const conversationFromMessages = messagesData?.conversation || null;

  // Also fetch full conversation details (same structure as conversation list)
  const { data: conversationData } = useConversation(conversationId, {
    enabled: !!conversationId,
  });

  // Use conversation from details API (same as list) or fallback to conversation from messages
  const conversation = conversationData || conversationFromMessages;

  // Also update hasMorePages based on current data (in case onSuccess doesn't fire)
  useEffect(() => {
    if (messagesData) {
      const total = messagesData.total || 0;
      const pageSize = messagesData.page_size || 20;
      const currentPageNum = messagesData.page || 1;

      if (total === 0) {
        setHasMorePages(false);
      } else {
        const totalPages = Math.ceil(total / pageSize);
        setHasMorePages(currentPageNum < totalPages);
      }
    }
  }, [messagesData]);

  // Get participant IDs (excluding current user) for presence checking
  const participantIds = useMemo(() => {
    if (!conversation?.participant_user_ids || !currentUser) return [];
    return conversation.participant_user_ids.filter((id) => {
      const normalizedId = typeof id === 'string' ? parseInt(id) : id;
      const normalizedCurrentUserId = typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id;
      return normalizedId !== normalizedCurrentUserId;
    });
  }, [conversation?.participant_user_ids, currentUser]);

  // Get all users for mention dropdown
  const allUsers = useMemo(() => {
    if (!usersData) return [];
    return usersData?.users || usersData?.data || [];
  }, [usersData]);

  // Get conversation participant IDs (for checking if mentioned users are in chat)
  const conversationParticipantIds = useMemo(() => {
    if (!conversation?.participant_user_ids) return [];
    return conversation.participant_user_ids.map(id =>
      typeof id === 'string' ? parseInt(id) : id
    );
  }, [conversation?.participant_user_ids]);

  // Get mentioned users not in conversation
  const mentionedUsersNotInChat = useMemo(() => {
    return mentionedUsers.filter(user => !user.isInConversation);
  }, [mentionedUsers]);

  // Batch fetch presence for conversation participants
  const { data: batchPresenceData } = useBatchPresence(participantIds, {
    enabled: participantIds.length > 0 && !!conversationId,
  });

  // Check if any participant is online
  const hasOnlineParticipant = useMemo(() => {
    if (participantIds.length === 0) return false;
    return participantIds.some((id) => isUserOnline(id));
  }, [participantIds, isUserOnline]);

  // Strip HTML helper (same as ConversationList)
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

  // Get thread title (exact same logic as ConversationList.getMainThreadSubject)
  const getThreadTitle = useMemo(() => {
    // Debug: log conversation object to see what fields are available
    if (process.env.NODE_ENV === 'development' && conversation) {
      console.log('[ConversationView] conversation object:', conversation);
      console.log('[ConversationView] conversation.first_message_title:', conversation.first_message_title);
      console.log('[ConversationView] conversation.initial_message_title:', conversation.initial_message_title);
      console.log('[ConversationView] conversation.subject:', conversation.subject);
    }

    if (!conversation) return null;

    // Use the exact same logic as ConversationList.getMainThreadSubject
    // Use first_message_title or initial_message_title if available, otherwise fall back to subject
    const title = conversation.first_message_title ||
      conversation.initial_message_title ||
      conversation.subject ||
      null;

    if (!title) {
      // Debug: log when no title found
      if (process.env.NODE_ENV === 'development') {
        console.log('[ConversationView] No title found in conversation object');
      }
      return null;
    }

    // Strip HTML using the same function as ConversationList
    const titleStr = stripHtml(title);
    if (!titleStr) return null;

    // Add "Re:" prefix if not already present (same as ConversationList)
    if (titleStr.toLowerCase().startsWith("re:")) {
      return titleStr;
    }

    // Always use "Re:" prefix for all threads (same as ConversationList)
    return `Re: ${titleStr}`;
  }, [conversation]);

  // Get participant names for header
  const participantNames = useMemo(() => {
    if (!conversation?.participant_user_ids || !usersData) {
      // Return thread title if available, otherwise return null (will be handled by header)
      return null; // Let header logic handle the title display
    }

    const users = usersData?.users || usersData?.data || [];
    const participants = conversation.participant_user_ids
      .filter((id) => {
        if (!currentUser) return true;
        const normalizedId = typeof id === 'string' ? parseInt(id) : id;
        const normalizedCurrentUserId = typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id;
        return normalizedId !== normalizedCurrentUserId;
      })
      .map((id) => {
        const user = users.find((u) => u.id === id);
        if (user) {
          return `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || user.username || "Unknown";
        }
        return "Unknown";
      });

    if (participants.length === 0) return "You";
    if (participants.length === 1) return participants[0];
    if (participants.length === 2) return participants.join(" and ");
    return `${participants[0]} and ${participants.length - 1} others`;
  }, [conversation?.participant_user_ids, usersData, currentUser]);

  // Check if current user is the sender of a message
  const isCurrentUserSender = (msg) => {
    if (!currentUser) return false;
    const createdBy = msg.created_by_user_id || msg.created_by || msg.created_by_id;
    if (createdBy) {
      return createdBy === currentUser.id || createdBy === currentUser.id?.toString();
    }
    return false;
  };

  // Get sender name from message
  const getSenderName = (msg) => {
    const users = usersData?.users || usersData?.data || [];
    const createdBy = msg.created_by_user_id || msg.created_by || msg.created_by_id;

    if (createdBy) {
      const sender = users.find((u) => u.id === createdBy || u.id === createdBy?.toString());
      if (sender) {
        return `${sender.first_name} ${sender.last_name}`.trim() || sender.email || sender.username || "Unknown";
      }
    }

    return "Unknown Sender";
  };

  // Get read status for a message
  const getMessageReadStatus = (msg) => {
    if (!currentUser) return { isRead: false, readBy: [] };

    // For sent messages, check if ALL recipients have read it
    if (isCurrentUserSender(msg)) {
      const readReceipts = msg.receipts?.filter((r) => r.is_read) || [];
      const totalRecipients = msg.recipients?.length || 0;
      return {
        isRead: totalRecipients > 0 && readReceipts.length === totalRecipients,
        readBy: readReceipts.map((r) => r.user_id),
        hasUnread: totalRecipients > 0 && readReceipts.length < totalRecipients,
      };
    }

    // For received messages, check if current user has read it
    const receipt = msg.receipts?.find((r) => r.user_id === currentUser.id);
    return {
      isRead: receipt?.is_read || false,
      readAt: receipt?.read_at,
    };
  };

  // Auto-mark unread messages as read when viewing
  useEffect(() => {
    if (!currentUser || !messages || messages.length === 0) return;

    // Find the latest unread message that was received (not sent by current user)
    const sortedMessages = [...messages].sort((a, b) => {
      // Sort by created_at descending (newest first)
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });

    for (const msg of sortedMessages) {
      // Skip if already processed
      if (markedAsReadRef.current.has(msg.id)) {
        continue;
      }

      // Never mark own messages as read
      const createdBy = msg.created_by_user_id || msg.created_by || msg.created_by_id;
      const isSentByCurrentUser = createdBy && (createdBy === currentUser.id || createdBy === currentUser.id?.toString());

      if (isSentByCurrentUser) {
        markedAsReadRef.current.add(msg.id);
        continue;
      }

      // Check if message is already read
      const receipt = msg.receipts?.find((r) => r.user_id === currentUser.id);
      if (receipt?.is_read) {
        markedAsReadRef.current.add(msg.id);
        continue;
      }

      // Found unread message - mark it as read
      markedAsReadRef.current.add(msg.id);

      markAsReadMutation.mutate({
        id: msg.id,
        readVia: "web"
      }, {
        onError: (error) => {
          console.error(`Failed to mark message ${msg.id} as read:`, error);
          markedAsReadRef.current.delete(msg.id);
        }
      });

      // Only mark the latest one
      break;
    }
  }, [messages?.length, currentUser?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    const scrollToBottom = () => {
      const scrollViewport = document.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      } else if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    };

    // Only auto-scroll if we're at the bottom or it's the initial load
    const scrollViewport = document.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollViewport) {
      const isNearBottom = scrollViewport.scrollHeight - scrollViewport.scrollTop - scrollViewport.clientHeight < 100;
      if (isNearBottom || isLoadingInitialRef.current) {
        setTimeout(scrollToBottom, 100);
      }
    } else {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages?.length]);

  // Load more messages when scrolling to top
  // Note: This is a simplified version. For full pagination, you'd need to fetch multiple pages
  // and merge them. For now, we'll just show a "load more" button.
  const handleLoadMore = async () => {
    if (!hasMorePages || isLoadingMore || isLoadingMessages || !conversationId) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response = await messagesService.getConversationMessages(conversationId, {
        page: nextPage,
        per_page: 20,
      });

      const newMessages = response.data?.messages || [];
      const total = response.data?.total || 0;
      const pageSize = response.data?.page_size || 20;

      if (newMessages.length > 0 && total > 0) {
        // Update cache with merged messages (oldest first)
        queryClient.setQueryData(
          messageKeys.conversationMessages(conversationId, { page: 1, per_page: 20 }),
          (oldData) => {
            if (!oldData) return oldData;
            // Prepend older messages to the beginning
            return {
              ...oldData,
              messages: [...newMessages, ...(oldData.messages || [])],
            };
          }
        );
        setCurrentPage(nextPage);

        // Check if there are more pages
        const totalPages = Math.ceil(total / pageSize);
        setHasMorePages(nextPage < totalPages);
      } else {
        // No more messages or total is 0
        setHasMorePages(false);
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSendMessage = async () => {
    if (!replyMessage.trim() || !conversationId) return;

    if (!currentUser) return;

    // Get conversation to determine target
    const conversationData = conversation || await queryClient.fetchQuery({
      queryKey: messageKeys.conversationDetail(conversationId),
      queryFn: async () => {
        const response = await messagesService.getConversation(conversationId);
        return response.data;
      },
    });

    if (!conversationData) {
      toast.error("Error", {
        description: "Could not load thread details.",
      });
      return;
    }

    // Determine target based on conversation participants
    const participantIds = conversationData.participant_user_ids || [];
    const targetUserIds = participantIds.filter((id) => {
      const normalizedId = typeof id === 'string' ? parseInt(id) : id;
      const normalizedCurrentUserId = typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id;
      return normalizedId !== normalizedCurrentUserId;
    });

    if (targetUserIds.length === 0) {
      toast.error("Cannot send message", {
        description: "No valid recipients found.",
      });
      return;
    }

    const messageContent = showAdvancedEditor ? replyMessage.trim() : `<p>${replyMessage.trim().replace(/\n/g, "<br>")}</p>`;

    const submitData = {
      title: conversationData.subject || `Re: ${conversationData.subject || "Message"}`,
      content: messageContent,
      target_type: "user",
      target_user_ids: targetUserIds,
      conversation_id: conversationId, // Include conversation_id to add to existing conversation
      content_delivery_mode: "full",
      send_email: deliveryChannels.send_email,
      send_sms: deliveryChannels.send_sms,
      send_push: deliveryChannels.send_push,
      alert_via_email: deliveryChannels.alert_via_email,
      priority: "normal",
      message_type: "general",
      created_by_user_id: currentUser.id,
    };

    // Clear input immediately for better UX
    setReplyMessage("");

    // Scroll to bottom immediately (optimistic update will add message)
    setTimeout(() => {
      const scrollViewport = document.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      } else if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);

    // Send message (optimistic update is handled in the mutation)
    createMessageMutation.mutate(submitData, {
      onSuccess: () => {
        // Scroll again after server confirms
        setTimeout(() => {
          const scrollViewport = document.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollViewport) {
            scrollViewport.scrollTop = scrollViewport.scrollHeight;
          } else if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        }, 100);
      },
    });
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-2">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
          <p className="text-sm text-muted-foreground">Select a thread to view messages</p>
        </div>
      </div>
    );
  }

  if (isLoadingMessages && isLoadingInitialRef.current) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex-1 flex flex-col bg-background animate-in slide-in-from-right duration-300 overflow-hidden min-h-0",
        isMobile && "absolute inset-0 z-10 bg-background"
      )}
    >
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center gap-2 px-3">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="mr-1"
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold truncate text-sm">
              {getThreadTitle || participantNames || "Thread"}
            </h2>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/admin/messages?conversation=${conversationId}`)}
              >
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea
        className="flex-1"
        ref={scrollAreaRef}
      >
        <div className="p-2 space-y-1">
          {/* Load More Button */}
          {hasMorePages && (
            <div className="flex justify-center py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadMore}
                disabled={isLoadingMore || isLoadingMessages}
                className="text-xs"
              >
                {isLoadingMore || isLoadingMessages ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronUp className="mr-1 h-3 w-3" />
                    Load older messages
                  </>
                )}
              </Button>
            </div>
          )}

          {messages.map((msg, index) => {
            const isSent = isCurrentUserSender(msg);
            const readStatus = getMessageReadStatus(msg);
            const isPending = msg._pending || msg._optimistic;
            const showTime = index === 0 ||
              (messages[index - 1]?.created_at && msg.created_at &&
                new Date(msg.created_at) - new Date(messages[index - 1].created_at) > 5 * 60 * 1000);

            return (
              <div key={msg.id} className={cn("w-full", isPending && "opacity-70")}>
                {/* Time separator */}
                {showTime && (
                  <div className="flex justify-center my-2">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {msg.created_at
                        ? (() => {
                          const msgDate = new Date(msg.created_at);
                          if (isToday(msgDate)) {
                            return format(msgDate, "HH:mm");
                          } else if (isYesterday(msgDate)) {
                            return `Yesterday ${format(msgDate, "HH:mm")}`;
                          } else {
                            return format(msgDate, "MMM d, HH:mm");
                          }
                        })()
                        : "Just now"}
                    </span>
                  </div>
                )}

                {/* Message bubble */}
                <div className={cn(
                  "flex",
                  isSent ? "justify-end" : "justify-start"
                )}>
                  <div className={cn(
                    "max-w-[75%] md:max-w-[60%] rounded-lg px-3 py-2 space-y-1",
                    isSent
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}>
                    <div className={cn(
                      "text-sm [&_p]:mb-1 [&_p]:last:mb-0 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-1 [&_li]:mb-0.5 [&_strong]:font-bold [&_em]:italic [&_a]:underline [&_a]:hover:underline-offset-2",
                      isSent ? "[&_a]:text-primary-foreground [&_a]:underline-offset-2" : "[&_a]:text-primary"
                    )}
                      dangerouslySetInnerHTML={{
                        __html: typeof msg.content === 'string' ? msg.content : String(msg.content || "")
                      }}
                    />
                    <div className={cn(
                      "flex items-center gap-1.5 text-xs",
                      isSent ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      <span>
                        {msg.created_at
                          ? format(new Date(msg.created_at), "HH:mm")
                          : "Just now"}
                      </span>
                      {/* Pending/Sending indicator */}
                      {isSent && isPending && (
                        <Loader2 className="h-3 w-3 animate-spin text-primary-foreground/50" title="Sending..." />
                      )}
                      {/* Read status indicator - only show for sent messages that are not pending */}
                      {isSent && !isPending && (
                        readStatus.isRead ? (
                          <div className="flex items-center gap-0.5" title="Seen by all">
                            <CheckCircle2 className="h-3 w-3 text-primary-foreground/70" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5" title="Not seen">
                            <Circle className="h-3 w-3 text-primary-foreground/50" />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Invisible element at the end for scrolling */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input Section */}
      <div className="flex-shrink-0 border-t bg-background">
        <div className="p-2 space-y-2">
          {/* Advanced Editor Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedEditor(!showAdvancedEditor)}
              className="text-xs h-7"
            >
              <Settings className="h-3 w-3 mr-1" />
              {showAdvancedEditor ? "Simple" : "Advanced"}
            </Button>
          </div>

          {/* Message Input */}
          {showAdvancedEditor ? (
            <div>
              <RichTextEditor
                value={replyMessage}
                onChange={setReplyMessage}
                placeholder="Type your message..."
              />
            </div>
          ) : (
            <MentionTextarea
              value={replyMessage}
              onChange={setReplyMessage}
              placeholder="Type a message... (use @ to mention)"
              users={allUsers}
              conversationParticipantIds={conversationParticipantIds}
              onMentionedUsersChange={setMentionedUsers}
              className="resize-none min-h-[60px] text-sm"
            />
          )}

          {/* Warning for mentioned users not in chat */}
          {mentionedUsersNotInChat.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <div className="flex-1 text-xs">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  {mentionedUsersNotInChat.length} user{mentionedUsersNotInChat.length !== 1 ? 's' : ''} mentioned but not in this chat:
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                  {mentionedUsersNotInChat.map(u => u.name).join(', ')}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 flex-shrink-0"
                onClick={() => {
                  // TODO: Implement add members to conversation
                  toast.info("Add members feature coming soon", {
                    description: "This will allow you to add mentioned users to the conversation.",
                  });
                }}
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Add Members
              </Button>
            </div>
          )}

          {/* Delivery Channels */}
          <div className="flex items-center gap-3 pt-1 border-t">
            <div className="flex items-center gap-1.5">
              <Mail className={cn("h-3.5 w-3.5", deliveryChannels.send_email ? "text-primary" : "text-muted-foreground")} />
              <Label htmlFor="send_email_conversation" className="text-xs cursor-pointer">
                Email
              </Label>
              <Switch
                id="send_email_conversation"
                checked={deliveryChannels.send_email}
                onCheckedChange={(checked) =>
                  setDeliveryChannels((prev) => ({ ...prev, send_email: checked }))
                }
                className="scale-75"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Smartphone className={cn("h-3.5 w-3.5", deliveryChannels.send_sms ? "text-primary" : "text-muted-foreground")} />
              <Label htmlFor="send_sms_conversation" className="text-xs cursor-pointer">
                SMS
              </Label>
              <Switch
                id="send_sms_conversation"
                checked={deliveryChannels.send_sms}
                onCheckedChange={(checked) =>
                  setDeliveryChannels((prev) => ({ ...prev, send_sms: checked }))
                }
                className="scale-75"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Bell className={cn("h-3.5 w-3.5", deliveryChannels.send_push ? "text-primary" : "text-muted-foreground")} />
              <Label htmlFor="send_push_conversation" className="text-xs cursor-pointer">
                Push
              </Label>
              <Switch
                id="send_push_conversation"
                checked={deliveryChannels.send_push}
                onCheckedChange={(checked) =>
                  setDeliveryChannels((prev) => ({ ...prev, send_push: checked }))
                }
                className="scale-75"
              />
            </div>
            <div className="flex-1" />
            <Button
              onClick={handleSendMessage}
              disabled={!replyMessage.trim() || createMessageMutation.isPending || (!deliveryChannels.send_email && !deliveryChannels.send_sms && !deliveryChannels.send_push)}
              size="sm"
              className="h-7"
            >
              {createMessageMutation.isPending ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-1 h-3 w-3" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationView;

