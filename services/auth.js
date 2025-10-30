import { api } from "./api-client";

// Auth API service
export const authService = {
  // Login
  login: async (credentials) => {
    try {
      return await api.post("/auth/login", credentials);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      return await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  },

  // Register
  register: async (userData) => {
    try {
      return await api.post("/auth/register", userData);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  },

  // Signup with invitation token
  signup: async (signupData) => {
    try {
      return await api.post("/auth/signup", signupData);
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      return await api.post("/auth/forgot-password", { email });
    } catch (error) {
      console.error("Forgot password failed:", error);
      throw error;
    }
  },

  // Reset password
  resetPassword: async (token, password) => {
    try {
      return await api.post("/auth/reset-password", { token, new_password: password });
    } catch (error) {
      console.error("Reset password failed:", error);
      throw error;
    }
  },

  // MFA Login verification
  mfaLogin: async (temp_token, mfa_token) => {
    try {
      return await api.post("/auth/mfa-login", { temp_token, mfa_token });
    } catch (error) {
      console.error("MFA login failed:", error);
      throw error;
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      return await api.post("/auth/refresh");
    } catch (error) {
      console.error("Token refresh failed:", error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      return await api.get("/auth/me");
    } catch (error) {
      console.error("Get current user failed:", error);
      throw error;
    }
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    try {
      return await api.post("/auth/refresh", {
        refresh_token: refreshToken
      });
    } catch (error) {
      console.error("Token refresh failed:", error);
      throw error;
    }
  },

  // Update profile
  updateProfile: async (userData) => {
    try {
      return await api.put("/auth/profile", userData);
    } catch (error) {
      console.error("Update profile failed:", error);
      throw error;
    }
  },
};
