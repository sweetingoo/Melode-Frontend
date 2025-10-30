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

  // Get custom field by ID
  getCustomField: async (id) => {
    try {
      return await api.get(`/settings/custom-fields/${id}`);
    } catch (error) {
      console.error(`Get custom field ${id} failed:`, error);
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
  updateCustomField: async (id, fieldData) => {
    try {
      console.log("Update Custom Field Service - ID:", id, "Data:", fieldData);
      const response = await api.put(
        `/settings/custom-fields/${id}`,
        fieldData
      );
      console.log("Update Custom Field Service - Response:", response);
      return response;
    } catch (error) {
      console.error(`Update custom field ${id} failed:`, error);
      throw error;
    }
  },

  // Delete custom field (soft delete)
  deleteCustomField: async (id) => {
    try {
      return await api.delete(`/settings/custom-fields/${id}`);
    } catch (error) {
      console.error(`Delete custom field ${id} failed:`, error);
      throw error;
    }
  },

  // Hard delete custom field
  hardDeleteCustomField: async (id) => {
    try {
      return await api.delete(`/settings/custom-fields/${id}/hard`);
    } catch (error) {
      console.error(`Hard delete custom field ${id} failed:`, error);
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
