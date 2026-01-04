import { api } from "./api-client";

// Comments API service
export const commentsService = {
  // Add comment to entity
  addComment: async (entityType, entitySlug, commentData) => {
    try {
      return await api.post(
        `/settings/entities/${entityType}/${entitySlug}/comments`,
        {
          ...commentData,
          entity_type: entityType,
          entity_id: commentData.entity_id, // Keep entity_id in body if provided (for backward compatibility)
        }
      );
    } catch (error) {
      console.error(
        `Add comment to ${entityType}/${entitySlug} failed:`,
        error
      );
      throw error;
    }
  },

  // Get comments for entity
  getComments: async (entityType, entitySlug, params = {}) => {
    try {
      return await api.get(
        `/settings/entities/${entityType}/${entitySlug}/comments`,
        { params }
      );
    } catch (error) {
      console.error(
        `Get comments for ${entityType}/${entitySlug} failed:`,
        error
      );
      throw error;
    }
  },

  // Get replies to a comment
  getReplies: async (entityType, entitySlug, commentSlug) => {
    try {
      return await api.get(
        `/settings/entities/${entityType}/${entitySlug}/comments/${commentSlug}/replies`
      );
    } catch (error) {
      console.error(
        `Get replies for comment ${commentSlug} failed:`,
        error
      );
      throw error;
    }
  },

  // Get single comment
  getComment: async (entityType, entitySlug, commentSlug) => {
    try {
      return await api.get(
        `/settings/entities/${entityType}/${entitySlug}/comments/${commentSlug}`
      );
    } catch (error) {
      console.error(`Get comment ${commentSlug} failed:`, error);
      throw error;
    }
  },

  // Update comment
  updateComment: async (entityType, entitySlug, commentSlug, commentData) => {
    try {
      return await api.put(
        `/settings/entities/${entityType}/${entitySlug}/comments/${commentSlug}`,
        commentData
      );
    } catch (error) {
      console.error(`Update comment ${commentSlug} failed:`, error);
      throw error;
    }
  },

  // Delete comment
  deleteComment: async (entityType, entitySlug, commentSlug) => {
    try {
      return await api.delete(
        `/settings/entities/${entityType}/${entitySlug}/comments/${commentSlug}`
      );
    } catch (error) {
      console.error(`Delete comment ${commentSlug} failed:`, error);
      throw error;
    }
  },
};

