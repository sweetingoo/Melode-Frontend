"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sseService } from "@/services/sse";
import { messageKeys } from "@/hooks/useMessages";
import { notificationKeys } from "@/hooks/useNotifications";
import { useCurrentUser } from "@/hooks/useAuth";

/**
 * Hook to manage SSE connection for real-time updates
 */
export const useSSE = () => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [connectionState, setConnectionState] = useState("disconnected");
  const isInitialized = useRef(false);

  useEffect(() => {
    // Only connect if user is authenticated
    if (!currentUser) {
      console.log("SSE: No current user, skipping connection");
      return;
    }
    
    // Reset initialization flag if user changes
    if (isInitialized.current && isInitialized.current !== currentUser.id) {
      console.log("SSE: User changed, resetting connection");
      isInitialized.current = false;
      sseService.disconnect();
    }
    
    if (isInitialized.current === currentUser.id) {
      console.log("SSE: Already initialized for this user, skipping");
      return;
    }

    console.log("SSE: Initializing connection for user:", currentUser.id);
    isInitialized.current = currentUser.id;

    const handleEvent = (event) => {
      console.log("SSE Event received:", event.type, event);

      switch (event.type) {
        case "message:created": {
          // event.data contains the message object
          const messageData = event.data;
          
          console.log("SSE: Processing message:created event", messageData);
          
          if (messageData && messageData.id) {
            // Update message detail cache
            queryClient.setQueryData(messageKeys.detail(messageData.id), messageData);
            console.log("SSE: Updated message detail cache for ID:", messageData.id);
            
            // If message has conversation_id, update conversation messages cache
            if (messageData.conversation_id) {
              queryClient.setQueryData(
                messageKeys.conversationMessages(messageData.conversation_id, { page: 1, per_page: 20 }),
                (oldData) => {
                  if (!oldData) return oldData;
                  
                  // Check if message already exists in cache
                  const existingIndex = oldData.messages?.findIndex((m) => m.id === messageData.id);
                  
                  if (existingIndex >= 0) {
                    // Update existing message
                    const updatedMessages = [...oldData.messages];
                    updatedMessages[existingIndex] = messageData;
                    return {
                      ...oldData,
                      messages: updatedMessages,
                      total: oldData.total || 0,
                    };
                  } else {
                    // Add new message to the end (messages are in chronological order, newest at end)
                    return {
                      ...oldData,
                      messages: [...(oldData.messages || []), messageData],
                      total: (oldData.total || 0) + 1,
                    };
                  }
                }
              );
              console.log("SSE: Updated conversation messages cache for conversation:", messageData.conversation_id);
            }
            
            // Dispatch custom event to notify components about new message
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("sse-message-created", {
                detail: { type: "message:created", data: messageData }
              }));
            }
          }
          
          // Invalidate and refetch ALL message queries (including lists with different params) to ensure immediate UI update
          queryClient.invalidateQueries({ queryKey: messageKeys.all, exact: false });
          queryClient.invalidateQueries({ queryKey: messageKeys.conversations(), exact: false });
          queryClient.refetchQueries({ queryKey: messageKeys.all, exact: false, type: 'active' });
          console.log("SSE: Invalidated and refetched all message queries");
          break;
        }

        case "message:read": {
          // event.data contains { message_id, user_id, read_at, read_via, receipt, conversation_id }
          const data = event.data;
          const messageId = data?.message_id;
          const receipt = data?.receipt;
          const conversationId = data?.conversation_id;
          
          console.log("SSE: Processing message:read event", data);
          
          if (messageId && receipt) {
            // Update message detail cache
            queryClient.setQueryData(messageKeys.detail(messageId), (oldData) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                receipts: oldData.receipts?.map((r) =>
                  r.user_id === receipt.user_id ? { ...r, ...receipt } : r
                ) || [receipt],
              };
            });
            console.log("SSE: Updated message detail cache for read status, ID:", messageId);
            
            // If conversation_id exists, update conversation messages cache
            if (conversationId) {
              queryClient.setQueryData(
                messageKeys.conversationMessages(conversationId, { page: 1, per_page: 20 }),
                (oldData) => {
                  if (!oldData || !oldData.messages) return oldData;
                  
                  const updatedMessages = oldData.messages.map((msg) => {
                    if (msg.id === messageId) {
                      return {
                        ...msg,
                        receipts: msg.receipts?.map((r) =>
                          r.user_id === receipt.user_id ? { ...r, ...receipt } : r
                        ) || [receipt],
                      };
                    }
                    return msg;
                  });
                  
                  return {
                    ...oldData,
                    messages: updatedMessages,
                  };
                }
              );
              console.log("SSE: Updated conversation messages cache for read status");
            }
          }
          
          // Invalidate and refetch ALL message queries to ensure immediate UI update
          queryClient.invalidateQueries({ queryKey: messageKeys.all, exact: false });
          queryClient.invalidateQueries({ queryKey: messageKeys.conversations(), exact: false });
          queryClient.refetchQueries({ queryKey: messageKeys.all, exact: false, type: 'active' });
          console.log("SSE: Invalidated and refetched all message queries for read status update");
          break;
        }

        case "message:acknowledged": {
          // event.data contains { message_id, user_id, acknowledged_at, acknowledgement_note, receipt }
          const data = event.data;
          const messageId = data?.message_id;
          const receipt = data?.receipt;
          
          if (messageId && receipt) {
            // Update message detail cache
            queryClient.setQueryData(messageKeys.detail(messageId), (oldData) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                receipts: oldData.receipts?.map((r) =>
                  r.user_id === receipt.user_id ? { ...r, ...receipt } : r
                ) || [receipt],
              };
            });
          }
          
          // Invalidate and refetch ALL message queries to refresh acknowledgement status
          queryClient.invalidateQueries({ queryKey: messageKeys.all, exact: false });
          queryClient.invalidateQueries({ queryKey: messageKeys.conversations(), exact: false });
          queryClient.refetchQueries({ queryKey: messageKeys.all, exact: false, type: 'active' });
          break;
        }

        case "message:status_updated": {
          // event.data contains { message_id, status, updated_at, delivery_status }
          const data = event.data;
          const messageId = data?.message_id;
          const status = data?.status;
          
          if (messageId) {
            // Update message detail cache
            queryClient.setQueryData(messageKeys.detail(messageId), (oldData) => {
              if (!oldData) return oldData;
              return { 
                ...oldData, 
                status,
                delivery_status: data.delivery_status || oldData.delivery_status,
                updated_at: data.updated_at || oldData.updated_at,
              };
            });
          }
          
          // Invalidate and refetch ALL message queries to refresh status
          queryClient.invalidateQueries({ queryKey: messageKeys.all, exact: false });
          queryClient.invalidateQueries({ queryKey: messageKeys.conversations(), exact: false });
          queryClient.refetchQueries({ queryKey: messageKeys.all, exact: false, type: 'active' });
          break;
        }

        case "notification:created": {
          // event.data contains the notification object
          const notificationData = event.data;
          
          // Invalidate notifications list
          queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
          queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
          break;
        }

        case "notification:read": {
          // event.data contains { notification_id, user_id, read_at }
          const data = event.data;
          
          // Invalidate notifications list and unread count
          queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
          queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
          break;
        }

        case "user:online": {
          // event.data contains { user_id, is_online, timestamp }
          const data = event.data;
          
          console.log("SSE: Processing user:online event", data);
          
          // Dispatch custom event for presence hook to handle
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("sse-user-online", {
              detail: { type: "user:online", data }
            }));
          }
          break;
        }

        case "user:offline": {
          // event.data contains { user_id, is_online, timestamp }
          const data = event.data;
          
          console.log("SSE: Processing user:offline event", data);
          
          // Dispatch custom event for presence hook to handle
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("sse-user-offline", {
              detail: { type: "user:offline", data }
            }));
          }
          break;
        }

        case "error": {
          const errorData = event.data || event;
          console.error("SSE Error:", errorData);
          
          if (errorData.type === "authentication_error") {
            // Token expired or invalid - disconnect and let auth system handle it
            sseService.disconnect();
            isInitialized.current = false;
          }
          break;
        }

        default:
          console.log("SSE: Unknown event type:", event.type);
      }
    };

    const handleError = (error) => {
      console.error("SSE Error:", error);
      setConnectionState("error");
    };

    const handleConnect = () => {
      console.log("SSE: Connected");
      setConnectionState("connected");
    };

    const handleDisconnect = () => {
      console.log("SSE: Disconnected");
      setConnectionState("disconnected");
    };

    // Connect to SSE
    console.log("SSE: Initializing connection...");
    setConnectionState("connecting");
    sseService.connect(handleEvent, handleError, handleConnect, handleDisconnect);

    // Cleanup on unmount or user change
    return () => {
      console.log("SSE: Cleaning up connection...");
      sseService.disconnect();
      if (isInitialized.current === currentUser?.id) {
        isInitialized.current = false;
      }
      setConnectionState("disconnected");
    };
  }, [currentUser?.id, queryClient]);

  // Update connection state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const state = sseService.getConnectionState();
      setConnectionState(state);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    connectionState,
    isConnected: connectionState === "connected",
  };
};

