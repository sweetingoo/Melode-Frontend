import { api } from "./api-client";

// Roles API service
export const rolesService = {
  // Get all roles
  getRoles: async (params = {}) => {
    try {
      return await api.get("/roles", { params });
    } catch (error) {
      console.error("Get roles failed:", error);
      throw error;
    }
  },

  // Get role by ID
  getRole: async (id) => {
    try {
      return await api.get(`/roles/${id}`);
    } catch (error) {
      console.error(`Get role ${id} failed:`, error);
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
  updateRole: async (id, roleData) => {
    try {
      return await api.put(`/roles/${id}`, roleData);
    } catch (error) {
      console.error(`Update role ${id} failed:`, error);
      throw error;
    }
  },

  // Delete role
  deleteRole: async (id) => {
    try {
      return await api.delete(`/roles/${id}`);
    } catch (error) {
      console.error(`Delete role ${id} failed:`, error);
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

  // Get permission by ID
  getPermission: async (id) => {
    try {
      return await api.get(`/permissions/${id}`);
    } catch (error) {
      console.error(`Get permission ${id} failed:`, error);
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
  removeRoleFromUser: async (userId, roleId) => {
    try {
      return await api.delete(`/roles/assign/${userId}/${roleId}`);
    } catch (error) {
      console.error(`Remove role ${roleId} from user ${userId} failed:`, error);
      throw error;
    }
  },

  // Get user roles
  getUserRoles: async (userId) => {
    try {
      return await api.get(`/roles/users/${userId}/roles`);
    } catch (error) {
      console.error(`Get user roles ${userId} failed:`, error);
      throw error;
    }
  },

  // Get role users
  getRoleUsers: async (roleId) => {
    try {
      return await api.get(`/roles/roles/${roleId}/users`);
    } catch (error) {
      console.error(`Get role users ${roleId} failed:`, error);
      throw error;
    }
  },

  // Get role permissions
  getRolePermissions: async (id) => {
    try {
      return await api.get(`/roles/${id}/permissions`);
    } catch (error) {
      console.error(`Get role permissions ${id} failed:`, error);
      throw error;
    }
  },

  // Assign permissions to role (using PUT to update role with permission_ids)
  assignPermissions: async (id, permissionIds) => {
    try {
      return await api.put(`/roles/${id}`, { 
        permission_ids: permissionIds 
      });
    } catch (error) {
      console.error(`Assign permissions to role ${id} failed:`, error);
      throw error;
    }
  },

  // Remove permissions from role (using PUT to update role with empty permission_ids)
  removePermissions: async (id, permissionIds) => {
    try {
      // Get current role data first to preserve other fields
      const currentRole = await rolesService.getRole(id);
      const currentPermissionIds = currentRole.data.permissions?.map(p => p.id) || [];
      
      // Remove the specified permission IDs
      const updatedPermissionIds = currentPermissionIds.filter(
        pid => !permissionIds.includes(pid)
      );
      
      return await api.put(`/roles/${id}`, { 
        permission_ids: updatedPermissionIds 
      });
    } catch (error) {
      console.error(`Remove permissions from role ${id} failed:`, error);
      throw error;
    }
  },
};
