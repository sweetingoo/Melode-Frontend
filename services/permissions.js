import { api } from "./api-client";

// Permissions API service
export const permissionsService = {
  // Get all permissions
  getPermissions: async (params = {}) => {
    try {
      const response = await api.get("/roles/permissions/", { params });
      // Axios returns { data: {...}, status: 200, ... }, return just the data
      return response.data || response;
    } catch (error) {
      console.error("Get permissions failed:", error);
      throw error;
    }
  },

  // Get permission by ID
  getPermission: async (id) => {
    try {
      return await api.get(`/roles/permissions/${id}`);
    } catch (error) {
      console.error(`Get permission ${id} failed:`, error);
      throw error;
    }
  },

  // Create permission
  createPermission: async (permissionData) => {
    try {
      return await api.post("/roles/permissions/", permissionData);
    } catch (error) {
      console.error("Create permission failed:", error);
      throw error;
    }
  },

  // Update permission
  updatePermission: async (id, permissionData) => {
    try {
      return await api.put(`/roles/permissions/${id}`, permissionData);
    } catch (error) {
      console.error(`Update permission ${id} failed:`, error);
      throw error;
    }
  },

  // Delete permission
  deletePermission: async (id) => {
    try {
      return await api.delete(`/permissions/${id}`);
    } catch (error) {
      console.error(`Delete permission ${id} failed:`, error);
      throw error;
    }
  },

  // Get available resources - extract from permissions data
  getResources: async () => {
    try {
      // Get all permissions first
      const permissionsResponse = await api.get("/roles/permissions/");
      // Axios returns { data: {...}, status: 200, ... }, so we need to access .data
      const responseData = permissionsResponse.data || permissionsResponse;

      // Handle new paginated response structure: { permissions: [], total: 96, ... }
      let permissionsData = [];
      if (responseData?.permissions && Array.isArray(responseData.permissions)) {
        permissionsData = responseData.permissions;
      } else if (Array.isArray(responseData)) {
        permissionsData = responseData;
      }

      // Extract unique resources from permissions
      const resources = [...new Set(permissionsData.map((p) => p.resource))];

      // Transform to the expected format
      return resources.map((resource) => ({
        id: resource,
        name: resource,
        displayName:
          resource.charAt(0).toUpperCase() +
          resource.slice(1).replace(/_/g, " "),
      }));
    } catch (error) {
      console.error("Get resources failed:", error);
      throw error;
    }
  },

  // Get available actions - extract from permissions data
  getActions: async () => {
    try {
      // Get all permissions first
      const permissionsResponse = await api.get("/roles/permissions/");
      // Axios returns { data: {...}, status: 200, ... }, so we need to access .data
      const responseData = permissionsResponse.data || permissionsResponse;

      // Handle new paginated response structure: { permissions: [], total: 96, ... }
      let permissionsData = [];
      if (responseData?.permissions && Array.isArray(responseData.permissions)) {
        permissionsData = responseData.permissions;
      } else if (Array.isArray(responseData)) {
        permissionsData = responseData;
      }

      // Extract unique actions from permissions
      const actions = [...new Set(permissionsData.map((p) => p.action))];

      // Transform to the expected format
      return actions.map((action) => ({
        id: action,
        name: action,
        displayName:
          action.charAt(0).toUpperCase() + action.slice(1).replace(/_/g, " "),
      }));
    } catch (error) {
      console.error("Get actions failed:", error);
      throw error;
    }
  },

  // Get roles with specific permission
  getRolesWithPermission: async (permissionId) => {
    try {
      return await api.get(`/roles/permissions/${permissionId}/roles`);
    } catch (error) {
      console.error(`Get roles with permission ${permissionId} failed:`, error);
      throw error;
    }
  },

  // Check user permissions
  checkUserPermissions: async (userId) => {
    try {
      return await api.get(`/roles/permissions/check/${userId}`);
    } catch (error) {
      console.error(`Check user permissions ${userId} failed:`, error);
      throw error;
    }
  },
};
