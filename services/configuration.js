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
      // Silently handle 403 errors during metadata generation (expected during SSR)
      if (error.response?.status === 403) {
        // Return a mock response structure to prevent errors from propagating
        // This allows metadata generation to gracefully handle the missing auth
        return { data: null };
      }
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
        // Always include integration_config if it exists
        // Backend will merge with existing config, so we send all fields including email styling
        ...(organisationData.integration_config !== undefined && {
          integration_config: organisationData.integration_config,
        }),
        // Always include branding_config if it exists
        // Backend will merge with existing config
        ...(organisationData.branding_config !== undefined && {
          branding_config: organisationData.branding_config,
        }),
      };
      
      // Debug: Log integration_config to verify email styling fields are included
      if (process.env.NODE_ENV === 'development' && requestData.integration_config) {
        console.log('Updating organisation with integration_config:', {
          hasEmailHeaderContent: !!requestData.integration_config.email_header_content,
          hasEmailHeaderLogoUrl: !!requestData.integration_config.email_header_logo_url,
          hasEmailPrimaryColor: !!requestData.integration_config.email_primary_color,
          hasEmailSecondaryColor: !!requestData.integration_config.email_secondary_color,
          hasEmailFooterContent: !!requestData.integration_config.email_footer_content,
          hasEmailFooterDisclaimer: !!requestData.integration_config.email_footer_disclaimer,
          emailStylingFields: {
            email_header_content: requestData.integration_config.email_header_content,
            email_header_logo_url: requestData.integration_config.email_header_logo_url,
            email_primary_color: requestData.integration_config.email_primary_color,
            email_secondary_color: requestData.integration_config.email_secondary_color,
            email_footer_content: requestData.integration_config.email_footer_content,
            email_footer_disclaimer: requestData.integration_config.email_footer_disclaimer,
          },
        });
      }
      
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
