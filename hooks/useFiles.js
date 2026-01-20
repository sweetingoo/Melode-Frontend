import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { filesService } from "@/services/files";
import { toast } from "sonner";
import { trackerKeys } from "./useTrackers";

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
  entitySlugOrId,
  includeInactive = false,
  options = {}
) => {
  return useQuery({
    queryKey: fileKeys.entity(entityType, entitySlugOrId),
    queryFn: async () => {
      const response = await filesService.getEntityAttachments(
        entityType,
        entitySlugOrId,
        includeInactive
      );
      return response;
    },
    enabled: !!entityType && !!entitySlugOrId,
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
    mutationFn: async ({ entityType, entitySlug, entityId, files, descriptions }) => {
      // Use slug if provided, fallback to id for backward compatibility
      const identifier = entitySlug || entityId;
      const response = await filesService.attachFiles(
        entityType,
        identifier,
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
      // Use the identifier (slug or id) that was actually used
      const identifier = variables.entitySlug || variables.entityId;
      queryClient.invalidateQueries({
        queryKey: fileKeys.entity(variables.entityType, identifier),
      });
      
      // If this is a tracker entry, also invalidate the timeline
      if (variables.entityType === "tracker_entry") {
        const entryId = identifier;
        queryClient.invalidateQueries({
          queryKey: trackerKeys.entryTimeline(entryId),
        });
      }
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
    mutationFn: async ({ entityType, entitySlug, entityId, fileIds, descriptions }) => {
      // Use slug if provided, fallback to id for backward compatibility
      const identifier = entitySlug || entityId;
      const response = await filesService.attachExistingFiles(
        entityType,
        identifier,
        fileIds,
        descriptions
      );
      return response;
    },
    onSuccess: (data, variables) => {
      toast.success("Files attached successfully!");
      // Invalidate entity attachments
      // Use the identifier (slug or id) that was actually used
      const identifier = variables.entitySlug || variables.entityId;
      queryClient.invalidateQueries({
        queryKey: fileKeys.entity(variables.entityType, identifier),
      });
      
      // If this is a tracker entry, also invalidate the timeline
      if (variables.entityType === "tracker_entry") {
        const entryId = identifier;
        queryClient.invalidateQueries({
          queryKey: trackerKeys.entryTimeline(entryId),
        });
      }
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
    mutationFn: async ({ attachmentSlug, attachmentId, softDelete = true, entityType, entitySlug, entityId }) => {
      // Use slug if provided, fallback to id for backward compatibility
      const identifier = attachmentSlug || attachmentId;
      const response = await filesService.deleteAttachment(identifier, softDelete);
      return { ...response, attachmentSlug: identifier, attachmentId, entityType, entitySlug, entityId };
    },
    onSuccess: (data) => {
      toast.success("Attachment deleted successfully");
      // Invalidate entity attachments if entity info provided
      // Use entitySlug or entityId from the original variables
      if (data.entityType && (data.entitySlug || data.entityId)) {
        const identifier = data.entitySlug || data.entityId;
        queryClient.invalidateQueries({
          queryKey: fileKeys.entity(data.entityType, identifier),
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

// Comment attachment hooks
// Query keys for comment attachments
export const commentAttachmentKeys = {
  all: ["comment-attachments"],
  comment: (commentSlug) => [...commentAttachmentKeys.all, commentSlug],
};

// Get comment attachments query
export const useCommentAttachments = (
  commentSlug,
  includeInactive = false,
  options = {}
) => {
  return useQuery({
    queryKey: [...commentAttachmentKeys.comment(commentSlug), includeInactive],
    queryFn: async () => {
      const response = await filesService.getCommentAttachments(
        commentSlug,
        includeInactive
      );
      return response;
    },
    enabled: !!commentSlug,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
};

// Attach files to comment mutation
export const useAttachFilesToComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentSlug, files, descriptions }) => {
      const response = await filesService.attachFilesToComment(
        commentSlug,
        files,
        descriptions
      );
      return { ...response, commentSlug };
    },
    onSuccess: (data) => {
      const count = data.total_files || data.uploaded_files?.length || 0;
      toast.success("Files attached successfully!", {
        description: `${count} file(s) attached to comment.`,
      });
      // Invalidate comment attachments
      queryClient.invalidateQueries({
        queryKey: commentAttachmentKeys.comment(data.commentSlug),
      });
    },
    onError: (error) => {
      console.error("Attach files to comment error:", error);
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

// Attach existing files to comment mutation
export const useAttachExistingFilesToComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentSlug, fileIds, descriptions }) => {
      const response = await filesService.attachExistingFilesToComment(
        commentSlug,
        fileIds,
        descriptions
      );
      return { ...response, commentSlug };
    },
    onSuccess: (data) => {
      toast.success("Files attached successfully!");
      // Invalidate comment attachments
      queryClient.invalidateQueries({
        queryKey: commentAttachmentKeys.comment(data.commentSlug),
      });
    },
    onError: (error) => {
      console.error("Attach existing files to comment error:", error);
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
