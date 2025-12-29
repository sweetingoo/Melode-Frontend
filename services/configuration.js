import { api } from "./api-client";

// Configuration API service
export const configurationService = {
  // Get all settings
  getSettings: async (params = {}) => {
    try {
      return await api.get("/configuration/settings", { params });
    } catch (error) {
      console.error("Get settings failed:", error);
      throw error;
    }
  },

  // Get setting by key
  getSetting: async (settingKey) => {
    try {
      return await api.get(`/configuration/settings/${settingKey}`);
    } catch (error) {
      console.error(`Get setting ${settingKey} failed:`, error);
      throw error;
    }
  },

  // Create setting
  createSetting: async (settingData) => {
    try {
      return await api.post("/configuration/settings", settingData);
    } catch (error) {
      console.error("Create setting failed:", error);
      throw error;
    }
  },

  // Update setting
  updateSetting: async (settingKey, settingData) => {
    try {
      return await api.put(`/configuration/settings/${settingKey}`, settingData);
    } catch (error) {
      console.error(`Update setting ${settingKey} failed:`, error);
      throw error;
    }
  },

  // Bulk update settings
  bulkUpdateSettings: async (settingsData) => {
    try {
      return await api.post("/configuration/settings/bulk-update", settingsData);
    } catch (error) {
      console.error("Bulk update settings failed:", error);
      throw error;
    }
  },

  // Delete setting
  deleteSetting: async (settingKey) => {
    try {
      return await api.delete(`/configuration/settings/${settingKey}`);
    } catch (error) {
      console.error(`Delete setting ${settingKey} failed:`, error);
      throw error;
    }
  },

  // Get categories
  getCategories: async () => {
    try {
      return await api.get("/configuration/categories");
    } catch (error) {
      console.error("Get categories failed:", error);
      throw error;
    }
  },

  // Get groups in category
  getCategoryGroups: async (category) => {
    try {
      return await api.get(`/configuration/categories/${category}/groups`);
    } catch (error) {
      console.error(`Get groups for category ${category} failed:`, error);
      throw error;
    }
  },

  // Get organisation
  getOrganisation: async () => {
    try {
      return await api.get("/settings/organizations/");
    } catch (error) {
      console.error("Get organisation failed:", error);
      throw error;
    }
  },

  // Update organisation (now handles create-or-update)
  updateOrganisation: async (organisationData) => {
    try {
      // Transform British English field names to American English for API request
      const requestData = {
        organization_name: organisationData.organisation_name || organisationData.organization_name,
        organization_code: organisationData.organisation_code || organisationData.organization_code,
        description: organisationData.description,
        is_active: organisationData.is_active,
        // Include integration_config if provided
        ...(organisationData.integration_config && {
          integration_config: organisationData.integration_config,
        }),
      };
      return await api.put("/settings/organizations/", requestData);
    } catch (error) {
      console.error("Update organisation failed:", error);
      throw error;
    }
  },

  // Check if organisation exists
  checkOrganisationExists: async (params = {}) => {
    try {
      return await api.get("/settings/organizations/exists", { params });
    } catch (error) {
      console.error("Check organisation exists failed:", error);
      throw error;
    }
  },

  // Get default role permissions
  getDefaultRolePermissions: async () => {
    try {
      return await api.get("/configuration/default-role-permissions");
    } catch (error) {
      console.error("Get default role permissions failed:", error);
      throw error;
    }
  },

  // Update default role permissions
  updateDefaultRolePermissions: async (permissionIds) => {
    try {
      return await api.put("/configuration/default-role-permissions", {
        permission_ids: permissionIds,
      });
    } catch (error) {
      console.error("Update default role permissions failed:", error);
      throw error;
    }
  },
};
