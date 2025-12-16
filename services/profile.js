import { api } from "./api-client";

export const profileService = {
  // Get current user's profile
  getMyProfile: async () => {
    try {
      const response = await api.get("/profile/me");
      return response.data || response;
    } catch (error) {
      console.error("Get my profile failed:", error);
      throw error;
    }
  },

  // Update current user's profile
  updateMyProfile: async (profileData) => {
    try {
      const response = await api.put("/profile/me", profileData);
      return response.data || response;
    } catch (error) {
      console.error("Update my profile failed:", error);
      throw error;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.put("/profile/me/password", passwordData);
      return response.data || response;
    } catch (error) {
      console.error("Change password failed:", error);
      throw error;
    }
  },

  // Get user statistics
  getMyStats: async () => {
    try {
      const response = await api.get("/profile/me/stats");
      return response.data || response;
    } catch (error) {
      console.error("Get my stats failed:", error);
      throw error;
    }
  },

  // Deactivate account
  deactivateAccount: async () => {
    try {
      const response = await api.post("/profile/me/deactivate");
      return response.data || response;
    } catch (error) {
      console.error("Deactivate account failed:", error);
      throw error;
    }
  },

  // Get pending profile
  getPendingProfile: async () => {
    try {
      const response = await api.get("/profile/me/pending");
      return response.data || response;
    } catch (error) {
      // Don't log 404 errors as they're expected when no pending profile exists
      if (error.response?.status !== 404) {
        console.error("Get pending profile failed:", error);
      }
      throw error;
    }
  },

  // Accept profile
  acceptProfile: async () => {
    try {
      const response = await api.post("/profile/me/accept");
      return response.data || response;
    } catch (error) {
      console.error("Accept profile failed:", error);
      throw error;
    }
  },

  // Admin endpoints
  getUserProfile: async (userId) => {
    try {
      const response = await api.get(`/profile/${userId}`);
      return response.data || response;
    } catch (error) {
      console.error(`Get user profile ${userId} failed:`, error);
      throw error;
    }
  },

  getUserStats: async (userId) => {
    try {
      const response = await api.get(`/profile/${userId}/stats`);
      return response.data || response;
    } catch (error) {
      console.error(`Get user stats ${userId} failed:`, error);
      throw error;
    }
  },

  reactivateUser: async (userId) => {
    try {
      const response = await api.post(`/profile/${userId}/reactivate`);
      return response.data || response;
    } catch (error) {
      console.error(`Reactivate user ${userId} failed:`, error);
      throw error;
    }
  },

  createUserProfile: async (userData) => {
    try {
      const response = await api.post("/profile/admin/create", userData);
      return response.data || response;
    } catch (error) {
      console.error("Create user profile failed:", error);
      throw error;
    }
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post("/profile/me/photo", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data || response;
    } catch (error) {
      console.error("Upload avatar failed:", error);
      throw error;
    }
  },

  // MFA endpoints
  setupMFA: async () => {
    try {
      const response = await api.post("/mfa/setup", {});
      return response.data || response;
    } catch (error) {
      console.error("Setup MFA failed:", error);
      throw error;
    }
  },

  verifyMFA: async (token) => {
    try {
      const response = await api.post("/mfa/verify", { token });
      return response.data || response;
    } catch (error) {
      console.error("Verify MFA failed:", error);
      throw error;
    }
  },

  disableMFA: async (token) => {
    try {
      const response = await api.post("/mfa/disable", { token });
      return response.data || response;
    } catch (error) {
      console.error("Disable MFA failed:", error);
      throw error;
    }
  },

  getMFAStatus: async () => {
    try {
      const response = await api.get("/mfa/status");
      return response.data || response;
    } catch (error) {
      console.error("Get MFA status failed:", error);
      throw error;
    }
  },

  regenerateBackupCodes: async (token) => {
    try {
      const response = await api.post("/mfa/backup-codes/regenerate", { token });
      return response.data || response;
    } catch (error) {
      console.error("Regenerate backup codes failed:", error);
      throw error;
    }
  },

  // User Custom Fields endpoints
  getUserCustomFields: async (userId) => {
    try {
      if (!userId) {
        throw new Error("User ID is required for custom fields operations");
      }

      const response = await api.get(`/settings/entities/user/${userId}/custom-fields`);
      return response.data || response;
    } catch (error) {
      console.error("Get user custom fields failed:", error);
      throw error;
    }
  },

  getUserCustomFieldsHierarchy: async (userId) => {
    try {
      if (!userId) {
        throw new Error("User ID is required for custom fields operations");
      }

      const response = await api.get(`/settings/entities/user/${userId}/custom-fields/hierarchy`);
      return response.data || response;
    } catch (error) {
      console.error("Get user custom fields hierarchy failed:", error);
      throw error;
    }
  },

  updateUserCustomField: async (fieldId, valueData, fileId = null, userId) => {
    try {
      if (!userId) {
        throw new Error("User ID is required for custom fields operations");
      }

      const payload = { value_data: valueData };
      if (fileId) payload.file_id = fileId;

      const response = await api.put(`/settings/entities/user/${userId}/custom-fields/${fieldId}`, payload);
      return response.data || response;
    } catch (error) {
      console.error("Update user custom field failed:", error);
      throw error;
    }
  },

  bulkUpdateUserCustomFields: async (updates, userId) => {
    try {
      if (!userId) {
        throw new Error("User ID is required for custom fields operations");
      }

      const response = await api.put(`/settings/entities/user/${userId}/custom-fields/bulk`, {
        updates: updates
      });
      return response.data || response;
    } catch (error) {
      console.error("Bulk update user custom fields failed:", error);
      throw error;
    }
  },

  addUserGroupEntry: async (groupKey, entryData, sortOrder = 0, userId) => {
    try {
      if (!userId) {
        throw new Error("User ID is required for custom fields operations");
      }

      const response = await api.post(`/settings/entities/user/${userId}/group-entries`, {
        group_key: groupKey,
        sort_order: sortOrder,
        entry_data: entryData
      });
      return response.data || response;
    } catch (error) {
      console.error("Add user group entry failed:", error);
      throw error;
    }
  },

  // Upload file for custom fields or form submissions
  uploadFile: async (file, options = {}) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Add form_id and field_id for form-based validation
      if (options.form_id !== undefined && options.form_id !== null) {
        formData.append('form_id', options.form_id.toString());
      }
      if (options.field_id !== undefined && options.field_id !== null) {
        formData.append('field_id', options.field_id.toString());
      }
      if (options.organization_id !== undefined && options.organization_id !== null) {
        formData.append('organization_id', options.organization_id.toString());
      }

      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('File upload with options:', {
          hasFile: !!file,
          fileName: file?.name,
          form_id: options.form_id,
          field_id: options.field_id,
          organization_id: options.organization_id,
        });
      }

      // Don't set Content-Type header - let axios set it automatically with boundary
      // This is important for FormData to work correctly
      const response = await api.post('/settings/files/upload', formData);
      return response.data || response;
    } catch (error) {
      console.error("File upload failed:", error);
      throw error;
    }
  },

  // Download file for custom fields
  downloadFile: async (fileId) => {
    try {
      const response = await api.get(`/settings/files/${fileId}/download`);
      return response.data || response;
    } catch (error) {
      console.error("File download failed:", error);
      throw error;
    }
  },

  // User Preferences endpoints
  getPreferences: async () => {
    try {
      const response = await api.get("/profile/preferences");
      return response.data || response;
    } catch (error) {
      // Handle different error scenarios gracefully
      if (error.response?.status === 404) {
        // Preferences don't exist yet - API should auto-create, but handle gracefully
        return null;
      }
      if (error.response?.status === 422) {
        // Validation error - endpoint might not be ready or has validation issues
        // Return null to allow app to continue with defaults
        console.warn("Preferences endpoint validation error - using defaults:", error.response?.data);
        return null;
      }
      // For other errors, log but don't throw - let hook handle gracefully
      console.error("Get preferences failed:", error);
      return null;
    }
  },

  updatePreferences: async (preferences) => {
    try {
      // Partial update - only send fields that are provided
      const response = await api.put("/profile/preferences", preferences);
      return response.data || response;
    } catch (error) {
      console.error("Update preferences failed:", error);
      throw error;
    }
  },
};
