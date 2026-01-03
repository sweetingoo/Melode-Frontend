import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/users";
import { rolesService } from "@/services/roles";
import { toast } from "sonner";
import { parseUTCDate } from "@/utils/time";

// Role query keys
export const roleKeys = {
  all: ["roles"],
  lists: () => [...roleKeys.all, "list"],
  list: (params) => [...roleKeys.lists(), params],
  details: () => [...roleKeys.all, "detail"],
  detail: (id) => [...roleKeys.details(), id],
};

// User query keys
export const userKeys = {
  all: ["users"],
  lists: () => [...userKeys.all, "list"],
  list: (params) => [...userKeys.lists(), params],
  details: () => [...userKeys.all, "detail"],
  detail: (id) => [...userKeys.details(), id],
  permissions: (id) => [...userKeys.detail(id), "permissions"],
  directPermissions: (id) => [...userKeys.detail(id), "direct-permissions"],
  roles: (id) => [...userKeys.detail(id), "roles"],
};

// Get all roles query
export const useRoles = (params = {}) => {
  return useQuery({
    queryKey: roleKeys.list(params),
    queryFn: async () => {
      const response = await rolesService.getRoles(params);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get all users query
export const useUsers = (params = {}, options = {}) => {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: async () => {
      try {
        const response = await usersService.getUsers(params);
        console.log("🔍 [useUsers] Raw axios response:", response);
        console.log("🔍 [useUsers] response.data:", response?.data);
        console.log("🔍 [useUsers] response.data?.data:", response?.data?.data);

        // The axios response has a 'data' property, so response.data contains the actual API response
        // Handle both cases: if response.data exists, use it; otherwise use response directly
        const apiData = response?.data || response;
        console.log("🔍 [useUsers] apiData:", apiData);

        // If the API response itself has a 'data' key, extract it
        const finalData = apiData?.data || apiData;
        console.log("🔍 [useUsers] finalData to return:", finalData);
        console.log("🔍 [useUsers] finalData?.users:", finalData?.users);

        return finalData;
      } catch (error) {
        console.error("Failed to fetch users:", error);

        // If it's a network error, return demo data for development
        if (
          error.code === "NETWORK_ERROR" ||
          error.message?.includes("Network Error")
        ) {
          console.warn("Network error detected, returning demo data");

          // Return demo data in the same format as the API
          return {
            page: 1,
            per_page: 20,
            total: 3,
            total_pages: 1,
            users: [
              {
                id: 1,
                email: "alex.brown@company.com",
                username: "alex.brown",
                first_name: "John",
                last_name: "Doe",
                title: "Mr",
                phone_number: "+44 20 7946 0958",
                avatar_url: null,
                bio: "",
                is_active: true,
                is_verified: true,
                is_superuser: false,
                last_login: "2024-01-20T10:30:00Z",
                created_at: "2024-01-15T09:00:00Z",
                updated_at: "2024-01-20T10:30:00Z",
              },
              {
                id: 2,
                email: "sarah.williams@company.com",
                username: "sarah.williams",
                first_name: "Jane",
                last_name: "Smith",
                title: "Ms",
                phone_number: "+44 20 7946 0959",
                avatar_url: null,
                bio: "",
                is_active: true,
                is_verified: true,
                is_superuser: false,
                last_login: "2024-01-20T09:15:00Z",
                created_at: "2024-01-16T10:00:00Z",
                updated_at: "2024-01-20T09:15:00Z",
              },
              {
                id: 3,
                email: "james.taylor@company.com",
                username: "james.taylor",
                first_name: "Mike",
                last_name: "Wilson",
                title: "Mr",
                phone_number: "+44 20 7946 0960",
                avatar_url: null,
                bio: "",
                is_active: false,
                is_verified: true,
                is_superuser: false,
                last_login: "2024-01-15T14:22:00Z",
                created_at: "2024-01-17T11:00:00Z",
                updated_at: "2024-01-15T14:22:00Z",
              },
            ],
          };
        }

        // Re-throw other errors
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: (previousData) => {
      // Only keep previous data if it exists and has users
      return previousData && previousData.users && previousData.users.length > 0;
    },
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }

      // Don't retry network errors more than once
      if (
        error?.code === "NETWORK_ERROR" ||
        error?.message?.includes("Network Error")
      ) {
        return failureCount < 1;
      }

      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options, // Allow passing query options like enabled, etc.
  });
};

// Get single user query
export const useUser = (slug) => {
  return useQuery({
    queryKey: userKeys.detail(slug),
    queryFn: async () => {
      // Fetch user data and roles in parallel
      const [userResponse, rolesResponse] = await Promise.all([
        usersService.getUser(slug),
        usersService.getUserRoles(slug).catch(() => ({ data: [] })),
      ]);

      // Combine user data with roles
      return {
        ...userResponse.data,
        roles: rolesResponse.data || [],
      };
    },
    enabled: !!slug,
    staleTime: 0, // Always refetch when invalidated
  });
};

// Create user mutation
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      const response = await usersService.createUser(userData);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate users list queries - this will trigger a refetch automatically
      queryClient.invalidateQueries({
        queryKey: userKeys.lists(),
        exact: false, // Match all queries that start with this key
        refetchType: 'active', // Only refetch active queries
      });

      toast.success("User created successfully", {
        description: `${data.first_name} ${data.last_name} has been added to the system.`,
      });
    },
    onError: (error) => {
      console.error("Create user error:", error);

      const errorMessage =
        error?.response?.data?.message || "Failed to create user";
      toast.error("Failed to create user", {
        description: errorMessage,
      });
    },
  });
};

// Update user mutation
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, userData }) => {
      const response = await usersService.updateUser(slug, userData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the user in cache
      queryClient.setQueryData(userKeys.detail(variables.slug), data);

      // Invalidate users list to refresh data
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      toast.success("User updated successfully", {
        description: `${data.first_name} ${data.last_name} has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Update user error:", error);

      const errorMessage =
        error?.response?.data?.message || "Failed to update user";
      toast.error("Failed to update user", {
        description: errorMessage,
      });
    },
  });
};

// Delete user mutation
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      const response = await usersService.deleteUser(slug);
      return response.data;
    },
    onSuccess: (data, slug) => {
      // Remove the user from cache
      queryClient.removeQueries({ queryKey: userKeys.detail(slug) });

      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      toast.success("User deleted successfully", {
        description: "The user has been removed from the system.",
      });
    },
    onError: (error) => {
      console.error("Delete user error:", error);

      const errorMessage =
        error?.response?.data?.message || "Failed to delete user";
      toast.error("Failed to delete user", {
        description: errorMessage,
      });
    },
  });
};

// Activate user mutation
export const useActivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      const response = await usersService.activateUser(slug);
      return response.data;
    },
    onSuccess: (data, slug) => {
      // Update the user in cache
      queryClient.setQueryData(userKeys.detail(slug), (oldData) => ({
        ...oldData,
        is_active: true,
      }));

      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      toast.success("User activated successfully", {
        description: "The user can now log in and access the system.",
      });
    },
    onError: (error) => {
      console.error("Activate user error:", error);

      const errorMessage =
        error?.response?.data?.message || "Failed to activate user";
      toast.error("Failed to activate user", {
        description: errorMessage,
      });
    },
  });
};

// Deactivate user mutation
export const useDeactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      const response = await usersService.deactivateUser(slug);
      return response.data;
    },
    onSuccess: (data, slug) => {
      // Update the user in cache
      queryClient.setQueryData(userKeys.detail(slug), (oldData) => ({
        ...oldData,
        is_active: false,
      }));

      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      toast.success("User deactivated successfully", {
        description: "The user can no longer log in to the system.",
      });
    },
    onError: (error) => {
      console.error("Deactivate user error:", error);

      const errorMessage =
        error?.response?.data?.message || "Failed to deactivate user";
      toast.error("Failed to deactivate user", {
        description: errorMessage,
      });
    },
  });
};

// Verify user mutation
export const useVerifyUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      const response = await usersService.verifyUser(slug);
      return response.data;
    },
    onSuccess: (data, slug) => {
      // Update the user in cache
      queryClient.setQueryData(userKeys.detail(slug), (oldData) => ({
        ...oldData,
        is_verified: true,
      }));

      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      toast.success("User verified successfully", {
        description: "The user's email has been verified.",
      });
    },
    onError: (error) => {
      console.error("Verify user error:", error);

      const errorMessage =
        error?.response?.data?.message || "Failed to verify user";
      toast.error("Failed to verify user", {
        description: errorMessage,
      });
    },
  });
};

// Get user permissions query
export const useUserPermissions = (slug) => {
  return useQuery({
    queryKey: userKeys.permissions(slug),
    queryFn: async () => {
      const response = await usersService.getUserPermissions(slug);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get user direct permissions query
export const useUserDirectPermissions = (slug) => {
  return useQuery({
    queryKey: userKeys.directPermissions(slug),
    queryFn: async () => {
      const response = await usersService.getUserDirectPermissions(slug);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Assign direct permission mutation
export const useAssignDirectPermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, permissionSlug }) => {
      const response = await usersService.assignDirectPermission(
        slug,
        permissionSlug
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate the user query to refetch the updated data
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.slug),
      });

      toast.success("Permission assigned successfully", {
        description: "The permission has been assigned to the user.",
      });
    },
    onError: (error) => {
      console.error("Assign direct permission error:", error);

      const errorMessage =
        error?.response?.data?.message || "Failed to assign permission";
      toast.error("Failed to assign permission", {
        description: errorMessage,
      });
    },
  });
};

// Remove direct permission mutation
export const useRemoveDirectPermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, permissionSlug }) => {
      const response = await usersService.removeDirectPermission(
        slug,
        permissionSlug
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate the user query to refetch the updated data
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.slug),
      });

      toast.success("Permission removed successfully", {
        description: "The permission has been removed from the user.",
      });
    },
    onError: (error) => {
      console.error("Remove direct permission error:", error);

      const errorMessage =
        error?.response?.data?.message || "Failed to remove permission";
      toast.error("Failed to remove permission", {
        description: errorMessage,
      });
    },
  });
};

// Get user roles query
export const useUserRoles = (slug) => {
  return useQuery({
    queryKey: userKeys.roles(slug),
    queryFn: async () => {
      const response = await usersService.getUserRoles(slug);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Assign role mutation - simplified approach
export const useAssignRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userSlug, roleSlug, assignedBy = null, notes = null }) => {
      const response = await usersService.assignRole(
        userSlug,
        roleSlug,
        assignedBy,
        notes
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate both user and roles queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.userSlug),
      });

      // Also invalidate the roles list to ensure role data is fresh
      queryClient.invalidateQueries({
        queryKey: roleKeys.list(),
      });

      toast.success("Role assigned successfully", {
        description: "The role has been assigned to the user.",
      });
    },
    onError: (error) => {
      console.error("Assign role error:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to assign role";
      toast.error("Failed to assign role", {
        description: errorMessage,
      });
    },
  });
};

// Remove role mutation - simplified approach
export const useRemoveRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userSlug, roleSlug }) => {
      const response = await usersService.removeRole(userSlug, roleSlug);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate both user and roles queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.userSlug),
      });

      // Also invalidate the roles list to ensure role data is fresh
      queryClient.invalidateQueries({
        queryKey: roleKeys.list(),
      });

      toast.success("Role removed successfully", {
        description: "The role has been removed from the user.",
      });
    },
    onError: (error) => {
      console.error("Remove role error:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to remove role";
      toast.error("Failed to remove role", {
        description: errorMessage,
      });
    },
  });
};

// Search users mutation
export const useSearchUsers = () => {
  return useMutation({
    mutationFn: async (searchData) => {
      const response = await usersService.searchUsers(searchData);
      return response.data;
    },
    onError: (error) => {
      console.error("Search users error:", error);

      const errorMessage =
        error?.response?.data?.message || "Failed to search users";
      toast.error("Failed to search users", {
        description: errorMessage,
      });
    },
  });
};

// Send invitation to existing user mutation
export const useSendInvitationToUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userSlug, options = {} }) => {
      const response = await usersService.sendInvitationToUser(userSlug, options);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate user queries to refresh data
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.userSlug),
      });
      queryClient.invalidateQueries({
        queryKey: userKeys.lists(),
      });

      toast.success("Invitation sent successfully!", {
        description: `Invitation email sent. The user can now set their password.`,
      });
    },
    onError: (error) => {
      console.error("Send invitation to user error:", error);

      const errorMessage =
        error?.response?.data?.message || "Failed to send invitation";
      toast.error("Failed to send invitation", {
        description: errorMessage,
      });
    },
  });
};

// Utility functions for data transformation
export const userUtils = {
  // Transform API user data to display format
  transformUser: (apiUser) => {
    return {
      id: apiUser.id,
      name:
        `${apiUser.first_name || ""} ${apiUser.last_name || ""}`.trim() ||
        "Unknown User",
      email: apiUser.email,
      username: apiUser.username,
      firstName: apiUser.first_name,
      lastName: apiUser.last_name,
      title: apiUser.title,
      phoneNumber: apiUser.phone_number,
      avatarUrl: apiUser.avatar_url,
      bio: apiUser.bio,
      isActive: apiUser.is_active,
      isVerified: apiUser.is_verified,
      isSuperuser: apiUser.is_superuser,
      lastLogin: apiUser.last_login
        ? (() => {
            const date = parseUTCDate(apiUser.last_login);
            return date ? date.toLocaleString() : "Never";
          })()
        : "Never",
      createdAt: apiUser.created_at
        ? (() => {
            const date = parseUTCDate(apiUser.created_at);
            return date ? date.toLocaleString() : "Unknown";
          })()
        : "Unknown",
      updatedAt: apiUser.updated_at
        ? (() => {
            const date = parseUTCDate(apiUser.updated_at);
            return date ? date.toLocaleString() : "Unknown";
          })()
        : "Unknown",
      initials:
        `${apiUser.first_name?.[0] || ""}${apiUser.last_name?.[0] || ""
          }`.toUpperCase() || "U",
      // Additional fields from the API response
      mfaEnabled: apiUser.mfa_enabled,
      roles: apiUser.roles || [],
      permissions: apiUser.permissions || [],
      directPermissions: apiUser.direct_permissions || [],
      profileCreatedByAdmin: apiUser.profile_created_by_admin,
      profileAcceptedAt: apiUser.profile_accepted_at
        ? (() => {
            const date = parseUTCDate(apiUser.profile_accepted_at);
            return date ? date.toLocaleString() : null;
          })()
        : null,
      isProfileAccepted: apiUser.is_profile_accepted,
      displayName: apiUser.display_name,
    };
  },

  // Get status display text
  getStatus: (user) => {
    if (!user.isActive) return "Inactive";
    if (!user.isVerified) return "Unverified";
    return "Active";
  },

  // Get role display text
  getRole: (user) => {
    if (user.isSuperuser) return "Superuser";

    // Check if user has roles assigned
    if (user.roles && user.roles.length > 0) {
      // Get the first role (assuming users have one primary role)
      const primaryRole = user.roles[0];

      // Handle both object and string role formats
      if (typeof primaryRole === "object") {
        return (
          primaryRole.display_name ||
          primaryRole.name ||
          primaryRole.slug ||
          "User"
        );
      } else if (typeof primaryRole === "string") {
        // Convert slug to display name (e.g., 'staff' -> 'Staff')
        return (
          primaryRole.charAt(0).toUpperCase() +
          primaryRole.slice(1).replace(/_/g, " ")
        );
      }
    }

    return "User"; // Default role
  },
};
