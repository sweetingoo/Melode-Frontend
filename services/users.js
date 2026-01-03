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

  // Get user by slug
  getUser: async (slug) => {
    try {
      return await api.get(`/users/${slug}`);
    } catch (error) {
      console.log(error);
      console.error(`Get user ${slug} failed:`, error);
      throw error;
    }
  },

  // Update user
  updateUser: async (slug, userData) => {
    try {
      return await api.put(`/users/${slug}`, userData);
    } catch (error) {
      console.error(`Update user ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete user
  deleteUser: async (slug) => {
    try {
      return await api.delete(`/users/${slug}`);
    } catch (error) {
      console.error(`Delete user ${slug} failed:`, error);
      throw error;
    }
  },

  // Activate user
  activateUser: async (slug) => {
    try {
      return await api.post(`/users/${slug}/activate`);
    } catch (error) {
      console.error(`Activate user ${slug} failed:`, error);
      throw error;
    }
  },

  // Deactivate user
  deactivateUser: async (slug) => {
    try {
      return await api.post(`/users/${slug}/deactivate`);
    } catch (error) {
      console.error(`Deactivate user ${slug} failed:`, error);
      throw error;
    }
  },

  // Verify user
  verifyUser: async (slug) => {
    try {
      return await api.post(`/users/${slug}/verify`);
    } catch (error) {
      console.error(`Verify user ${slug} failed:`, error);
      throw error;
    }
  },

  // Get user permissions
  getUserPermissions: async (slug) => {
    try {
      return await api.get(`/users/${slug}/permissions`);
    } catch (error) {
      console.error(`Get user permissions ${slug} failed:`, error);
      throw error;
    }
  },

  // Assign direct permission to user
  assignDirectPermission: async (slug, permissionSlug) => {
    try {
      return await api.post(
        `/users/${slug}/assign-permission/${permissionSlug}`
      );
    } catch (error) {
      console.error(`Assign direct permission to user ${slug} failed:`, error);
      throw error;
    }
  },

  // Get user direct permissions
  getUserDirectPermissions: async (slug) => {
    try {
      return await api.get(`/users/${slug}/permissions/direct`);
    } catch (error) {
      console.error(`Get user direct permissions ${slug} failed:`, error);
      throw error;
    }
  },

  // Remove direct permission from user
  removeDirectPermission: async (slug, permissionSlug) => {
    try {
      return await api.delete(`/users/${slug}/remove-permission/${permissionSlug}`);
    } catch (error) {
      console.error(`Remove direct permission from user ${slug} failed:`, error);
      throw error;
    }
  },

  // Get user roles
  getUserRoles: async (slug) => {
    try {
      return await api.get(`/users/${slug}/roles`);
    } catch (error) {
      console.error(`Get user roles ${slug} failed:`, error);
      throw error;
    }
  },

  // Assign role to user
  assignRole: async (userSlug, roleSlug, assignedBy = null, notes = null) => {
    try {
      return await api.post(`/users/${userSlug}/assign-role/${roleSlug}`, {
        assigned_by: assignedBy,
        notes: notes,
      });
    } catch (error) {
      console.error(`Assign role to user ${userSlug} failed:`, error);
      throw error;
    }
  },

  // Remove role from user
  removeRole: async (userSlug, roleSlug) => {
    try {
      return await api.delete(`/users/${userSlug}/remove-role/${roleSlug}`);
    } catch (error) {
      console.error(`Remove role from user ${userSlug} failed:`, error);
      throw error;
    }
  },

  // Send invitation to existing user
  sendInvitationToUser: async (userSlug, options = {}) => {
    try {
      return await api.post(`/users/${userSlug}/send-invitation`, options);
    } catch (error) {
      console.error(`Send invitation to user ${userSlug} failed:`, error);
      throw error;
    }
  },
};
