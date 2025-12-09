import { api } from "./api-client";

// Users API service
export const usersService = {
  // Get all users
  getUsers: async (params = {}) => {
    try {
      return await api.get("/users", { params });
    } catch (error) {
      console.error("Get users failed:", error);
      throw error;
    }
  },

  // Create user
  createUser: async (userData) => {
    try {
      return await api.post("/users", userData);
    } catch (error) {
      console.error("Create user failed:", error);
      throw error;
    }
  },

  // Advanced user search
  searchUsers: async (searchData) => {
    try {
      return await api.post("/users/search", searchData);
    } catch (error) {
      console.error("Search users failed:", error);
      throw error;
    }
  },

  // Get user by ID
  getUser: async (id) => {
    try {
      return await api.get(`/users/${id}`);
    } catch (error) {
      console.log(error);
      console.error(`Get user ${id} failed:`, error);
      throw error;
    }
  },

  // Update user
  updateUser: async (id, userData) => {
    try {
      return await api.put(`/users/${id}`, userData);
    } catch (error) {
      console.error(`Update user ${id} failed:`, error);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (id) => {
    try {
      return await api.delete(`/users/${id}`);
    } catch (error) {
      console.error(`Delete user ${id} failed:`, error);
      throw error;
    }
  },

  // Activate user
  activateUser: async (id) => {
    try {
      return await api.post(`/users/${id}/activate`);
    } catch (error) {
      console.error(`Activate user ${id} failed:`, error);
      throw error;
    }
  },

  // Deactivate user
  deactivateUser: async (id) => {
    try {
      return await api.post(`/users/${id}/deactivate`);
    } catch (error) {
      console.error(`Deactivate user ${id} failed:`, error);
      throw error;
    }
  },

  // Verify user
  verifyUser: async (id) => {
    try {
      return await api.post(`/users/${id}/verify`);
    } catch (error) {
      console.error(`Verify user ${id} failed:`, error);
      throw error;
    }
  },

  // Get user permissions
  getUserPermissions: async (id) => {
    try {
      return await api.get(`/users/${id}/permissions`);
    } catch (error) {
      console.error(`Get user permissions ${id} failed:`, error);
      throw error;
    }
  },

  // Assign direct permission to user
  assignDirectPermission: async (id, permissionId) => {
    try {
      return await api.post(
        `/users/${id}/permissions?permission_id=${permissionId}`
      );
    } catch (error) {
      console.error(`Assign direct permission to user ${id} failed:`, error);
      throw error;
    }
  },

  // Get user direct permissions
  getUserDirectPermissions: async (id) => {
    try {
      return await api.get(`/users/${id}/permissions/direct`);
    } catch (error) {
      console.error(`Get user direct permissions ${id} failed:`, error);
      throw error;
    }
  },

  // Remove direct permission from user
  removeDirectPermission: async (id, permissionId) => {
    try {
      return await api.delete(`/users/${id}/permissions/${permissionId}`);
    } catch (error) {
      console.error(`Remove direct permission from user ${id} failed:`, error);
      throw error;
    }
  },

  // Get user roles
  getUserRoles: async (id) => {
    try {
      return await api.get(`/roles/users/${id}/roles`);
    } catch (error) {
      console.error(`Get user roles ${id} failed:`, error);
      throw error;
    }
  },

  // Assign role to user
  assignRole: async (id, roleId, assignedBy = null, notes = null) => {
    try {
      return await api.post(`/roles/assign`, {
        user_id: id,
        role_id: roleId,
        assigned_by: assignedBy,
        notes: notes,
      });
    } catch (error) {
      console.error(`Assign role to user ${id} failed:`, error);
      throw error;
    }
  },

  // Remove role from user
  removeRole: async (id, roleId) => {
    try {
      return await api.delete(`/roles/assign/${id}/${roleId}`);
    } catch (error) {
      console.error(`Remove role from user ${id} failed:`, error);
      throw error;
    }
  },

  // Send invitation to existing user
  sendInvitationToUser: async (userId, options = {}) => {
    try {
      return await api.post(`/users/${userId}/send-invitation`, options);
    } catch (error) {
      console.error(`Send invitation to user ${userId} failed:`, error);
      throw error;
    }
  },
};
