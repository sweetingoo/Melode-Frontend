import { api } from "./api-client";

// Documents API service
export const documentsService = {
  // Get all documents
  getDocuments: async (params = {}) => {
    try {
      return await api.get("/documents", { params });
    } catch (error) {
      console.error("Get documents failed:", error);
      throw error;
    }
  },

  // Get document by ID
  getDocument: async (id) => {
    try {
      return await api.get(`/documents/${id}`);
    } catch (error) {
      console.error(`Get document ${id} failed:`, error);
      throw error;
    }
  },

  // Create document
  createDocument: async (documentData) => {
    try {
      return await api.post("/documents", documentData);
    } catch (error) {
      console.error("Create document failed:", error);
      throw error;
    }
  },

  // Update document
  updateDocument: async (id, documentData) => {
    try {
      return await api.put(`/documents/${id}`, documentData);
    } catch (error) {
      console.error(`Update document ${id} failed:`, error);
      throw error;
    }
  },

  // Delete document
  deleteDocument: async (id) => {
    try {
      return await api.delete(`/documents/${id}`);
    } catch (error) {
      console.error(`Delete document ${id} failed:`, error);
      throw error;
    }
  },

  // Search documents
  searchDocuments: async (params = {}) => {
    try {
      return await api.get("/documents/search", { params });
    } catch (error) {
      console.error("Search documents failed:", error);
      throw error;
    }
  },

  // Get document attachments
  getDocumentAttachments: async (id) => {
    try {
      return await api.get(`/documents/${id}/attachments`);
    } catch (error) {
      console.error(`Get document ${id} attachments failed:`, error);
      throw error;
    }
  },

  // Share document with users
  shareDocument: async (id, userIds) => {
    try {
      return await api.post(`/documents/${id}/share`, { user_ids: userIds });
    } catch (error) {
      console.error(`Share document ${id} failed:`, error);
      throw error;
    }
  },

  // Unshare document with users
  unshareDocument: async (id, userIds) => {
    try {
      return await api.delete(`/documents/${id}/share`, { data: { user_ids: userIds } });
    } catch (error) {
      console.error(`Unshare document ${id} failed:`, error);
      throw error;
    }
  },

  // Get document audit logs
  getDocumentAuditLogs: async (id, params = {}) => {
    try {
      return await api.get(`/documents/${id}/audit-logs`, { params });
    } catch (error) {
      console.error(`Get document ${id} audit logs failed:`, error);
      throw error;
    }
  },
};

