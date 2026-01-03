import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsService } from "@/services/documents";
import { toast } from "sonner";

// Document query keys
export const documentKeys = {
  all: ["documents"],
  lists: () => [...documentKeys.all, "list"],
  list: (params) => [...documentKeys.lists(), params],
  details: () => [...documentKeys.all, "detail"],
  detail: (id) => [...documentKeys.details(), id],
  search: (params) => [...documentKeys.all, "search", params],
  attachments: (id) => [...documentKeys.all, "attachments", id],
  auditLogs: (id, params) => [...documentKeys.all, "audit-logs", id, params],
};

// Get all documents query
export const useDocuments = (params = {}, options = {}) => {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: async () => {
      const response = await documentsService.getDocuments(params);
      // Handle paginated response
      if (response?.data && typeof response.data === 'object' && 'documents' in response.data) {
        return response.data;
      }
      // Handle array response
      return Array.isArray(response?.data) 
        ? { documents: response.data, total: response.data.length, page: 1, per_page: response.data.length, total_pages: 1 }
        : response?.data || { documents: [], total: 0, page: 1, per_page: 20, total_pages: 0 };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get single document query
export const useDocument = (slug, options = {}) => {
  return useQuery({
    queryKey: documentKeys.detail(slug),
    queryFn: async () => {
      const response = await documentsService.getDocument(slug);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Search documents query
export const useSearchDocuments = (params = {}, options = {}) => {
  return useQuery({
    queryKey: documentKeys.search(params),
    queryFn: async () => {
      const response = await documentsService.searchDocuments(params);
      // Handle paginated response
      if (response?.data && typeof response.data === 'object' && 'documents' in response.data) {
        return response.data;
      }
      // Handle array response
      return Array.isArray(response?.data)
        ? { documents: response.data, total: response.data.length, page: 1, per_page: response.data.length, total_pages: 1 }
        : response?.data || { documents: [], total: 0, page: 1, per_page: 20, total_pages: 0 };
    },
    enabled: !!params.q || params.q === "",
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

// Get document attachments query
export const useDocumentAttachments = (slug, options = {}) => {
  return useQuery({
    queryKey: documentKeys.attachments(slug),
    queryFn: async () => {
      const response = await documentsService.getDocumentAttachments(slug);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// Get document audit logs query
export const useDocumentAuditLogs = (slug, params = {}, options = {}) => {
  return useQuery({
    queryKey: documentKeys.auditLogs(slug, params),
    queryFn: async () => {
      const response = await documentsService.getDocumentAuditLogs(slug, params);
      return response.data;
    },
    enabled: !!slug,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

// Create document mutation
export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentData) => {
      const response = await documentsService.createDocument(documentData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success("Document created successfully", {
        description: `Document "${data.title || 'Untitled'}" has been created.`,
      });
    },
    onError: (error) => {
      console.error("Create document error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to create document";
      toast.error("Failed to create document", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Update document mutation
export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, documentData }) => {
      const response = await documentsService.updateDocument(slug, documentData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(variables.slug) });
      toast.success("Document updated successfully", {
        description: `Document "${data.title || 'Untitled'}" has been updated.`,
      });
    },
    onError: (error) => {
      console.error("Update document error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update document";
      toast.error("Failed to update document", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Delete document mutation
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug) => {
      const response = await documentsService.deleteDocument(slug);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.removeQueries({ queryKey: documentKeys.detail(variables) });
      toast.success("Document deleted successfully", {
        description: "The document has been deleted.",
      });
    },
    onError: (error) => {
      console.error("Delete document error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete document";
      toast.error("Failed to delete document", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Share document mutation
export const useShareDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, userIds }) => {
      const response = await documentsService.shareDocument(slug, userIds);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(variables.slug) });
      toast.success("Document shared successfully", {
        description: "The document has been shared with selected users.",
      });
    },
    onError: (error) => {
      console.error("Share document error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to share document";
      toast.error("Failed to share document", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Unshare document mutation
export const useUnshareDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, userIds }) => {
      const response = await documentsService.unshareDocument(slug, userIds);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(variables.slug) });
      toast.success("Document unshared successfully", {
        description: "The document has been unshared with selected users.",
      });
    },
    onError: (error) => {
      console.error("Unshare document error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to unshare document";
      toast.error("Failed to unshare document", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

