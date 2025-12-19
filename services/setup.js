import { api } from "./api-client";

// Setup API service
export const setupService = {
  // Check if setup is complete
  checkSetupStatus: async () => {
    try {
      return await api.get("/setup/status");
    } catch (error) {
      console.error("Check setup status failed:", error);
      throw error;
    }
  },

  // Get setup requirements status
  getSetupRequirements: async () => {
    try {
      return await api.get("/setup/requirements");
    } catch (error) {
      console.error("Get setup requirements failed:", error);
      throw error;
    }
  },

  // Run complete setup
  runSetup: async (setupData) => {
    try {
      return await api.post("/setup/initialize", setupData);
    } catch (error) {
      console.error("Run setup failed:", error);
      throw error;
    }
  },

  // Create superuser role
  createSuperuserRole: async () => {
    try {
      return await api.post("/setup/create-superuser-role");
    } catch (error) {
      console.error("Create superuser role failed:", error);
      throw error;
    }
  },

  // Create superuser user
  createSuperuserUser: async (userData) => {
    try {
      return await api.post("/setup/create-superuser-user", userData);
    } catch (error) {
      console.error("Create superuser user failed:", error);
      throw error;
    }
  },

  // Create organization
  createOrganization: async (organizationData) => {
    try {
      return await api.post("/setup/create-organization", organizationData);
    } catch (error) {
      console.error("Create organization failed:", error);
      throw error;
    }
  },

  // Initialize permissions
  initializePermissions: async () => {
    try {
      return await api.post("/setup/initialize-permissions");
    } catch (error) {
      console.error("Initialize permissions failed:", error);
      throw error;
    }
  },

  // Initialize configurations
  initializeConfigurations: async () => {
    try {
      return await api.post("/setup/initialize-configurations");
    } catch (error) {
      console.error("Initialize configurations failed:", error);
      throw error;
    }
  },

  // Mark setup as complete
  markSetupComplete: async () => {
    try {
      return await api.post("/setup/complete");
    } catch (error) {
      console.error("Mark setup complete failed:", error);
      throw error;
    }
  },
};
