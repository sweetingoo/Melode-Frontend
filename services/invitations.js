import { api } from "./api-client";

// Invitations API service
export const invitationsService = {
  // Get all invitations
  getInvitations: async (params = {}) => {
    try {
      return await api.get("/invitations", { params });
    } catch (error) {
      // Don't log network errors (handled gracefully in hook)
      if (error.code !== "NETWORK_ERROR" && !(error.request && !error.response)) {
        console.error("Get invitations failed:", error);
      }
      throw error;
    }
  },

  // Get invitation by slug
  getInvitation: async (slug) => {
    try {
      return await api.get(`/invitations/${slug}`);
    } catch (error) {
      console.error(`Get invitation ${slug} failed:`, error);
      throw error;
    }
  },

  // Create invitation
  createInvitation: async (invitationData) => {
    try {
      return await api.post("/invitations", invitationData);
    } catch (error) {
      console.error("Create invitation failed:", error);
      throw error;
    }
  },

  // Update invitation
  updateInvitation: async (slug, invitationData) => {
    try {
      return await api.put(`/invitations/${slug}`, invitationData);
    } catch (error) {
      console.error(`Update invitation ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete invitation
  deleteInvitation: async (slug) => {
    try {
      return await api.delete(`/invitations/${slug}`);
    } catch (error) {
      console.error(`Delete invitation ${slug} failed:`, error);
      throw error;
    }
  },

  // Resend invitation
  resendInvitation: async (slug) => {
    try {
      return await api.post(`/invitations/${slug}/resend`);
    } catch (error) {
      console.error(`Resend invitation ${slug} failed:`, error);
      throw error;
    }
  },

  // Revoke invitation
  revokeInvitation: async (slug) => {
    try {
      return await api.delete(`/invitations/${slug}`);
    } catch (error) {
      console.error(`Revoke invitation ${slug} failed:`, error);
      throw error;
    }
  },

  // Bulk operations
  resendAllPending: async () => {
    try {
      return await api.post("/invitations/resend-all-pending");
    } catch (error) {
      console.error("Resend all pending invitations failed:", error);
      throw error;
    }
  },

  revokeAllExpired: async () => {
    try {
      return await api.post("/invitations/revoke-all-expired");
    } catch (error) {
      console.error("Revoke all expired invitations failed:", error);
      throw error;
    }
  },
};
