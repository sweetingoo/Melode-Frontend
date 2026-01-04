import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsService } from "@/services/comments";
import { toast } from "sonner";

// Comment query keys
export const commentKeys = {
  all: ["comments"],
  entity: (entityType, entitySlug) => [...commentKeys.all, entityType, entitySlug],
  list: (entityType, entitySlug, params) => [
    ...commentKeys.entity(entityType, entitySlug),
    "list",
    params,
  ],
  detail: (entityType, entitySlug, commentSlug) => [
    ...commentKeys.entity(entityType, entitySlug),
    "detail",
    commentSlug,
  ],
  replies: (entityType, entitySlug, commentSlug) => [
    ...commentKeys.entity(entityType, entitySlug),
    "replies",
    commentSlug,
  ],
};

// Get comments for entity query
export const useComments = (
  entityType,
  entitySlug,
  params = {},
  options = {}
) => {
  return useQuery({
    queryKey: commentKeys.list(entityType, entitySlug, params),
    queryFn: async () => {
      const response = await commentsService.getComments(
        entityType,
        entitySlug,
        params
      );
      return response.data;
    },
    enabled: !!entityType && !!entitySlug,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

// Get single comment query
export const useComment = (entityType, entitySlug, commentSlug, options = {}) => {
  return useQuery({
    queryKey: commentKeys.detail(entityType, entitySlug, commentSlug),
    queryFn: async () => {
      const response = await commentsService.getComment(
        entityType,
        entitySlug,
        commentSlug
      );
      return response.data;
    },
    enabled: !!entityType && !!entitySlug && !!commentSlug,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

// Get replies to a comment query
export const useCommentReplies = (
  entityType,
  entitySlug,
  commentSlug,
  options = {}
) => {
  return useQuery({
    queryKey: commentKeys.replies(entityType, entitySlug, commentSlug),
    queryFn: async () => {
      const response = await commentsService.getReplies(
        entityType,
        entitySlug,
        commentSlug
      );
      return response.data;
    },
    enabled: !!entityType && !!entitySlug && !!commentSlug,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

// Add comment mutation
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entityType, entitySlug, commentData }) => {
      const response = await commentsService.addComment(
        entityType,
        entitySlug,
        commentData
      );
      return { data: response.data, entityType, entitySlug };
    },
    onSuccess: ({ data, entityType, entitySlug }) => {
      // Invalidate comments list for this entity
      queryClient.invalidateQueries({
        queryKey: commentKeys.entity(entityType, entitySlug),
      });

      // If this is a reply, also invalidate the parent comment's replies
      if (data.parent_comment_slug || data.parent_comment_id) {
        const parentSlug = data.parent_comment_slug || data.parent_comment_id;
        queryClient.invalidateQueries({
          queryKey: commentKeys.replies(
            entityType,
            entitySlug,
            parentSlug
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
    mutationFn: async ({ entityType, entitySlug, commentSlug, commentData }) => {
      const response = await commentsService.updateComment(
        entityType,
        entitySlug,
        commentSlug,
        commentData
      );
      return { data: response.data, entityType, entitySlug, commentSlug };
    },
    onSuccess: ({ data, entityType, entitySlug, commentSlug }) => {
      // Update the comment in cache
      queryClient.setQueryData(
        commentKeys.detail(entityType, entitySlug, commentSlug),
        data
      );

      // Invalidate comments list to refresh
      queryClient.invalidateQueries({
        queryKey: commentKeys.entity(entityType, entitySlug),
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
    mutationFn: async ({ entityType, entitySlug, commentSlug }) => {
      await commentsService.deleteComment(entityType, entitySlug, commentSlug);
      return { entityType, entitySlug, commentSlug };
    },
    onSuccess: ({ entityType, entitySlug, commentSlug }) => {
      // Remove the comment from cache
      queryClient.removeQueries({
        queryKey: commentKeys.detail(entityType, entitySlug, commentSlug),
      });

      // Invalidate comments list to refresh
      queryClient.invalidateQueries({
        queryKey: commentKeys.entity(entityType, entitySlug),
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

