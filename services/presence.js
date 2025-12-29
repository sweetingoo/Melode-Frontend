import { api } from "./api-client";

// Presence API service
export const presenceService = {
  // Get single user presence status
  getUserPresence: async (userId) => {
    try {
      return await api.get(`/users/presence/${userId}`);
    } catch (error) {
      console.error(`Get user presence ${userId} failed:`, error);
      throw error;
    }
  },

  // Get all online users
  getOnlineUsers: async () => {
    try {
      return await api.get("/users/presence/online");
    } catch (error) {
      console.error("Get online users failed:", error);
      throw error;
    }
  },

  // Get batch user presence status
  getBatchPresence: async (userIds) => {
    try {
      // Ensure userIds is an array
      const idsArray = Array.isArray(userIds) ? userIds : [userIds];
      const idsString = idsArray.join(",");
      return await api.get("/users/presence/batch", {
        params: { user_ids: idsString },
      });
    } catch (error) {
      console.error("Get batch presence failed:", error);
      throw error;
    }
  },
};

