import { api } from "./api-client";

export const locationsService = {
  getLocations: async (params = {}) => {
    try {
      const response = await api.get("/locations/", { params });
      return response.data || response;
    } catch (error) {
      console.error("Get locations failed:", error);
      throw error;
    }
  },

  getLocation: async (id) => {
    try {
      const response = await api.get(`/locations/${id}`);
      return response.data || response;
    } catch (error) {
      console.error(`Get location ${id} failed:`, error);
      throw error;
    }
  },

  createLocation: async (locationData) => {
    try {
      // Debug: Log the data being sent to API
      console.log(
        "createLocation - sending data:",
        JSON.stringify(locationData, null, 2)
      );
      console.log(
        "createLocation - location_type:",
        locationData.location_type
      );

      const response = await api.post("/locations/", locationData);
      return response.data || response;
    } catch (error) {
      console.error("Create location failed:", error);
      console.error(
        "Request payload was:",
        JSON.stringify(locationData, null, 2)
      );
      if (error.response?.data) {
        console.error(
          "API error response:",
          JSON.stringify(error.response.data, null, 2)
        );
      }
      throw error;
    }
  },

  updateLocation: async (id, locationData) => {
    try {
      const response = await api.put(`/locations/${id}`, locationData);
      return response.data || response;
    } catch (error) {
      console.error(`Update location ${id} failed:`, error);
      throw error;
    }
  },

  deleteLocation: async (id) => {
    try {
      const response = await api.delete(`/locations/${id}`);
      return response.data || response;
    } catch (error) {
      console.error(`Delete location ${id} failed:`, error);
      throw error;
    }
  },

  searchLocations: async (searchData) => {
    try {
      const response = await api.post("/locations/search", searchData);
      return response.data || response;
    } catch (error) {
      console.error("Search locations failed:", error);
      throw error;
    }
  },

  getLocationHierarchy: async (id) => {
    try {
      const response = await api.get(`/locations/${id}/hierarchy`);
      return response.data || response;
    } catch (error) {
      console.error(`Get location hierarchy ${id} failed:`, error);
      throw error;
    }
  },

  getLocationsByType: async (type) => {
    try {
      const response = await api.get(`/locations/type/${type}`);
      return response.data || response;
    } catch (error) {
      console.error(`Get locations by type ${type} failed:`, error);
      throw error;
    }
  },

  getRootLocations: async () => {
    try {
      const response = await api.get("/locations/roots/all");
      return response.data || response;
    } catch (error) {
      console.error("Get root locations failed:", error);
      throw error;
    }
  },

  getLocationStatistics: async () => {
    try {
      const response = await api.get("/locations/stats/overview");
      return response.data || response;
    } catch (error) {
      console.error("Get location statistics failed:", error);
      throw error;
    }
  },

  moveLocation: async (id, newParentId) => {
    try {
      const response = await api.put(`/locations/${id}/move`, {
        parent_location_id: newParentId || null,
      });
      return response.data || response;
    } catch (error) {
      console.error(`Move location ${id} failed:`, error);
      throw error;
    }
  },

  getChildLocations: async (id) => {
    try {
      const response = await api.get(`/locations/${id}/children`);
      return response.data || response;
    } catch (error) {
      console.error(`Get child locations ${id} failed:`, error);
      throw error;
    }
  },

  getDescendantLocations: async (id) => {
    try {
      const response = await api.get(`/locations/${id}/descendants`);
      return response.data || response;
    } catch (error) {
      console.error(`Get descendant locations ${id} failed:`, error);
      throw error;
    }
  },
};
