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

  // Get document by slug
  getDocument: async (slug) => {
    try {
      return await api.get(`/documents/${slug}`);
    } catch (error) {
      console.error(`Get document ${slug} failed:`, error);
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
  updateDocument: async (slug, documentData) => {
    try {
      return await api.put(`/documents/${slug}`, documentData);
    } catch (error) {
      console.error(`Update document ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete document
  deleteDocument: async (slug) => {
    try {
      return await api.delete(`/documents/${slug}`);
    } catch (error) {
      console.error(`Delete document ${slug} failed:`, error);
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
  getDocumentAttachments: async (slug) => {
    try {
      return await api.get(`/documents/${slug}/attachments`);
    } catch (error) {
      console.error(`Get document ${slug} attachments failed:`, error);
      throw error;
    }
  },

  // Share document with users
  shareDocument: async (slug, userIds) => {
    try {
      return await api.post(`/documents/${slug}/share`, { user_ids: userIds });
    } catch (error) {
      console.error(`Share document ${slug} failed:`, error);
      throw error;
    }
  },

  // Unshare document with users
  unshareDocument: async (slug, userIds) => {
    try {
      return await api.delete(`/documents/${slug}/share`, { data: { user_ids: userIds } });
    } catch (error) {
      console.error(`Unshare document ${slug} failed:`, error);
      throw error;
    }
  },

  // Get document audit logs
  getDocumentAuditLogs: async (slug, params = {}) => {
    try {
      return await api.get(`/documents/${slug}/audit-logs`, { params });
    } catch (error) {
      console.error(`Get document ${slug} audit logs failed:`, error);
      throw error;
    }
  },
};

