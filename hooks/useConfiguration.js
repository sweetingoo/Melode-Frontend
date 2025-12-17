"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { configurationService } from "@/services/configuration";
import { toast } from "sonner";

// Configuration query keys
export const configurationKeys = {
  all: ["configuration"],
  settings: (params) => [...configurationKeys.all, "settings", params],
  setting: (key) => [...configurationKeys.all, "setting", key],
  categories: () => [...configurationKeys.all, "categories"],
  categoryGroups: (category) => [
    ...configurationKeys.all,
    "category-groups",
    category,
  ],
  organisation: () => [...configurationKeys.all, "organisation"],
  defaultRolePermissions: () => [...configurationKeys.all, "default-role-permissions"],
};

// Get settings query
export const useSettings = (params = {}, options = {}) => {
  return useQuery({
    queryKey: configurationKeys.settings(params),
    queryFn: async () => {
      try {
        const response = await configurationService.getSettings(params);
        return response.data;
      } catch (error) {
        if (error?.response?.status === 403) {
          throw new Error("Superuser privileges required to manage configuration");
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get setting by key query
export const useSetting = (settingKey, options = {}) => {
  return useQuery({
    queryKey: configurationKeys.setting(settingKey),
    queryFn: async () => {
      const response = await configurationService.getSetting(settingKey);
      return response.data;
    },
    enabled: !!settingKey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get categories query
export const useConfigurationCategories = (options = {}) => {
  return useQuery({
    queryKey: configurationKeys.categories(),
    queryFn: async () => {
      try {
        const response = await configurationService.getCategories();
        return response.data;
      } catch (error) {
        if (error?.response?.status === 403) {
          throw new Error("Superuser privileges required to manage configuration");
        }
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
    ...options,
  });
};

// Get category groups query
export const useCategoryGroups = (category, options = {}) => {
  return useQuery({
    queryKey: configurationKeys.categoryGroups(category),
    queryFn: async () => {
      try {
        const response = await configurationService.getCategoryGroups(category);
        return response.data;
      } catch (error) {
        if (error?.response?.status === 403) {
          throw new Error("Superuser privileges required to manage configuration");
        }
        throw error;
      }
    },
    enabled: !!category,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// Create setting mutation
export const useCreateSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settingData) => {
      const response = await configurationService.createSetting(settingData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configurationKeys.all });
      toast.success("Setting created successfully", {
        description: "The setting has been created.",
      });
    },
    onError: (error) => {
      console.error("Create setting error:", error);
      if (error?.response?.status === 403) {
        toast.error("Access Denied", {
          description: "Superuser privileges required to manage configuration",
        });
        return;
      }
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create setting";
      toast.error("Failed to create setting", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Update setting mutation
export const useUpdateSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ settingKey, settingData }) => {
      const response = await configurationService.updateSetting(
        settingKey,
        settingData
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: configurationKeys.setting(variables.settingKey),
      });
      queryClient.invalidateQueries({ queryKey: configurationKeys.settings() });
      toast.success("Setting updated successfully", {
        description: "The setting has been updated.",
      });
    },
    onError: (error) => {
      console.error("Update setting error:", error);
      if (error?.response?.status === 403) {
        toast.error("Access Denied", {
          description: "Superuser privileges required to manage configuration",
        });
        return;
      }
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update setting";
      toast.error("Failed to update setting", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Bulk update settings mutation
export const useBulkUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settingsData) => {
      const response = await configurationService.bulkUpdateSettings(
        settingsData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configurationKeys.all });
      toast.success("Settings updated successfully", {
        description: "The settings have been updated.",
      });
    },
    onError: (error) => {
      console.error("Bulk update settings error:", error);
      if (error?.response?.status === 403) {
        toast.error("Access Denied", {
          description: "Superuser privileges required to manage configuration",
        });
        return;
      }
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update settings";
      toast.error("Failed to update settings", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Delete setting mutation
export const useDeleteSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settingKey) => {
      await configurationService.deleteSetting(settingKey);
      return settingKey;
    },
    onSuccess: (settingKey) => {
      queryClient.removeQueries({
        queryKey: configurationKeys.setting(settingKey),
      });
      queryClient.invalidateQueries({ queryKey: configurationKeys.settings() });
      toast.success("Setting deleted successfully", {
        description: "The setting has been deleted.",
      });
    },
    onError: (error) => {
      console.error("Delete setting error:", error);
      if (error?.response?.status === 403) {
        toast.error("Access Denied", {
          description: "Superuser privileges required to manage configuration",
        });
        return;
      }
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete setting";
      toast.error("Failed to delete setting", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Helper function to extract organisation from response
// Handles both paginated response ({ organizations: [...] }) and direct organisation object
const extractOrganisation = (responseData) => {
  if (!responseData) return null;

  // Handle paginated response structure: { organizations: [...], total, page, ... }
  if (responseData?.organizations && Array.isArray(responseData.organizations)) {
    // Extract the first organisation from the array (there's always one)
    return responseData.organizations[0] || null;
  }

  // Handle direct organisation object
  return responseData;
};

// Helper function to transform organization response fields
// Handles both American (organization_*) and British (organisation_*) English field names
const transformOrganisationResponse = (data) => {
  if (!data) return data;

  return {
    ...data,
    // Transform American English to British English for UI consistency
    organisation_name: data.organisation_name || data.organization_name,
    organisation_code: data.organisation_code || data.organization_code,
    organisation_exists: data.organisation_exists !== undefined
      ? data.organisation_exists
      : data.organization_exists,
    // Transform stats fields from American to British English
    total_organisations: data.total_organisations !== undefined
      ? data.total_organisations
      : data.total_organizations,
    active_organisations: data.active_organisations !== undefined
      ? data.active_organisations
      : data.active_organizations,
    // Keep original fields for compatibility
    organization_name: data.organization_name || data.organisation_name,
    organization_code: data.organization_code || data.organisation_code,
    total_organizations: data.total_organizations || data.total_organisations,
    active_organizations: data.active_organizations || data.active_organisations,
  };
};

// Get organisation query
export const useOrganisation = (options = {}) => {
  return useQuery({
    queryKey: configurationKeys.organisation(),
    queryFn: async () => {
      try {
        const response = await configurationService.getOrganisation();
        const organisation = extractOrganisation(response.data);

        if (!organisation) {
          // No organisation found
          return null;
        }

        return transformOrganisationResponse(organisation);
      } catch (error) {
        if (error?.response?.status === 403) {
          throw new Error("Superuser privileges required to manage configuration");
        }
        if (error?.response?.status === 404) {
          // Organisation doesn't exist yet, return null
          return null;
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Check if organisation exists query
export const useCheckOrganisationExists = (params = {}, options = {}) => {
  return useQuery({
    queryKey: [...configurationKeys.organisation(), "exists", params],
    queryFn: async () => {
      try {
        const response = await configurationService.checkOrganisationExists(params);
        return transformOrganisationResponse(response.data);
      } catch (error) {
        if (error?.response?.status === 403) {
          throw new Error("Superuser privileges required to manage configuration");
        }
        throw error;
      }
    },
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Update organisation mutation (now handles create-or-update)
export const useUpdateOrganisation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organisationData) => {
      const response = await configurationService.updateOrganisation(
        organisationData
      );
      const organisation = extractOrganisation(response.data);
      return transformOrganisationResponse(organisation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: configurationKeys.organisation(),
      });
      toast.success("Organisation saved successfully", {
        description: "The organisation settings have been created or updated.",
      });
    },
    onError: (error) => {
      console.error("Update organisation error:", error);
      if (error?.response?.status === 403) {
        toast.error("Access Denied", {
          description: "Superuser privileges required to manage configuration",
        });
        return;
      }
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update organisation";
      toast.error("Failed to update organisation", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Get default role permissions query
export const useDefaultRolePermissions = (options = {}) => {
  return useQuery({
    queryKey: configurationKeys.defaultRolePermissions(),
    queryFn: async () => {
      try {
        const response = await configurationService.getDefaultRolePermissions();
        // Extract value from response - could be { value: [...] } or direct array
        const data = response.data || response;
        const value = data?.value || data;
        return Array.isArray(value) ? value : [];
      } catch (error) {
        if (error?.response?.status === 404) {
          // Setting doesn't exist yet, return empty array
          return [];
        }
        if (error?.response?.status === 403) {
          throw new Error("Superuser privileges required to manage configuration");
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Update default role permissions mutation
export const useUpdateDefaultRolePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (permissionIds) => {
      const response = await configurationService.updateDefaultRolePermissions(permissionIds);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: configurationKeys.defaultRolePermissions(),
      });
      toast.success("Default role permissions updated successfully", {
        description: "New roles will automatically receive these permissions if none are specified.",
      });
    },
    onError: (error) => {
      console.error("Update default role permissions error:", error);
      if (error?.response?.status === 403) {
        toast.error("Access Denied", {
          description: "Superuser privileges required to manage configuration",
        });
        return;
      }
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update default role permissions";
      toast.error("Failed to update default role permissions", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};



