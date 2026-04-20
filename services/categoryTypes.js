import { api } from "./api-client";

// Category Types API service
export const categoryTypesService = {
  // Get all category types with pagination
  getCategoryTypes: async (params = {}) => {
    try {
      return await api.get("/category-types", { params });
    } catch (error) {
      console.error("Get category types failed:", error);
      throw error;
    }
  },

  // Get all active category types (for dropdowns/selectors)
  getActiveCategoryTypes: async () => {
    try {
      return await api.get("/category-types/active/all");
    } catch (error) {
      console.error("Get active category types failed:", error);
      throw error;
    }
  },

  /** @param {string} slug category type slug (path segment; required) */
  getCategoryType: async (identifier) => {
    try {
      const seg = encodeURIComponent(String(identifier));
      return await api.get(`/category-types/${seg}`);
    } catch (error) {
      console.error(`Get category type ${identifier} failed:`, error);
      throw error;
    }
  },

  /** @param {string} slug category type slug (same path as getCategoryType; name kept for callers) */
  getCategoryTypeById: async (id) => {
    try {
      const seg = encodeURIComponent(String(id));
      return await api.get(`/category-types/${seg}`);
    } catch (error) {
      console.error(`Get category type ${id} failed:`, error);
      throw error;
    }
  },

  // Create category type
  createCategoryType: async (categoryTypeData) => {
    try {
      return await api.post("/category-types", categoryTypeData);
    } catch (error) {
      console.error("Create category type failed:", error);
      throw error;
    }
  },

  /** @param {string} slug category type slug (path segment; required) */
  updateCategoryType: async (identifier, categoryTypeData) => {
    try {
      const seg = encodeURIComponent(String(identifier));
      return await api.put(`/category-types/${seg}`, categoryTypeData);
    } catch (error) {
      console.error(`Update category type ${identifier} failed:`, error);
      throw error;
    }
  },

  /** @param {string} slug category type slug (same path as updateCategoryType; name kept for callers) */
  updateCategoryTypeById: async (id, categoryTypeData) => {
    try {
      const seg = encodeURIComponent(String(id));
      return await api.put(`/category-types/${seg}`, categoryTypeData);
    } catch (error) {
      console.error(`Update category type ${id} failed:`, error);
      throw error;
    }
  },

  /** @param {string} slug category type slug (path segment; required) */
  deleteCategoryType: async (identifier) => {
    try {
      const seg = encodeURIComponent(String(identifier));
      await api.delete(`/category-types/${seg}`);
    } catch (error) {
      console.error(`Delete category type ${identifier} failed:`, error);
      throw error;
    }
  },

  /** @param {string} slug category type slug (same path as deleteCategoryType; name kept for callers) */
  deleteCategoryTypeById: async (id) => {
    try {
      const seg = encodeURIComponent(String(id));
      await api.delete(`/category-types/${seg}`);
    } catch (error) {
      console.error(`Delete category type ${id} failed:`, error);
      throw error;
    }
  },
};
