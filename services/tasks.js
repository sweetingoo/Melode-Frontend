import { api } from "./api-client";

// Tasks API service
export const tasksService = {
  // Get all tasks with basic filters
  getTasks: async (params = {}) => {
    try {
      return await api.get("/tasks", { params });
    } catch (error) {
      console.error("Get tasks failed:", error);
      throw error;
    }
  },

  // Get task by ID
  getTask: async (id) => {
    try {
      return await api.get(`/tasks/${id}`);
    } catch (error) {
      console.error(`Get task ${id} failed:`, error);
      throw error;
    }
  },

  // Create task
  createTask: async (taskData) => {
    try {
      return await api.post("/tasks", taskData);
    } catch (error) {
      console.error("Create task failed:", error);
      throw error;
    }
  },

  // Update task
  updateTask: async (id, taskData) => {
    try {
      return await api.put(`/tasks/${id}`, taskData);
    } catch (error) {
      console.error(`Update task ${id} failed:`, error);
      throw error;
    }
  },

  // Delete task
  deleteTask: async (id) => {
    try {
      return await api.delete(`/tasks/${id}`);
    } catch (error) {
      console.error(`Delete task ${id} failed:`, error);
      throw error;
    }
  },

  // Assign/Reassign task
  assignTask: async (id, assignmentData) => {
    try {
      return await api.put(`/tasks/${id}/assign`, assignmentData);
    } catch (error) {
      console.error(`Assign task ${id} failed:`, error);
      throw error;
    }
  },

  // Complete task
  completeTask: async (id, completionData) => {
    try {
      return await api.put(`/tasks/${id}/complete`, completionData);
    } catch (error) {
      console.error(`Complete task ${id} failed:`, error);
      throw error;
    }
  },

  // Advanced search
  searchTasks: async (searchData) => {
    try {
      return await api.post("/tasks/search", searchData);
    } catch (error) {
      console.error("Search tasks failed:", error);
      throw error;
    }
  },

  // Get my tasks
  getMyTasks: async (params = {}) => {
    try {
      return await api.get("/tasks/my-tasks", { params });
    } catch (error) {
      console.error("Get my tasks failed:", error);
      throw error;
    }
  },

  // Get tasks by user
  getTasksByUser: async (userId, params = {}) => {
    try {
      return await api.get(`/tasks/user/${userId}`, { params });
    } catch (error) {
      console.error(`Get tasks by user ${userId} failed:`, error);
      throw error;
    }
  },

  // Get tasks by asset
  getTasksByAsset: async (assetId, params = {}) => {
    try {
      return await api.get(`/tasks/asset/${assetId}`, { params });
    } catch (error) {
      console.error(`Get tasks by asset ${assetId} failed:`, error);
      throw error;
    }
  },

  // Get overdue tasks
  getOverdueTasks: async (params = {}) => {
    try {
      return await api.get("/tasks/overdue/all", { params });
    } catch (error) {
      console.error("Get overdue tasks failed:", error);
      throw error;
    }
  },

  // Get due soon tasks
  getDueSoonTasks: async (params = {}) => {
    try {
      return await api.get("/tasks/due-soon/all", { params });
    } catch (error) {
      console.error("Get due soon tasks failed:", error);
      throw error;
    }
  },

  // Get compliance tasks
  getComplianceTasks: async (params = {}) => {
    try {
      return await api.get("/tasks/compliance/all", { params });
    } catch (error) {
      console.error("Get compliance tasks failed:", error);
      throw error;
    }
  },

  // Get automated tasks
  getAutomatedTasks: async (params = {}) => {
    try {
      return await api.get("/tasks/automated/all", { params });
    } catch (error) {
      console.error("Get automated tasks failed:", error);
      throw error;
    }
  },

  // Get task statistics
  getTaskStats: async () => {
    try {
      return await api.get("/tasks/stats/overview");
    } catch (error) {
      console.error("Get task stats failed:", error);
      throw error;
    }
  },

  // Get recurring task history
  getRecurringTaskHistory: async (taskId) => {
    try {
      return await api.get(`/tasks/${taskId}/recurring-history`);
    } catch (error) {
      console.error(`Get recurring task history for ${taskId} failed:`, error);
      throw error;
    }
  },

  // Bulk create tasks for role
  bulkCreateTasksForRole: async (roleId, taskTemplate) => {
    try {
      return await api.post("/tasks/bulk-create-for-role", {
        role_id: roleId,
        task_template: taskTemplate,
      });
    } catch (error) {
      console.error(`Bulk create tasks for role ${roleId} failed:`, error);
      throw error;
    }
  },
};

