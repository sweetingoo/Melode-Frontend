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

  // Get category type by slug
  getCategoryType: async (slug) => {
    try {
      return await api.get(`/category-types/slug/${slug}`);
    } catch (error) {
      console.error(`Get category type ${slug} failed:`, error);
      throw error;
    }
  },

  // Get category type by ID (for backward compatibility)
  getCategoryTypeById: async (id) => {
    try {
      return await api.get(`/category-types/${id}`);
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

  // Update category type by slug
  updateCategoryType: async (slug, categoryTypeData) => {
    try {
      return await api.put(`/category-types/slug/${slug}`, categoryTypeData);
    } catch (error) {
      console.error(`Update category type ${slug} failed:`, error);
      throw error;
    }
  },

  // Update category type by ID (for backward compatibility)
  updateCategoryTypeById: async (id, categoryTypeData) => {
    try {
      return await api.put(`/category-types/${id}`, categoryTypeData);
    } catch (error) {
      console.error(`Update category type ${id} failed:`, error);
      throw error;
    }
  },

  // Delete category type by slug
  deleteCategoryType: async (slug) => {
    try {
      return await api.delete(`/category-types/slug/${slug}`);
    } catch (error) {
      console.error(`Delete category type ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete category type by ID (for backward compatibility)
  deleteCategoryTypeById: async (id) => {
    try {
      return await api.delete(`/category-types/${id}`);
    } catch (error) {
      console.error(`Delete category type ${id} failed:`, error);
      throw error;
    }
  },
};
