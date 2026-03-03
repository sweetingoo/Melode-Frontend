import { api } from "./api-client";

/**
 * Broadcasts API service – one-way announcements only.
 * Separate from Messages (conversations) and Notifications.
 *
 * Three separate endpoint groups:
 * - Broadcasts (this module): /broadcasts – create, list, inbox, read, acknowledge.
 * - Messages: /messages, /conversations – two-way conversation messages only.
 * - Notifications: /notifications – system notifications (bell/list).
 */
export const broadcastsService = {
  getBroadcasts: async (params = {}) => {
    try {
      const queryParams = { ...params, my_broadcasts: params.my_broadcasts ?? false };
      return await api.get("/broadcasts", { params: queryParams });
    } catch (error) {
      console.error("Get broadcasts failed:", error);
      throw error;
    }
  },

  getBroadcast: async (slug) => {
    try {
      return await api.get(`/broadcasts/${slug}`);
    } catch (error) {
      console.error(`Get broadcast ${slug} failed:`, error);
      throw error;
    }
  },

  createBroadcast: async (broadcastData) => {
    try {
      const response = await api.post("/broadcasts", broadcastData);
      if (process.env.NODE_ENV === "development") {
        console.log("Create broadcast response:", response);
      }
      return response;
    } catch (error) {
      console.error("Create broadcast failed:", error);
      if (process.env.NODE_ENV === "development") {
        console.error("Broadcast error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
      }
      throw error;
    }
  },

  updateBroadcast: async (slug, broadcastData) => {
    try {
      return await api.put(`/broadcasts/${slug}`, broadcastData);
    } catch (error) {
      console.error(`Update broadcast ${slug} failed:`, error);
      throw error;
    }
  },

  markBroadcastAsRead: async (slug, readVia = "web") => {
    try {
      const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : undefined;
      const requestBody = {
        read_via: readVia,
        ...(userAgent && { user_agent: userAgent }),
      };
      return await api.post(`/broadcasts/${slug}/read`, requestBody);
    } catch (error) {
      console.error(`Mark broadcast ${slug} as read failed:`, error);
      throw error;
    }
  },

  acknowledgeBroadcast: async (slug, acknowledgementStatus, acknowledgementNote = "") => {
    try {
      return await api.post(`/broadcasts/${slug}/acknowledge`, {
        acknowledgement_status: acknowledgementStatus,
        acknowledgement_note: acknowledgementNote,
      });
    } catch (error) {
      console.error(`Acknowledge broadcast ${slug} failed:`, error);
      throw error;
    }
  },

  getBroadcastInbox: async (params = {}) => {
    try {
      return await api.get("/broadcasts/inbox", { params });
    } catch (error) {
      console.error("Get broadcast inbox failed:", error);
      throw error;
    }
  },
};
