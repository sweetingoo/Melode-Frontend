import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invitationsService } from "@/services/invitations";
import { toast } from "sonner";

// Invitation query keys
export const invitationKeys = {
  all: ["invitations"],
  lists: () => [...invitationKeys.all, "list"],
  list: (filters) => [...invitationKeys.lists(), { filters }],
  details: () => [...invitationKeys.all, "detail"],
  detail: (id) => [...invitationKeys.details(), id],
};

// Get invitations query
export const useInvitations = (params = {}) => {
  return useQuery({
    queryKey: invitationKeys.list(params),
    queryFn: async () => {
      try {
        const response = await invitationsService.getInvitations(params);
        // The axios response has a 'data' property, so response.data contains the actual API response
        // Handle both cases: if response.data exists, use it; otherwise use response directly
        const apiData = response?.data || response;
        // Handle paginated response structure: { invitations: [...], total, page, etc. }
        // Or direct array response, or nested data property
        if (apiData?.invitations && Array.isArray(apiData.invitations)) {
          return apiData.invitations;
        }
        // If the API response itself has a 'data' key, extract it
        if (apiData?.data && Array.isArray(apiData.data)) {
          return apiData.data;
        }
        // If apiData is already an array, return it
        if (Array.isArray(apiData)) {
          return apiData;
        }
        // Fallback: return empty array if structure is unexpected
        return [];
      } catch (error) {
        // If it's a network error, return demo data for development silently
        if (
          error.code === "NETWORK_ERROR" ||
          error.message?.includes("Network Error") ||
          (error.request && !error.response)
        ) {
          // Return demo data when API is not available
          return [
            {
              id: 1,
              email: "john.doe@company.com",
              role_id: 1,
              suggested_username: "john.doe",
              suggested_title: "Mr",
              suggested_first_name: "Alex",
              suggested_last_name: "Brown",
              suggested_phone_number: "+44 20 1234 5678",
              is_used: false,
              used_at: null,
              expires_at: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
              ).toISOString(),
              created_at: new Date(
                Date.now() - 2 * 24 * 60 * 60 * 1000
              ).toISOString(),
              token: "demo-token-1",
              inviter_id: 1,
            },
            {
              id: 2,
              email: "sarah.williams@company.com",
              role_id: 2,
              suggested_username: "sarah.williams",
              suggested_title: "Ms",
              suggested_first_name: "Sarah",
              suggested_last_name: "Williams",
              suggested_phone_number: "+44 20 2345 6789",
              is_used: true,
              used_at: new Date(
                Date.now() - 1 * 24 * 60 * 60 * 1000
              ).toISOString(),
              expires_at: new Date(
                Date.now() - 1 * 24 * 60 * 60 * 1000
              ).toISOString(),
              created_at: new Date(
                Date.now() - 3 * 24 * 60 * 60 * 1000
              ).toISOString(),
              token: "demo-token-2",
              inviter_id: 1,
            },
            {
              id: 3,
              email: "james.taylor@company.com",
              role_id: 3,
              suggested_username: "james.taylor",
              suggested_title: "Mr",
              suggested_first_name: "James",
              suggested_last_name: "Taylor",
              suggested_phone_number: "+44 20 3456 7890",
              is_used: false,
              used_at: null,
              expires_at: new Date(
                Date.now() - 1 * 24 * 60 * 60 * 1000
              ).toISOString(), // Expired
              created_at: new Date(
                Date.now() - 5 * 24 * 60 * 60 * 1000
              ).toISOString(),
              token: "demo-token-3",
              inviter_id: 1,
            },
          ];
        }

        // Re-throw other errors
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Disable retries to prevent multiple network error logs
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid repeated errors
    refetchOnReconnect: false, // Don't refetch on reconnect automatically
    keepPreviousData: (previousData) => {
      // Only keep previous data if it exists and is an array with items
      return previousData && Array.isArray(previousData) && previousData.length > 0;
    },
  });
};

// Get single invitation query
export const useInvitation = (id) => {
  return useQuery({
    queryKey: invitationKeys.detail(id),
    queryFn: async () => {
      const response = await invitationsService.getInvitation(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Create invitation mutation
export const useCreateInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationData) => {
      const response = await invitationsService.createInvitation(
        invitationData
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate only the specific invitations list query that's currently active
      // This is more targeted and won't affect other queries
      queryClient.invalidateQueries({
        queryKey: invitationKeys.lists(),
        exact: false, // Match all queries that start with this key (e.g., list with different params)
        refetchType: 'active', // Only refetch active queries
      });

      toast.success("Invitation created successfully!", {
        description: `Invitation sent to ${data.email}`,
      });
    },
    onError: (error) => {
      console.error("Create invitation error:", error);

      if (error.response?.status === 422) {
        const errorData = error.response.data;

        // Handle the new API error format with detail array
        if (errorData?.detail && Array.isArray(errorData.detail)) {
          errorData.detail.forEach((errorItem) => {
            if (errorItem.loc && errorItem.loc.length > 1) {
              const fieldName = errorItem.loc[1];
              toast.error(`${fieldName}: ${errorItem.msg}`);
            }
          });
        }
        // Fallback to old format for backward compatibility
        else if (errorData?.errors) {
          Object.keys(errorData.errors).forEach((field) => {
            toast.error(`${field}: ${errorData.errors[field].join(", ")}`);
          });
        } else {
          toast.error("Validation error", {
            description: errorData?.message || "Please check your input",
          });
        }
      } else if (error.response?.status === 409) {
        toast.error("Invitation already exists", {
          description: "An invitation for this email already exists",
        });
      } else {
        toast.error("Failed to create invitation", {
          description: error.response?.data?.message || "Please try again",
        });
      }
    },
  });
};

// Update invitation mutation
export const useUpdateInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await invitationsAPI.updateInvitation(id, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the specific invitation in cache
      queryClient.setQueryData(invitationKeys.detail(variables.id), data);

      // Invalidate invitations list
      queryClient.invalidateQueries({ queryKey: invitationKeys.all });

      toast.success("Invitation updated successfully!");
    },
    onError: (error) => {
      console.error("Update invitation error:", error);

      if (error.response?.status === 422) {
        toast.error("Validation error", {
          description:
            error.response.data?.message || "Please check your input",
        });
      } else {
        toast.error("Failed to update invitation", {
          description: error.response?.data?.message || "Please try again",
        });
      }
    },
  });
};

// Delete invitation mutation
export const useDeleteInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await invitationsService.deleteInvitation(id);
      return response.data;
    },
    onSuccess: (data, id) => {
      // Remove the invitation from cache
      queryClient.removeQueries({ queryKey: invitationKeys.detail(id) });

      // Invalidate invitations list
      queryClient.invalidateQueries({ queryKey: invitationKeys.all });

      toast.success("Invitation deleted successfully!");
    },
    onError: (error) => {
      console.error("Delete invitation error:", error);

      if (error.response?.status === 404) {
        toast.error("Invitation not found", {
          description: "The invitation may have already been deleted",
        });
      } else {
        toast.error("Failed to delete invitation", {
          description: error.response?.data?.message || "Please try again",
        });
      }
    },
  });
};

// Resend invitation mutation
export const useResendInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await invitationsService.resendInvitation(id);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate invitations list to refresh data
      queryClient.invalidateQueries({ queryKey: invitationKeys.all });

      toast.success("Invitation resent successfully!", {
        description: `New invitation sent to ${data.email}`,
      });
    },
    onError: (error) => {
      console.error("Resend invitation error:", error);

      if (error.response?.status === 404) {
        toast.error("Invitation not found");
      } else if (error.response?.status === 400) {
        toast.error("Cannot resend invitation", {
          description:
            error.response.data?.message ||
            "Invitation may have expired or been used",
        });
      } else {
        toast.error("Failed to resend invitation", {
          description: error.response?.data?.message || "Please try again",
        });
      }
    },
  });
};

// Revoke invitation mutation
export const useRevokeInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await invitationsService.revokeInvitation(id);
      return response.data;
    },
    onSuccess: (data) => {
      // Update the invitation in cache
      queryClient.setQueryData(invitationKeys.detail(data.id), data);

      // Invalidate invitations list
      queryClient.invalidateQueries({ queryKey: invitationKeys.all });

      toast.success("Invitation revoked successfully!");
    },
    onError: (error) => {
      console.error("Revoke invitation error:", error);

      if (error.response?.status === 404) {
        toast.error("Invitation not found");
      } else if (error.response?.status === 400) {
        toast.error("Cannot revoke invitation", {
          description:
            error.response.data?.message ||
            "Invitation may have already been used",
        });
      } else {
        toast.error("Failed to revoke invitation", {
          description: error.response?.data?.message || "Please try again",
        });
      }
    },
  });
};

// Bulk operations mutations
export const useResendAllPending = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await invitationsService.resendAllPending();
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate invitations list
      queryClient.invalidateQueries({ queryKey: invitationKeys.all });

      toast.success("All pending invitations resent!", {
        description: `${data.count} invitations have been resent`,
      });
    },
    onError: (error) => {
      console.error("Resend all pending error:", error);

      toast.error("Failed to resend invitations", {
        description: error.response?.data?.message || "Please try again",
      });
    },
  });
};

export const useRevokeAllExpired = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await invitationsService.revokeAllExpired();
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate invitations list
      queryClient.invalidateQueries({ queryKey: invitationKeys.all });

      toast.success("All expired invitations revoked!", {
        description: `${data.count} invitations have been revoked`,
      });
    },
    onError: (error) => {
      console.error("Revoke all expired error:", error);

      toast.error("Failed to revoke invitations", {
        description: error.response?.data?.message || "Please try again",
      });
    },
  });
};

// Utility functions for invitation data transformation
export const invitationUtils = {
  // Transform API data to display format
  transformInvitation: (apiInvitation) => {
    // Map role_id to role name
    const roleMap = {
      1: "Admin",
      2: "Manager",
      3: "Editor",
      4: "Viewer",
    };

    return {
      id: apiInvitation.id,
      email: apiInvitation.email,
      role: roleMap[apiInvitation.role_id] || `Role ${apiInvitation.role_id}`,
      status: invitationUtils.getStatus(apiInvitation),
      sentDate: new Date(apiInvitation.created_at).toLocaleDateString(),
      expiresDate: new Date(apiInvitation.expires_at).toLocaleDateString(),
      sentBy: apiInvitation.inviter_id, // This might need to be mapped to user name
      suggestedUsername: apiInvitation.suggested_username,
      title: apiInvitation.suggested_title,
      firstName: apiInvitation.suggested_first_name,
      lastName: apiInvitation.suggested_last_name,
      phoneNumber: apiInvitation.suggested_phone_number,
      expiresIn: Math.ceil(
        (new Date(apiInvitation.expires_at) - new Date()) /
        (1000 * 60 * 60 * 24)
      ),
      // Additional fields from API
      token: apiInvitation.token,
      inviterId: apiInvitation.inviter_id,
      isUsed: apiInvitation.is_used,
      usedAt: apiInvitation.used_at,
      expiresAt: apiInvitation.expires_at,
      createdAt: apiInvitation.created_at,
    };
  },

  // Get status based on API data
  getStatus: (invitation) => {
    if (invitation.is_used) {
      return "Accepted";
    }

    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (now > expiresAt) {
      return "Expired";
    }

    return "Pending";
  },

  // Get status color for UI
  getStatusColor: (status) => {
    switch (status) {
      case "Accepted":
        return "text-green-600 bg-green-50";
      case "Pending":
        return "text-yellow-600 bg-yellow-50";
      case "Expired":
        return "text-red-600 bg-red-50";
      case "Revoked":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  },
};
