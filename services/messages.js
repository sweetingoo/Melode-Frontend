import { api } from "./api-client";

/**
 * Messages API service – two-way conversation messages only.
 * Separate from Notifications and Broadcasts.
 *
 * Three separate endpoint groups:
 * - Messages (this module): /messages, /conversations – list, create, read, acknowledge for conversations only.
 * - Notifications: /notifications – system notifications (bell/list).
 * - Broadcasts: use broadcastsService from ./broadcasts for /broadcasts (inbox, create, read, acknowledge).
 */
export const messagesService = {
  getMessages: async (params = {}) => {
    try {
      return await api.get("/messages", { params });
    } catch (error) {
      console.error("Get messages failed:", error);
      throw error;
    }
  },

  getMessage: async (slug) => {
    try {
      return await api.get(`/messages/${slug}`);
    } catch (error) {
      console.error(`Get message ${slug} failed:`, error);
      throw error;
    }
  },

  createMessage: async (messageData) => {
    try {
      return await api.post("/messages", messageData);
    } catch (error) {
      console.error("Create message failed:", error);
      throw error;
    }
  },

  markAsRead: async (slug, readVia = "web") => {
    try {
      const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : undefined;
      const requestBody = {
        read_via: readVia,
        ...(userAgent && { user_agent: userAgent }),
      };
      return await api.post(`/messages/${slug}/read`, requestBody);
    } catch (error) {
      console.error(`Mark message ${slug} as read failed:`, error);
      throw error;
    }
  },

  acknowledgeMessage: async (slug, acknowledgementNote = "") => {
    try {
      return await api.post(`/messages/${slug}/acknowledge`, {
        acknowledgement_note: acknowledgementNote,
      });
    } catch (error) {
      console.error(`Acknowledge message ${slug} failed:`, error);
      throw error;
    }
  },

  acknowledgeMessageWithStatus: async (slug, acknowledgementStatus, acknowledgementNote = "") => {
    try {
      return await api.post(`/messages/${slug}/acknowledge`, {
        acknowledgement_status: acknowledgementStatus,
        acknowledgement_note: acknowledgementNote,
      });
    } catch (error) {
      console.error(`Acknowledge message ${slug} with status failed:`, error);
      throw error;
    }
  },

  getUnreadMessagesCount: async () => {
    try {
      const response = await api.get("/conversations", {
        params: { limit: 100, page: 1 },
      });
      const conversations = response.data?.conversations || response.data?.data || response.data || [];
      let totalUnread = 0;
      conversations.forEach((conversation) => {
        if (conversation.unread_count !== undefined) {
          totalUnread += conversation.unread_count || 0;
        } else if (conversation.messages && Array.isArray(conversation.messages)) {
          const unreadInConversation = conversation.messages.filter((msg) => {
            if (msg.is_broadcast) return false;
            const receipt = msg.receipts?.find((r) => r.is_read === false) || msg.receipts?.find((r) => !r.is_read);
            return !receipt || !receipt.is_read;
          }).length;
          totalUnread += unreadInConversation;
        }
      });
      return { data: { unread_count: totalUnread } };
    } catch (error) {
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        console.warn("Get unread messages count timeout - backend may be slow");
        return { data: { unread_count: 0 } };
      }
      console.error("Get unread messages count failed:", error);
      return { data: { unread_count: 0 } };
    }
  },

  getConversations: async (params = {}) => {
    try {
      const queryParams = { ...params };
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

  getConversationThread: async (slug) => {
    try {
      return await api.get(`/conversations/${slug}/thread`);
    } catch (error) {
      console.error(`Get conversation thread ${slug} failed:`, error);
      throw error;
    }
  },

  getConversationMessages: async (conversationSlug, params = {}) => {
    try {
      return await api.get(`/conversations/${conversationSlug}/messages`, { params });
    } catch (error) {
      console.error(`Get conversation messages ${conversationSlug} failed:`, error);
      throw error;
    }
  },

  getConversation: async (slug) => {
    try {
      return await api.get(`/conversations/${slug}`);
    } catch (error) {
      console.error(`Get conversation ${slug} failed:`, error);
      throw error;
    }
  },

  addParticipant: async (conversationSlug, userId) => {
    try {
      return await api.post(`/conversations/${conversationSlug}/participants`, { user_id: userId });
    } catch (error) {
      console.error(`Add participant ${userId} to conversation ${conversationSlug} failed:`, error);
      throw error;
    }
  },

  removeParticipant: async (conversationSlug, userSlug) => {
    try {
      return await api.delete(`/conversations/${conversationSlug}/participants/${userSlug}`);
    } catch (error) {
      console.error(`Remove participant ${userSlug} from conversation ${conversationSlug} failed:`, error);
      throw error;
    }
  },
};
