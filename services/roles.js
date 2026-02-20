import { api } from "./api-client";

// Roles API service
export const rolesService = {
  // Get all roles (single page)
  getRoles: async (params = {}) => {
    try {
      return await api.get("/roles", { params });
    } catch (error) {
      console.error("Get roles failed:", error);
      throw error;
    }
  },

  // Get all roles by requesting pages until there is no next page (small page size)
  getRolesAllPages: async (perPage = 20, params = {}) => {
    const all = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const response = await api.get("/roles", {
        params: { page, per_page: perPage, ...params },
      });
      const data = response.data ?? response;
      const chunk = Array.isArray(data) ? data : [];
      all.push(...chunk);
      hasMore = chunk.length >= perPage;
      page += 1;
    }
    return { data: all };
  },

  // Get role by slug
  getRole: async (slug) => {
    try {
      return await api.get(`/roles/${slug}`);
    } catch (error) {
      console.error(`Get role ${slug} failed:`, error);
      throw error;
    }
  },

  // Create role
  createRole: async (roleData) => {
    try {
      return await api.post("/roles", roleData);
    } catch (error) {
      console.error("Create role failed:", error);
      throw error;
    }
  },

  // Update role
  updateRole: async (slug, roleData) => {
    try {
      return await api.put(`/roles/${slug}`, roleData);
    } catch (error) {
      console.error(`Update role ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete role
  deleteRole: async (slug) => {
    try {
      return await api.delete(`/roles/${slug}`);
    } catch (error) {
      console.error(`Delete role ${slug} failed:`, error);
      throw error;
    }
  },

  // Get all permissions
  getPermissions: async (params = {}) => {
    try {
      return await api.get("/permissions/", { params });
    } catch (error) {
      console.error("Get permissions failed:", error);
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

  // Assign role to user
  assignRoleToUser: async (userData) => {
    try {
      return await api.post("/roles/assign", userData);
    } catch (error) {
      console.error("Assign role to user failed:", error);
      throw error;
    }
  },

  // Remove role from user
  removeRoleFromUser: async (userSlug, roleSlug) => {
    try {
      return await api.delete(`/roles/assign/${userSlug}/${roleSlug}`);
    } catch (error) {
      console.error(`Remove role ${roleSlug} from user ${userSlug} failed:`, error);
      throw error;
    }
  },

  // Get user roles
  getUserRoles: async (userSlug) => {
    try {
      return await api.get(`/roles/users/${userSlug}/roles`);
    } catch (error) {
      console.error(`Get user roles ${userSlug} failed:`, error);
      throw error;
    }
  },

  // Get role users
  getRoleUsers: async (roleSlug) => {
    try {
      return await api.get(`/roles/roles/${roleSlug}/users`);
    } catch (error) {
      console.error(`Get role users ${roleSlug} failed:`, error);
      throw error;
    }
  },

  // Get role permissions
  getRolePermissions: async (slug) => {
    try {
      return await api.get(`/roles/${slug}/permissions`);
    } catch (error) {
      console.error(`Get role permissions ${slug} failed:`, error);
      throw error;
    }
  },

  // Assign permissions to role (using PUT to update role with permission_ids)
  assignPermissions: async (slug, permissionIds) => {
    try {
      return await api.put(`/roles/${slug}`, { 
        permission_ids: permissionIds 
      });
    } catch (error) {
      console.error(`Assign permissions to role ${slug} failed:`, error);
      throw error;
    }
  },

  // Remove permissions from role (using PUT to update role with empty permission_ids)
  removePermissions: async (slug, permissionIds) => {
    try {
      // Get current role data first to preserve other fields
      const currentRole = await rolesService.getRole(slug);
      const currentPermissionIds = currentRole.data.permissions?.map(p => p.id) || [];
      
      // Remove the specified permission IDs
      const updatedPermissionIds = currentPermissionIds.filter(
        pid => !permissionIds.includes(pid)
      );
      
      return await api.put(`/roles/${slug}`, { 
        permission_ids: updatedPermissionIds 
      });
    } catch (error) {
      console.error(`Remove permissions from role ${slug} failed:`, error);
      throw error;
    }
  },
};
