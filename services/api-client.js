import axios from "axios";

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: "https://melode-api-staging.onrender.com/api/v1",
  timeout: 10000, // 10 seconds timeout
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to add auth token and department context
apiClient.interceptors.request.use(
  (config) => {
    // If data is FormData, remove Content-Type header to let axios set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    // Get token from localStorage or wherever you store it
    // Check if we're in browser environment
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add assignment context header (X-Assignment-ID)
      const assignmentId = localStorage.getItem("assignment_id");
      if (assignmentId) {
        config.headers["X-Assignment-ID"] = assignmentId;
      }
    }

    // Log request in development
    if (process.env.NODE_ENV === "development") {
      console.log("API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        data: config.data,
        headers: config.headers,
      });
    }

    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle responses and errors
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === "development") {
      console.log("API Response:", {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        url: response.config.url,
      });
    }

    return response;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const config = error.config;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          // But don't redirect if this is a login attempt (to avoid infinite redirects)
          const isLoginAttempt =
            config?.url?.includes("/auth/login") ||
            config?.url?.includes("/auth/mfa-login");

          if (!isLoginAttempt) {
            localStorage.removeItem("authToken");
            if (typeof window !== "undefined") {
              window.location.href = "/auth";
            }
          }
          break;
        case 403:
          // Forbidden
          console.error(
            "Access forbidden:",
            data.message || "You do not have permission to access this resource"
          );
          break;
        case 404:
          // Not found - log as warning instead of error for better UX
          console.warn(
            "Resource not found:",
            data.message || "The requested resource was not found"
          );
          break;
        case 422:
          // Validation error
          console.error(
            "Validation error:",
            data?.errors || data?.message || "Validation failed"
          );
          break;
        case 500:
          // Server error
          console.error(
            "Server error:",
            data.message || "Internal server error"
          );
          break;
        default:
          console.error(
            "API Error:",
            data.message || "An unexpected error occurred"
          );
      }

      // Log error in development
      if (process.env.NODE_ENV === "development") {
        console.error("API Error Response:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.response?.config?.url,
        });
      }
    } else if (error.request) {
      // Request was made but no response received
      // Log as warning instead of error for better UX (network errors are often expected)
      const url = error.config?.url || "unknown";
      // Only log network errors for non-invitation endpoints to reduce noise
      if (!url.includes("/invitations")) {
        console.warn(
          "Network Error:",
          `No response received from server for ${url}`
        );
      }

      // Add network error code for better handling
      error.code = "NETWORK_ERROR";
    } else {
      // Something else happened
      console.error("Request Setup Error:", error.message);
    }

    return Promise.reject(error);
  }
);

// API methods for common operations
export const api = {
  // GET request
  get: async (url, config = {}) => {
    try {
      return await apiClient.get(url, config);
    } catch (error) {
      // Don't log network errors for invitations endpoint (handled gracefully in hook)
      if (error.code === "NETWORK_ERROR" && url.includes("/invitations")) {
        // Silently handle network errors for invitations
      } else {
        console.error(`GET request failed for ${url}:`, error);
      }
      throw error;
    }
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    try {
      return await apiClient.post(url, data, config);
    } catch (error) {
      console.error(`POST request failed for ${url}:`, error);
      throw error;
    }
  },

  // PUT request
  put: async (url, data = {}, config = {}) => {
    try {
      return await apiClient.put(url, data, config);
    } catch (error) {
      console.error(`PUT request failed for ${url}:`, error);
      throw error;
    }
  },

  // PATCH request
  patch: async (url, data = {}, config = {}) => {
    try {
      return await apiClient.patch(url, data, config);
    } catch (error) {
      console.error(`PATCH request failed for ${url}:`, error);
      throw error;
    }
  },

  // DELETE request
  delete: async (url, config = {}) => {
    try {
      return await apiClient.delete(url, config);
    } catch (error) {
      console.error(`DELETE request failed for ${url}:`, error);
      throw error;
    }
  },

  // Upload file
  upload: async (url, formData, config = {}) => {
    try {
      return await apiClient.post(url, formData, {
        ...config,
        headers: {
          ...config.headers,
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.error(`Upload request failed for ${url}:`, error);
      throw error;
    }
  },

  // Download file
  download: async (url, config = {}) => {
    try {
      return await apiClient.get(url, {
        ...config,
        responseType: "blob",
      });
    } catch (error) {
      console.error(`Download request failed for ${url}:`, error);
      throw error;
    }
  },
};

// Utility functions
export const apiUtils = {
  // Set auth token
  setAuthToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("authToken", token);
      } else {
        localStorage.removeItem("authToken");
      }
    }
  },

  // Get auth token
  getAuthToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken");
    }
    return null;
  },

  // Clear auth token
  clearAuthToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    if (typeof window !== "undefined") {
      const hasToken = !!localStorage.getItem("authToken");
      console.log("isAuthenticated check:", {
        hasToken,
        token: localStorage.getItem("authToken"),
      });
      return hasToken;
    }
    console.log("isAuthenticated check: window undefined, returning false");
    return false;
  },

  // Set refresh token
  setRefreshToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("refreshToken", token);
      } else {
        localStorage.removeItem("refreshToken");
      }
    }
  },

  // Get refresh token
  getRefreshToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refreshToken");
    }
    return null;
  },

  // Set active role ID (previously department ID)
  setActiveRoleId: (roleId) => {
    if (typeof window !== "undefined") {
      if (roleId) {
        localStorage.setItem("activeRoleId", roleId.toString());
      } else {
        localStorage.removeItem("activeRoleId");
      }
    }
  },

  // Get active role ID (previously department ID)
  getActiveRoleId: () => {
    if (typeof window !== "undefined") {
      const roleId = localStorage.getItem("activeRoleId");
      return roleId ? parseInt(roleId) : null;
    }
    return null;
  },

  // Clear active role (previously department)
  clearActiveRole: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("activeRoleId");
      // Also clear legacy department ID for migration
      localStorage.removeItem("activeDepartmentId");
    }
  },

  // Legacy support - Set active department ID (for backward compatibility)
  setActiveDepartmentId: (departmentId) => {
    if (typeof window !== "undefined") {
      if (departmentId) {
        localStorage.setItem("activeDepartmentId", departmentId.toString());
      } else {
        localStorage.removeItem("activeDepartmentId");
      }
    }
  },

  // Legacy support - Get active department ID (for backward compatibility)
  getActiveDepartmentId: () => {
    if (typeof window !== "undefined") {
      const deptId = localStorage.getItem("activeDepartmentId");
      return deptId ? parseInt(deptId) : null;
    }
    return null;
  },

  // Legacy support - Clear active department (for backward compatibility)
  clearActiveDepartment: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("activeDepartmentId");
    }
  },
};

export default apiClient;
