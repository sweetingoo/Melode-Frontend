import { api } from "./api-client";

/**
 * Notifications API service – system notifications (bell/list) only.
 * Separate from Messages (conversations) and Broadcasts.
 *
 * Three separate endpoint groups:
 * - Notifications (this module): /notifications – list and unread count for notification/alert/task + broadcasts in bell.
 * - Messages: /messages, /conversations – two-way conversation messages only.
 * - Broadcasts: use broadcastsService from ./broadcasts for /broadcasts (inbox, create, read, acknowledge).
 */
export const notificationsService = {
  // Get user's notifications
  getNotifications: async (params = {}) => {
    try {
      return await api.get("/notifications/", { params });
    } catch (error) {
      console.error("Get notifications failed:", error);
      throw error;
    }
  },

  // Get unread notifications count
  getUnreadCount: async () => {
    try {
      // Use a longer timeout for this endpoint as it might take longer
      return await api.get("/notifications/unread-count", {
        timeout: 30000, // 30 seconds timeout
      });
    } catch (error) {
      // Don't log timeout errors as they're expected if backend is slow
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        console.warn("Get unread count timeout - backend may be slow");
        // Return a default response instead of throwing
        return { data: { unread_count: 0 } };
      }
      console.error("Get unread count failed:", error);
      // For other errors, return default to prevent UI breaking
      return { data: { unread_count: 0 } };
    }
  },
};

