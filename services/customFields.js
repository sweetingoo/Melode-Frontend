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

  // Get custom field section by slug
  getCustomFieldSection: async (slug) => {
    try {
      return await api.get(`/settings/custom-field-sections/${slug}`);
    } catch (error) {
      console.error(`Get custom field section ${slug} failed:`, error);
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
  updateCustomFieldSection: async (slug, sectionData) => {
    try {
      console.log("Update Section Service - Slug:", slug, "Data:", sectionData);
      const response = await api.put(
        `/settings/custom-field-sections/${slug}`,
        sectionData
      );
      console.log("Update Section Service - Response:", response);
      return response;
    } catch (error) {
      console.error(`Update custom field section ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete custom field section (soft delete)
  deleteCustomFieldSection: async (slug) => {
    try {
      return await api.delete(`/settings/custom-field-sections/${slug}`);
    } catch (error) {
      console.error(`Delete custom field section ${slug} failed:`, error);
      throw error;
    }
  },

  // Hard delete custom field section
  hardDeleteCustomFieldSection: async (slug) => {
    try {
      return await api.delete(`/settings/custom-field-sections/${slug}/hard`);
    } catch (error) {
      console.error(`Hard delete custom field section ${slug} failed:`, error);
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
  getCustomFieldsHierarchy: async (entityType, entitySlug) => {
    try {
      console.log(
        `Getting custom fields hierarchy for ${entityType}/${entitySlug}`
      );
      const response = await api.get(
        `/settings/entities/${entityType}/${entitySlug}/custom-fields/hierarchy`
      );
      console.log("Custom fields hierarchy response:", response);
      return response;
    } catch (error) {
      console.error(
        `Get custom fields hierarchy for ${entityType}/${entitySlug} failed:`,
        error
      );
      throw error;
    }
  },

  getCustomFieldsPreview: async (entityType, entitySlug) => {
    try {
      console.log(
        `Getting custom fields preview for ${entityType}/${entitySlug}`
      );
      const response = await api.get(
        `/settings/entities/${entityType}/${entitySlug}/custom-fields/preview`
      );
      console.log("Custom fields preview response:", response);
      return response;
    } catch (error) {
      console.error(
        `Get custom fields preview for ${entityType}/${entitySlug} failed:`,
        error
      );
      throw error;
    }
  },
};
