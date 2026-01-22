import { api } from "./api-client";

// Directory API service
export const directoryService = {
  // Get directory data
  getDirectory: async (params = {}) => {
    try {
      return await api.get("/directory", { params });
    } catch (error) {
      console.error("Get directory failed:", error);
      throw error;
    }
  },
};
