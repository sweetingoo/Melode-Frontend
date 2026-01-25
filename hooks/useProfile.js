import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/services/profile";
import { authKeys } from "@/hooks/useAuth";
import { toast } from "sonner";
import { extractAvatarFileReference } from "@/utils/avatar";

// Query keys for profile
export const profileKeys = {
  all: ["profile"],
  me: () => [...profileKeys.all, "me"],
  stats: () => [...profileKeys.all, "stats"],
  pending: () => [...profileKeys.all, "pending"],
  user: (userId) => [...profileKeys.all, "user", userId],
  userStats: (userId) => [...profileKeys.all, "userStats", userId],
  mfaStatus: () => [...profileKeys.all, "mfaStatus"],
  userCustomFields: () => [...profileKeys.all, "userCustomFields"],
  userCustomFieldValuesList: (userSlug, filters) => [...profileKeys.all, "userCustomFieldValuesList", userSlug, filters],
  preferences: () => [...profileKeys.all, "preferences"],
};

// Utility functions for data transformation
export const profileUtils = {
  transformProfile: (profile) => {
    // Extract file reference from avatar URL if it's a URL, otherwise use as-is
    const avatarValue = profile.avatar_url || profile.avatar;
    const avatarFileReference = avatarValue ? extractAvatarFileReference(avatarValue) : null;
    
    // Get primary role (first role in the array, or a specific role if marked as primary)
    const roles = profile.roles || [];
    const primaryRole = roles.find(r => r.is_default) || roles[0] || null;
    
    return {
      id: profile.id,
      slug: profile.slug, // Include slug for API calls
      firstName: profile.first_name || profile.firstName,
      lastName: profile.last_name || profile.lastName,
      email: profile.email,
      phone: profile.phone || profile.phone_number,
      address: profile.address,
      bio: profile.bio,
      department: profile.department,
      jobTitle: profile.job_title || profile.jobTitle || profile.title,
      joinDate: profile.join_date || profile.joinDate,
      username: profile.username,
      // Store file reference instead of S3 URL
      avatar: avatarFileReference || avatarValue || null,
      avatar_url: avatarFileReference || avatarValue || null, // Keep both for compatibility
      isActive: profile.is_active !== undefined ? profile.is_active : true,
      isSuperuser: profile.is_superuser || false,
      createdAt: profile.created_at || profile.createdAt,
      updatedAt: profile.updated_at || profile.updatedAt,
      // Role information
      roles: roles, // Array of all roles
      role: primaryRole, // Primary/default role
      permissions: profile.permissions || [],
      // Additional computed fields
      fullName: `${profile.first_name || profile.firstName || ""} ${profile.last_name || profile.lastName || ""
        }`.trim() || profile.display_name,
      initials: `${(profile.first_name || profile.firstName || "").charAt(0)}${(
        profile.last_name ||
        profile.lastName ||
        ""
      ).charAt(0)}`.toUpperCase() || "AU",
    };
  },

  transformProfileForAPI: (profile) => ({
    bio: profile.bio,
    avatar: profile.avatar_url || profile.avatar,
  }),
};

// Get current user's profile
export const useMyProfile = () => {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: async () => {
      const response = await profileService.getMyProfile();
      return profileUtils.transformProfile(response);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get user statistics
export const useMyStats = () => {
  return useQuery({
    queryKey: profileKeys.stats(),
    queryFn: async () => {
      const response = await profileService.getMyStats();
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get pending profile
export const usePendingProfile = () => {
  return useQuery({
    queryKey: profileKeys.pending(),
    queryFn: async () => {
      try {
        const response = await profileService.getPendingProfile();
        return response;
      } catch (error) {
        // If it's a 404, return null (no pending profile)
        if (error.response?.status === 404) {
          return null;
        }
        // Re-throw other errors
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error.response?.status === 404) {
        return false;
      }
      // Retry other errors up to 3 times
      return failureCount < 3;
    },
  });
};

// Update profile mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData) => {
      const transformedData = profileUtils.transformProfileForAPI(profileData);
      const response = await profileService.updateMyProfile(transformedData);
      return profileUtils.transformProfile(response);
    },
    onSuccess: (data) => {
      // Update the profile in cache
      queryClient.setQueryData(profileKeys.me(), data);

      toast.success("Profile updated successfully!", {
        description: "Your profile information has been updated.",
      });
    },
    onError: (error) => {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile", {
        description:
          error.response?.data?.message ||
          "An error occurred while updating your profile.",
      });
    },
  });
};

// Change password mutation
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (passwordData) => {
      const response = await profileService.changePassword(passwordData);
      return response;
    },
    onSuccess: () => {
      toast.success("Password changed successfully!", {
        description: "Your password has been updated.",
      });
    },
    onError: (error) => {
      console.error("Failed to change password:", error);
      toast.error("Failed to change password", {
        description:
          error.response?.data?.message ||
          "An error occurred while changing your password.",
      });
    },
  });
};

// Deactivate account mutation
export const useDeactivateAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await profileService.deactivateAccount();
      return response;
    },
    onSuccess: () => {
      // Clear all profile-related cache
      queryClient.removeQueries({ queryKey: profileKeys.all });

      toast.success("Account deactivated successfully!", {
        description: "Your account has been deactivated.",
      });
    },
    onError: (error) => {
      console.error("Failed to deactivate account:", error);
      toast.error("Failed to deactivate account", {
        description:
          error.response?.data?.message ||
          "An error occurred while deactivating your account.",
      });
    },
  });
};

// Accept profile mutation
export const useAcceptProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await profileService.acceptProfile();
      return response;
    },
    onSuccess: () => {
      // Invalidate profile queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
      queryClient.invalidateQueries({ queryKey: profileKeys.pending() });

      toast.success("Profile accepted successfully!", {
        description: "Your profile has been accepted.",
      });
    },
    onError: (error) => {
      console.error("Failed to accept profile:", error);
      toast.error("Failed to accept profile", {
        description:
          error.response?.data?.message ||
          "An error occurred while accepting your profile.",
      });
    },
  });
};

// Admin hooks
export const useUserProfile = (userSlug) => {
  return useQuery({
    queryKey: profileKeys.user(userSlug),
    queryFn: async () => {
      const response = await profileService.getUserProfile(userSlug);
      return profileUtils.transformProfile(response);
    },
    enabled: !!userSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserStats = (userSlug) => {
  return useQuery({
    queryKey: profileKeys.userStats(userSlug),
    queryFn: async () => {
      const response = await profileService.getUserStats(userSlug);
      return response;
    },
    enabled: !!userSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useReactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userSlug) => {
      const response = await profileService.reactivateUser(userSlug);
      return response;
    },
    onSuccess: (data, userSlug) => {
      // Invalidate user profile queries
      queryClient.invalidateQueries({ queryKey: profileKeys.user(userSlug) });

      toast.success("User reactivated successfully!", {
        description: `User has been reactivated.`,
      });
    },
    onError: (error) => {
      console.error("Failed to reactivate user:", error);
      toast.error("Failed to reactivate user", {
        description:
          error.response?.data?.message ||
          "An error occurred while reactivating the user.",
      });
    },
  });
};

export const useCreateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      const response = await profileService.createUserProfile(userData);
      return response;
    },
    onSuccess: () => {
      toast.success("User profile created successfully!", {
        description: "The new user profile has been created.",
      });
    },
    onError: (error) => {
      console.error("Failed to create user profile:", error);
      toast.error("Failed to create user profile", {
        description:
          error.response?.data?.message ||
          "An error occurred while creating the user profile.",
      });
    },
  });
};

// Upload avatar mutation
export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file) => {
      const response = await profileService.uploadAvatar(file);
      // Return the file reference from the response
      return response;
    },
    onSuccess: (data) => {
      console.log('Avatar upload response:', data);
      
      // Extract file ID (file reference) from the response
      // The uploadAvatar service returns the file ID as 'id' or 'file_reference_id'
      let fileReference = data?.id || 
                         data?.file_reference_id ||
                         data?.file_id;
      
      console.log('Extracted file reference:', fileReference);

      // Use file reference if available - this is the file ID we want to store
      // IMPORTANT: Don't use data.avatar_url from the update response as it might be a temporary S3 URL
      // We want to store the file ID, not the URL
      if (!fileReference) {
        console.warn('No file reference found in upload response:', data);
        // Try to extract from nested response data
        const nestedData = data?.data || data;
        const fallbackId = nestedData?.id || nestedData?.file_reference_id || nestedData?.file_id;
        if (fallbackId) {
          console.log('Using fallback file ID:', fallbackId);
          fileReference = fallbackId;
        } else {
          console.error('Cannot proceed without file ID');
          return;
        }
      }
      
      const avatarValue = fileReference;

      // Update the profile in cache with file reference (file ID)
      queryClient.setQueryData(profileKeys.me(), (oldData) => {
        if (oldData) {
          return {
            ...oldData,
            avatar: avatarValue, // Store file ID (file reference) instead of temporary URL
            avatar_url: avatarValue, // Also update avatar_url with file ID
          };
        }
        return oldData;
      });

      // Invalidate profile and current user queries to refresh the sidebar and other components
      queryClient.invalidateQueries({ queryKey: profileKeys.me() });
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });

      toast.success("Avatar uploaded successfully!", {
        description: "Your profile picture has been updated.",
      });
    },
    onError: (error) => {
      console.error("Failed to upload avatar:", error);

      if (error.response?.status === 422) {
        // Handle validation errors
        const errorData = error.response.data;
        if (errorData?.detail && Array.isArray(errorData.detail)) {
          const firstError = errorData.detail[0];
          const fieldName = firstError.loc && firstError.loc.length > 1 ? firstError.loc[1] : 'file';
          toast.error(`Upload Error: ${fieldName}`, {
            description: firstError.msg || "Please check your file and try again",
          });
        } else {
          toast.error("Upload Error", {
            description: errorData?.message || "Please check your file and try again",
          });
        }
      } else {
        toast.error("Failed to upload avatar", {
          description:
            error.response?.data?.message ||
            "An error occurred while uploading your avatar.",
        });
      }
    },
  });
};

// MFA hooks
export const useMFAStatus = () => {
  return useQuery({
    queryKey: profileKeys.mfaStatus(),
    queryFn: async () => {
      const response = await profileService.getMFAStatus();
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSetupMFA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await profileService.setupMFA();
      return response;
    },
    onSuccess: (data) => {
      toast.success("MFA setup initiated!", {
        description: "Please scan the QR code with your authenticator app and verify with a token.",
      });
    },
    onError: (error) => {
      console.error("Failed to setup MFA:", error);

      if (error.response?.status === 422) {
        const errorData = error.response.data;
        if (errorData?.detail && Array.isArray(errorData.detail)) {
          const firstError = errorData.detail[0];
          const fieldName = firstError.loc && firstError.loc.length > 1 ? firstError.loc[1] : 'field';
          toast.error(`MFA Setup Error: ${fieldName}`, {
            description: firstError.msg || "Please try again",
          });
        } else {
          toast.error("MFA Setup Error", {
            description: errorData?.message || "Please try again",
          });
        }
      } else {
        toast.error("Failed to setup MFA", {
          description:
            error.response?.data?.message ||
            "An error occurred while setting up MFA.",
        });
      }
    },
  });
};

export const useVerifyMFA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token) => {
      const response = await profileService.verifyMFA(token);
      return response;
    },
    onSuccess: () => {
      // Invalidate MFA status to refetch updated data
      queryClient.invalidateQueries({ queryKey: profileKeys.mfaStatus() });

      toast.success("MFA enabled successfully!", {
        description: "Multi-factor authentication is now active on your account.",
      });
    },
    onError: (error) => {
      console.error("Failed to verify MFA:", error);

      if (error.response?.status === 422) {
        const errorData = error.response.data;
        if (errorData?.detail && Array.isArray(errorData.detail)) {
          const firstError = errorData.detail[0];
          const fieldName = firstError.loc && firstError.loc.length > 1 ? firstError.loc[1] : 'token';
          toast.error(`MFA Verification Error: ${fieldName}`, {
            description: firstError.msg || "Invalid token. Please try again.",
          });
        } else {
          toast.error("MFA Verification Error", {
            description: errorData?.message || "Invalid token. Please try again.",
          });
        }
      } else {
        toast.error("Failed to verify MFA", {
          description:
            error.response?.data?.message ||
            "Invalid token. Please try again.",
        });
      }
    },
  });
};

export const useDisableMFA = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token) => {
      const response = await profileService.disableMFA(token);
      return response;
    },
    onSuccess: () => {
      // Invalidate MFA status to refetch updated data
      queryClient.invalidateQueries({ queryKey: profileKeys.mfaStatus() });

      toast.success("MFA disabled successfully!", {
        description: "Multi-factor authentication has been disabled on your account.",
      });
    },
    onError: (error) => {
      console.error("Failed to disable MFA:", error);

      if (error.response?.status === 422) {
        const errorData = error.response.data;
        if (errorData?.detail && Array.isArray(errorData.detail)) {
          const firstError = errorData.detail[0];
          const fieldName = firstError.loc && firstError.loc.length > 1 ? firstError.loc[1] : 'token';
          toast.error(`MFA Disable Error: ${fieldName}`, {
            description: firstError.msg || "Invalid token. Please try again.",
          });
        } else {
          toast.error("MFA Disable Error", {
            description: errorData?.message || "Invalid token. Please try again.",
          });
        }
      } else {
        toast.error("Failed to disable MFA", {
          description:
            error.response?.data?.message ||
            "Invalid token. Please try again.",
        });
      }
    },
  });
};

export const useRegenerateBackupCodes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token) => {
      const response = await profileService.regenerateBackupCodes(token);
      return response;
    },
    onSuccess: (data) => {
      // Invalidate MFA status to refetch updated data
      queryClient.invalidateQueries({ queryKey: profileKeys.mfaStatus() });

      toast.success("Backup codes regenerated!", {
        description: "New backup codes have been generated. Please save them securely.",
      });
    },
    onError: (error) => {
      console.error("Failed to regenerate backup codes:", error);

      if (error.response?.status === 422) {
        const errorData = error.response.data;
        if (errorData?.detail && Array.isArray(errorData.detail)) {
          const firstError = errorData.detail[0];
          const fieldName = firstError.loc && firstError.loc.length > 1 ? firstError.loc[1] : 'token';
          toast.error(`Backup Codes Error: ${fieldName}`, {
            description: firstError.msg || "Invalid token. Please try again.",
          });
        } else {
          toast.error("Backup Codes Error", {
            description: errorData?.message || "Invalid token. Please try again.",
          });
        }
      } else {
        toast.error("Failed to regenerate backup codes", {
          description:
            error.response?.data?.message ||
            "Invalid token. Please try again.",
        });
      }
    },
  });
};

// User Custom Fields hooks
export const useUserCustomFields = (userSlug = null) => {
  return useQuery({
    queryKey: [...profileKeys.userCustomFields(), userSlug],
    queryFn: async () => {
      if (!userSlug) {
        throw new Error("User slug is required for custom fields operations");
      }
      const response = await profileService.getUserCustomFields(userSlug);
      return response;
    },
    enabled: !!userSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserCustomFieldsHierarchy = (userSlug = null) => {
  return useQuery({
    queryKey: [...profileKeys.userCustomFields(), 'hierarchy', userSlug],
    queryFn: async () => {
      if (!userSlug) {
        throw new Error("User slug is required for custom fields operations");
      }
      const response = await profileService.getUserCustomFieldsHierarchy(userSlug);
      return response;
    },
    enabled: !!userSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateUserCustomField = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fieldSlug, valueData, fileId = null, userSlug = null }) => {
      const response = await profileService.updateUserCustomField(fieldSlug, valueData, fileId, userSlug);
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate user custom fields to refetch updated data
      queryClient.invalidateQueries({ queryKey: profileKeys.userCustomFields() });

      toast.success("Custom field updated successfully!", {
        description: "Your custom field has been updated.",
      });
    },
    onError: (error) => {
      console.error("Failed to update custom field:", error);

      if (error.response?.status === 422) {
        const errorData = error.response.data;
        if (errorData?.detail && Array.isArray(errorData.detail)) {
          const firstError = errorData.detail[0];
          const fieldName = firstError.loc && firstError.loc.length > 1 ? firstError.loc[1] : 'field';
          toast.error(`Custom Field Error: ${fieldName}`, {
            description: firstError.msg || "Please check your input",
          });
        } else {
          toast.error("Custom Field Error", {
            description: errorData?.message || "Please check your input",
          });
        }
      } else {
        toast.error("Failed to update custom field", {
          description:
            error.response?.data?.message ||
            "An error occurred while updating your custom field.",
        });
      }
    },
  });
};

export const useBulkUpdateUserCustomFields = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ updates, userSlug = null }) => {
      const response = await profileService.bulkUpdateUserCustomFields(updates, userSlug);
      return response;
    },
    onSuccess: () => {
      // Invalidate user custom fields to refetch updated data
      queryClient.invalidateQueries({ queryKey: profileKeys.userCustomFields() });

      toast.success("Custom fields updated successfully!", {
        description: "Your custom field information has been updated.",
      });
    },
    onError: (error) => {
      console.error("Failed to update custom fields:", error);

      if (error.response?.status === 422) {
        const errorData = error.response.data;
        if (errorData?.detail && Array.isArray(errorData.detail)) {
          const firstError = errorData.detail[0];
          const fieldName = firstError.loc && firstError.loc.length > 1 ? firstError.loc[1] : 'field';
          toast.error(`Custom Fields Error: ${fieldName}`, {
            description: firstError.msg || "Please check your input",
          });
        } else {
          toast.error("Custom Fields Error", {
            description: errorData?.message || "Please check your input",
          });
        }
      } else if (error.response?.status === 400 || error.response?.status === 404) {
        // Handle structured bulk update errors
        const errorData = error.response?.data?.detail;
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          // Multiple field errors
          const errorMessages = errorData.errors.map(err => 
            `Field "${err.field_slug}": ${err.error}`
          ).join('\n');
          toast.error(errorData.message || "Some fields failed to update", {
            description: errorMessages,
            duration: 8000, // Show longer for multiple errors
          });
        } else if (errorData?.field_slug) {
          // Single field error (legacy format)
          toast.error(`Field "${errorData.field_slug}" failed`, {
            description: errorData.error || errorData.message || "Failed to update this field",
          });
        } else {
          // Generic error message
          const errorMessage = errorData?.message || errorData || "Failed to update custom fields";
          toast.error("Failed to update custom fields", {
            description: errorMessage,
          });
        }
      } else {
        toast.error("Failed to update custom fields", {
          description:
            error.response?.data?.detail?.message ||
            error.response?.data?.message ||
            "An error occurred while updating your custom fields.",
        });
      }
    },
  });
};

export const useAddUserGroupEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ groupKey, entryData, sortOrder = 0, userSlug = null }) => {
      const response = await profileService.addUserGroupEntry(groupKey, entryData, sortOrder, userSlug);
      return response;
    },
    onSuccess: () => {
      // Invalidate user custom fields to refetch updated data
      queryClient.invalidateQueries({ queryKey: profileKeys.userCustomFields() });

      toast.success("Group entry added successfully!", {
        description: "New entry has been added to the group.",
      });
    },
    onError: (error) => {
      console.error("Failed to add group entry:", error);

      if (error.response?.status === 422) {
        const errorData = error.response.data;
        if (errorData?.detail && Array.isArray(errorData.detail)) {
          const firstError = errorData.detail[0];
          const fieldName = firstError.loc && firstError.loc.length > 1 ? firstError.loc[1] : 'field';
          toast.error(`Group Entry Error: ${fieldName}`, {
            description: firstError.msg || "Please check your input",
          });
        } else {
          toast.error("Group Entry Error", {
            description: errorData?.message || "Please check your input",
          });
        }
      } else {
        toast.error("Failed to add group entry", {
          description:
            error.response?.data?.message ||
            "An error occurred while adding the group entry.",
        });
      }
    },
  });
};

export const useUploadFile = (options = {}) => {
  return useMutation({
    mutationFn: async (params) => {
      // params can be a file or an object with { file, form_id, field_id, organization_id }
      let file;
      let uploadOptions = { ...options };

      if (params instanceof File) {
        // Backward compatibility: if just a file is passed
        file = params;
      } else if (params && params.file) {
        // New format: object with file and options
        file = params.file;
        // Explicitly extract form_id, field_id, and organization_id
        uploadOptions = {
          ...options,
          form_id: params.form_id,
          field_id: params.field_id,
          organization_id: params.organization_id,
        };
        // Remove undefined values
        Object.keys(uploadOptions).forEach(key => {
          if (uploadOptions[key] === undefined || uploadOptions[key] === null) {
            delete uploadOptions[key];
          }
        });
      } else {
        throw new Error("Invalid parameters: expected File or { file, ...options }");
      }

      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('useUploadFile - Uploading file with options:', {
          fileName: file?.name,
          fileSize: file?.size,
          form_id: uploadOptions.form_id,
          field_id: uploadOptions.field_id,
          organization_id: uploadOptions.organization_id,
        });
      }

      const response = await profileService.uploadFile(file, uploadOptions);
      return response;
    },
    onSuccess: (data, variables, context) => {
      // Only show toast if not silent (for form submissions, we might want to suppress)
      if (!options.silent) {
        toast.success("File uploaded successfully!", {
          description: `File "${data.file_name || data.name || 'file'}" has been uploaded.`,
        });
      }
    },
    onError: (error) => {
      console.error("Failed to upload file:", error);

      // Only show toast if not silent
      if (!options.silent) {
        if (error.response?.status === 422) {
          const errorData = error.response.data;
          // Backend returns detail as string for file upload errors
          if (errorData?.detail) {
            const errorMessage = typeof errorData.detail === 'string'
              ? errorData.detail
              : Array.isArray(errorData.detail)
                ? errorData.detail[0]?.msg || errorData.detail[0]?.detail || "File validation failed"
                : errorData.detail;
            toast.error("File Upload Error", {
              description: errorMessage,
            });
          } else {
            toast.error("File Upload Error", {
              description: errorData?.message || "Please check your file",
            });
          }
        } else {
          toast.error("File Upload Error", {
            description: error.response?.data?.message || error.message || "Failed to upload file",
          });
        }
      }
    },
  });
};

export const useDownloadFile = () => {
  return useMutation({
    mutationFn: async (fileSlug) => {
      const response = await profileService.downloadFile(fileSlug);
      return response;
    },
    onSuccess: (data) => {
      // Handle both string URL and object response
      if (data) {
        let downloadUrl;
        if (typeof data === 'string') {
          downloadUrl = data;
        } else if (data.download_url) {
          downloadUrl = data.download_url;
        }

        if (downloadUrl) {
          // Create a temporary anchor element to trigger download
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.target = '_blank';
          link.download = ''; // This will use the filename from the server
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          console.error("No download URL found in response:", data);
          toast.error("Download URL not found", {
            description: "The server did not provide a valid download URL."
          });
        }
      }
    },
    onError: (error) => {
      console.error("Failed to download file:", error);
      toast.error("Failed to download file", {
        description:
          error.response?.data?.message ||
          "An error occurred while downloading the file.",
      });
    },
  });
};

// User Preferences hooks
export const usePreferences = () => {
  return useQuery({
    queryKey: profileKeys.preferences(),
    queryFn: async () => {
      const response = await profileService.getPreferences();
      // API auto-creates preferences if they don't exist, so response should always exist
      // But handle null gracefully (service returns null on errors)
      return response || {
        default_job_role_id: null,
        default_shift_role_id: null,
        default_location_id: null,
        additional_preferences: null,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 422 (validation errors) or 404 (not found)
      // These are likely permanent issues
      if (error.response?.status === 422 || error.response?.status === 404) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences) => {
      // Partial update - only send fields that are provided
      const response = await profileService.updatePreferences(preferences);
      return response;
    },
    onSuccess: () => {
      // Invalidate preferences to refetch updated data
      queryClient.invalidateQueries({ queryKey: profileKeys.preferences() });

      toast.success("Preferences updated successfully!", {
        description: "Your preferences have been saved.",
      });
    },
    onError: (error) => {
      console.error("Failed to update preferences:", error);

      if (error.response?.status === 422) {
        const errorData = error.response.data;
        if (errorData?.detail && Array.isArray(errorData.detail)) {
          const firstError = errorData.detail[0];
          const fieldName = firstError.loc && firstError.loc.length > 1 ? firstError.loc[1] : 'field';
          toast.error(`Update Error: ${fieldName}`, {
            description: firstError.msg || "Please check your input",
          });
        } else {
          toast.error("Update Error", {
            description: errorData?.message || "Please check your input",
          });
        }
      } else if (error.response?.status === 403) {
        toast.error("Access Denied", {
          description: "You don't have permission to update this preference.",
        });
      } else {
        toast.error("Failed to update preferences", {
          description:
            error.response?.data?.message ||
            "An error occurred while updating your preferences.",
        });
      }
    },
  });
};

// Get user custom field values list with filters (for admin view)
export const useUserCustomFieldValuesList = (userSlug, filters = {}) => {
  return useQuery({
    queryKey: profileKeys.userCustomFieldValuesList(userSlug, filters),
    queryFn: async () => {
      if (!userSlug) {
        throw new Error("User slug is required");
      }
      const response = await profileService.getUserCustomFieldValuesList(userSlug, filters);
      return response;
    },
    enabled: !!userSlug,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
