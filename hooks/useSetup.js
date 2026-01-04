"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { setupService } from "@/services/setup";

// Setup query keys
export const setupKeys = {
  all: ["setup"],
  status: () => [...setupKeys.all, "status"],
  requirements: () => [...setupKeys.all, "requirements"],
};

// Check setup status query
export const useSetupStatus = (options = {}) => {
  return useQuery({
    queryKey: setupKeys.status(),
    queryFn: async () => {
      try {
        const response = await setupService.checkSetupStatus();
        return response.data;
      } catch (error) {
        // If endpoint doesn't exist yet, return default status
        if (error?.response?.status === 404) {
          return {
            is_complete: false,
            completed_at: null,
          };
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get setup requirements query
export const useSetupRequirements = (options = {}) => {
  return useQuery({
    queryKey: setupKeys.requirements(),
    queryFn: async () => {
      try {
        const response = await setupService.getSetupRequirements();
        return response.data;
      } catch (error) {
        // If endpoint doesn't exist yet, return default requirements
        if (error?.response?.status === 404) {
          return {
            superuser_role: { exists: false, has_users: false },
            organization: { exists: false },
            permissions: { exists: false, count: 0 },
            configurations: { exists: false, count: 0 },
          };
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Run complete setup mutation
export const useRunSetup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (setupData) => {
      const response = await setupService.runSetup(setupData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: setupKeys.all });
      toast.success("Setup completed successfully", {
        description: "Your organisation has been initialized and is ready to use.",
      });
    },
    onError: (error) => {
      console.error("Setup error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to complete setup";
      toast.error("Setup failed", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Create superuser role mutation
export const useCreateSuperuserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await setupService.createSuperuserRole();
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: setupKeys.all });
      toast.success("Superuser role created", {
        description: "The superuser role has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Create superuser role error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create superuser role";
      toast.error("Failed to create superuser role", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Create superuser user mutation
export const useCreateSuperuserUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      const response = await setupService.createSuperuserUser(userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: setupKeys.all });
      toast.success("Superuser created", {
        description: "The superuser account has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Create superuser user error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create superuser";
      toast.error("Failed to create superuser", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Create organization mutation
export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationData) => {
      const response = await setupService.createOrganization(organizationData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: setupKeys.all });
      queryClient.invalidateQueries({ queryKey: ["configuration"] });
      toast.success("Organisation created", {
        description: "The organisation has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Create organisation error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create organisation";
      toast.error("Failed to create organisation", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Initialize permissions mutation
export const useInitializePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await setupService.initializePermissions();
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: setupKeys.all });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      const count = data?.permissions_created || data?.count || 0;
      toast.success("Permissions initialized", {
        description: `${count} permissions have been created successfully.`,
      });
    },
    onError: (error) => {
      console.error("Initialize permissions error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to initialize permissions";
      toast.error("Failed to initialize permissions", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Initialize configurations mutation
export const useInitializeConfigurations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await setupService.initializeConfigurations();
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: setupKeys.all });
      queryClient.invalidateQueries({ queryKey: ["configuration"] });
      const count = data?.configurations_created || data?.count || 0;
      toast.success("Configurations initialized", {
        description: `${count} configuration settings have been created successfully.`,
      });
    },
    onError: (error) => {
      console.error("Initialize configurations error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to initialize configurations";
      toast.error("Failed to initialize configurations", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Mark setup as complete mutation
export const useMarkSetupComplete = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await setupService.markSetupComplete();
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: setupKeys.all });
      toast.success("Setup marked as complete", {
        description: "The setup process has been completed.",
      });
    },
    onError: (error) => {
      console.error("Mark setup complete error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to mark setup as complete";
      toast.error("Failed to mark setup as complete", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};




