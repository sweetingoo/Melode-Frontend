import { api } from "./api-client";

// Comments API service
export const commentsService = {
  // Add comment to entity
  addComment: async (entityType, entityId, commentData) => {
    try {
      return await api.post(
        `/settings/entities/${entityType}/${entityId}/comments`,
        {
          ...commentData,
          entity_type: entityType,
          entity_id: entityId,
        }
      );
    } catch (error) {
      console.error(
        `Add comment to ${entityType}/${entityId} failed:`,
        error
      );
      throw error;
    }
  },

  // Get comments for entity
  getComments: async (entityType, entityId, params = {}) => {
    try {
      return await api.get(
        `/settings/entities/${entityType}/${entityId}/comments`,
        { params }
      );
    } catch (error) {
      console.error(
        `Get comments for ${entityType}/${entityId} failed:`,
        error
      );
      throw error;
    }
  },

  // Get replies to a comment
  getReplies: async (entityType, entityId, commentId) => {
    try {
      return await api.get(
        `/settings/entities/${entityType}/${entityId}/comments/${commentId}/replies`
      );
    } catch (error) {
      console.error(
        `Get replies for comment ${commentId} failed:`,
        error
      );
      throw error;
    }
  },

  // Get single comment
  getComment: async (entityType, entityId, commentId) => {
    try {
      return await api.get(
        `/settings/entities/${entityType}/${entityId}/comments/${commentId}`
      );
    } catch (error) {
      console.error(`Get comment ${commentId} failed:`, error);
      throw error;
    }
  },

  // Update comment
  updateComment: async (entityType, entityId, commentId, commentData) => {
    try {
      return await api.put(
        `/settings/entities/${entityType}/${entityId}/comments/${commentId}`,
        commentData
      );
    } catch (error) {
      console.error(`Update comment ${commentId} failed:`, error);
      throw error;
    }
  },

  // Delete comment
  deleteComment: async (entityType, entityId, commentId) => {
    try {
      return await api.delete(
        `/settings/entities/${entityType}/${entityId}/comments/${commentId}`
      );
    } catch (error) {
      console.error(`Delete comment ${commentId} failed:`, error);
      throw error;
    }
  },
};

