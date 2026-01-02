"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Eye,
  MoreVertical,
  Mail,
  Smartphone,
  Bell,
  Clock,
  User,
  Users,
  CheckSquare2,
  Link as LinkIcon,
  Send,
  Loader2,
  Settings,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import RichTextEditor from "@/components/RichTextEditor";
import { parseUTCDate } from "@/utils/time";
import { useCreateMessage, useMarkMessageAsRead, useConversationMessages } from "@/hooks/useMessages";
import { useCurrentUser } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { messageKeys } from "@/hooks/useMessages";
import { toast } from "sonner";
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

const MessageDetail = ({ message, isMobile, onBack, messages, usersData, rolesData, queryParams }) => {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [replyMessage, setReplyMessage] = useState("");
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [deliveryChannels, setDeliveryChannels] = useState({
    send_email: false,
    send_sms: false,
    send_push: true,
    alert_via_email: true, // Master switch for email alerts
  });
  const createMessageMutation = useCreateMessage();
  const markAsReadMutation = useMarkMessageAsRead();
  const markedAsReadRef = useRef(new Set()); // Track which messages we've already marked as read
  const processedConversationRef = useRef(null); // Track which conversation we've processed
  const messagesEndRef = useRef(null); // Ref for scrolling to the latest message

  // Check if current user is the sender of a message
  const isCurrentUserSender = (msg) => {
    if (!currentUser) return false;
    const createdBy = msg.created_by || msg.created_by_user_id || msg.created_by_id;
    if (createdBy) {
      return createdBy === currentUser.id || createdBy === currentUser.id?.toString();
    }
    // Fallback: if current user is not in target_user_ids, they are likely the sender
    if (msg.target_type === "user" && msg.target_user_ids?.length > 0) {
      return !msg.target_user_ids.includes(currentUser.id);
    }
    return false;
  };

  // Get read status for a message
  const getMessageReadStatus = (msg) => {
    if (!currentUser) return { isRead: false, readBy: [] };
    
    // For sent messages, check if ALL recipients have read it
    if (isCurrentUserSender(msg)) {
      const readReceipts = msg.receipts?.filter((r) => r.is_read) || [];
      const totalRecipients = msg.target_user_ids?.length || (msg.target_id ? 1 : 0);
      // Only show as "read" if ALL recipients have read it
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

  // Get sender name from message
  const getSenderName = (msg) => {
    const users = usersData?.users || usersData?.data || [];
    const createdBy = msg.created_by || msg.created_by_user_id || msg.created_by_id;
    
    if (createdBy) {
      const sender = users.find((u) => u.id === createdBy || u.id === createdBy?.toString());
      if (sender) {
        return `${sender.first_name} ${sender.last_name}`.trim() || sender.email || sender.username || "Unknown";
      }
    }
    
    // Fallback: try to get from created_by_name if available
    if (msg.created_by_name) {
      return msg.created_by_name;
    }
    
    return "Unknown Sender";
  };

  // Get receiver name from message
  const getReceiverName = (msg) => {
    if (msg.target_type === "user") {
      if (msg.target_user_ids && msg.target_user_ids.length > 0) {
        const users = usersData?.users || usersData?.data || [];
        const targetUsers = users.filter((u) => msg.target_user_ids.includes(u.id));
        if (targetUsers.length > 0) {
          if (targetUsers.length === 1) {
            return `${targetUsers[0].first_name} ${targetUsers[0].last_name}`.trim() || targetUsers[0].email || targetUsers[0].username || "User";
          } else {
            return `${targetUsers.length} users`;
          }
        }
      }
      return "Users";
    } else if (msg.target_type === "role") {
      if (msg.target_id) {
        const roles = rolesData?.roles || rolesData || [];
        const targetRole = roles.find((r) => r.id === msg.target_id);
        if (targetRole) {
          return targetRole.display_name || targetRole.name || "Role";
        }
      }
      return "Role";
    } else if (msg.target_type === "task") {
      return "Task";
    }
    return "Unknown";
  };

  // Get display name for header (sender if received, receiver if sent)
  const getHeaderDisplayName = () => {
    if (!currentUser) {
      return getReceiverName(message);
    }

    const isSender = isCurrentUserSender(message);
    
    if (isSender) {
      // If current user is sender, show receiver name
      return getReceiverName(message);
    } else {
      // If current user is receiver, show sender name
      return getSenderName(message);
    }
  };

  if (!message) return null;

  // Get conversation thread (all messages between the same participants)
  const getConversationThread = () => {
    if (!messages || messages.length === 0) return [message];
    
    let conversationMessages = [];
    if (message.target_type === "user" && message.target_user_ids?.length > 0) {
      // For user-to-user conversations, group messages that involve the same set of users
      // regardless of direction (A->B and B->A should be in the same conversation)
      const messageCreatedBy = message.created_by || message.created_by_user_id || message.created_by_id;
      const messageTargetIds = new Set(message.target_user_ids);
      
      // Create a set of all participants in this conversation (sender + recipients)
      const participants = new Set([...messageTargetIds]);
      if (messageCreatedBy) {
        participants.add(messageCreatedBy);
      }
      
      conversationMessages = messages.filter((m) => {
        if (m.target_type !== "user" || !m.target_user_ids?.length) return false;
        
        const mCreatedBy = m.created_by || m.created_by_user_id || m.created_by_id;
        const mTargetIds = new Set(m.target_user_ids);
        
        // Create a set of all participants in this message
        const mParticipants = new Set([...mTargetIds]);
        if (mCreatedBy) {
          mParticipants.add(mCreatedBy);
        }
        
        // Messages are in the same conversation if they have the same set of participants
        if (participants.size !== mParticipants.size) return false;
        
        // Check if all participants match
        for (const participant of participants) {
          if (!mParticipants.has(participant)) return false;
        }
        
        return true;
      });
    } else if (message.target_type === "role" && message.target_id) {
      conversationMessages = messages.filter(
        (m) => m.target_type === "role" && m.target_id === message.target_id
      );
    } else if (message.target_type === "task" && message.target_id) {
      conversationMessages = messages.filter(
        (m) => m.target_type === "task" && m.target_id === message.target_id
      );
    } else {
      return [message];
    }

    // Sort by created_at (oldest first for conversation view)
    return conversationMessages.sort(
      (a, b) => parseUTCDate(a.created_at) - parseUTCDate(b.created_at)
    );
  };

  // Memoize conversation thread to update when messages change
  const conversationThread = useMemo(() => {
    const thread = getConversationThread();
    console.log("Conversation thread updated:", thread.map(m => ({ id: m.id, created_at: m.created_at })));
    return thread;
  }, [messages, message]);

  // Only refetch on initial mount or when message ID actually changes
  // SSE handles real-time updates, so we don't need constant refetching
  useEffect(() => {
    // Only refetch once when the component first mounts with a message
    // Subsequent updates come from SSE
    if (message?.id) {
      // Just invalidate to mark as stale, but don't force refetch
      // The query will refetch if needed when it's accessed
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
    }
  }, [message?.id]); // Only depend on message ID, not queryParams

  // Auto-mark the LATEST unread message in the conversation as read when viewing
  // Only marks the most recent unread message received from others
  useEffect(() => {
    if (!currentUser || !conversationThread || conversationThread.length === 0) return;
    
    // Find the latest unread message that was received (not sent by current user)
    // Sort by ID descending first (higher ID = more recent), then by created_at as fallback
    const sortedThread = [...conversationThread].sort((a, b) => {
      // Primary sort: by ID (higher ID = more recent)
      if (a.id !== b.id) {
        return b.id - a.id; // Most recent first (higher ID)
      }
      // Fallback: by created_at
      const dateA = parseUTCDate(a.created_at || 0);
      const dateB = parseUTCDate(b.created_at || 0);
      return dateB - dateA; // Most recent first
    });
    
    console.log("Conversation thread sorted:", sortedThread.map(m => ({ id: m.id, created_at: m.created_at })));
    
    // Find the latest unread message received from others
    for (const msg of sortedThread) {
      // Skip if already processed
      if (markedAsReadRef.current.has(msg.id)) {
        console.log(`Skipping message ${msg.id} - already processed`);
        continue;
      }
      
      // IMPORTANT: Never mark own messages as read - only mark messages received from others
      const createdBy = msg.created_by || msg.created_by_user_id || msg.created_by_id;
      const isSentByCurrentUser = createdBy && (createdBy === currentUser.id || createdBy === currentUser.id?.toString());
      
      // Skip if current user sent this message
      if (isSentByCurrentUser) {
        console.log(`Skipping message ${msg.id} - sent by current user`);
        markedAsReadRef.current.add(msg.id);
        continue;
      }
      
      // Check if message is already read
      const receipt = msg.receipts?.find((r) => r.user_id === currentUser.id);
      if (receipt?.is_read) {
        console.log(`Skipping message ${msg.id} - already read`);
        markedAsReadRef.current.add(msg.id);
        continue;
      }
      
      // Found the latest unread message - mark it as read
      markedAsReadRef.current.add(msg.id);
      
      console.log(`✅ Marking latest unread message ${msg.id} as read (from conversation with ${sortedThread.length} messages)`);
      
      // Mark as read via web (only for messages received from others)
      markAsReadMutation.mutate({ 
        id: msg.id, 
        readVia: "web" 
      }, {
        onError: (error) => {
          console.error(`Failed to mark message ${msg.id} as read:`, error);
          // Remove from ref on error so we can retry
          markedAsReadRef.current.delete(msg.id);
        }
      });
      
      // Only mark the latest one, then break
      break;
    }
  }, [conversationThread?.length, currentUser?.id]); // Re-run when conversation thread changes

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!conversationThread || conversationThread.length === 0) return;
    
    // Scroll to bottom after a short delay to ensure DOM is updated
    const scrollToBottom = () => {
      // Try to find the scroll viewport (Radix UI ScrollArea)
      const scrollViewport = document.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      } else if (messagesEndRef.current) {
        // Fallback: scroll the message end element into view
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    };
    
    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [conversationThread?.length]); // Re-run when conversation thread length changes

  const handleSendMessage = async () => {
    if (!replyMessage.trim()) return;

    if (!currentUser) return;

    // Validate that user is not sending to themselves
    // Check if the original message was sent to the current user (meaning current user would be replying to themselves)
    const messageCreatedBy = message.created_by || message.created_by_user_id || message.created_by_id;
    const isOriginalMessageFromCurrentUser = messageCreatedBy && (
      messageCreatedBy === currentUser.id || messageCreatedBy === currentUser.id?.toString()
    );

    if (message.target_type === "user" && message.target_user_ids?.length > 0) {
      // Check if original message was sent to current user
      const isOriginalMessageToCurrentUser = message.target_user_ids.some((userId) => {
        const normalizedUserId = typeof userId === 'string' ? parseInt(userId) : userId;
        const normalizedCurrentUserId = typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id;
        return normalizedUserId === normalizedCurrentUserId;
      });

      // If original message was from current user to current user, prevent reply
      if (isOriginalMessageFromCurrentUser && isOriginalMessageToCurrentUser) {
        toast.error("Cannot send message", {
          description: "You cannot send a message to yourself.",
        });
        return;
      }

      // Also check if trying to send to self in the target list
      const isSendingToSelf = message.target_user_ids.some((userId) => {
        const normalizedUserId = typeof userId === 'string' ? parseInt(userId) : userId;
        const normalizedCurrentUserId = typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id;
        return normalizedUserId === normalizedCurrentUserId;
      });
      
      if (isSendingToSelf && !isOriginalMessageFromCurrentUser) {
        toast.error("Cannot send message", {
          description: "You cannot send a message to yourself.",
        });
        return;
      }
    }

    // Determine target based on original message
    const submitData = {
      title: `Re: ${message.title}`,
      content: showAdvancedEditor ? replyMessage.trim() : `<p>${replyMessage.trim().replace(/\n/g, "<br>")}</p>`,
      target_type: message.target_type,
      content_delivery_mode: "full",
      send_email: deliveryChannels.send_email,
      send_sms: deliveryChannels.send_sms,
      send_push: deliveryChannels.send_push,
      alert_via_email: deliveryChannels.alert_via_email, // Master switch for email alerts
      priority: message.priority || "normal",
      message_type: message.message_type || "general",
      reply_to_message_id: message.id, // Always include reply_to_message_id - backend will auto-correct recipient
    };

    // Include conversation_id if available to add message to existing conversation
    if (message.conversation_id) {
      submitData.conversation_id = message.conversation_id;
    }

    // Set target based on message type - ensure only one target field is set
    // Backend will auto-correct recipient if reply_to_message_id is provided, but we send it for best UX
    if (message.target_type === "user" && message.target_user_ids?.length > 0) {
      // Ensure all user IDs are integers
      submitData.target_user_ids = message.target_user_ids.map(id => typeof id === 'string' ? parseInt(id) : id);
      // Explicitly don't send target_id for user-based messages
      delete submitData.target_id;
    } else if (message.target_id) {
      submitData.target_id = typeof message.target_id === 'string' ? parseInt(message.target_id) : message.target_id;
      // Explicitly don't send target_user_ids for role/task-based messages
      delete submitData.target_user_ids;
    }

    try {
      await createMessageMutation.mutateAsync(submitData);
      setReplyMessage("");
      
      // Immediately refetch messages to show the new message in the conversation
      // Invalidate queries instead of refetching - let React Query handle when to refetch
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: messageKeys.conversations() });
      
      // If conversation_id exists, invalidate conversation messages
      if (message.conversation_id) {
        queryClient.invalidateQueries({ queryKey: messageKeys.conversationMessages(message.conversation_id) });
      }
      
      // Scroll to bottom after sending message
      setTimeout(() => {
        const scrollViewport = document.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
          scrollViewport.scrollTop = scrollViewport.scrollHeight;
        } else if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 200);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

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
            <h2 className="font-semibold truncate text-sm">{getHeaderDisplayName()}</h2>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => router.push(`/admin/messages/${message.id}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Full Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Conversation History */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversationThread.map((msg, index) => {
            const isSent = isCurrentUserSender(msg);
            const readStatus = getMessageReadStatus(msg);
            const showTime = index === 0 || 
              parseUTCDate(msg.created_at) - parseUTCDate(conversationThread[index - 1].created_at) > 5 * 60 * 1000; // 5 minutes
            
            return (
              <div key={msg.id} className="w-full">
                {/* Time separator */}
                {showTime && (
                  <div className="flex justify-center my-2">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {msg.created_at
                        ? (() => {
                            const msgDate = parseUTCDate(msg.created_at);
                            if (isToday(msgDate)) {
                              return format(msgDate, "HH:mm");
                            } else if (isYesterday(msgDate)) {
                              return `Yesterday ${format(msgDate, "HH:mm")}`;
                            } else {
                              return format(msgDate, "MMM d, HH:mm");
                            }
                          })()
                        : "N/A"}
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
                    <MessageContent 
                      content={typeof msg.content === 'string' ? msg.content : String(msg.content || "")}
                      className={cn(
                        "text-sm [&_p]:mb-1 [&_p]:last:mb-0 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-1 [&_li]:mb-0.5 [&_strong]:font-bold [&_em]:italic [&_a]:underline [&_a]:hover:underline-offset-2",
                        isSent ? "[&_a]:text-primary-foreground [&_a]:underline-offset-2" : "[&_a]:text-primary"
                      )}
                    />
                    <div className={cn(
                      "flex items-center gap-1.5 text-xs",
                      isSent ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      <span>
                        {msg.created_at
                          ? format(parseUTCDate(msg.created_at), "HH:mm")
                          : ""}
                      </span>
                      {/* Read status indicator - only show for sent messages */}
                      {isSent && (
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

      {/* Message Input Section - Always Visible */}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/messages/${message.id}`)}
              className="text-xs h-7"
            >
              <Eye className="h-3 w-3 mr-1" />
              Details
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
            <Textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Type a message..."
              className="resize-none min-h-[60px] text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          )}

          {/* Email Alert Control */}
          <div className="flex items-center justify-between pt-1 border-t pb-2">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <Label htmlFor="alert_via_email_reply" className="text-xs cursor-pointer">
                Enable Email Alerts
              </Label>
            </div>
            <Switch
              id="alert_via_email_reply"
              checked={deliveryChannels.alert_via_email}
              onCheckedChange={(checked) =>
                setDeliveryChannels((prev) => ({ ...prev, alert_via_email: checked }))
              }
              className="scale-75"
            />
          </div>

          {/* Delivery Channels */}
          <div className="flex items-center gap-3 pt-1 border-t">
            <div className="flex items-center gap-1.5">
              <Mail className={cn("h-3.5 w-3.5", deliveryChannels.send_email ? "text-primary" : "text-muted-foreground")} />
              <Label htmlFor="send_email_reply" className="text-xs cursor-pointer">
                Email
              </Label>
              <Switch
                id="send_email_reply"
                checked={deliveryChannels.send_email}
                onCheckedChange={(checked) =>
                  setDeliveryChannels((prev) => ({ ...prev, send_email: checked }))
                }
                className="scale-75"
                disabled={!deliveryChannels.alert_via_email}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Smartphone className={cn("h-3.5 w-3.5", deliveryChannels.send_sms ? "text-primary" : "text-muted-foreground")} />
              <Label htmlFor="send_sms_reply" className="text-xs cursor-pointer">
                SMS
              </Label>
              <Switch
                id="send_sms_reply"
                checked={deliveryChannels.send_sms}
                onCheckedChange={(checked) =>
                  setDeliveryChannels((prev) => ({ ...prev, send_sms: checked }))
                }
                className="scale-75"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Bell className={cn("h-3.5 w-3.5", deliveryChannels.send_push ? "text-primary" : "text-muted-foreground")} />
              <Label htmlFor="send_push_reply" className="text-xs cursor-pointer">
                Push
              </Label>
              <Switch
                id="send_push_reply"
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

export default MessageDetail;

