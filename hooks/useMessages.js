import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesService } from "@/services/messages";
import { toast } from "sonner";

// Message query keys
export const messageKeys = {
  all: ["messages"],
  lists: () => [...messageKeys.all, "list"],
  list: (params) => [...messageKeys.lists(), params],
  details: () => [...messageKeys.all, "detail"],
  detail: (id) => [...messageKeys.details(), id],
  conversations: () => [...messageKeys.all, "conversations"],
  conversationList: (params) => [...messageKeys.conversations(), "list", params],
  conversationThread: (id) => [...messageKeys.conversations(), "thread", id],
  conversationMessages: (id, params) => [...messageKeys.conversations(), "messages", id, params],
  conversationDetail: (id) => [...messageKeys.conversations(), "detail", id],
};

// Get all messages query
export const useMessages = (params = {}, options = {}) => {
  return useQuery({
    queryKey: messageKeys.list(params),
    queryFn: async () => {
      const response = await messagesService.getMessages(params);
      return response.data;
    },
    staleTime: 0, // Always consider stale so SSE updates trigger refetch
    refetchOnWindowFocus: true, // Refetch when window regains focus
    // Removed polling - SSE handles real-time updates
    ...options,
  });
};

// Get single message query
export const useMessage = (id, options = {}) => {
  return useQuery({
    queryKey: messageKeys.detail(id),
    queryFn: async () => {
      const response = await messagesService.getMessage(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Create message mutation with optimistic updates
export const useCreateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageData) => {
      const response = await messagesService.createMessage(messageData);
      return response.data;
    },
    onMutate: async (messageData) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      const conversationId = messageData.conversation_id;
      if (!conversationId) return { previousMessages: null };

      await queryClient.cancelQueries({ 
        queryKey: messageKeys.conversationMessages(conversationId, { page: 1, per_page: 20 })
      });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(
        messageKeys.conversationMessages(conversationId, { page: 1, per_page: 20 })
      );

      // Generate a temporary ID for the optimistic message
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      // Create optimistic message
      const optimisticMessage = {
        id: tempId,
        content: messageData.content,
        title: messageData.title,
        created_at: now,
        updated_at: now,
        created_by: messageData.created_by || messageData.created_by_user_id,
        created_by_user_id: messageData.created_by_user_id || messageData.created_by,
        target_type: messageData.target_type,
        target_user_ids: messageData.target_user_ids,
        conversation_id: conversationId,
        _optimistic: true, // Flag to identify optimistic messages
        _pending: true, // Flag to show sending state
        receipts: [],
        recipients: [],
      };

      // Optimistically update the cache
      queryClient.setQueryData(
        messageKeys.conversationMessages(conversationId, { page: 1, per_page: 20 }),
        (old) => {
          if (!old) {
            return {
              messages: [optimisticMessage],
              total: 1,
              page: 1,
              page_size: 20,
              conversation: null,
            };
          }

          // Append optimistic message at the end (newest messages are typically at the end)
          return {
            ...old,
            messages: [...(old.messages || []), optimisticMessage],
            total: (old.total || 0) + 1,
          };
        }
      );

      return { previousMessages, optimisticMessage, conversationId };
    },
    onSuccess: (data, variables, context) => {
      const conversationId = variables.conversation_id || context?.conversationId;
      
      if (conversationId && context?.optimisticMessage) {
        // Replace optimistic message with real message from server
        queryClient.setQueryData(
          messageKeys.conversationMessages(conversationId, { page: 1, per_page: 20 }),
          (old) => {
            if (!old) return old;

            // Find and replace the optimistic message
            const optimisticIndex = old.messages?.findIndex(
              (msg) => msg.id === context.optimisticMessage.id || msg._optimistic
            );

            if (optimisticIndex !== undefined && optimisticIndex >= 0) {
              const newMessages = [...(old.messages || [])];
              // Replace optimistic message with real one
              newMessages[optimisticIndex] = {
                ...data,
                _optimistic: false,
                _pending: false,
              };
              
              return {
                ...old,
                messages: newMessages,
                total: old.total, // Keep total as is (we added 1 optimistically, now replacing)
              };
            }

            // If optimistic message not found, append the new message
            return {
              ...old,
              messages: [...(old.messages || []), data],
              total: (old.total || 0) + 1,
            };
          }
        );
      }

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      queryClient.invalidateQueries({ queryKey: messageKeys.conversationList() });
    },
    onError: (error, variables, context) => {
      const conversationId = variables.conversation_id || context?.conversationId;
      
      // Remove optimistic message on error
      if (conversationId && context?.optimisticMessage) {
        queryClient.setQueryData(
          messageKeys.conversationMessages(conversationId, { page: 1, per_page: 20 }),
          (old) => {
            if (!old) return old;

            return {
              ...old,
              messages: (old.messages || []).filter(
                (msg) => msg.id !== context.optimisticMessage.id && !msg._optimistic
              ),
              total: Math.max(0, (old.total || 0) - 1),
            };
          }
        );
      }

      // Restore previous messages if available
      if (context?.previousMessages) {
        queryClient.setQueryData(
          messageKeys.conversationMessages(conversationId, { page: 1, per_page: 20 }),
          context.previousMessages
        );
      }

      console.error("Create message error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create message";
      
      // Strip HTML tags from error message
      const stripHtml = (html) => {
        if (typeof html !== 'string') return html;
        return html.replace(/<[^>]*>/g, '').trim();
      };
      
      const cleanErrorMessage = Array.isArray(errorMessage)
        ? errorMessage.map((e) => stripHtml(e.msg || e)).join(", ")
        : stripHtml(errorMessage);
      
      toast.error("Failed to send message", {
        description: cleanErrorMessage,
      });
    },
  });
};

// Mark message as read mutation
export const useMarkMessageAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, readVia = "web" }) => {
      const response = await messagesService.markAsRead(id, readVia);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Backend returns receipt object: { id, user_id, user_email, user_name, read_at, is_read, ... }
      console.log("Message marked as read:", data);
      
      // Update the message in cache with the receipt data
      queryClient.setQueryData(messageKeys.detail(variables.id), (oldData) => {
        if (!oldData) return oldData;
        
        // Update or add receipt for current user
        const existingReceipts = oldData.receipts || [];
        const receiptIndex = existingReceipts.findIndex((r) => r.user_id === data.user_id);
        
        let updatedReceipts;
        if (receiptIndex >= 0) {
          // Update existing receipt
          updatedReceipts = existingReceipts.map((receipt, index) =>
            index === receiptIndex ? { ...receipt, ...data } : receipt
          );
        } else {
          // Add new receipt
          updatedReceipts = [...existingReceipts, data];
        }
        
        return {
          ...oldData,
          receipts: updatedReceipts,
        };
      });
      
      // Invalidate messages list to refresh read status
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
    },
    onError: (error) => {
      console.error("Mark message as read error:", error);
      // Don't show error toast for read operations - they're silent
    },
  });
};

// Acknowledge message mutation
export const useAcknowledgeMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, acknowledgementNote = "" }) => {
      const response = await messagesService.acknowledgeMessage(
        id,
        acknowledgementNote
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the message in cache
      queryClient.setQueryData(messageKeys.detail(variables.id), (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          receipts: oldData.receipts?.map((receipt) =>
            receipt.user_id === data.user_id
              ? { ...receipt, ...data }
              : receipt
          ) || [],
        };
      });
      
      // Invalidate messages list to refresh acknowledgement status
      queryClient.invalidateQueries({ queryKey: messageKeys.lists() });
      
      toast.success("Message acknowledged", {
        description: "Your acknowledgement has been recorded.",
      });
    },
    onError: (error) => {
      console.error("Acknowledge message error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to acknowledge message";
      toast.error("Failed to acknowledge message", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Get conversations query (for two-way communication)
export const useConversations = (params = {}, options = {}) => {
  return useQuery({
    queryKey: messageKeys.conversationList(params),
    queryFn: async () => {
      const response = await messagesService.getConversations(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get conversation thread query (legacy - use useConversationMessages instead)
export const useConversationThread = (id, options = {}) => {
  return useQuery({
    queryKey: messageKeys.conversationThread(id),
    queryFn: async () => {
      const response = await messagesService.getConversationThread(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get messages in a conversation query (new endpoint)
export const useConversationMessages = (conversationId, params = {}, options = {}) => {
  return useQuery({
    queryKey: messageKeys.conversationMessages(conversationId, params),
    queryFn: async () => {
      const response = await messagesService.getConversationMessages(conversationId, params);
      return response.data;
    },
    enabled: !!conversationId,
    staleTime: 0, // Always consider stale so SSE updates trigger refetch
    ...options,
  });
};

// Get conversation details query
export const useConversation = (id, options = {}) => {
  return useQuery({
    queryKey: messageKeys.conversationDetail(id),
    queryFn: async () => {
      const response = await messagesService.getConversation(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Add participant mutation
export const useAddParticipant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, userId }) => {
      const response = await messagesService.addParticipant(conversationId, userId);
      return response.data;
    },
    onSuccess: (data, variables) => {
      const { conversationId } = variables;
      
      // If the API returns the updated conversation, update the cache directly
      if (data && data.participant_user_ids) {
        queryClient.setQueryData(
          messageKeys.conversationDetail(conversationId),
          (oldData) => {
            if (!oldData) return data;
            return { ...oldData, ...data };
          }
        );
      }
      
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: messageKeys.conversationDetail(conversationId) });
      queryClient.invalidateQueries({ queryKey: messageKeys.conversationList() });
      
      toast.success("Participant added", {
        description: "The user has been added to the conversation.",
      });
    },
    onError: (error, variables) => {
      console.error("Add participant error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to add participant";
      
      // Strip HTML tags from error message
      const stripHtml = (html) => {
        if (typeof html !== 'string') return html;
        return html.replace(/<[^>]*>/g, '').trim();
      };
      
      const cleanErrorMessage = Array.isArray(errorMessage)
        ? errorMessage.map((e) => stripHtml(e.msg || e)).join(", ")
        : stripHtml(errorMessage);
      
      toast.error("Failed to add participant", {
        description: cleanErrorMessage,
      });
    },
  });
};

// Remove participant mutation
export const useRemoveParticipant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, userId }) => {
      const response = await messagesService.removeParticipant(conversationId, userId);
      return response.data;
    },
    onSuccess: (data, variables) => {
      const { conversationId, userId } = variables;
      
      // Optimistically update the conversation cache
      queryClient.setQueryData(
        messageKeys.conversationDetail(conversationId),
        (oldData) => {
          if (!oldData) return oldData;
          
          // If API returns updated conversation, use it
          if (data && data.participant_user_ids) {
            return { ...oldData, ...data };
          }
          
          // Otherwise, remove the user from participant_user_ids
          const updatedParticipantIds = (oldData.participant_user_ids || []).filter(
            (id) => {
              const normalizedId = typeof id === 'string' ? parseInt(id, 10) : id;
              const normalizedUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;
              return normalizedId !== normalizedUserId;
            }
          );
          
          return {
            ...oldData,
            participant_user_ids: updatedParticipantIds,
          };
        }
      );
      
      // Invalidate to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: messageKeys.conversationDetail(conversationId) });
      queryClient.invalidateQueries({ queryKey: messageKeys.conversationList() });
      
      toast.success("Participant removed", {
        description: "The user has been removed from the conversation.",
      });
    },
    onError: (error, variables) => {
      console.error("Remove participant error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to remove participant";
      
      // Strip HTML tags from error message
      const stripHtml = (html) => {
        if (typeof html !== 'string') return html;
        return html.replace(/<[^>]*>/g, '').trim();
      };
      
      const cleanErrorMessage = Array.isArray(errorMessage)
        ? errorMessage.map((e) => stripHtml(e.msg || e)).join(", ")
        : stripHtml(errorMessage);
      
      toast.error("Failed to remove participant", {
        description: cleanErrorMessage,
      });
    },
  });
};

