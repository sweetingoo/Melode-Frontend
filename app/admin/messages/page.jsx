"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Loader2,
  Send,
  Mail,
  Smartphone,
  Bell,
  Calendar,
  MessageSquare,
} from "lucide-react";
import {
  useMessages,
  useCreateMessage,
  useConversations,
} from "@/hooks/useMessages";
import { useUsers } from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useRoles";
import { useTasks } from "@/hooks/useTasks";
import { useCurrentUser } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePermissionsCheck } from "@/hooks/usePermissionsCheck";
import { cn } from "@/lib/utils";
import MessagesList from "@/components/messages/MessagesList";
import MessageDetail from "@/components/messages/MessageDetail";
import ConversationList from "@/components/messages/ConversationList";
import ConversationView from "@/components/messages/ConversationView";
import StartChatDialog from "@/components/messages/StartChatDialog";
import { Suspense } from "react";

const MessagesPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();
  const { data: currentUser } = useCurrentUser();
  const { hasPermission } = usePermissionsCheck();

  // Permission checks
  const canReadMessages = hasPermission("message:read") || hasPermission("message:list");
  const canCreateMessage = hasPermission("message:create");
  const canUpdateMessage = hasPermission("message:update");
  const canDeleteMessage = hasPermission("message:delete");

  const selectedMessageId = searchParams.get("message");
  const selectedConversationId = searchParams.get("conversation");
  const [viewMode, setViewMode] = useState("conversations"); // "conversations" or "messages"
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [newMessageIds, setNewMessageIds] = useState(new Set());
  const newMessageIdsRef = useRef(new Set());
  const [filters, setFilters] = useState({
    status: "",
    message_type: "",
    priority: "",
    my_messages: false,
  });

  const [messageFormData, setMessageFormData] = useState({
    title: "",
    content: "",
    target_type: "",
    target_id: "",
    target_user_ids: [],
    content_delivery_mode: "full",
    send_email: true,
    send_sms: false,
    send_push: true,
    alert_via_email: true,
    alert_via_sms: false,
    requires_acknowledgement: false,
    priority: "normal",
    message_type: "general",
    image_url: "",
    link_url: "",
    link_text: "",
    summary: "",
    scheduled_at: "",
  });

  const [selectedTargetType, setSelectedTargetType] = useState("");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [scheduledDate, setScheduledDate] = useState(null);
  const [scheduledTime, setScheduledTime] = useState("");

  const queryParams = {
    page: currentPage,
    per_page: 20,
    ...(searchTerm && { search: searchTerm }),
    ...(filters.status && { status: filters.status }),
    ...(filters.message_type && { message_type: filters.message_type }),
    ...(filters.priority && { priority: filters.priority }),
    ...(filters.my_messages && { my_messages: true }),
  };

  const { data: messagesData, isLoading: isLoadingMessages } = useMessages(queryParams);
  const { data: conversationsData, isLoading: isLoadingConversations } = useConversations({
    is_active: true,
    limit: 50,
    offset: 0,
  });
  const { data: usersData } = useUsers({ page: 1, per_page: 100 });
  const { data: rolesData } = useRoles();
  const { data: tasksData } = useTasks({ page: 1, per_page: 100 });
  const createMessageMutation = useCreateMessage();

  const conversations = conversationsData?.conversations || [];

  const messages = messagesData?.messages || messagesData?.data || [];
  const totalPages = messagesData?.total_pages || 1;
  const total = messagesData?.total || 0;
  const selectedMessage = selectedMessageId
    ? messages.find((m) => m.id.toString() === selectedMessageId)
    : null;

  const handleCreateMessage = async () => {
    if (!messageFormData.title.trim() || !messageFormData.content.trim() || !selectedTargetType) {
      return;
    }
    if (selectedTargetType !== "" && !selectedTargetId && selectedUserIds.length === 0) {
      return;
    }

    const submitData = {
      title: messageFormData.title,
      content: messageFormData.content,
      target_type: selectedTargetType,
      content_delivery_mode: messageFormData.content_delivery_mode,
      send_email: messageFormData.send_email,
      send_sms: messageFormData.send_sms,
      send_push: messageFormData.send_push,
      alert_via_email: messageFormData.alert_via_email,
      alert_via_sms: messageFormData.alert_via_sms,
      requires_acknowledgement: messageFormData.requires_acknowledgement,
      priority: messageFormData.priority,
      message_type: messageFormData.message_type,
    };

    if (selectedTargetType === "user" && selectedUserIds.length > 0) {
      submitData.target_user_ids = selectedUserIds;
    } else if (selectedTargetId) {
      submitData.target_id = parseInt(selectedTargetId);
    }

    if (messageFormData.summary) submitData.summary = messageFormData.summary;
    if (messageFormData.image_url) submitData.image_url = messageFormData.image_url;
    if (messageFormData.link_url) submitData.link_url = messageFormData.link_url;
    if (messageFormData.link_text) submitData.link_text = messageFormData.link_text;

    if (scheduledDate && scheduledTime) {
      const scheduledDateTime = new Date(scheduledDate);
      const [hours, minutes] = scheduledTime.split(":");
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      submitData.scheduled_at = scheduledDateTime.toISOString();
    }

    try {
      await createMessageMutation.mutateAsync(submitData);
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create message:", error);
    }
  };

  const resetForm = () => {
    setMessageFormData({
      title: "",
      content: "",
      target_type: "",
      target_id: "",
      target_user_ids: [],
      content_delivery_mode: "full",
      send_email: true,
      send_sms: false,
      send_push: true,
      alert_via_email: true,
      alert_via_sms: false,
      requires_acknowledgement: false,
      priority: "normal",
      message_type: "general",
      image_url: "",
      link_url: "",
      link_text: "",
      summary: "",
      scheduled_at: "",
    });
    setSelectedTargetType("");
    setSelectedTargetId("");
    setSelectedUserIds([]);
    setScheduledDate(null);
    setScheduledTime("");
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary", icon: Clock },
      sending: { label: "Sending", variant: "default", icon: Send },
      sent: { label: "Sent", variant: "default", icon: CheckCircle2 },
      failed: { label: "Failed", variant: "destructive", icon: AlertCircle },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 text-xs">
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
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const getReadStatus = (message) => {
    if (!currentUser) return { isRead: false, isAcknowledged: false };
    const receipt = message.receipts?.find((r) => r.user_id === currentUser.id);
    return {
      isRead: receipt?.is_read || false,
      isAcknowledged: receipt?.is_acknowledged || false,
      readAt: receipt?.read_at,
      acknowledgedAt: receipt?.acknowledged_at,
    };
  };

  // Listen for SSE events to track new messages and auto-scroll
  useEffect(() => {
    const handleSSEMessage = (event) => {
      if (event.detail?.type === "message:created" && event.detail?.data?.id) {
        const messageId = event.detail.data.id;
        newMessageIdsRef.current.add(messageId);
        setNewMessageIds(new Set(newMessageIdsRef.current));

        // Scroll to top of messages list to show new message
        setTimeout(() => {
          const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollArea) {
            scrollArea.scrollTop = 0;
          }
        }, 200);

        // Remove from new messages after 5 seconds
        setTimeout(() => {
          newMessageIdsRef.current.delete(messageId);
          setNewMessageIds(new Set(newMessageIdsRef.current));
        }, 5000);
      }
    };

    // Listen for custom SSE events
    window.addEventListener("sse-message-created", handleSSEMessage);

    return () => {
      window.removeEventListener("sse-message-created", handleSSEMessage);
    };
  }, []);

  // Mark message as seen when clicked
  const handleMessageClick = (messageId) => {
    // Remove from new messages when clicked
    newMessageIdsRef.current.delete(messageId);
    setNewMessageIds(new Set(newMessageIdsRef.current));

    if (isMobile) {
      router.push(`/admin/messages/${messageId}`);
    } else {
      router.push(`/admin/messages?message=${messageId}`);
    }
  };

  const handleBackToList = () => {
    router.push("/admin/messages");
  };

  const handleConversationClick = (conversationId) => {
    if (isMobile) {
      router.push(`/admin/messages?conversation=${conversationId}`);
    } else {
      router.push(`/admin/messages?conversation=${conversationId}`);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // If user doesn't have permission to read messages, show access denied
  if (!canReadMessages) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to view messages.
          </p>
        </div>
      </div>
    );
  }

  // Sort conversations: first conversation stays at top, rest sorted by last_message_at descending
  const sortedConversations = useMemo(() => {
    if (conversations.length === 0) return [];

    // Get the first conversation (index 0) - this will stick to the top
    const firstConversation = conversations[0];

    // Get the rest of the conversations (excluding the first one)
    const restConversations = conversations.slice(1);

    // Sort the rest by last_message_at descending
    const sortedRest = [...restConversations].sort((a, b) => {
      const dateA = new Date(a.last_message_at || a.created_at || 0);
      const dateB = new Date(b.last_message_at || b.created_at || 0);
      return dateB - dateA;
    });

    // Return first conversation at top, followed by sorted rest
    return [firstConversation, ...sortedRest];
  }, [conversations]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Conversation List Sidebar */}
        <div
          className={cn(
            "flex-shrink-0 border-r bg-background transition-all duration-300 flex flex-col",
            isMobile && selectedConversationId ? "hidden" : "w-full md:w-80",
            !isMobile && "md:block"
          )}
        >
          {/* Header with New Chat Button */}
          <div className="flex-shrink-0 border-b p-3 flex items-center justify-between">
            <h2 className="font-semibold text-lg">Conversations</h2>
            {canCreateMessage && (
              <Button
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                New Chat
              </Button>
            )}
          </div>

          {/* Conversation List */}
          <ConversationList
            conversations={sortedConversations}
            isLoading={isLoadingConversations}
            selectedConversationId={selectedConversationId}
            onConversationClick={handleConversationClick}
            usersData={usersData}
          />
        </div>

        {/* Conversation View or Message Detail */}
        {selectedConversationId ? (
          <ConversationView
            conversationId={selectedConversationId}
            isMobile={isMobile}
            onBack={handleBackToList}
            usersData={usersData}
            rolesData={rolesData}
          />
        ) : selectedMessage ? (
          <MessageDetail
            message={selectedMessage}
            isMobile={isMobile}
            onBack={handleBackToList}
            messages={messages}
            usersData={usersData}
            rolesData={rolesData}
            queryParams={queryParams}
          />
        ) : !isMobile ? (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center space-y-2">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
              <p className="text-sm text-muted-foreground">Select a conversation to view messages</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Start Chat Dialog - Simple WhatsApp-like */}
      {canCreateMessage && (
        <StartChatDialog
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          onSubmit={async (submitData) => {
            try {
              const result = await createMessageMutation.mutateAsync(submitData);
              setIsCreateModalOpen(false);
              resetForm();

              // If message was added to a conversation, navigate to that conversation
              if (result?.conversation_id) {
                router.push(`/admin/messages?conversation=${result.conversation_id}`);
              }
            } catch (error) {
              console.error("Failed to send message:", error);
            }
          }}
          isLoading={createMessageMutation.isPending}
          usersData={usersData}
          rolesData={rolesData}
          tasksData={tasksData}
        />
      )}
    </div>
  );
};

const MessagesPage = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <MessagesPageContent />
    </Suspense>
  );
};

export default MessagesPage;
