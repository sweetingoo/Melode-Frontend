import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard";

// Dashboard query keys
export const dashboardKeys = {
  all: ["dashboard"],
  stats: (params) => [...dashboardKeys.all, "stats", params],
  userMetrics: () => [...dashboardKeys.all, "userMetrics"],
  systemMetrics: () => [...dashboardKeys.all, "systemMetrics"],
};

// Get dashboard statistics
export const useDashboardStats = (params = {}, options = {}) => {
  return useQuery({
    queryKey: dashboardKeys.stats(params),
    queryFn: async () => {
      const response = await dashboardService.getDashboardStats(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    enabled: options.enabled !== false,
    ...options,
  });
};

// Get user metrics
export const useUserMetrics = (options = {}) => {
  return useQuery({
    queryKey: dashboardKeys.userMetrics(),
    queryFn: async () => {
      const response = await dashboardService.getUserMetrics();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: options.enabled !== false,
    ...options,
  });
};

// Get system metrics
export const useSystemMetrics = (options = {}) => {
  return useQuery({
    queryKey: dashboardKeys.systemMetrics(),
    queryFn: async () => {
      const response = await dashboardService.getSystemMetrics();
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    enabled: options.enabled !== false,
    ...options,
  });
};
