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

  // Get task by slug
  getTask: async (slug) => {
    try {
      return await api.get(`/tasks/${slug}`);
    } catch (error) {
      console.error(`Get task ${slug} failed:`, error);
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
  updateTask: async (slug, taskData) => {
    try {
      return await api.put(`/tasks/${slug}`, taskData);
    } catch (error) {
      console.error(`Update task ${slug} failed:`, error);
      throw error;
    }
  },

  // Delete task
  deleteTask: async (slug) => {
    try {
      return await api.delete(`/tasks/${slug}`);
    } catch (error) {
      console.error(`Delete task ${slug} failed:`, error);
      throw error;
    }
  },

  // Assign/Reassign task
  assignTask: async (slug, assignmentData) => {
    try {
      return await api.put(`/tasks/${slug}/assign`, assignmentData);
    } catch (error) {
      console.error(`Assign task ${slug} failed:`, error);
      throw error;
    }
  },

  // Complete task
  completeTask: async (slug, completionData) => {
    try {
      return await api.put(`/tasks/${slug}/complete`, completionData);
    } catch (error) {
      console.error(`Complete task ${slug} failed:`, error);
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
  getTasksByUser: async (userSlug, params = {}) => {
    try {
      return await api.get(`/tasks/user/${userSlug}`, { params });
    } catch (error) {
      console.error(`Get tasks by user ${userSlug} failed:`, error);
      throw error;
    }
  },

  // Get tasks by asset
  getTasksByAsset: async (assetSlug, params = {}) => {
    try {
      return await api.get(`/tasks/asset/${assetSlug}`, { params });
    } catch (error) {
      console.error(`Get tasks by asset ${assetSlug} failed:`, error);
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
  getRecurringTaskHistory: async (taskSlug) => {
    try {
      return await api.get(`/tasks/${taskSlug}/recurring-history`);
    } catch (error) {
      console.error(`Get recurring task history for ${taskSlug} failed:`, error);
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

