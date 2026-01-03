import { api } from "./api-client";

// Task Types API service
export const taskTypesService = {
  // Get all active task types (for dropdowns/selectors)
  getActiveTaskTypes: async () => {
    try {
      return await api.get("/task-types/active/all");
    } catch (error) {
      console.error("Get active task types failed:", error);
      throw error;
    }
  },

  // Get all task types with pagination
  getTaskTypes: async (params = {}) => {
    try {
      return await api.get("/task-types", { params });
    } catch (error) {
      console.error("Get task types failed:", error);
      throw error;
    }
  },

  // Get task type by slug
  getTaskType: async (slug) => {
    try {
      return await api.get(`/task-types/${slug}`);
    } catch (error) {
      console.error(`Get task type ${slug} failed:`, error);
      throw error;
    }
  },

  // Create task type
  createTaskType: async (taskTypeData) => {
    try {
      return await api.post("/task-types", taskTypeData);
    } catch (error) {
      console.error("Create task type failed:", error);
      throw error;
    }
  },

  // Update task type
  updateTaskType: async (slug, taskTypeData) => {
    try {
      return await api.put(`/task-types/${slug}`, taskTypeData);
    } catch (error) {
      console.error(`Update task type ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete/deactivate task type
  deleteTaskType: async (slug) => {
    try {
      return await api.delete(`/task-types/${slug}`);
    } catch (error) {
      console.error(`Delete task type ${slug} failed:`, error);
      throw error;
    }
  },
};

