import { api } from "./api-client";

// Audit Logs API service
export const auditLogsService = {
  // Get all audit logs with filters
  getAuditLogs: async (params = {}) => {
    try {
      // Try general audit logs endpoint first
      return await api.get("/audit-logs/", { params });
    } catch (error) {
      // If general endpoint doesn't exist, try file audit logs endpoint
      if (error.response?.status === 404) {
        try {
          return await api.get("/files/admin/audit-logs/", { params });
        } catch (fileError) {
          console.error("Get audit logs failed:", fileError);
          throw fileError;
        }
      }
      console.error("Get audit logs failed:", error);
      throw error;
    }
  },

  // Get audit logs for a specific resource
  getResourceAuditLogs: async (resource, resourceIdOrSlug, params = {}) => {
    try {
      // Use the resource-specific endpoint: /audit-logs/resource/{resource}/{resource_slug}
      return await api.get(`/audit-logs/resource/${resource}/${resourceIdOrSlug}`, {
        params,
      });
    } catch (error) {
      console.error(
        `Get audit logs for ${resource} ${resourceIdOrSlug} failed:`,
        error
      );
      throw error;
    }
  },

  // Get audit logs for a specific user
  getUserAuditLogs: async (userSlug, params = {}) => {
    try {
      return await api.get(`/audit-logs/user/${userSlug}`, {
        params,
      });
    } catch (error) {
      console.error(`Get audit logs for user ${userSlug} failed:`, error);
      throw error;
    }
  },

  // Get audit log by slug
  getAuditLog: async (slug) => {
    try {
      return await api.get(`/audit-logs/${slug}`);
    } catch (error) {
      console.error(`Get audit log ${slug} failed:`, error);
      throw error;
    }
  },

  // Export audit logs to CSV
  exportAuditLogs: async (params = {}) => {
    try {
      return await api.get("/audit-logs/export", {
        params,
        responseType: "blob",
      });
    } catch (error) {
      console.error("Export audit logs failed:", error);
      throw error;
    }
  },
};














