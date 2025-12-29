import { api } from "./api-client";

// Notifications API service
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
      return await api.get("/notifications/unread-count");
    } catch (error) {
      console.error("Get unread count failed:", error);
      throw error;
    }
  },
};

