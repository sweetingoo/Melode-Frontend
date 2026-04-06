import { api } from "./api-client";

/**
 * Hard cap for list-style query params (`per_page`, etc.) on Melode user APIs.
 * Do not exceed this in any single request from the frontend.
 */
export const API_MAX_LIST_PAGE = 100;

/** Alias: max `per_page` for GET /users/suggest; default when omitted. */
export const USERS_SUGGEST_MAX_PER_PAGE = API_MAX_LIST_PAGE;

function clampUsersListPerPage(raw) {
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return undefined;
  return Math.min(Math.floor(n), API_MAX_LIST_PAGE);
}

// Users API service
export const usersService = {
  // Get all users
  getUsers: async (params = {}) => {
    try {
      const { per_page, ...rest } = params;
      const capped = clampUsersListPerPage(per_page);
      const nextParams =
        capped != null ? { ...rest, per_page: capped } : { ...rest };
      return await api.get("/users", { params: nextParams });
    } catch (error) {
      console.error("Get users failed:", error);
      throw error;
    }
  },

  /** Fetch every page from GET /users (max per_page 100 on API). Omit is_active to include inactive users. */
  getUsersAllPages: async (perPage = API_MAX_LIST_PAGE, params = {}) => {
    const pageSize = clampUsersListPerPage(perPage) ?? API_MAX_LIST_PAGE;
    const all = [];
    let page = 1;
    let totalPages = 1;
    for (;;) {
      const response = await api.get("/users", {
        params: { page, per_page: pageSize, ...params },
      });
      const body = response.data ?? response;
      const chunk = Array.isArray(body.users) ? body.users : [];
      all.push(...chunk);
      totalPages =
        typeof body.total_pages === "number" && body.total_pages >= 1
          ? body.total_pages
          : 1;
      if (page >= totalPages || chunk.length === 0) break;
      page += 1;
    }
    return { data: { users: all, total: all.length } };
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

  // Suggest users for field selection (autocomplete)
  suggestUsers: async (params = {}) => {
    try {
      const { per_page: rawPerPage, ...rest } = params;
      let per_page = USERS_SUGGEST_MAX_PER_PAGE;
      const capped = clampUsersListPerPage(rawPerPage);
      if (capped != null) per_page = capped;
      return await api.get("/users/suggest", { params: { ...rest, per_page } });
    } catch (error) {
      console.error("Suggest users failed:", error);
      throw error;
    }
  },

  // Get user by slug (path is /users/{slug} — use slug, never a numeric id)
  getUser: async (slug) => {
    try {
      return await api.get(`/users/${slug}`);
    } catch (error) {
      console.log(error);
      console.error(`Get user ${slug} failed:`, error);
      throw error;
    }
  },

  /**
   * Resolve a user by internal id without putting the id in the URL path (avoids /users/123).
   * Pages through GET /users until a matching row is found or pages are exhausted.
   */
  resolveUserByListLookup: async (userId, { maxPages = 50 } = {}) => {
    const id = Number(userId);
    if (!Number.isFinite(id) || id < 1) return null;
    let page = 1;
    for (; page <= maxPages; page += 1) {
      const response = await api.get("/users", {
        params: { page, per_page: API_MAX_LIST_PAGE },
      });
      const body = response.data ?? response;
      const users = Array.isArray(body.users) ? body.users : [];
      const hit = users.find((u) => u.id === id);
      if (hit) return hit;
      const totalPages =
        typeof body.total_pages === "number" && body.total_pages >= 1
          ? body.total_pages
          : 1;
      if (page >= totalPages || users.length === 0) break;
    }
    return null;
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

  // Admin manual password reset for a user
  resetUserPassword: async (userSlug, newPassword) => {
    try {
      return await api.post(`/users/${userSlug}/reset-password`, {
        new_password: newPassword,
      });
    } catch (error) {
      console.error(`Reset password for user ${userSlug} failed:`, error);
      throw error;
    }
  },
};
