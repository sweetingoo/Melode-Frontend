import { api } from "./api-client";

// Asset Types API service
export const assetTypesService = {
  // Get all active asset types (for dropdowns/selectors)
  getActiveAssetTypes: async () => {
    try {
      return await api.get("/asset-types/active/all");
    } catch (error) {
      console.error("Get active asset types failed:", error);
      throw error;
    }
  },

  // Get all asset types with pagination
  getAssetTypes: async (params = {}) => {
    try {
      return await api.get("/asset-types", { params });
    } catch (error) {
      console.error("Get asset types failed:", error);
      throw error;
    }
  },

  // Get asset type by slug
  getAssetType: async (slug) => {
    try {
      return await api.get(`/asset-types/${slug}`);
    } catch (error) {
      console.error(`Get asset type ${slug} failed:`, error);
      throw error;
    }
  },

  // Get asset type by name
  getAssetTypeByName: async (name) => {
    try {
      return await api.get(`/asset-types/name/${name}`);
    } catch (error) {
      console.error(`Get asset type by name ${name} failed:`, error);
      throw error;
    }
  },

  // Create asset type
  createAssetType: async (assetTypeData) => {
    try {
      return await api.post("/asset-types", assetTypeData);
    } catch (error) {
      console.error("Create asset type failed:", error);
      throw error;
    }
  },

  // Update asset type
  updateAssetType: async (slug, assetTypeData) => {
    try {
      return await api.put(`/asset-types/${slug}`, assetTypeData);
    } catch (error) {
      console.error(`Update asset type ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete/deactivate asset type
  deleteAssetType: async (slug) => {
    try {
      return await api.delete(`/asset-types/${slug}`);
    } catch (error) {
      console.error(`Delete asset type ${slug} failed:`, error);
      throw error;
    }
  },

  // Search asset types
  searchAssetTypes: async (searchData) => {
    try {
      return await api.post("/asset-types/search", searchData);
    } catch (error) {
      console.error("Search asset types failed:", error);
      throw error;
    }
  },
};
