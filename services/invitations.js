import { api } from "./api-client";

// Invitations API service
export const invitationsService = {
  // Get all invitations
  getInvitations: async (params = {}) => {
    try {
      return await api.get("/invitations", { params });
    } catch (error) {
      console.error("Get invitations failed:", error);
      throw error;
    }
  },

  // Get invitation by ID
  getInvitation: async (id) => {
    try {
      return await api.get(`/invitations/${id}`);
    } catch (error) {
      console.error(`Get invitation ${id} failed:`, error);
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
  updateInvitation: async (id, invitationData) => {
    try {
      return await api.put(`/invitations/${id}`, invitationData);
    } catch (error) {
      console.error(`Update invitation ${id} failed:`, error);
      throw error;
    }
  },

  // Delete invitation
  deleteInvitation: async (id) => {
    try {
      return await api.delete(`/invitations/${id}`);
    } catch (error) {
      console.error(`Delete invitation ${id} failed:`, error);
      throw error;
    }
  },

  // Resend invitation
  resendInvitation: async (id) => {
    try {
      return await api.post(`/invitations/${id}/resend`);
    } catch (error) {
      console.error(`Resend invitation ${id} failed:`, error);
      throw error;
    }
  },

  // Revoke invitation
  revokeInvitation: async (id) => {
    try {
      return await api.delete(`/invitations/${id}`);
    } catch (error) {
      console.error(`Revoke invitation ${id} failed:`, error);
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
