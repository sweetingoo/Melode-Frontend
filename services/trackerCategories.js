import api from "./api-client";

/**
 * Tracker Categories Service
 * Handles all tracker category related API calls (organize trackers like Form Types)
 */

export const trackerCategoriesService = {
  getTrackerCategories: async (params = {}) => {
    try {
      const response = await api.get("/tracker-categories", { params });
      return response.data;
    } catch (error) {
      console.error("Get tracker categories failed:", error);
      throw error;
    }
  },

  getActiveTrackerCategories: async (params = {}) => {
    try {
      const response = await api.get("/tracker-categories/active/all", { params });
      return response.data;
    } catch (error) {
      console.error("Get active tracker categories failed:", error);
      throw error;
    }
  },

  getTrackerCategory: async (slug) => {
    try {
      const response = await api.get(`/tracker-categories/${slug}`);
      return response.data;
    } catch (error) {
      console.error(`Get tracker category ${slug} failed:`, error);
      throw error;
    }
  },

  createTrackerCategory: async (data) => {
    try {
      const response = await api.post("/tracker-categories", data);
      return response.data;
    } catch (error) {
      console.error("Create tracker category failed:", error);
      throw error;
    }
  },

  updateTrackerCategory: async (slug, data) => {
    try {
      const response = await api.put(`/tracker-categories/${slug}`, data);
      return response.data;
    } catch (error) {
      console.error(`Update tracker category ${slug} failed:`, error);
      throw error;
    }
  },

  deleteTrackerCategory: async (slug) => {
    try {
      const response = await api.delete(`/tracker-categories/${slug}`);
      return response.data;
    } catch (error) {
      console.error(`Delete tracker category ${slug} failed:`, error);
      throw error;
    }
  },
};
