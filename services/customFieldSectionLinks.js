import { api } from "./api-client";

// Custom Field Section Links API service
export const customFieldSectionLinksService = {
  // Get all custom field section links
  getCustomFieldSectionLinks: async (params = {}) => {
    try {
      const response = await api.get("/settings/custom-field-section-links/", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Get custom field section links failed:", error);
      throw error;
    }
  },

  // Get custom field section link by slug
  getCustomFieldSectionLink: async (slug) => {
    try {
      const response = await api.get(`/settings/custom-field-section-links/${slug}`);
      return response.data;
    } catch (error) {
      console.error(`Get custom field section link ${slug} failed:`, error);
      throw error;
    }
  },

  // Create custom field section link
  createCustomFieldSectionLink: async (linkData) => {
    try {
      const response = await api.post("/settings/custom-field-section-links/", linkData);
      return response.data;
    } catch (error) {
      console.error("Create custom field section link failed:", error);
      throw error;
    }
  },

  // Update custom field section link
  updateCustomFieldSectionLink: async (slug, linkData) => {
    try {
      const response = await api.put(
        `/settings/custom-field-section-links/${slug}`,
        linkData
      );
      return response.data;
    } catch (error) {
      console.error(`Update custom field section link ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete custom field section link
  deleteCustomFieldSectionLink: async (slug) => {
    try {
      return await api.delete(`/settings/custom-field-section-links/${slug}`);
    } catch (error) {
      console.error(`Delete custom field section link ${slug} failed:`, error);
      throw error;
    }
  },

  // Get links for a specific section
  getLinksForSection: async (sectionId, entityType) => {
    try {
      const response = await api.get("/settings/custom-field-section-links/", {
        params: {
          section_id: sectionId,
          entity_type: entityType,
          is_active: true,
        },
      });
      return response.data || [];
    } catch (error) {
      console.error(`Get links for section ${sectionId} failed:`, error);
      throw error;
    }
  },
};
