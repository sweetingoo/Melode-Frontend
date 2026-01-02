import { api } from "./api-client";

// Document Categories API service
export const documentCategoriesService = {
  // Get category tree
  getCategories: async () => {
    try {
      return await api.get("/documents/categories");
    } catch (error) {
      console.error("Get categories failed:", error);
      throw error;
    }
  },

  // Get category by ID
  getCategory: async (id) => {
    try {
      return await api.get(`/documents/categories/${id}`);
    } catch (error) {
      console.error(`Get category ${id} failed:`, error);
      throw error;
    }
  },

  // Create category
  createCategory: async (categoryData) => {
    try {
      return await api.post("/documents/categories", categoryData);
    } catch (error) {
      console.error("Create category failed:", error);
      throw error;
    }
  },

  // Update category
  updateCategory: async (id, categoryData) => {
    try {
      return await api.put(`/documents/categories/${id}`, categoryData);
    } catch (error) {
      console.error(`Update category ${id} failed:`, error);
      throw error;
    }
  },

  // Delete category
  deleteCategory: async (id) => {
    try {
      return await api.delete(`/documents/categories/${id}`);
    } catch (error) {
      console.error(`Delete category ${id} failed:`, error);
      throw error;
    }
  },

  // Get category permissions
  getCategoryPermissions: async (id) => {
    try {
      return await api.get(`/documents/categories/${id}/permissions`);
    } catch (error) {
      console.error(`Get category ${id} permissions failed:`, error);
      throw error;
    }
  },

  // Update category permissions
  updateCategoryPermissions: async (id, permissions) => {
    try {
      return await api.put(`/documents/categories/${id}/permissions`, permissions);
    } catch (error) {
      console.error(`Update category ${id} permissions failed:`, error);
      throw error;
    }
  },
};

