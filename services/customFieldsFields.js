import { api } from "./api-client";

// Custom Fields API service
export const customFieldsFieldsService = {
  // Get all custom fields
  getCustomFields: async (params = {}) => {
    try {
      console.log(
        "Custom Fields Service - Making API call with params:",
        params
      );
      const response = await api.get("/settings/custom-fields/", {
        params,
      });
      console.log("Custom Fields Service - API response:", response);
      return response;
    } catch (error) {
      console.error("Get custom fields failed:", error);
      throw error;
    }
  },

  // Get custom field by slug
  getCustomField: async (slug) => {
    try {
      const response = await api.get(`/settings/custom-fields/${slug}`);
      console.log("getCustomField - Raw API response:", response);
      // Axios returns { data: {...}, status: 200, ... }
      // The actual field object is in response.data
      return response.data;
    } catch (error) {
      console.error(`Get custom field ${slug} failed:`, error);
      throw error;
    }
  },

  // Create custom field
  createCustomField: async (fieldData) => {
    try {
      console.log("Create Custom Field Service - Data:", fieldData);
      const response = await api.post("/settings/custom-fields/", fieldData);
      console.log("Create Custom Field Service - Response:", response);
      return response;
    } catch (error) {
      console.error("Create custom field failed:", error);
      throw error;
    }
  },

  // Update custom field
  updateCustomField: async (slug, fieldData) => {
    try {
      console.log("Update Custom Field Service - Slug:", slug, "Data:", fieldData);
      const response = await api.put(
        `/settings/custom-fields/${slug}`,
        fieldData
      );
      console.log("Update Custom Field Service - Response:", response);
      return response;
    } catch (error) {
      console.error(`Update custom field ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete custom field (soft delete)
  deleteCustomField: async (slug) => {
    try {
      return await api.delete(`/settings/custom-fields/${slug}`);
    } catch (error) {
      console.error(`Delete custom field ${slug} failed:`, error);
      throw error;
    }
  },

  // Hard delete custom field
  hardDeleteCustomField: async (slug) => {
    try {
      return await api.delete(`/settings/custom-fields/${slug}/hard`);
    } catch (error) {
      console.error(`Hard delete custom field ${slug} failed:`, error);
      throw error;
    }
  },

  // Search custom fields
  searchCustomFields: async (searchData) => {
    try {
      return await api.post("/settings/custom-fields/search", searchData);
    } catch (error) {
      console.error("Search custom fields failed:", error);
      throw error;
    }
  },
};
