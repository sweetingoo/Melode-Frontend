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

  /** @param {string} slug broadcast slug (path segment; required) */
  getBroadcast: async (identifier) => {
    try {
      const seg = encodeURIComponent(String(identifier));
      return await api.get(`/broadcasts/${seg}`);
    } catch (error) {
      console.error(`Get broadcast ${identifier} failed:`, error);
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

  /** @param {string} slug broadcast slug (path segment; required) */
  updateBroadcast: async (identifier, broadcastData) => {
    try {
      const seg = encodeURIComponent(String(identifier));
      return await api.put(`/broadcasts/${seg}`, broadcastData);
    } catch (error) {
      console.error(`Update broadcast ${identifier} failed:`, error);
      throw error;
    }
  },

  /** @param {string} slug broadcast slug (path segment; required) */
  markBroadcastAsRead: async (identifier, readVia = "web") => {
    try {
      const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : undefined;
      const requestBody = {
        read_via: readVia,
        ...(userAgent && { user_agent: userAgent }),
      };
      const seg = encodeURIComponent(String(identifier));
      return await api.post(`/broadcasts/${seg}/read`, requestBody);
    } catch (error) {
      console.error(`Mark broadcast ${identifier} as read failed:`, error);
      throw error;
    }
  },

  /** @param {string} slug broadcast slug (path segment; required) */
  acknowledgeBroadcast: async (identifier, acknowledgementStatus, acknowledgementNote = "") => {
    try {
      const seg = encodeURIComponent(String(identifier));
      return await api.post(`/broadcasts/${seg}/acknowledge`, {
        acknowledgement_status: acknowledgementStatus,
        acknowledgement_note: acknowledgementNote,
      });
    } catch (error) {
      console.error(`Acknowledge broadcast ${identifier} failed:`, error);
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
