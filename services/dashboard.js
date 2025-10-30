import { api } from "./api-client";

export const dashboardService = {
  // Get comprehensive dashboard statistics
  getDashboardStats: async (params = {}) => {
    const { period = "month", include_historical = true } = params;
    
    const queryParams = new URLSearchParams({
      period,
      include_historical: include_historical.toString(),
    });

    return await api.get(`/dashboard/?${queryParams}`);
  },

  // Get detailed user metrics
  getUserMetrics: async () => {
    return await api.get("/dashboard/metrics/users");
  },

  // Get system performance and health metrics
  getSystemMetrics: async () => {
    return await api.get("/dashboard/metrics/system");
  },
};
