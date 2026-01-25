import { api } from "./api-client";

// Custom Field Links API service
export const customFieldLinksService = {
  // Get all custom field links
  getCustomFieldLinks: async (params = {}) => {
    try {
      const response = await api.get("/settings/custom-field-links/", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Get custom field links failed:", error);
      throw error;
    }
  },

  // Get custom field link by slug
  getCustomFieldLink: async (slug) => {
    try {
      const response = await api.get(`/settings/custom-field-links/${slug}`);
      return response.data;
    } catch (error) {
      console.error(`Get custom field link ${slug} failed:`, error);
      throw error;
    }
  },

  // Create custom field link
  createCustomFieldLink: async (linkData) => {
    try {
      const response = await api.post("/settings/custom-field-links/", linkData);
      return response.data;
    } catch (error) {
      console.error("Create custom field link failed:", error);
      throw error;
    }
  },

  // Update custom field link
  updateCustomFieldLink: async (slug, linkData) => {
    try {
      const response = await api.put(
        `/settings/custom-field-links/${slug}`,
        linkData
      );
      return response.data;
    } catch (error) {
      console.error(`Update custom field link ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete custom field link
  deleteCustomFieldLink: async (slug) => {
    try {
      return await api.delete(`/settings/custom-field-links/${slug}`);
    } catch (error) {
      console.error(`Delete custom field link ${slug} failed:`, error);
      throw error;
    }
  },

  // Search custom field links
  searchCustomFieldLinks: async (searchData) => {
    try {
      const response = await api.post(
        "/settings/custom-field-links/search",
        searchData
      );
      return response.data;
    } catch (error) {
      console.error("Search custom field links failed:", error);
      throw error;
    }
  },

  // Get links for a specific custom field
  getLinksForField: async (customFieldId, entityType) => {
    try {
      const response = await api.get("/settings/custom-field-links/", {
        params: {
          custom_field_id: customFieldId,
          entity_type: entityType,
          is_active: true,
        },
      });
      return response.data?.links || [];
    } catch (error) {
      console.error(`Get links for field ${customFieldId} failed:`, error);
      throw error;
    }
  },
};
