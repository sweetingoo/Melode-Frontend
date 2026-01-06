import { api } from "./api-client";

// Location Types API service
export const locationTypesService = {
  // Get all active location types (for dropdowns/selectors)
  getActiveLocationTypes: async () => {
    try {
      return await api.get("/location-types/active/all");
    } catch (error) {
      console.error("Get active location types failed:", error);
      throw error;
    }
  },

  // Get all location types with pagination
  getLocationTypes: async (params = {}) => {
    try {
      return await api.get("/location-types", { params });
    } catch (error) {
      console.error("Get location types failed:", error);
      throw error;
    }
  },

  // Get location type by slug
  getLocationType: async (slug) => {
    try {
      return await api.get(`/location-types/${slug}`);
    } catch (error) {
      console.error(`Get location type ${slug} failed:`, error);
      throw error;
    }
  },

  // Get location type by name
  getLocationTypeByName: async (name) => {
    try {
      return await api.get(`/location-types/name/${name}`);
    } catch (error) {
      console.error(`Get location type by name ${name} failed:`, error);
      throw error;
    }
  },

  // Create location type
  createLocationType: async (locationTypeData) => {
    try {
      return await api.post("/location-types", locationTypeData);
    } catch (error) {
      console.error("Create location type failed:", error);
      throw error;
    }
  },

  // Update location type
  updateLocationType: async (slug, locationTypeData) => {
    try {
      return await api.put(`/location-types/${slug}`, locationTypeData);
    } catch (error) {
      console.error(`Update location type ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete/deactivate location type
  deleteLocationType: async (slug) => {
    try {
      return await api.delete(`/location-types/${slug}`);
    } catch (error) {
      console.error(`Delete location type ${slug} failed:`, error);
      throw error;
    }
  },
};
