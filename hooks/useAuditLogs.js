import { useQuery, useQueryClient } from "@tanstack/react-query";
import { auditLogsService } from "@/services/auditLogs";
import { toast } from "sonner";

// Audit log query keys
export const auditLogKeys = {
  all: ["audit-logs"],
  lists: () => [...auditLogKeys.all, "list"],
  list: (params) => [...auditLogKeys.lists(), params],
  resource: (resource, resourceId, params) => [
    ...auditLogKeys.all,
    "resource",
    resource,
    resourceId,
    params,
  ],
  user: (userId, params) => [...auditLogKeys.all, "user", userId, params],
  detail: (id) => [...auditLogKeys.all, "detail", id],
};

// Get audit logs query
export const useAuditLogs = (params = {}, options = {}) => {
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: async () => {
      const response = await auditLogsService.getAuditLogs(params);
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

// Get audit logs for a specific resource
export const useResourceAuditLogs = (
  resource,
  resourceId,
  params = {},
  options = {}
) => {
  return useQuery({
    queryKey: auditLogKeys.resource(resource, resourceId, params),
    queryFn: async () => {
      const response = await auditLogsService.getResourceAuditLogs(
        resource,
        resourceId,
        params
      );
      return response.data;
    },
    enabled: !!resource && !!resourceId,
    staleTime: 30 * 1000,
    ...options,
  });
};

// Get audit logs for a specific user
export const useUserAuditLogs = (userId, params = {}, options = {}) => {
  return useQuery({
    queryKey: auditLogKeys.user(userId, params),
    queryFn: async () => {
      const response = await auditLogsService.getUserAuditLogs(userId, params);
      return response.data;
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
    ...options,
  });
};

// Get single audit log
export const useAuditLog = (id, options = {}) => {
  return useQuery({
    queryKey: auditLogKeys.detail(id),
    queryFn: async () => {
      const response = await auditLogsService.getAuditLog(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};













