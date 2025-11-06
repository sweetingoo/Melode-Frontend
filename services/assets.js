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

  getAsset: async (id) => {
    try {
      const response = await api.get(`/assets/${id}`);
      return response.data || response;
    } catch (error) {
      console.error(`Get asset ${id} failed:`, error);
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
      console.log(
        "createAsset - sending data:",
        JSON.stringify(assetData, null, 2)
      );
      const response = await api.post("/assets/", assetData);
      return response.data || response;
    } catch (error) {
      console.error("Create asset failed:", error);
      console.error("Request payload was:", JSON.stringify(assetData, null, 2));
      if (error.response?.data) {
        console.error(
          "API error response:",
          JSON.stringify(error.response.data, null, 2)
        );
      }
      throw error;
    }
  },

  updateAsset: async (id, assetData) => {
    try {
      const response = await api.put(`/assets/${id}`, assetData);
      return response.data || response;
    } catch (error) {
      console.error(`Update asset ${id} failed:`, error);
      throw error;
    }
  },

  deleteAsset: async (id) => {
    try {
      const response = await api.delete(`/assets/${id}`);
      return response.data || response;
    } catch (error) {
      console.error(`Delete asset ${id} failed:`, error);
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

  updateAssetAttributes: async (id, attributes) => {
    try {
      const response = await api.put(`/assets/${id}/attributes`, attributes);
      return response.data || response;
    } catch (error) {
      console.error(`Update asset attributes ${id} failed:`, error);
      throw error;
    }
  },

  updateAssetSensorData: async (id, sensorData) => {
    try {
      const response = await api.put(`/assets/${id}/sensor-data`, sensorData);
      return response.data || response;
    } catch (error) {
      console.error(`Update asset sensor data ${id} failed:`, error);
      throw error;
    }
  },

  assignAsset: async (id, assignData) => {
    try {
      const response = await api.put(`/assets/${id}/assign`, assignData);
      return response.data || response;
    } catch (error) {
      console.error(`Assign asset ${id} failed:`, error);
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

  getAssetsByLocation: async (locationId) => {
    try {
      const response = await api.get(`/assets/location/${locationId}`);
      return response.data || response;
    } catch (error) {
      console.error(`Get assets by location ${locationId} failed:`, error);
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
