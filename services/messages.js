import { api } from "./api-client";

// Messages API service
export const messagesService = {
    // Get all messages with filters
    getMessages: async (params = {}) => {
        try {
            return await api.get("/messages", { params });
        } catch (error) {
            console.error("Get messages failed:", error);
            throw error;
        }
    },

    // Get all broadcasts (admin view)
    getBroadcasts: async (params = {}) => {
        try {
            // Use is_broadcast=true to get only broadcasts
            const queryParams = { ...params, is_broadcast: true };
            return await api.get("/messages", { params: queryParams });
        } catch (error) {
            console.error("Get broadcasts failed:", error);
            throw error;
        }
    },

    // Get message by ID
    getMessage: async (id) => {
        try {
            return await api.get(`/messages/${id}`);
        } catch (error) {
            console.error(`Get message ${id} failed:`, error);
            throw error;
        }
    },

    // Create message
    createMessage: async (messageData) => {
        try {
            return await api.post("/messages", messageData);
        } catch (error) {
            console.error("Create message failed:", error);
            throw error;
        }
    },

    // Mark message as read
    // POST /api/v1/messages/{message_id}/read
    // Request body: { read_via: string, ip_address?: string, user_agent?: string }
    markAsRead: async (id, readVia = "web") => {
        try {
            // Get user agent and IP if available
            const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : undefined;
            
            const requestBody = {
                read_via: readVia,
                ...(userAgent && { user_agent: userAgent }),
            };
            
            return await api.post(`/messages/${id}/read`, requestBody);
        } catch (error) {
            console.error(`Mark message ${id} as read failed:`, error);
            throw error;
        }
    },

    // Acknowledge message
    acknowledgeMessage: async (id, acknowledgementNote = "") => {
        try {
            return await api.post(`/messages/${id}/acknowledge`, {
                acknowledgement_note: acknowledgementNote,
            });
        } catch (error) {
            console.error(`Acknowledge message ${id} failed:`, error);
            throw error;
        }
    },

    // Acknowledge message with status (for broadcasts)
    acknowledgeMessageWithStatus: async (id, acknowledgementStatus, acknowledgementNote = "") => {
        try {
            return await api.post(`/messages/${id}/acknowledge`, {
                acknowledgement_status: acknowledgementStatus, // "agreed" or "disagreed"
                acknowledgement_note: acknowledgementNote,
            });
        } catch (error) {
            console.error(`Acknowledge message ${id} with status failed:`, error);
            throw error;
        }
    },

    // Get broadcast inbox
    getBroadcastInbox: async (params = {}) => {
        try {
            // Support both new pagination params (limit/offset) and legacy (page/per_page)
            const queryParams = { ...params };
            // If page/per_page provided, keep them as backend expects page/per_page
            // Backend defaults: page=1, per_page=20, max per_page=100
            return await api.get("/messages/inbox", { params: queryParams });
        } catch (error) {
            console.error("Get broadcast inbox failed:", error);
            throw error;
        }
    },

    // Get unread messages count (for conversations only, not broadcasts)
    getUnreadMessagesCount: async () => {
        try {
            // Get all conversations (limit to reasonable number for performance)
            const response = await api.get("/conversations", { 
                params: { limit: 100, page: 1 } // Get first 100 conversations
            });
            const conversations = response.data?.conversations || response.data?.data || response.data || [];
            
            // Count total unread messages across all conversations
            let totalUnread = 0;
            conversations.forEach((conversation) => {
                // Check if conversation has unread_count field (if backend provides it)
                if (conversation.unread_count !== undefined) {
                    totalUnread += conversation.unread_count || 0;
                } else if (conversation.messages && Array.isArray(conversation.messages)) {
                    // Fallback: count unread messages in the conversation
                    // Backend returns receipts for the current user (based on auth token)
                    const unreadInConversation = conversation.messages.filter((msg) => {
                        // Check if message is a broadcast (should be excluded from message count)
                        if (msg.is_broadcast) return false;
                        
                        // Check if message is read
                        // Receipts returned by backend are for the current user
                        const receipt = msg.receipts?.find((r) => r.is_read === false) || 
                                       msg.receipts?.find((r) => !r.is_read);
                        
                        // If no receipt found or receipt shows unread, count it
                        return !receipt || !receipt.is_read;
                    }).length;
                    totalUnread += unreadInConversation;
                }
            });
            
            return { data: { unread_count: totalUnread } };
        } catch (error) {
            // Don't log timeout errors as they're expected if backend is slow
            if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
                console.warn("Get unread messages count timeout - backend may be slow");
                return { data: { unread_count: 0 } };
            }
            console.error("Get unread messages count failed:", error);
            // For other errors, return default to prevent UI breaking
            return { data: { unread_count: 0 } };
        }
    },

    // Get conversations (for two-way communication)
    getConversations: async (params = {}) => {
        try {
            // Support both new pagination params (limit/offset) and legacy (page/per_page)
            const queryParams = { ...params };
            // If page/per_page provided, convert to limit/offset
            if (queryParams.page && queryParams.per_page) {
                queryParams.limit = queryParams.per_page;
                queryParams.offset = (queryParams.page - 1) * queryParams.per_page;
                delete queryParams.page;
                delete queryParams.per_page;
            }
            return await api.get("/conversations", { params: queryParams });
        } catch (error) {
            console.error("Get conversations failed:", error);
            throw error;
        }
    },

    // Get conversation thread (legacy - use getConversationMessages instead)
    getConversationThread: async (id) => {
        try {
            return await api.get(`/conversations/${id}/thread`);
        } catch (error) {
            console.error(`Get conversation thread ${id} failed:`, error);
            throw error;
        }
    },

    // Get messages in a conversation (new endpoint)
    getConversationMessages: async (conversationId, params = {}) => {
        try {
            // Support both new pagination params (limit/offset) and legacy (page/per_page)
            const queryParams = { ...params };
            // If page/per_page provided, keep them as backend expects page/per_page
            // Backend defaults: page=1, per_page=20, max per_page=100
            return await api.get(`/conversations/${conversationId}/messages`, { params: queryParams });
        } catch (error) {
            console.error(`Get conversation messages ${conversationId} failed:`, error);
            throw error;
        }
    },

    // Get conversation details
    getConversation: async (id) => {
        try {
            return await api.get(`/conversations/${id}`);
        } catch (error) {
            console.error(`Get conversation ${id} failed:`, error);
            throw error;
        }
    },

    // Add participant to conversation
    addParticipant: async (conversationId, userId) => {
        try {
            return await api.post(`/conversations/${conversationId}/participants`, {
                user_id: userId,
            });
        } catch (error) {
            console.error(`Add participant ${userId} to conversation ${conversationId} failed:`, error);
            throw error;
        }
    },

    // Remove participant from conversation
    removeParticipant: async (conversationId, userId) => {
        try {
            return await api.delete(`/conversations/${conversationId}/participants/${userId}`);
        } catch (error) {
            console.error(`Remove participant ${userId} from conversation ${conversationId} failed:`, error);
            throw error;
        }
    },
};

