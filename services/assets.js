import { api } from "./api-client";

export const assetsService = {
  getAssets: async (params = {}) => {
    try {
      const response = await api.get("/assets/", { params });
      return response.data || response;
    } catch (error) {
      console.error("Get assets failed:", error);
      throw error;
    }
  },

  getAsset: async (slug) => {
    try {
      const response = await api.get(`/assets/${slug}`);
      return response.data || response;
    } catch (error) {
      console.error(`Get asset ${slug} failed:`, error);
      throw error;
    }
  },

  getAssetByNumber: async (assetNumber) => {
    try {
      const response = await api.get(`/assets/number/${assetNumber}`);
      return response.data || response;
    } catch (error) {
      console.error(`Get asset by number ${assetNumber} failed:`, error);
      throw error;
    }
  },

  createAsset: async (assetData) => {
    try {
      const response = await api.post("/assets/", assetData);
      return response.data || response;
    } catch (error) {
      console.error("Create asset failed:", error);
      if (error.response?.data) {
        console.error(
          "API error response:",
          JSON.stringify(error.response.data, null, 2)
        );
      }
      throw error;
    }
  },

  updateAsset: async (slug, assetData) => {
    try {
      const response = await api.put(`/assets/${slug}`, assetData);
      return response.data || response;
    } catch (error) {
      console.error(`Update asset ${slug} failed:`, error);
      throw error;
    }
  },

  deleteAsset: async (slug) => {
    try {
      const response = await api.delete(`/assets/${slug}`);
      return response.data || response;
    } catch (error) {
      console.error(`Delete asset ${slug} failed:`, error);
      throw error;
    }
  },

  searchAssets: async (searchData) => {
    try {
      const response = await api.post("/assets/search", searchData);
      return response.data || response;
    } catch (error) {
      console.error("Search assets failed:", error);
      throw error;
    }
  },

  updateAssetAttributes: async (slug, attributes) => {
    try {
      const response = await api.put(`/assets/${slug}/attributes`, attributes);
      return response.data || response;
    } catch (error) {
      console.error(`Update asset attributes ${slug} failed:`, error);
      throw error;
    }
  },

  updateAssetSensorData: async (slug, sensorData) => {
    try {
      const response = await api.put(`/assets/${slug}/sensor-data`, sensorData);
      return response.data || response;
    } catch (error) {
      console.error(`Update asset sensor data ${slug} failed:`, error);
      throw error;
    }
  },

  assignAsset: async (slug, assignData) => {
    try {
      const response = await api.put(`/assets/${slug}/assign`, assignData);
      return response.data || response;
    } catch (error) {
      console.error(`Assign asset ${slug} failed:`, error);
      throw error;
    }
  },

  getAssetStatistics: async () => {
    try {
      const response = await api.get("/assets/stats/overview");
      return response.data || response;
    } catch (error) {
      console.error("Get asset statistics failed:", error);
      throw error;
    }
  },

  getAssetsByLocation: async (locationSlug) => {
    try {
      const response = await api.get(`/assets/location/${locationSlug}`);
      return response.data || response;
    } catch (error) {
      console.error(`Get assets by location ${locationSlug} failed:`, error);
      throw error;
    }
  },

  getAssetsNeedingMaintenance: async () => {
    try {
      const response = await api.get("/assets/maintenance/needed");
      return response.data || response;
    } catch (error) {
      console.error("Get assets needing maintenance failed:", error);
      throw error;
    }
  },
};
