import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsService } from "@/services/comments";
import { toast } from "sonner";

// Comment query keys
export const commentKeys = {
  all: ["comments"],
  entity: (entityType, entityId) => [...commentKeys.all, entityType, entityId],
  list: (entityType, entityId, params) => [
    ...commentKeys.entity(entityType, entityId),
    "list",
    params,
  ],
  detail: (entityType, entityId, commentId) => [
    ...commentKeys.entity(entityType, entityId),
    "detail",
    commentId,
  ],
  replies: (entityType, entityId, commentId) => [
    ...commentKeys.entity(entityType, entityId),
    "replies",
    commentId,
  ],
};

// Get comments for entity query
export const useComments = (
  entityType,
  entityId,
  params = {},
  options = {}
) => {
  return useQuery({
    queryKey: commentKeys.list(entityType, entityId, params),
    queryFn: async () => {
      const response = await commentsService.getComments(
        entityType,
        entityId,
        params
      );
      return response.data;
    },
    enabled: !!entityType && !!entityId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

// Get single comment query
export const useComment = (entityType, entityId, commentId, options = {}) => {
  return useQuery({
    queryKey: commentKeys.detail(entityType, entityId, commentId),
    queryFn: async () => {
      const response = await commentsService.getComment(
        entityType,
        entityId,
        commentId
      );
      return response.data;
    },
    enabled: !!entityType && !!entityId && !!commentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

// Get replies to a comment query
export const useCommentReplies = (
  entityType,
  entityId,
  commentId,
  options = {}
) => {
  return useQuery({
    queryKey: commentKeys.replies(entityType, entityId, commentId),
    queryFn: async () => {
      const response = await commentsService.getReplies(
        entityType,
        entityId,
        commentId
      );
      return response.data;
    },
    enabled: !!entityType && !!entityId && !!commentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

// Add comment mutation
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entityType, entityId, commentData }) => {
      const response = await commentsService.addComment(
        entityType,
        entityId,
        commentData
      );
      return { data: response.data, entityType, entityId };
    },
    onSuccess: ({ data, entityType, entityId }) => {
      // Invalidate comments list for this entity
      queryClient.invalidateQueries({
        queryKey: commentKeys.entity(entityType, entityId),
      });

      // If this is a reply, also invalidate the parent comment's replies
      if (data.parent_comment_id) {
        queryClient.invalidateQueries({
          queryKey: commentKeys.replies(
            entityType,
            entityId,
            data.parent_comment_id
          ),
        });
      }

      toast.success("Comment added successfully");
    },
    onError: (error) => {
      console.error("Add comment error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to add comment";
      toast.error("Failed to add comment", {
        description: Array.isArray(errorMessage)
          ? errorMessage.map((e) => e.msg || e).join(", ")
          : errorMessage,
      });
    },
  });
};

// Update comment mutation
export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entityType, entityId, commentId, commentData }) => {
      const response = await commentsService.updateComment(
        entityType,
        entityId,
        commentId,
        commentData
      );
      return { data: response.data, entityType, entityId, commentId };
    },
    onSuccess: ({ data, entityType, entityId, commentId }) => {
      // Update the comment in cache
      queryClient.setQueryData(
        commentKeys.detail(entityType, entityId, commentId),
        data
      );

      // Invalidate comments list to refresh
      queryClient.invalidateQueries({
        queryKey: commentKeys.entity(entityType, entityId),
      });

      toast.success("Comment updated successfully");
    },
    onError: (error) => {
      console.error("Update comment error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to update comment";

      if (error?.response?.status === 403) {
        toast.error("Permission denied", {
          description: "You can only edit your own comments",
        });
      } else {
        toast.error("Failed to update comment", {
          description: Array.isArray(errorMessage)
            ? errorMessage.map((e) => e.msg || e).join(", ")
            : errorMessage,
        });
      }
    },
  });
};

// Delete comment mutation
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entityType, entityId, commentId }) => {
      await commentsService.deleteComment(entityType, entityId, commentId);
      return { entityType, entityId, commentId };
    },
    onSuccess: ({ entityType, entityId, commentId }) => {
      // Remove the comment from cache
      queryClient.removeQueries({
        queryKey: commentKeys.detail(entityType, entityId, commentId),
      });

      // Invalidate comments list to refresh
      queryClient.invalidateQueries({
        queryKey: commentKeys.entity(entityType, entityId),
      });

      toast.success("Comment deleted successfully");
    },
    onError: (error) => {
      console.error("Delete comment error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to delete comment";

      if (error?.response?.status === 403) {
        toast.error("Permission denied", {
          description: "You can only delete your own comments",
        });
      } else {
        toast.error("Failed to delete comment", {
          description: Array.isArray(errorMessage)
            ? errorMessage.map((e) => e.msg || e).join(", ")
            : errorMessage,
        });
      }
    },
  });
};

