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

  // Get category by slug
  getCategory: async (slug) => {
    try {
      return await api.get(`/documents/categories/${slug}`);
    } catch (error) {
      console.error(`Get category ${slug} failed:`, error);
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
  updateCategory: async (slug, categoryData) => {
    try {
      return await api.put(`/documents/categories/${slug}`, categoryData);
    } catch (error) {
      console.error(`Update category ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete category
  deleteCategory: async (slug) => {
    try {
      return await api.delete(`/documents/categories/${slug}`);
    } catch (error) {
      console.error(`Delete category ${slug} failed:`, error);
      throw error;
    }
  },

  // Get category permissions
  getCategoryPermissions: async (slug) => {
    try {
      return await api.get(`/documents/categories/${slug}/permissions`);
    } catch (error) {
      console.error(`Get category ${slug} permissions failed:`, error);
      throw error;
    }
  },

  // Update category permissions
  updateCategoryPermissions: async (slug, permissions) => {
    try {
      return await api.put(`/documents/categories/${slug}/permissions`, permissions);
    } catch (error) {
      console.error(`Update category ${slug} permissions failed:`, error);
      throw error;
    }
  },
};

