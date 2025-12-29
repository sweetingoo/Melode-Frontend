"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Loader2,
  Plus,
  CheckCircle2,
  Circle,
  User,
  Users,
  CheckSquare2,
  Mail,
  AlertCircle,
  Clock,
  Send,
  Search,
  Filter,
  MoreVertical,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, isToday, isYesterday } from "date-fns";
import { cn } from "@/lib/utils";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";

const MessagesList = ({
  messages,
  isLoading,
  selectedMessageId,
  onMessageClick,
  getReadStatus,
  getStatusBadge,
  getPriorityBadge,
  onOpenCreate,
  searchTerm,
  onSearchChange,
  isFiltersOpen,
  onToggleFilters,
  filters,
  onFiltersChange,
  usersData,
  rolesData,
  currentUser,
  newMessageIds = new Set(),
}) => {
  const { hasPermission } = usePermissionsCheck();
  const canCreateMessage = hasPermission("message:create");
  const scrollAreaRef = useRef(null);
  
  // Auto-scroll to top when new messages arrive
  useEffect(() => {
    if (newMessageIds.size > 0) {
      setTimeout(() => {
        const viewport = document.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = 0;
        }
      }, 200);
    }
  }, [newMessageIds.size]);

  const formatMessageTime = (dateString) => {
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

  const getMessageTypeIcon = (messageType) => {
    const iconConfig = {
      notification: Mail,
      alert: AlertCircle,
      task: CheckSquare2,
      general: MessageSquare,
    };
    return iconConfig[messageType] || MessageSquare;
  };

  // Check if current user is the sender of the message
  const isCurrentUserSender = (message) => {
    if (!currentUser) return false;
    // Check if message has created_by or created_by_user_id field
    const createdBy = message.created_by || message.created_by_user_id || message.created_by_id;
    if (createdBy) {
      return createdBy === currentUser.id || createdBy === currentUser.id?.toString();
    }
    // Fallback: if current user is not in target_user_ids, they are likely the sender
    if (message.target_type === "user" && message.target_user_ids?.length > 0) {
      return !message.target_user_ids.includes(currentUser.id);
    }
    return false;
  };

  // Get sender name from message
  const getSenderName = (message) => {
    const users = usersData?.users || usersData?.data || [];
    const createdBy = message.created_by || message.created_by_user_id || message.created_by_id;
    
    if (createdBy) {
      const sender = users.find((u) => u.id === createdBy || u.id === createdBy?.toString());
      if (sender) {
        return `${sender.first_name} ${sender.last_name}`.trim() || sender.email || sender.username || "Unknown";
      }
    }
    
    // Fallback: try to get from created_by_name if available
    if (message.created_by_name) {
      return message.created_by_name;
    }
    
    return "Unknown Sender";
  };

  // Get display name based on whether current user is sender or receiver
  const getDisplayName = (message) => {
    if (!currentUser) {
      // If no current user, show receiver name (original behavior)
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

  const getReceiverName = (message) => {
    if (message.target_type === "user") {
      if (message.target_user_ids && message.target_user_ids.length > 0) {
        const users = usersData?.users || usersData?.data || [];
        const targetUsers = users.filter((u) => message.target_user_ids.includes(u.id));
        if (targetUsers.length > 0) {
          if (targetUsers.length === 1) {
            return `${targetUsers[0].first_name} ${targetUsers[0].last_name}`.trim() || targetUsers[0].email || targetUsers[0].username || "User";
          } else {
            return `${targetUsers.length} users`;
          }
        }
      }
      return "Users";
    } else if (message.target_type === "role") {
      if (message.target_id) {
        const roles = rolesData?.roles || rolesData || [];
        const targetRole = roles.find((r) => r.id === message.target_id);
        if (targetRole) {
          return targetRole.display_name || targetRole.name || "Role";
        }
      }
      return "Role";
    } else if (message.target_type === "task") {
      return "Task";
    }
    return "Unknown";
  };

  // Group messages by conversation (same participants = same conversation)
  const groupMessagesByConversation = (messages) => {
    const conversations = new Map();
    
    messages.forEach((message) => {
      // Create a unique key for the conversation
      let conversationKey;
      if (message.target_type === "user" && message.target_user_ids?.length > 0) {
        // For user-to-user conversations, include both sender and recipients in the key
        // This ensures A->B and B->A are in the same conversation
        const messageCreatedBy = message.created_by || message.created_by_user_id || message.created_by_id;
        const participants = new Set();
        
        // Normalize all IDs to numbers for consistent comparison
        message.target_user_ids.forEach(id => {
          const normalizedId = typeof id === 'string' ? parseInt(id, 10) : id;
          if (!isNaN(normalizedId)) {
            participants.add(normalizedId);
          }
        });
        
        if (messageCreatedBy) {
          const createdById = typeof messageCreatedBy === 'string' ? parseInt(messageCreatedBy, 10) : messageCreatedBy;
          if (!isNaN(createdById)) {
            participants.add(createdById);
          }
        }
        
        // Ensure we have at least 2 participants for a valid conversation
        if (participants.size < 2) {
          // Fallback: use target_user_ids only
          const sortedIds = Array.from(message.target_user_ids)
            .map(id => typeof id === 'string' ? parseInt(id, 10) : id)
            .filter(id => !isNaN(id))
            .sort((a, b) => a - b);
          conversationKey = `user_${sortedIds.join("_")}`;
        } else {
          const sortedIds = Array.from(participants).sort((a, b) => a - b);
          conversationKey = `user_${sortedIds.join("_")}`;
        }
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log(`Message ${message.id}: created_by=${messageCreatedBy}, target_user_ids=${message.target_user_ids}, conversationKey=${conversationKey}`);
        }
      } else if (message.target_type === "role" && message.target_id) {
        conversationKey = `role_${message.target_id}`;
      } else if (message.target_type === "task" && message.target_id) {
        conversationKey = `task_${message.target_id}`;
      } else {
        conversationKey = `unknown_${message.id}`;
      }

      if (!conversations.has(conversationKey)) {
        // Calculate participants for user-to-user conversations
        let participants = null;
        let displayName = getDisplayName(message); // Default fallback
        
        if (message.target_type === "user" && message.target_user_ids?.length > 0) {
          const messageCreatedBy = message.created_by || message.created_by_user_id || message.created_by_id;
          const participantSet = new Set();
          
          // Normalize all IDs to numbers for consistent comparison
          message.target_user_ids.forEach(id => {
            participantSet.add(typeof id === 'string' ? parseInt(id, 10) : id);
          });
          
          if (messageCreatedBy) {
            const createdById = typeof messageCreatedBy === 'string' ? parseInt(messageCreatedBy, 10) : messageCreatedBy;
            participantSet.add(createdById);
          }
          
          participants = Array.from(participantSet).filter(id => !isNaN(id)).sort((a, b) => a - b);
          
          // For two-person conversations, ALWAYS show the OTHER person's name (not current user)
          // This ensures:
          // - User 1 sending to User 2: User 1 sees "User 2", User 2 sees "User 1"
          // - User 2 replying to User 1: User 2 still sees "User 1", User 1 still sees "User 2"
          if (participants.length === 2 && currentUser) {
            const currentUserId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
            const otherParticipantId = participants.find(p => {
              const normalizedP = typeof p === 'string' ? parseInt(p, 10) : p;
              return normalizedP !== currentUserId;
            });
            
            if (otherParticipantId !== undefined) {
              const users = usersData?.users || usersData?.data || [];
              const otherUser = users.find(u => {
                const userId = typeof u.id === 'string' ? parseInt(u.id, 10) : u.id;
                const normalizedOtherId = typeof otherParticipantId === 'string' ? parseInt(otherParticipantId, 10) : otherParticipantId;
                return userId === normalizedOtherId;
              });
              
              if (otherUser) {
                displayName = `${otherUser.first_name} ${otherUser.last_name}`.trim() || otherUser.email || otherUser.username || "User";
              }
            }
          }
        }
        
        conversations.set(conversationKey, {
          key: conversationKey,
          messages: [],
          latestMessage: message,
          displayName: displayName, // Set once when conversation is created - shows the OTHER person
          targetType: message.target_type,
          participants: participants,
        });
      }

      const conversation = conversations.get(conversationKey);
      conversation.messages.push(message);
      
      // Update latest message if this one is newer
      if (new Date(message.created_at) > new Date(conversation.latestMessage.created_at)) {
        conversation.latestMessage = message;
      }
      
      // Display name is set once when conversation is created and should not change
      // It always shows the OTHER person's name (not current user)
      // This ensures:
      // - User 1 sending to User 2: User 1 sees "User 2", User 2 sees "User 1"
      // - User 2 replying to User 1: User 2 still sees "User 1", User 1 still sees "User 2"
      // So we only set it once when the conversation is first created
    });

    // Sort conversations by latest message time (newest first)
    const sortedConversations = Array.from(conversations.values()).sort((a, b) => {
      return new Date(b.latestMessage.created_at) - new Date(a.latestMessage.created_at);
    });
    
    // Debug logging to help identify grouping issues
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MessagesList] Grouped ${messages.length} messages into ${sortedConversations.length} conversations`);
      sortedConversations.forEach(conv => {
        console.log(`[MessagesList] Conversation "${conv.displayName}" (key: ${conv.key}): ${conv.messages.length} messages`);
        if (conv.participants) {
          console.log(`[MessagesList]   Participants:`, conv.participants);
        }
      });
    }
    
    return sortedConversations;
  };

  const conversations = groupMessagesByConversation(messages);
  
  // Track if we've shown the new message separator
  let hasShownNewMessageSeparator = false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
        <p className="text-sm text-muted-foreground">No messages found</p>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCreate}
          className="mt-4"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create First Message
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search and Filter Section */}
      <div className="flex-shrink-0 border-b bg-background">
        {/* Start Chat Button */}
        {canCreateMessage && (
          <div className="px-4 pt-3 pb-2">
            <Button
              onClick={onOpenCreate}
              size="sm"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Start New Chat
            </Button>
          </div>
        )}

        {/* Search Bar */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Filter Toggle Button */}
        <div className="px-4 pb-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFilters}
            className={cn(
              "h-8 text-xs",
              isFiltersOpen && "bg-accent"
            )}
          >
            <Filter className="h-3 w-3 mr-2" />
            Filters
          </Button>
        </div>

        {/* Filters Panel */}
        {isFiltersOpen && (
          <div className="px-4 pb-3 border-t bg-muted/30">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
              <Select
                value={filters.status}
                onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sending">Sending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.message_type}
                onValueChange={(value) => onFiltersChange({ ...filters, message_type: value })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.priority}
                onValueChange={(value) => onFiltersChange({ ...filters, priority: value })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="my-messages"
                  checked={filters.my_messages}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ ...filters, my_messages: checked })
                  }
                />
                <Label htmlFor="my-messages" className="text-xs cursor-pointer">
                  My messages
                </Label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages List */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="divide-y">
        {conversations.map((conversation, index) => {
          const latestMessage = conversation.latestMessage;
          const readStatus = getReadStatus(latestMessage);
          const MessageIcon = getMessageTypeIcon(latestMessage.message_type);
          const isSelected = selectedMessageId === latestMessage.id.toString();
          const unreadCount = conversation.messages.filter(
            (m) => !getReadStatus(m).isRead
          ).length;
          const isNewMessage = newMessageIds.has(latestMessage.id);
          const showNewMessageSeparator = isNewMessage && !hasShownNewMessageSeparator;

          if (showNewMessageSeparator) {
            hasShownNewMessageSeparator = true;
          }

          return (
            <React.Fragment key={conversation.key}>
              {/* New Message Separator */}
              {showNewMessageSeparator && (
                <div className="px-4 py-2 bg-blue-100/50 dark:bg-blue-950/20 border-y border-blue-300/50 dark:border-blue-800/50">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-blue-400 dark:bg-blue-600" />
                    <Badge variant="default" className="bg-blue-600 text-white dark:bg-blue-500 flex items-center gap-1.5 px-2 py-0.5">
                      <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                      New Message
                    </Badge>
                    <div className="h-px flex-1 bg-blue-400 dark:bg-blue-600" />
                  </div>
                </div>
              )}
              <div
                className={cn(
                  "group relative",
                  isSelected && "bg-muted border-l-4 border-l-primary",
                  !readStatus.isRead && "bg-blue-50/50 dark:bg-blue-950/10",
                  isNewMessage && "bg-blue-100/30 dark:bg-blue-950/20 border-l-2 border-l-blue-500"
                )}
              >
              <div
                onClick={() => onMessageClick(latestMessage.id)}
                className="p-4 cursor-pointer transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                      !readStatus.isRead
                        ? "bg-blue-100 dark:bg-blue-900"
                        : "bg-muted"
                    )}
                  >
                    <MessageIcon
                      className={cn(
                        "h-5 w-5",
                        !readStatus.isRead
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-muted-foreground"
                      )}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Receiver Name - Top */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {conversation.targetType === "user" && <User className="h-3.5 w-3.5 text-muted-foreground" />}
                        {conversation.targetType === "role" && <Users className="h-3.5 w-3.5 text-muted-foreground" />}
                        {conversation.targetType === "task" && (
                          <CheckSquare2 className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <h3
                          className={cn(
                            "font-semibold text-sm",
                            !readStatus.isRead && "font-bold"
                          )}
                        >
                          {conversation.displayName}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {unreadCount > 0 && (
                          <Badge variant="default" className="text-xs h-4 px-1.5">
                            {unreadCount}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatMessageTime(latestMessage.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Latest Message Content */}
                    <p className="text-sm text-foreground line-clamp-2 mb-2">
                      {latestMessage.content?.replace(/<[^>]*>/g, "").substring(0, 120) ||
                        latestMessage.title ||
                        "No content"}
                    </p>

                    {/* Options/Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getPriorityBadge(latestMessage.priority)}
                      {getStatusBadge(latestMessage.status)}
                      <Badge variant="outline" className="text-xs">
                        {latestMessage.message_type}
                      </Badge>
                      {readStatus.isAcknowledged && (
                        <Badge
                          variant="default"
                          className="text-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Ack
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Dots Menu - Show on Hover */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/admin/messages/${latestMessage.id}`, "_blank");
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            </React.Fragment>
          );
        })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MessagesList;

