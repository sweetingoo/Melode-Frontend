import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { filesService } from "@/services/files";
import { toast } from "sonner";

// Query keys for file attachments
export const fileKeys = {
  all: ["files"],
  entities: () => [...fileKeys.all, "entities"],
  entity: (entityType, entityId) => [
    ...fileKeys.entities(),
    entityType,
    entityId,
  ],
};

// Get entity attachments query
export const useEntityAttachments = (
  entityType,
  entityId,
  includeInactive = false,
  options = {}
) => {
  return useQuery({
    queryKey: fileKeys.entity(entityType, entityId),
    queryFn: async () => {
      const response = await filesService.getEntityAttachments(
        entityType,
        entityId,
        includeInactive
      );
      return response;
    },
    enabled: !!entityType && !!entityId,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

// Upload multiple files mutation
export const useUploadMultipleFiles = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ files, entityType, entityId, descriptions }) => {
      const response = await filesService.uploadMultiple(files, {
        entity_type: entityType,
        entity_id: entityId,
        descriptions,
      });
      return response;
    },
    onSuccess: (data, variables) => {
      if (!options.silent) {
        const count = data.total_files || data.uploaded_files?.length || 0;
        toast.success("Files uploaded successfully!", {
          description: `${count} file(s) uploaded.`,
        });
      }
      // Invalidate entity attachments if entity info provided
      if (variables.entityType && variables.entityId) {
        queryClient.invalidateQueries({
          queryKey: fileKeys.entity(variables.entityType, variables.entityId),
        });
      }
    },
    onError: (error) => {
      console.error("Upload multiple files error:", error);
      if (!options.silent) {
        const errorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.detail ||
          "Failed to upload files";
        toast.error("Upload failed", {
          description: errorMessage,
        });
      }
    },
  });
};

// Attach files to entity mutation
export const useAttachFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entityType, entityId, files, descriptions }) => {
      const response = await filesService.attachFiles(
        entityType,
        entityId,
        files,
        descriptions
      );
      return response;
    },
    onSuccess: (data, variables) => {
      const count = data.total_files || data.uploaded_files?.length || 0;
      toast.success("Files attached successfully!", {
        description: `${count} file(s) attached to ${variables.entityType}.`,
      });
      // Invalidate entity attachments
      queryClient.invalidateQueries({
        queryKey: fileKeys.entity(variables.entityType, variables.entityId),
      });
    },
    onError: (error) => {
      console.error("Attach files error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to attach files";
      toast.error("Attach failed", {
        description: errorMessage,
      });
    },
  });
};

// Attach existing files to entity mutation
export const useAttachExistingFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entityType, entityId, fileIds, descriptions }) => {
      const response = await filesService.attachExistingFiles(
        entityType,
        entityId,
        fileIds,
        descriptions
      );
      return response;
    },
    onSuccess: (data, variables) => {
      toast.success("Files attached successfully!");
      // Invalidate entity attachments
      queryClient.invalidateQueries({
        queryKey: fileKeys.entity(variables.entityType, variables.entityId),
      });
    },
    onError: (error) => {
      console.error("Attach existing files error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to attach files";
      toast.error("Attach failed", {
        description: errorMessage,
      });
    },
  });
};

// Delete attachment mutation
export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attachmentId, softDelete = true, entityType, entityId }) => {
      const response = await filesService.deleteAttachment(attachmentId, softDelete);
      return { ...response, attachmentId, entityType, entityId };
    },
    onSuccess: (data) => {
      toast.success("Attachment deleted successfully");
      // Invalidate entity attachments if entity info provided
      if (data.entityType && data.entityId) {
        queryClient.invalidateQueries({
          queryKey: fileKeys.entity(data.entityType, data.entityId),
        });
      }
    },
    onError: (error) => {
      console.error("Delete attachment error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete attachment";
      toast.error("Delete failed", {
        description: errorMessage,
      });
    },
  });
};

// Download file mutation
export const useDownloadFile = () => {
  return useMutation({
    mutationFn: async (downloadUrl) => {
      return await filesService.downloadFile(downloadUrl);
    },
    onError: (error) => {
      console.error("Download file error:", error);
      toast.error("Download failed", {
        description: "Failed to download file. Please try again.",
      });
    },
  });
};

