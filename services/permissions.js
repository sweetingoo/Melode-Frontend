import { api } from "./api-client";

// Permissions API service
export const permissionsService = {
  // Get all permissions
  getPermissions: async (params = {}) => {
    try {
      // Ensure we have at least page and per_page for pagination if backend requires it
      const queryParams = {
        page: params.page || 1,
        per_page: params.per_page || 50,
        ...params,
      };
      const response = await api.get("/permissions/", { params: queryParams });
      // Axios returns { data: {...}, status: 200, ... }, return just the data
      return response.data || response;
    } catch (error) {
      // Log more details for 422 errors
      if (error?.response?.status === 422) {
        console.error("Get permissions validation error:", {
          status: error.response.status,
          data: error.response.data,
          params: params,
        });
      } else {
        console.error("Get permissions failed:", error);
      }
      throw error;
    }
  },

  // Get permission by slug
  getPermission: async (slug) => {
    try {
      return await api.get(`/permissions/${slug}`);
    } catch (error) {
      console.error(`Get permission ${slug} failed:`, error);
      throw error;
    }
  },

  // Create permission
  createPermission: async (permissionData) => {
    try {
      return await api.post("/permissions/", permissionData);
    } catch (error) {
      console.error("Create permission failed:", error);
      throw error;
    }
  },

  // Update permission
  updatePermission: async (slug, permissionData) => {
    try {
      return await api.put(`/permissions/${slug}`, permissionData);
    } catch (error) {
      console.error(`Update permission ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete permission
  deletePermission: async (slug) => {
    try {
      return await api.delete(`/permissions/${slug}`);
    } catch (error) {
      console.error(`Delete permission ${slug} failed:`, error);
      throw error;
    }
  },

  // Get available resources - extract from permissions data
  getResources: async () => {
    try {
      // Get all permissions first
      const permissionsResponse = await api.get("/permissions/");
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
      const permissionsResponse = await api.get("/permissions/");
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
  getRolesWithPermission: async (permissionSlug) => {
    try {
      return await api.get(`/permissions/${permissionSlug}/roles`);
    } catch (error) {
      console.error(`Get roles with permission ${permissionSlug} failed:`, error);
      throw error;
    }
  },

  // Check user permissions
  checkUserPermissions: async (userSlug) => {
    try {
      return await api.get(`/permissions/check/${userSlug}`);
    } catch (error) {
      console.error(`Check user permissions ${userSlug} failed:`, error);
      throw error;
    }
  },
};
