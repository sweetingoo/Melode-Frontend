import { api } from "./api-client";

// Custom Fields API service
export const customFieldsService = {
  // Get all custom field sections
  getCustomFieldSections: async (params = {}) => {
    try {
      console.log(
        "Custom Fields Service - Making API call with params:",
        params
      );
      const response = await api.get("/settings/custom-field-sections/", {
        params,
      });
      console.log("Custom Fields Service - API response:", response);
      return response;
    } catch (error) {
      console.error("Get custom field sections failed:", error);
      throw error;
    }
  },

  // Get custom field section by ID
  getCustomFieldSection: async (id) => {
    try {
      return await api.get(`/settings/custom-field-sections/${id}`);
    } catch (error) {
      console.error(`Get custom field section ${id} failed:`, error);
      throw error;
    }
  },

  // Create custom field section
  createCustomFieldSection: async (sectionData) => {
    try {
      return await api.post("/settings/custom-field-sections/", sectionData);
    } catch (error) {
      console.error("Create custom field section failed:", error);
      throw error;
    }
  },

  // Update custom field section
  updateCustomFieldSection: async (id, sectionData) => {
    try {
      console.log("Update Section Service - ID:", id, "Data:", sectionData);
      const response = await api.put(
        `/settings/custom-field-sections/${id}`,
        sectionData
      );
      console.log("Update Section Service - Response:", response);
      return response;
    } catch (error) {
      console.error(`Update custom field section ${id} failed:`, error);
      throw error;
    }
  },

  // Delete custom field section (soft delete)
  deleteCustomFieldSection: async (id) => {
    try {
      return await api.delete(`/settings/custom-field-sections/${id}`);
    } catch (error) {
      console.error(`Delete custom field section ${id} failed:`, error);
      throw error;
    }
  },

  // Hard delete custom field section
  hardDeleteCustomFieldSection: async (id) => {
    try {
      return await api.delete(`/settings/custom-field-sections/${id}/hard`);
    } catch (error) {
      console.error(`Hard delete custom field section ${id} failed:`, error);
      throw error;
    }
  },

  // Search custom field sections
  searchCustomFieldSections: async (searchData) => {
    try {
      return await api.post(
        "/settings/custom-field-sections/search",
        searchData
      );
    } catch (error) {
      console.error("Search custom field sections failed:", error);
      throw error;
    }
  },

  // Preview API endpoints
  getCustomFieldsHierarchy: async (entityType, entityId = 1) => {
    try {
      console.log(
        `Getting custom fields hierarchy for ${entityType}/${entityId}`
      );
      const response = await api.get(
        `/settings/entities/${entityType}/${entityId}/custom-fields/hierarchy`
      );
      console.log("Custom fields hierarchy response:", response);
      return response;
    } catch (error) {
      console.error(
        `Get custom fields hierarchy for ${entityType}/${entityId} failed:`,
        error
      );
      throw error;
    }
  },

  getCustomFieldsPreview: async (entityType, entityId = 1) => {
    try {
      console.log(
        `Getting custom fields preview for ${entityType}/${entityId}`
      );
      const response = await api.get(
        `/settings/entities/${entityType}/${entityId}/custom-fields/preview`
      );
      console.log("Custom fields preview response:", response);
      return response;
    } catch (error) {
      console.error(
        `Get custom fields preview for ${entityType}/${entityId} failed:`,
        error
      );
      throw error;
    }
  },
};
