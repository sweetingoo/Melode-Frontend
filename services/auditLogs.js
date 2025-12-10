import { api } from "./api-client";

// Audit Logs API service
export const auditLogsService = {
  // Get all audit logs with filters
  getAuditLogs: async (params = {}) => {
    try {
      // Try general audit logs endpoint first
      return await api.get("/audit-logs", { params });
    } catch (error) {
      // If general endpoint doesn't exist, try file audit logs endpoint
      if (error.response?.status === 404) {
        try {
          return await api.get("/files/admin/audit-logs", { params });
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
  getResourceAuditLogs: async (resource, resourceId, params = {}) => {
    try {
      return await api.get("/audit-logs", {
        params: {
          resource,
          resource_id: resourceId,
          ...params,
        },
      });
    } catch (error) {
      console.error(
        `Get audit logs for ${resource} ${resourceId} failed:`,
        error
      );
      throw error;
    }
  },

  // Get audit logs for a specific user
  getUserAuditLogs: async (userId, params = {}) => {
    try {
      return await api.get("/audit-logs", {
        params: {
          user_id: userId,
          ...params,
        },
      });
    } catch (error) {
      console.error(`Get audit logs for user ${userId} failed:`, error);
      throw error;
    }
  },

  // Get audit log by ID
  getAuditLog: async (id) => {
    try {
      return await api.get(`/audit-logs/${id}`);
    } catch (error) {
      console.error(`Get audit log ${id} failed:`, error);
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













