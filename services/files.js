import { api } from "./api-client";

// File attachments service for entities
export const filesService = {
  // Upload multiple files
  uploadMultiple: async (files, options = {}) => {
    try {
      const formData = new FormData();
      
      // Append all files
      files.forEach((file) => {
        formData.append("files", file);
      });

      // Add optional entity_type and entity_id
      if (options.entity_type) {
        formData.append("entity_type", options.entity_type);
      }
      if (options.entity_id) {
        formData.append("entity_id", options.entity_id.toString());
      }

      // Add optional descriptions as JSON array
      if (options.descriptions && Array.isArray(options.descriptions)) {
        formData.append("descriptions", JSON.stringify(options.descriptions));
      }

      const response = await api.post("/files/upload/multiple", formData);
      return response.data || response;
    } catch (error) {
      console.error("Upload multiple files failed:", error);
      throw error;
    }
  },

  // Upload and attach multiple files to an entity
  attachFiles: async (entityType, entitySlug, files, descriptions = []) => {
    try {
      const formData = new FormData();

      // Append all files
      files.forEach((file) => {
        formData.append("files", file);
      });

      // Add descriptions as JSON array if provided
      if (descriptions && descriptions.length > 0) {
        formData.append("descriptions", JSON.stringify(descriptions));
      }

      const response = await api.post(
        `/files/entities/${entityType}/${entitySlug}/attach`,
        formData
      );
      return response.data || response;
    } catch (error) {
      console.error("Attach files failed:", error);
      throw error;
    }
  },

  // Attach existing files to an entity
  attachExistingFiles: async (entityType, entitySlug, fileIds, descriptions = []) => {
    try {
      const body = {
        file_ids: fileIds,
      };

      // Add descriptions if provided
      if (descriptions && descriptions.length > 0) {
        body.descriptions = descriptions;
      }

      const response = await api.post(
        `/files/entities/${entityType}/${entitySlug}/attach-existing`,
        body
      );
      return response.data || response;
    } catch (error) {
      console.error("Attach existing files failed:", error);
      throw error;
    }
  },

  // Get all files attached to an entity
  getEntityAttachments: async (entityType, entitySlug, includeInactive = false) => {
    try {
      const response = await api.get(
        `/files/entities/${entityType}/${entitySlug}/attachments`,
        {
          params: {
            include_inactive: includeInactive,
          },
        }
      );
      return response.data || response;
    } catch (error) {
      console.error("Get entity attachments failed:", error);
      throw error;
    }
  },

  // Delete an attachment
  deleteAttachment: async (attachmentSlug, softDelete = true) => {
    try {
      const response = await api.delete(`/files/attachments/${attachmentSlug}`, {
        params: {
          soft_delete: softDelete,
        },
      });
      return response.data || response;
    } catch (error) {
      console.error("Delete attachment failed:", error);
      throw error;
    }
  },

  // Download a file (using download_url from attachment)
  downloadFile: async (downloadUrl) => {
    try {
      // downloadUrl is a presigned URL, so we can fetch it directly
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error("Failed to download file");
      }
      const blob = await response.blob();
      
      // Create a temporary URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadUrl.split("/").pop() || "download";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (error) {
      console.error("Download file failed:", error);
      throw error;
    }
  },

  // Get pre-signed URL for a file by file_slug
  // Returns: { url: string, file_slug: string, expires_in_seconds: number }
  getFileUrl: async (fileSlug) => {
    try {
      const response = await api.get(`/files/${fileSlug}/url`);
      return response.data || response;
    } catch (error) {
      console.error(`Get file URL failed for file ${fileSlug}:`, error);
      throw error;
    }
  },

  // Delete a file
  deleteFile: async (fileSlug) => {
    try {
      const response = await api.delete(`/files/delete/${fileSlug}`);
      return response.data || response;
    } catch (error) {
      console.error(`Delete file ${fileSlug} failed:`, error);
      throw error;
    }
  },

  // Comment-specific attachment methods
  // Attach files to a comment
  attachFilesToComment: async (commentSlug, files, descriptions = []) => {
    try {
      const formData = new FormData();

      // Append all files
      files.forEach((file) => {
        formData.append("files", file);
      });

      // Add descriptions as JSON array if provided
      if (descriptions && descriptions.length > 0) {
        formData.append("descriptions", JSON.stringify(descriptions));
      }

      const response = await api.post(
        `/files/entities/entity_comment/${commentSlug}/attach`,
        formData
      );
      return response.data || response;
    } catch (error) {
      console.error("Attach files to comment failed:", error);
      throw error;
    }
  },

  // Attach existing files to a comment
  attachExistingFilesToComment: async (commentSlug, fileIds, descriptions = []) => {
    try {
      const body = {
        file_ids: fileIds,
      };

      // Add descriptions if provided
      if (descriptions && descriptions.length > 0) {
        body.descriptions = descriptions;
      }

      const response = await api.post(
        `/files/entities/entity_comment/${commentSlug}/attach-existing`,
        body
      );
      return response.data || response;
    } catch (error) {
      console.error("Attach existing files to comment failed:", error);
      throw error;
    }
  },

  // Get attachments for a comment
  getCommentAttachments: async (commentSlug, includeInactive = false) => {
    try {
      const response = await api.get(
        `/files/entities/entity_comment/${commentSlug}/attachments`,
        {
          params: {
            include_inactive: includeInactive,
          },
        }
      );
      return response.data || response;
    } catch (error) {
      console.error("Get comment attachments failed:", error);
      throw error;
    }
  },
};

