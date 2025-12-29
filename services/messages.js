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

